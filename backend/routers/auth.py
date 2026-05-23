import logging

from fastapi import APIRouter, Depends, HTTPException
from passlib.hash import bcrypt
from pydantic import BaseModel

from auth_utils import criar_token, require_auth, require_superadmin
from db import get_conn, normalize_cliente, using_database
from mock_data import ADMINS, get_cliente

router = APIRouter()
logger = logging.getLogger(__name__)


class LoginClienteBody(BaseModel):
    cpf: str


class LoginAdminBody(BaseModel):
    cpf: str | None = None
    email: str | None = None
    senha: str


class AdminPermissaoBody(BaseModel):
    cpf: str
    senha: str
    role: str = "admin"


def senha_admin_valida(senha: str, senha_hash: str | None) -> bool:
    if not senha_hash:
        return False
    try:
        return bcrypt.verify(senha, senha_hash.strip())
    except Exception as exc:
        logger.warning("Falha ao validar hash de admin: %s", exc)
        return False


@router.post("/cliente")
async def login_cliente(body: LoginClienteBody):
    cpf = body.cpf.replace(".", "").replace("-", "").strip()
    if using_database():
        with get_conn() as conn:
            cliente = conn.execute("select * from clientes where cpf = %s", (cpf,)).fetchone()
        cliente = normalize_cliente(cliente)
        if not cliente:
            raise HTTPException(404, "CPF não cadastrado. Fale com a barbearia.")
        token = criar_token({"tipo": "cliente", "cpf": cliente["cpf"]})
        return {"token": token, "tipo": "cliente", "nome": cliente["nome"], "pontos": cliente["pontos"]}

    cliente = get_cliente(cpf)
    if not cliente:
        raise HTTPException(404, "CPF não cadastrado. Fale com a barbearia.")
    token = criar_token({"tipo": "cliente", "cpf": cliente["cpf"]})
    return {"token": token, "tipo": "cliente", "nome": cliente["nome"], "pontos": cliente["pontos"]}


@router.post("/admin")
async def login_admin(body: LoginAdminBody):
    login_id = (body.cpf or body.email or "").replace(".", "").replace("-", "").strip()
    if not login_id:
        raise HTTPException(400, "Informe o CPF")

    if using_database():
        with get_conn() as conn:
            admin = conn.execute(
                """
                select
                  ap.cpf,
                  ap.role,
                  ap.senha_hash,
                  c.nome
                from admin_permissoes ap
                left join clientes c on c.cpf = ap.cpf
                where ap.cpf = %s
                  and ap.ativo = true
                """,
                (login_id,),
            ).fetchone()
        if not admin or not senha_admin_valida(body.senha, admin["senha_hash"]):
            raise HTTPException(401, "Credenciais invalidas")
        nome = admin["nome"] or "Administrador"
        token = criar_token({"tipo": "admin", "cpf": admin["cpf"], "role": admin["role"], "nome": nome})
        return {"token": token, "tipo": "admin", "cpf": admin["cpf"], "role": admin["role"], "nome": nome}

    admin = next((item for item in ADMINS if item["email"] == login_id), None)
    if not admin or body.senha != admin["senha"]:
        raise HTTPException(401, "Credenciais invalidas")
    token = criar_token({"tipo": "admin", "id": admin["id"], "nome": admin["nome"]})
    return {"token": token, "tipo": "admin", "nome": admin["nome"]}


@router.get("/me")
async def me(payload: dict = Depends(require_auth)):
    return payload


@router.get("/admins")
async def listar_admins(_: dict = Depends(require_superadmin)):
    if not using_database():
        return [{"cpf": item["email"], "nome": item["nome"], "role": "superadmin", "ativo": True} for item in ADMINS]

    with get_conn() as conn:
        rows = conn.execute(
            """
            select ap.cpf, c.nome, ap.role, ap.ativo, ap.created_at, ap.updated_at
            from admin_permissoes ap
            join clientes c on c.cpf = ap.cpf
            order by c.nome
            """
        ).fetchall()
    return [dict(row) for row in rows]


@router.post("/admins", status_code=201)
async def salvar_admin(body: AdminPermissaoBody, _: dict = Depends(require_superadmin)):
    if body.role not in ("admin", "superadmin"):
        raise HTTPException(400, "Role invalida")
    if not using_database():
        raise HTTPException(400, "Cadastro de admins exige banco de dados")

    cpf = body.cpf.replace(".", "").replace("-", "").strip()
    if len(cpf) != 11:
        raise HTTPException(400, "CPF invalido")

    senha_hash = bcrypt.hash(body.senha)
    with get_conn() as conn:
        cliente = conn.execute("select cpf from clientes where cpf = %s", (cpf,)).fetchone()
        if not cliente:
            raise HTTPException(404, "Cliente não encontrado")
        row = conn.execute(
            """
            insert into admin_permissoes (cpf, role, senha_hash, ativo)
            values (%s, %s, %s, true)
            on conflict (cpf) do update
            set role = excluded.role,
                senha_hash = excluded.senha_hash,
                ativo = true
            returning cpf, role, ativo
            """,
            (cpf, body.role, senha_hash),
        ).fetchone()
        conn.commit()
    return dict(row)


@router.delete("/admins/{cpf}")
async def desativar_admin(cpf: str, _: dict = Depends(require_superadmin)):
    if not using_database():
        raise HTTPException(400, "Cadastro de admins exige banco de dados")

    clean_cpf = cpf.replace(".", "").replace("-", "").strip()
    with get_conn() as conn:
        row = conn.execute(
            "update admin_permissoes set ativo = false where cpf = %s returning cpf, role, ativo",
            (clean_cpf,),
        ).fetchone()
        conn.commit()
    if not row:
        raise HTTPException(404, "Admin não encontrado")
    return dict(row)
