import json
import os
from contextlib import contextmanager
from datetime import date, datetime
from decimal import Decimal

import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.getenv("DATABASE_URL")


def using_database() -> bool:
    return bool(DATABASE_URL)


@contextmanager
def get_conn():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL nao configurado")
    with psycopg.connect(DATABASE_URL, row_factory=dict_row) as conn:
        yield conn


def serialize(value):
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return int(value) if value == int(value) else float(value)
    if isinstance(value, list):
        return [serialize(item) for item in value]
    if isinstance(value, dict):
        return {key: serialize(item) for key, item in value.items()}
    return value


def row_to_dict(row):
    return serialize(dict(row)) if row else None


def rows_to_list(rows):
    return [row_to_dict(row) for row in rows]


def parse_json_array(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return []
    return value


def normalize_cliente(cliente):
    if not cliente:
        return None
    data = row_to_dict(cliente)
    data["cortes_semanas"] = parse_json_array(data.get("cortes_semanas"))
    data["barbas_semanas"] = parse_json_array(data.get("barbas_semanas"))
    return data
