from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth_utils import require_admin, require_auth
from db import get_conn, row_to_dict, rows_to_list, using_database
from mock_data import CONFIG

router = APIRouter()


class ConfigUpdate(BaseModel):
    chave: str
    valor: str


@router.get("/")
async def listar(_: dict = Depends(require_auth)):
    if using_database():
        with get_conn() as conn:
            rows = conn.execute("select chave, valor, tipo from config_sistema order by chave").fetchall()
        return rows_to_list(rows)

    return [{"chave": key, "valor": value["valor"], "tipo": value["tipo"]} for key, value in CONFIG.items()]


@router.patch("/")
async def atualizar(body: ConfigUpdate, _: dict = Depends(require_admin)):
    if using_database():
        with get_conn() as conn:
            row = conn.execute(
                """
                update config_sistema
                set valor = %s
                where chave = %s
                returning chave, valor, tipo
                """,
                (body.valor, body.chave),
            ).fetchone()
            conn.commit()
        if not row:
            raise HTTPException(404, f"Chave '{body.chave}' não encontrada")
        return row_to_dict(row)

    if body.chave not in CONFIG:
        raise HTTPException(404, f"Chave '{body.chave}' não encontrada")

    tipo = CONFIG[body.chave]["tipo"]
    if tipo == "boolean":
        CONFIG[body.chave]["valor"] = body.valor.lower() in ("true", "1", "yes")
    elif tipo == "integer":
        CONFIG[body.chave]["valor"] = int(body.valor)
    else:
        CONFIG[body.chave]["valor"] = body.valor

    return {"chave": body.chave, "valor": CONFIG[body.chave]["valor"]}
