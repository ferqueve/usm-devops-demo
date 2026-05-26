"""ai-svc · capa de IA generativa de UTEC Space Manager.

Microservicio Python que orquesta llamadas a Gemini (text gen + embeddings)
y expone endpoints HTTP que el backend Spring consume vía proxy.

- /health                 — liveness
- /insights/*             — features de prompt simple (resumen stats, etc.)
- /search/*               — búsqueda semántica con RAG
- /admin/*                — mantenimiento (reindex embeddings)
- /chat                   — chatbot con function calling

Ver documentation/fichas-tecnicas/capa-ia-generativa.md.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime

from fastapi import FastAPI

from routes import admin, chat, insights, search

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)

app = FastAPI(
    title="UTEC Space Manager · AI service",
    version="1.0.0",
    description="Capa de IA generativa: insights, RAG y chatbot.",
)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "provider": os.getenv("LLM_PROVIDER", "gemini"),
        "model": os.getenv("LLM_MODEL", "gemini-2.5-flash"),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


app.include_router(insights.router, prefix="/insights", tags=["insights"])
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(chat.router, tags=["chat"])
