from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from db import using_database
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router, prefix, tag in ROUTERS:
    app.include_router(router, prefix=prefix, tags=[tag])


@app.get("/")
async def root():
    return {
        "status": "ok",
        "app": "Barbearia Corte Fino API",
        "modo": "DATABASE" if using_database() else "MOCK",
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "database": using_database()}
