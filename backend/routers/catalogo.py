from fastapi import APIRouter, Depends, HTTPException

from auth_utils import require_admin, require_auth
from db import get_conn, row_to_dict, rows_to_list, using_database
from mock_data import CATALOGO

router = APIRouter()


@router.get("/")
async def listar(payload: dict = Depends(require_auth)):
    if using_database():
        where = "" if payload.get("tipo") == "admin" else "where ativo = true"
        with get_conn() as conn:
            rows = conn.execute(f"select * from catalogo_itens {where} order by ordem, id").fetchall()
        return rows_to_list(rows)

    if payload.get("tipo") == "admin":
        return CATALOGO
    return [item for item in CATALOGO if item["ativo"]]


@router.patch("/{id}/toggle")
async def toggle(id: int, _: dict = Depends(require_admin)):
    if using_database():
        with get_conn() as conn:
            row = conn.execute(
                "update catalogo_itens set ativo = not ativo where id = %s returning id, ativo",
                (id,),
            ).fetchone()
            conn.commit()
        if not row:
            raise HTTPException(404, "Item nao encontrado")
        return row_to_dict(row)

    item = next((catalogo_item for catalogo_item in CATALOGO if catalogo_item["id"] == id), None)
    if not item:
        raise HTTPException(404, "Item nao encontrado")
    item["ativo"] = not item["ativo"]
    return {"id": id, "ativo": item["ativo"]}
