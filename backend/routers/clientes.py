from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from passlib.hash import bcrypt
from pydantic import BaseModel

from auth_utils import require_admin, require_auth
from db import get_conn, normalize_cliente, row_to_dict, rows_to_list, using_database
from mock_data import CLIENTES, RESGATES, get_cliente, get_historico

router = APIRouter()


class ClienteCreate(BaseModel):
    cpf: str
    nome: str = "Sem nome"
    telefone: str
    tipo: str = "regular"
    tornar_admin: bool = False
    admin_senha: Optional[str] = None


class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    tipo: Optional[str] = None
    plano_tipo: Optional[str] = None
    plano_inicio: Optional[str] = None
    plano_vencimento: Optional[str] = None
    semanas_barba: Optional[str] = None
    anotacoes: Optional[str] = None


@router.get("/")
async def listar(_: dict = Depends(require_admin)):
    if using_database():
        with get_conn() as conn:
            rows = conn.execute("select * from clientes order by created_at desc").fetchall()
        return [normalize_cliente(row) for row in rows]
    return CLIENTES


@router.post("/", status_code=201)
async def criar(body: ClienteCreate, _: dict = Depends(require_admin)):
    cpf = body.cpf.replace(".", "").replace("-", "").strip()
    if len(cpf) != 11:
        raise HTTPException(400, "CPF invalido")
    if body.tornar_admin and not body.admin_senha:
        raise HTTPException(400, "Informe a senha do acesso admin")
    if using_database():
        try:
            with get_conn() as conn:
                row = conn.execute(
                    """
                    insert into clientes (cpf, nome, telefone, tipo)
                    values (%s, %s, %s, %s)
                    returning *
                    """,
                    (cpf, body.nome, body.telefone, body.tipo),
                ).fetchone()
                if body.tornar_admin:
                    senha_hash = bcrypt.hash(body.admin_senha)
                    conn.execute(
                        """
                        insert into admin_permissoes (cpf, role, senha_hash, ativo)
                        values (%s, 'admin', %s, true)
                        on conflict (cpf) do update
                        set role = 'admin',
                            senha_hash = excluded.senha_hash,
                            ativo = true
                        """,
                        (cpf, senha_hash),
                    )
                conn.commit()
        except Exception as exc:
            if "duplicate key" in str(exc).lower():
                raise HTTPException(409, "CPF ja cadastrado") from exc
            raise
        return normalize_cliente(row)

    if get_cliente(cpf):
        raise HTTPException(409, "CPF ja cadastrado")

    novo = {
        "cpf": cpf,
        "nome": body.nome,
        "telefone": body.telefone,
        "pontos": 0,
        "tipo": body.tipo,
        "plano_tipo": "completo",
        "plano_inicio": None,
        "plano_vencimento": None,
        "semanas_barba": "impar",
        "cortes_semanas": "[]",
        "barbas_semanas": "[]",
        "created_at": date.today().isoformat(),
    }
    CLIENTES.insert(0, novo)
    return novo


@router.get("/{cpf}")
async def buscar(cpf: str, payload: dict = Depends(require_auth)):
    if payload.get("tipo") == "cliente" and payload.get("cpf") != cpf:
        raise HTTPException(403, "Acesso negado")

    if using_database():
        with get_conn() as conn:
            cliente = conn.execute("select * from clientes where cpf = %s", (cpf,)).fetchone()
            historico = conn.execute(
                "select * from pontos_historico where cpf = %s order by created_at desc",
                (cpf,),
            ).fetchall()
            resgates = conn.execute(
                """
                select *
                from v_resgates_completo
                where cpf = %s
                order by created_at desc
                """,
                (cpf,),
            ).fetchall()
        cliente = normalize_cliente(cliente)
        if not cliente:
            raise HTTPException(404, "Cliente não encontrado")
        return {**cliente, "historico": rows_to_list(historico), "resgates": rows_to_list(resgates)}

    cliente = get_cliente(cpf)
    if not cliente:
        raise HTTPException(404, "Cliente não encontrado")

    return {
        **cliente,
        "historico": get_historico(cpf),
        "resgates": [resgate for resgate in RESGATES if resgate["cpf"] == cpf],
    }


@router.patch("/{cpf}")
async def atualizar(cpf: str, body: ClienteUpdate, _: dict = Depends(require_admin)):
    if using_database():
        updates = body.dict(exclude_none=True)
        if not updates:
            with get_conn() as conn:
                row = conn.execute("select * from clientes where cpf = %s", (cpf,)).fetchone()
            if not row:
                raise HTTPException(404, "Cliente não encontrado")
            return normalize_cliente(row)

        allowed = {
            "nome",
            "telefone",
            "tipo",
            "plano_tipo",
            "plano_inicio",
            "plano_vencimento",
            "semanas_barba",
            "anotacoes",
        }
        set_parts = [f"{key} = %s" for key in updates if key in allowed]
        values = [updates[key] for key in updates if key in allowed]
        if updates.get("tipo") == "regular":
            set_parts.extend(
                [
                    "plano_inicio = null",
                    "plano_vencimento = null",
                    "cortes_semanas = '[]'::jsonb",
                    "barbas_semanas = '[]'::jsonb",
                ]
            )
        if not set_parts:
            raise HTTPException(400, "Nenhum campo valido para atualizar")
        values.append(cpf)

        with get_conn() as conn:
            row = conn.execute(
                f"update clientes set {', '.join(set_parts)} where cpf = %s returning *",
                values,
            ).fetchone()
            conn.commit()
        if not row:
            raise HTTPException(404, "Cliente não encontrado")
        return normalize_cliente(row)

    cliente = get_cliente(cpf)
    if not cliente:
        raise HTTPException(404, "Cliente não encontrado")

    updates = body.dict(exclude_none=True)
    cliente.update(updates)
    if updates.get("tipo") == "regular":
        cliente.update(
            {
                "plano_inicio": None,
                "plano_vencimento": None,
                "cortes_semanas": "[]",
                "barbas_semanas": "[]",
            }
        )
    return cliente


@router.delete("/{cpf}")
async def remover(cpf: str, _: dict = Depends(require_admin)):
    clean_cpf = cpf.replace(".", "").replace("-", "").strip()
    if using_database():
        with get_conn() as conn:
            row = conn.execute(
                "delete from clientes where cpf = %s returning cpf",
                (clean_cpf,),
            ).fetchone()
            conn.commit()
        if not row:
            raise HTTPException(404, "Cliente não encontrado")
        return {"status": "removido", "cpf": clean_cpf}

    cliente = get_cliente(clean_cpf)
    if not cliente:
        raise HTTPException(404, "Cliente não encontrado")
    CLIENTES.remove(cliente)
    return {"status": "removido", "cpf": clean_cpf}
