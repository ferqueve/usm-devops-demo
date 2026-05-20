"""Acceso a la base de datos compartida con el backend Spring Boot.

ai-svc lee datos transaccionales para alimentar las features de IA, y
escribe sólo sobre la tabla `ai_embedding_espacio` (embeddings vectoriales).
"""

from __future__ import annotations

import os
from typing import Any, Iterable

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine


def _build_url() -> str:
    raw = os.getenv("DATABASE_URL")
    if raw:
        if raw.startswith("postgres://"):
            raw = raw.replace("postgres://", "postgresql://", 1)
        return raw
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "utec_db")
    user = os.getenv("DB_USER", "ut_user")
    password = os.getenv("DB_PASSWORD", "")
    return f"postgresql://{user}:{password}@{host}:{port}/{name}"


_engine: Engine = create_engine(_build_url(), pool_pre_ping=True)


def get_engine() -> Engine:
    return _engine


def listar_espacios_para_indexar() -> list[dict[str, Any]]:
    """Devuelve los espacios activos con datos suficientes para embeddings."""
    sql = text(
        """
        SELECT e.id           AS espacio_id,
               e.nombre       AS nombre,
               e.capacidad    AS capacidad,
               e.estado       AS estado,
               te.nombre      AS tipo,
               ed.nombre      AS edificio
          FROM espacio e
     LEFT JOIN tipo_espacio te ON te.id = e.tipo_espacio_id
     LEFT JOIN edificio     ed ON ed.id = e.edificio_id
         WHERE e.deleted_at IS NULL
         ORDER BY e.id
        """
    )
    with _engine.connect() as conn:
        rows = conn.execute(sql).mappings().all()
    return [dict(r) for r in rows]


def upsert_embeddings(
    items: Iterable[tuple[int, str, list[float], str]],
) -> int:
    """Inserta o actualiza embeddings por espacio_id.

    Cada item: (espacio_id, texto_indexado, embedding, model_version).
    Devuelve cuántas filas se afectaron.
    """
    sql = text(
        """
        INSERT INTO ai_embedding_espacio
            (espacio_id, texto_indexado, embedding, model_version, updated_at)
        VALUES
            (:espacio_id, :texto, CAST(:emb AS vector), :model, now())
        ON CONFLICT (espacio_id) DO UPDATE
            SET texto_indexado = EXCLUDED.texto_indexado,
                embedding      = EXCLUDED.embedding,
                model_version  = EXCLUDED.model_version,
                updated_at     = now()
        """
    )
    count = 0
    with _engine.begin() as conn:
        for espacio_id, texto, emb, model in items:
            conn.execute(
                sql,
                {
                    "espacio_id": espacio_id,
                    "texto": texto,
                    "emb": str(emb),
                    "model": model,
                },
            )
            count += 1
    return count


def buscar_espacios_similares(
    query_embedding: list[float], top: int = 5
) -> list[dict[str, Any]]:
    """Cosine similarity search sobre ai_embedding_espacio."""
    sql = text(
        """
        SELECT espacio_id,
               texto_indexado,
               1 - (embedding <=> CAST(:emb AS vector)) AS similitud
          FROM ai_embedding_espacio
         ORDER BY embedding <=> CAST(:emb AS vector)
         LIMIT :top
        """
    )
    with _engine.connect() as conn:
        rows = conn.execute(
            sql, {"emb": str(query_embedding), "top": top}
        ).mappings().all()
    return [dict(r) for r in rows]
