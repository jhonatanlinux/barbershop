import os
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

SECRET_KEY = os.getenv("JWT_SECRET", "corte_fino_secret_2025_troque_em_producao")
ALGORITHM = "HS256"
EXPIRES_DAYS = int(os.getenv("JWT_EXPIRES_DAYS", "7"))

bearer = HTTPBearer()


def criar_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(days=EXPIRES_DAYS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decodificar_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Token invalido ou expirado") from exc


async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    return decodificar_token(credentials.credentials)


async def require_admin(payload: dict = Depends(require_auth)) -> dict:
    if payload.get("tipo") != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return payload


async def require_cliente(payload: dict = Depends(require_auth)) -> dict:
    if payload.get("tipo") != "cliente":
        raise HTTPException(status_code=403, detail="Acesso restrito a clientes")
    return payload
