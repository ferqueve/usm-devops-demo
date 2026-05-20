"""Endpoints de búsqueda semántica de espacios (RAG con pgvector)."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query

from db import buscar_espacios_similares
from llm import get_embeddings

router = APIRouter()
log = logging.getLogger("ai-svc.search")


@router.get("/espacios")
def buscar_espacios(
    q: str = Query(..., min_length=2, description="Consulta en lenguaje natural"),
    top: int = Query(5, ge=1, le=20),
) -> dict:
    embeddings = get_embeddings()
    try:
        vector = embeddings.embed_query(q)
    except Exception as exc:  # noqa: BLE001
        log.exception("Falló embedding de la query")
        raise HTTPException(status_code=502, detail=f"Embeddings error: {exc}") from exc

    resultados = buscar_espacios_similares(vector, top=top)
    return {"query": q, "resultados": resultados}
