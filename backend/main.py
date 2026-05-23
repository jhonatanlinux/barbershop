import os

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

if os.getenv("APP_ENV", "").lower() not in {"prod", "production"} and not os.getenv("RENDER"):
    load_dotenv()

from db import is_production, mock_data_enabled, using_database
from routers import auth, catalogo, clientes, config, cortes, mensalistas, resgates

ROUTERS = (
    (auth.router, "/auth", "Auth"),
    (clientes.router, "/clientes", "Clientes"),
    (cortes.router, "/cortes", "Cortes"),
    (resgates.router, "/resgates", "Resgates"),
    (catalogo.router, "/catalogo", "Catalogo"),
    (mensalistas.router, "/mensalistas", "Mensalistas"),
    (config.router, "/config", "Config"),
)

app = FastAPI(title="Barbearia Corte Fino API", version="1.0.0")


def data_mode() -> str:
    if using_database():
        return "DATABASE"
    if mock_data_enabled():
        return "MOCK"
    return "DATABASE_REQUIRED"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def block_mock_data_in_production(request, call_next):
    if (
        request.url.path not in {"/", "/health"}
        and not using_database()
        and not mock_data_enabled()
    ):
        return JSONResponse(
            status_code=503,
            content={
                "detail": "Banco de dados nao configurado no ambiente de producao.",
            },
        )
    return await call_next(request)

for router, prefix, tag in ROUTERS:
    app.include_router(router, prefix=prefix, tags=[tag])


@app.get("/")
async def root():
    return {
        "status": "ok",
        "app": "Barbearia Corte Fino API",
        "modo": data_mode(),
        "production": is_production(),
        "mock_enabled": mock_data_enabled(),
    }


@app.get("/health")
async def health():
    if is_production() and not using_database():
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": False,
                "detail": "DATABASE_URL nao configurado",
            },
        )
    return {"status": "healthy", "database": using_database()}
