"""Endpoints administrativos: reindex de embeddings, etc."""

from __future__ import annotations

import logging
import os

from fastapi import APIRouter, HTTPException

from db import listar_espacios_para_indexar, upsert_embeddings
from llm import get_embeddings

router = APIRouter()
log = logging.getLogger("ai-svc.admin")


def _texto_espacio(e: dict) -> str:
    partes = [
        f"Espacio {e['nombre']}.",
        f"Capacidad {e['capacidad']} personas." if e.get("capacidad") else "",
        f"Tipo {e['tipo']}." if e.get("tipo") else "",
        f"Edificio {e['edificio']}." if e.get("edificio") else "",
        f"Estado {e['estado']}." if e.get("estado") else "",
    ]
    return " ".join(p for p in partes if p)


@router.post("/reindex-espacios")
def reindex_espacios() -> dict:
    espacios = listar_espacios_para_indexar()
    if not espacios:
        return {"status": "ok", "indexed": 0, "mensaje": "No hay espacios para indexar."}

    embeddings = get_embeddings()
    model_name = os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")
    textos = [_texto_espacio(e) for e in espacios]

    try:
        vectores = embeddings.embed_documents(textos)
    except Exception as exc:
        log.exception("Falló embedding batch")
        raise HTTPException(status_code=502, detail=f"Embeddings error: {exc}") from exc

    items = [
        (espacios[i]["espacio_id"], textos[i], vectores[i], model_name)
        for i in range(len(espacios))
    ]
    n = upsert_embeddings(items)
    log.info("Reindexados %s espacios con modelo %s", n, model_name)
    return {"status": "ok", "indexed": n, "model": model_name}
