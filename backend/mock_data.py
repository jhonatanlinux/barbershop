import json
import os
from datetime import date, timedelta


def _atras(days: int) -> str:
    return (date.today() - timedelta(days=days)).isoformat()


def _afrente(days: int) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


ADMINS = [
    {
        "id": 1,
        "email": os.getenv("MOCK_ADMIN_EMAIL", "admin"),
        "senha": os.getenv("MOCK_ADMIN_PASSWORD", "troque-esta-senha"),
        "nome": "Administrador",
    },
]

CLIENTES = [
    {
        "cpf": "04232595120",
        "nome": "Carlos Eduardo",
        "telefone": "(66) 99234-5678",
        "pontos": 50,
        "tipo": "regular",
        "plano_tipo": "completo",
        "plano_inicio": None,
        "plano_vencimento": None,
        "semanas_barba": "impar",
        "cortes_semanas": "[]",
        "barbas_semanas": "[]",
        "created_at": _atras(90),
    },
    {
        "cpf": "12345678900",
        "nome": "Rafael Mendes",
        "telefone": "(66) 98765-4321",
        "pontos": 130,
        "tipo": "mensalista",
        "plano_tipo": "completo",
        "plano_inicio": _atras(18),
        "plano_vencimento": _afrente(12),
        "semanas_barba": "impar",
        "cortes_semanas": "[1,2]",
        "barbas_semanas": "[1]",
        "created_at": _atras(180),
    },
    {
        "cpf": "98765432100",
        "nome": "Pedro Henrique",
        "telefone": "(66) 97654-3210",
        "pontos": 80,
        "tipo": "regular",
        "plano_tipo": "completo",
        "plano_inicio": None,
        "plano_vencimento": None,
        "semanas_barba": "impar",
        "cortes_semanas": "[]",
        "barbas_semanas": "[]",
        "created_at": _atras(60),
    },
]

CATALOGO = [
    {"id": 1, "nome": "Corte Gratis", "descricao": "Corte masculino completo", "custo_pontos": 100, "categoria": "corte", "ativo": True},
    {"id": 2, "nome": "Corte + Barba", "descricao": "Combo completo por pontos", "custo_pontos": 140, "categoria": "corte", "ativo": True},
    {"id": 3, "nome": "Barba Gratis", "descricao": "Modelagem e acabamento de barba", "custo_pontos": 60, "categoria": "barba", "ativo": True},
    {"id": 4, "nome": "Cerveja Gelada", "descricao": "Uma Heineken gelada no atendimento", "custo_pontos": 30, "categoria": "bebida", "ativo": True},
    {"id": 5, "nome": "Refrigerante", "descricao": "Lata gelada a sua escolha", "custo_pontos": 15, "categoria": "bebida", "ativo": True},
    {"id": 6, "nome": "Zacca Pomada Matte", "descricao": "Fixacao forte, acabamento opaco", "custo_pontos": 50, "categoria": "produto", "ativo": True},
]

RESGATES = [
    {
        "id": 1,
        "cpf": "04232595120",
        "cliente_nome": "Carlos Eduardo",
        "item_id": 1,
        "item_nome": "Corte Gratis",
        "item_cat": "corte",
        "pontos_usados": 100,
        "status": "pendente",
        "data_agenda": None,
        "created_at": _atras(1),
    },
    {
        "id": 2,
        "cpf": "98765432100",
        "cliente_nome": "Pedro Henrique",
        "item_id": 4,
        "item_nome": "Cerveja Gelada",
        "item_cat": "bebida",
        "pontos_usados": 30,
        "status": "pendente",
        "data_agenda": None,
        "created_at": _atras(0),
    },
]

HISTORICO = {
    "04232595120": [
        {"tipo": "ganho", "pontos": 10, "descricao": "Corte realizado", "created_at": _atras(7)},
        {"tipo": "resgate", "pontos": -30, "descricao": "Resgate: Cerveja Gelada", "created_at": _atras(20)},
    ],
    "12345678900": [
        {"tipo": "ganho", "pontos": 3, "descricao": "Corte Mensalista Semana 3", "created_at": _atras(3)},
    ],
}

CONFIG = {
    "modulo_mensalista": {"valor": True, "tipo": "boolean"},
    "modulo_catalogo": {"valor": True, "tipo": "boolean"},
    "validacao_cpf": {"valor": True, "tipo": "boolean"},
    "limite_solicitacoes": {"valor": 2, "tipo": "integer"},
    "pontos_por_corte": {"valor": 10, "tipo": "integer"},
    "pontos_mensalista": {"valor": 3, "tipo": "integer"},
    "nome_barbearia": {"valor": "Corte Fino", "tipo": "string"},
    "preco_mensalista": {"valor": 150, "tipo": "integer"},
    "preco_mensalista_sem_barba": {"valor": 100, "tipo": "integer"},
    "preco_mensalista_so_barba": {"valor": 80, "tipo": "integer"},
    "dias_plano": {"valor": 30, "tipo": "integer"},
}


def get_cliente(cpf: str):
    return next((cliente for cliente in CLIENTES if cliente["cpf"] == cpf), None)


def get_catalogo_item(item_id: int):
    return next((item for item in CATALOGO if item["id"] == item_id), None)


def get_resgate(resgate_id: int):
    return next((resgate for resgate in RESGATES if resgate["id"] == resgate_id), None)


def next_resgate_id() -> int:
    return max((resgate["id"] for resgate in RESGATES), default=0) + 1


def get_historico(cpf: str):
    return HISTORICO.get(cpf, [])


def add_historico(cpf: str, tipo: str, pontos: int, descricao: str):
    HISTORICO.setdefault(cpf, []).insert(
        0,
        {
            "tipo": tipo,
            "pontos": pontos,
            "descricao": descricao,
            "created_at": date.today().isoformat(),
        },
    )


def parse_arr(value):
    if not value:
        return []
    if isinstance(value, list):
        return value
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return []


def semana_do_plano(data_inicio: str) -> int:
    return (date.today() - date.fromisoformat(data_inicio)).days // 7 + 1


def plano_ativo(cliente: dict) -> bool:
    if cliente.get("tipo") != "mensalista" or not cliente.get("plano_vencimento"):
        return False
    return date.today() <= date.fromisoformat(cliente["plano_vencimento"])


def pode_corte(cliente: dict) -> bool:
    if not plano_ativo(cliente) or cliente.get("plano_tipo") == "so_barba":
        return False
    semana = semana_do_plano(cliente["plano_inicio"])
    return semana not in parse_arr(cliente.get("cortes_semanas"))


def pode_barba(cliente: dict) -> bool:
    if not plano_ativo(cliente) or cliente.get("plano_tipo") == "sem_barba":
        return False
    semana = semana_do_plano(cliente["plano_inicio"])
    usadas = parse_arr(cliente.get("barbas_semanas"))
    if cliente.get("plano_tipo") == "so_barba":
        return semana not in usadas
    padrao = cliente.get("semanas_barba", "impar")
    permitida = semana % 2 == 1 if padrao == "impar" else semana % 2 == 0
    return permitida and semana not in usadas
