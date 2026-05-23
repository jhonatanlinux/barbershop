from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth_utils import require_admin
from db import get_conn, normalize_cliente, rows_to_list, using_database
from mock_data import CLIENTES, get_cliente, plano_ativo, pode_barba, pode_corte, semana_do_plano

router = APIRouter()


class PagamentoBody(BaseModel):
    data_pagamento: str
    plano_tipo: str = "completo"
    semanas_barba: str = "impar"


@router.get("/")
async def listar(_: dict = Depends(require_admin)):
    if using_database():
        with get_conn() as conn:
            rows = conn.execute(
                """
                select *
                from clientes
                where tipo = 'mensalista'
                order by nome
                """
            ).fetchall()
        mensalistas = [normalize_cliente(row) for row in rows]
        return [
            {
                **cliente,
                "plano_ativo": plano_ativo(cliente),
                "semana_atual": semana_do_plano(cliente["plano_inicio"]) if cliente.get("plano_inicio") else 0,
                "pode_corte": pode_corte(cliente),
                "pode_barba": pode_barba(cliente),
            }
            for cliente in mensalistas
        ]

    mensalistas = [cliente for cliente in CLIENTES if cliente["tipo"] == "mensalista"]
    return [
        {
            **cliente,
            "plano_ativo": plano_ativo(cliente),
            "semana_atual": semana_do_plano(cliente["plano_inicio"]) if cliente.get("plano_inicio") else 0,
            "pode_corte": pode_corte(cliente),
            "pode_barba": pode_barba(cliente),
        }
        for cliente in mensalistas
    ]


@router.post("/{cpf}/pagamento")
async def registrar_pagamento(cpf: str, body: PagamentoBody, _: dict = Depends(require_admin)):
    if using_database():
        inicio = date.fromisoformat(body.data_pagamento)
        vencimento = inicio + timedelta(days=30)
        with get_conn() as conn:
            row = conn.execute(
                """
                update clientes
                set tipo = 'mensalista',
                    plano_inicio = %s,
                    plano_vencimento = %s,
                    plano_tipo = %s,
                    semanas_barba = %s,
                    cortes_semanas = '[]'::jsonb,
                    barbas_semanas = '[]'::jsonb
                where cpf = %s
                returning plano_inicio, plano_vencimento
                """,
                (body.data_pagamento, vencimento.isoformat(), body.plano_tipo, body.semanas_barba, cpf),
            ).fetchone()
            conn.commit()
        if not row:
            raise HTTPException(404, "Cliente não encontrado")
        return {
            "mensagem": "Pagamento registrado",
            "plano_inicio": row["plano_inicio"].isoformat(),
            "plano_vencimento": row["plano_vencimento"].isoformat(),
        }

    cliente = get_cliente(cpf)
    if not cliente:
        raise HTTPException(404, "Cliente não encontrado")

    inicio = date.fromisoformat(body.data_pagamento)
    vencimento = inicio + timedelta(days=30)
    cliente.update(
        {
            "tipo": "mensalista",
            "plano_inicio": body.data_pagamento,
            "plano_vencimento": vencimento.isoformat(),
            "plano_tipo": body.plano_tipo,
            "semanas_barba": body.semanas_barba,
            "cortes_semanas": "[]",
            "barbas_semanas": "[]",
        }
    )
    return {
        "mensagem": "Pagamento registrado",
        "plano_inicio": cliente["plano_inicio"],
        "plano_vencimento": cliente["plano_vencimento"],
    }
