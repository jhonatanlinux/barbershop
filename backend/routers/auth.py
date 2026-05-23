from fastapi import APIRouter, Depends, HTTPException
from passlib.hash import bcrypt
from pydantic import BaseModel

from auth_utils import criar_token, require_auth
from db import get_conn, normalize_cliente, using_database
from mock_data import ADMINS, get_cliente

router = APIRouter()


class LoginClienteBody(BaseModel):
    cpf: str


class LoginAdminBody(BaseModel):
    email: str
    senha: str


@router.post("/cliente")
async def login_cliente(body: LoginClienteBody):
    cpf = body.cpf.replace(".", "").replace("-", "").strip()
    if using_database():
        with get_conn() as conn:
            cliente = conn.execute("select * from clientes where cpf = %s", (cpf,)).fetchone()
        cliente = normalize_cliente(cliente)
        if not cliente:
            raise HTTPException(404, "CPF nao cadastrado. Fale com a barbearia.")
        token = criar_token({"tipo": "cliente", "cpf": cliente["cpf"]})
        return {"token": token, "tipo": "cliente", "nome": cliente["nome"], "pontos": cliente["pontos"]}

    cliente = get_cliente(cpf)
    if not cliente:
        raise HTTPException(404, "CPF nao cadastrado. Fale com a barbearia.")
    token = criar_token({"tipo": "cliente", "cpf": cliente["cpf"]})
    return {"token": token, "tipo": "cliente", "nome": cliente["nome"], "pontos": cliente["pontos"]}


@router.post("/admin")
async def login_admin(body: LoginAdminBody):
    if using_database():
        with get_conn() as conn:
            admin = conn.execute(
                "select id, email, senha_hash, nome from admins where email = %s and ativo = true",
                (body.email,),
            ).fetchone()
        if not admin or not bcrypt.verify(body.senha, admin["senha_hash"]):
            raise HTTPException(401, "Credenciais invalidas")
        token = criar_token({"tipo": "admin", "id": admin["id"], "nome": admin["nome"]})
        return {"token": token, "tipo": "admin", "nome": admin["nome"]}

    admin = next((item for item in ADMINS if item["email"] == body.email), None)
    if not admin or body.senha != admin["senha"]:
        raise HTTPException(401, "Credenciais invalidas")
    token = criar_token({"tipo": "admin", "id": admin["id"], "nome": admin["nome"]})
    return {"token": token, "tipo": "admin", "nome": admin["nome"]}


@router.get("/me")
async def me(payload: dict = Depends(require_auth)):
    return payload
