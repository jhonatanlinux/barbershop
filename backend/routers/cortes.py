import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth_utils import require_admin
from db import get_conn, normalize_cliente, using_database
from mock_data import CONFIG, add_historico, get_cliente, parse_arr, semana_do_plano

router = APIRouter()


class CorteBody(BaseModel):
    cpf: str
    tipo_servico: str = "corte"


@router.post("/", status_code=201)
async def lancar_corte(body: CorteBody, _: dict = Depends(require_admin)):
    cpf = body.cpf.replace(".", "").replace("-", "").strip()
    if using_database():
        with get_conn() as conn:
            cliente = conn.execute("select * from clientes where cpf = %s", (cpf,)).fetchone()
            if not cliente:
                raise HTTPException(404, "Cliente não encontrado")
            cliente = normalize_cliente(cliente)
            is_mensalista = cliente["tipo"] == "mensalista"
            cfg_rows = conn.execute(
                "select chave, valor from config_sistema where chave in ('pontos_mensalista', 'pontos_por_corte')"
            ).fetchall()
            cfg = {row["chave"]: int(row["valor"]) for row in cfg_rows}
            pontos = cfg["pontos_mensalista"] if is_mensalista else cfg["pontos_por_corte"]
            semana = semana_do_plano(cliente["plano_inicio"]) if is_mensalista and cliente.get("plano_inicio") else None
            result = conn.execute(
                "select fn_lancar_corte(%s, %s, %s, %s, %s, null) as data",
                (cpf, _.get("id"), body.tipo_servico, pontos, semana),
            ).fetchone()
            campo = "cortes_semanas" if body.tipo_servico == "corte" else "barbas_semanas"
            if semana and campo in cliente:
                usadas = parse_arr(cliente[campo])
                if semana not in usadas:
                    usadas.append(semana)
                conn.execute(f"update clientes set {campo} = %s::jsonb where cpf = %s", (json.dumps(usadas), cpf))
            conn.commit()
        data = result["data"]
        return {
            "pontos_adicionados": pontos,
            "pontos_atuais": data["pontos_atuais"],
            "mensagem": "Corte realizado" if body.tipo_servico == "corte" else "Barba realizada",
        }

    cliente = get_cliente(cpf)
    if not cliente:
        raise HTTPException(404, "Cliente não encontrado")

    is_mensalista = cliente["tipo"] == "mensalista"
    pontos = CONFIG["pontos_mensalista"]["valor"] if is_mensalista else CONFIG["pontos_por_corte"]["valor"]
    tipo = body.tipo_servico

    if is_mensalista and cliente.get("plano_inicio"):
        semana = semana_do_plano(cliente["plano_inicio"])
        campo = "cortes_semanas" if tipo == "corte" else "barbas_semanas"
        usadas = parse_arr(cliente[campo])
        if semana not in usadas:
            usadas.append(semana)
        cliente[campo] = json.dumps(usadas)
        descricao = f"{'Corte' if tipo == 'corte' else 'Barba'} Mensalista Semana {semana}"
    else:
        descricao = "Corte realizado" if tipo == "corte" else "Barba realizada"

    cliente["pontos"] += pontos
    add_historico(cpf, "ganho", pontos, descricao)
    return {"pontos_adicionados": pontos, "pontos_atuais": cliente["pontos"], "mensagem": descricao}
