from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth_utils import require_admin, require_cliente
from db import get_conn, rows_to_list, using_database
from mock_data import CONFIG, RESGATES, add_historico, get_catalogo_item, get_cliente, get_resgate, next_resgate_id

router = APIRouter()

LIMITE_RESGATE_MSG = "Você já resgatou itens. Aguarde aprovação da barbearia."


class ResgateBody(BaseModel):
    item_id: int


class AutorizarBody(BaseModel):
    data_agenda: Optional[str] = None


@router.post("/", status_code=201)
async def solicitar(body: ResgateBody, payload: dict = Depends(require_cliente)):
    cpf = payload["cpf"]
    if using_database():
        try:
            with get_conn() as conn:
                result = conn.execute("select fn_solicitar_resgate(%s, %s) as data", (cpf, body.item_id)).fetchone()
                conn.commit()
        except Exception as exc:
            msg = str(exc).lower()
            if "limite de solicit" in msg:
                raise HTTPException(400, LIMITE_RESGATE_MSG) from exc
            if "pontos insuficientes" in msg:
                raise HTTPException(400, "Pontos insuficientes para este resgate.") from exc
            if "item indisponivel" in msg or "item indisponível" in msg:
                raise HTTPException(400, "Item indisponível.") from exc
            raise
        return {**result["data"], "status": "pendente"}

    cliente = get_cliente(cpf)
    item = get_catalogo_item(body.item_id)

    if not cliente:
        raise HTTPException(404, "Cliente não encontrado")
    if not item or not item["ativo"]:
        raise HTTPException(400, "Item indisponivel")

    limite = CONFIG["limite_solicitacoes"]["valor"]
    pendentes = [resgate for resgate in RESGATES if resgate["cpf"] == cpf and resgate["status"] == "pendente"]
    if limite > 0 and len(pendentes) >= limite:
        raise HTTPException(400, LIMITE_RESGATE_MSG)

    if cliente["pontos"] < item["custo_pontos"]:
        raise HTTPException(
            400,
            f"Pontos insuficientes: {cliente['pontos']} disponiveis, {item['custo_pontos']} necessarios",
        )

    cliente["pontos"] -= item["custo_pontos"]
    novo = {
        "id": next_resgate_id(),
        "cpf": cpf,
        "cliente_nome": cliente["nome"],
        "item_id": item["id"],
        "item_nome": item["nome"],
        "item_cat": item["categoria"],
        "pontos_usados": item["custo_pontos"],
        "status": "pendente",
        "data_agenda": None,
        "created_at": date.today().isoformat(),
    }
    RESGATES.insert(0, novo)
    return {
        "resgate_id": novo["id"],
        "item_nome": item["nome"],
        "pontos_usados": item["custo_pontos"],
        "pontos_restantes": cliente["pontos"],
        "status": "pendente",
    }


@router.get("/pendentes")
async def pendentes(_: dict = Depends(require_admin)):
    if using_database():
        with get_conn() as conn:
            rows = conn.execute(
                """
                select *
                from v_resgates_completo
                where status = 'pendente'
                order by created_at desc
                """
            ).fetchall()
        return rows_to_list(rows)

    return [resgate for resgate in RESGATES if resgate["status"] == "pendente"]


@router.get("/historico")
async def historico(_: dict = Depends(require_admin)):
    if using_database():
        with get_conn() as conn:
            rows = conn.execute(
                """
                select *
                from v_resgates_completo
                where status <> 'pendente'
                order by created_at desc
                """
            ).fetchall()
        return rows_to_list(rows)

    return [resgate for resgate in RESGATES if resgate["status"] != "pendente"]


@router.patch("/{id}/autorizar")
async def autorizar(id: int, body: AutorizarBody, admin: dict = Depends(require_admin)):
    if using_database():
        with get_conn() as conn:
            resgate = conn.execute(
                """
                select r.*, ci.nome as item_nome
                from resgates r
                join catalogo_itens ci on ci.id = r.item_id
                where r.id = %s and r.status = 'pendente'
                for update
                """,
                (id,),
            ).fetchone()
            if not resgate:
                raise HTTPException(400, "Resgate não encontrado ou já processado")
            conn.execute(
                """
                update resgates
                set status = 'autorizado',
                    data_agenda = %s,
                    admin_cpf = %s,
                    admin_nome = %s,
                    processed_at = now()
                where id = %s
                """,
                (body.data_agenda, admin.get("cpf"), admin.get("nome"), id),
            )
            descricao = f"Resgate autorizado por {admin.get('nome') or 'administrador'}: {resgate['item_nome']}"
            if body.data_agenda:
                descricao = f"{descricao} - agendado para {body.data_agenda}"
            conn.execute(
                """
                insert into pontos_historico (cpf, tipo, pontos, descricao, ref_id)
                values (%s, 'resgate', %s, %s, %s)
                """,
                (resgate["cpf"], -resgate["pontos_usados"], descricao, id),
            )
            conn.commit()
        return {"status": "autorizado", "data_agenda": body.data_agenda}

    resgate = get_resgate(id)
    if not resgate or resgate["status"] != "pendente":
        raise HTTPException(400, "Resgate não encontrado ou já processado")

    resgate["status"] = "autorizado"
    resgate["data_agenda"] = body.data_agenda
    resgate["admin_cpf"] = admin.get("cpf")
    resgate["admin_nome"] = admin.get("nome")
    descricao = f"Resgate: {resgate['item_nome']}"
    if body.data_agenda:
        descricao = f"{descricao} Agendado {body.data_agenda}"
    add_historico(resgate["cpf"], "resgate", -resgate["pontos_usados"], descricao)
    return {"status": "autorizado", "data_agenda": body.data_agenda}


@router.patch("/{id}/recusar")
async def recusar(id: int, admin: dict = Depends(require_admin)):
    if using_database():
        with get_conn() as conn:
            resgate = conn.execute(
                """
                select r.*, ci.nome as item_nome
                from resgates r
                join catalogo_itens ci on ci.id = r.item_id
                where r.id = %s and r.status = 'pendente'
                for update
                """,
                (id,),
            ).fetchone()
            if not resgate:
                raise HTTPException(400, "Resgate não encontrado ou já processado")
            conn.execute(
                """
                update resgates
                set status = 'recusado',
                    admin_cpf = %s,
                    admin_nome = %s,
                    processed_at = now()
                where id = %s
                """,
                (admin.get("cpf"), admin.get("nome"), id),
            )
            conn.execute(
                "update clientes set pontos = pontos + %s where cpf = %s",
                (resgate["pontos_usados"], resgate["cpf"]),
            )
            conn.execute(
                """
                insert into pontos_historico (cpf, tipo, pontos, descricao, ref_id)
                values (%s, 'estorno', %s, %s, %s)
                """,
                (
                    resgate["cpf"],
                    resgate["pontos_usados"],
                    f"Resgate recusado por {admin.get('nome') or 'administrador'}: {resgate['item_nome']} - pontos devolvidos",
                    id,
                ),
            )
            conn.commit()
        return {"status": "recusado", "pontos_devolvidos": resgate["pontos_usados"]}

    resgate = get_resgate(id)
    if not resgate or resgate["status"] != "pendente":
        raise HTTPException(400, "Resgate não encontrado ou já processado")

    resgate["status"] = "recusado"
    resgate["admin_cpf"] = admin.get("cpf")
    resgate["admin_nome"] = admin.get("nome")
    cliente = get_cliente(resgate["cpf"])
    if cliente:
        cliente["pontos"] += resgate["pontos_usados"]
    return {"status": "recusado", "pontos_devolvidos": resgate["pontos_usados"]}
