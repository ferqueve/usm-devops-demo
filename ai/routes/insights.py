"""Endpoints de prompt simple (no requieren RAG ni function calling)."""

from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel

from llm import invoke_with_fallback

router = APIRouter()
log = logging.getLogger("ai-svc.insights")


def _invoke(system: str, user_payload: Any, label: str) -> str:
    """Invoca el LLM probando la cadena de providers en orden.

    Si el primario (típicamente Gemini) está rate-limited, salta al secundario
    (Groq) sin que el cliente lo perciba.
    """
    payload_text = json.dumps(user_payload, ensure_ascii=False, default=str)
    try:
        texto, _provider = invoke_with_fallback(
            [SystemMessage(content=system), HumanMessage(content=payload_text)],
            log_label=f"insights.{label}",
        )
        return texto
    except Exception as exc:  # noqa: BLE001
        log.exception("Toda la cadena LLM falló en %s", label)
        raise HTTPException(status_code=502, detail=f"LLM error: {exc}") from exc


# --------- 1.1 Resumen de stats ---------

class StatsSummaryRequest(BaseModel):
    periodo: str
    stats: dict[str, Any]


@router.post("/stats-summary")
def stats_summary(body: StatsSummaryRequest) -> dict:
    system = (
        "Sos un analista de datos que escribe un resumen ejecutivo para gestores universitarios. "
        "A partir de las estadísticas que te paso (formato JSON, español), redactá un párrafo de "
        "3 a 4 oraciones en español formal, citando los 2-3 hallazgos más relevantes y una "
        "recomendación operativa concreta. No uses bullet points. No repitas números crudos sin "
        "contexto. Pensá como si lo fuera a leer un decano apurado."
    )
    payload = {"periodo": body.periodo, "stats": body.stats}
    texto = _invoke(system, payload, "stats_summary")
    return {"resumen": texto.strip()}


# --------- 1.2 Explicación de recomendación ---------

class ExplainRecomendacionRequest(BaseModel):
    recomendacion: dict[str, Any]
    contexto_usuario: dict[str, Any] | None = None


@router.post("/explain-recomendacion")
def explain_recomendacion(body: ExplainRecomendacionRequest) -> dict:
    system = (
        "Sos un asistente de un sistema de reserva de espacios universitarios. "
        "Te paso una recomendación de espacio generada por un motor heurístico (con un puntaje "
        "entre 0 y 1 y una razón corta), más opcionalmente datos del usuario. Tu trabajo es "
        "convertir esa recomendación en una explicación natural, cálida y útil de 2 a 3 oraciones, "
        "en español, hablándole de vos al usuario. No inventes datos que no estén en el payload. "
        "Mencioná el puntaje sólo si es alto (>0.7) y de forma natural ('un muy buen match')."
    )
    payload = {
        "recomendacion": body.recomendacion,
        "contexto_usuario": body.contexto_usuario or {},
    }
    texto = _invoke(system, payload, "explain")
    return {"explicacion": texto.strip()}


# --------- 1.3 Análisis del forecast ---------

class AnalyzeForecastRequest(BaseModel):
    historico: list[dict[str, Any]]
    predicciones: list[dict[str, Any]]
    mape: float | None = None


@router.post("/analyze-forecast")
def analyze_forecast(body: AnalyzeForecastRequest) -> dict:
    system = (
        "Sos un analista que interpreta predicciones de demanda generadas por un modelo Prophet. "
        "Te paso histórico reciente, predicciones futuras (cada una con banda inferior y superior) "
        "y opcionalmente el MAPE del modelo. Devolvé un análisis de 3 a 5 oraciones en español formal "
        "que cubra: tendencia general, picos o caídas anticipados con fecha aproximada, y una "
        "recomendación operativa accionable (por ejemplo, liberar espacios extra cierto día). "
        "Si el MAPE es alto (>40%), aclaralo brevemente como advertencia."
    )
    payload = {
        "mape_porcentaje": body.mape,
        "historico_reciente": body.historico[-30:],  # acotar tokens
        "predicciones": body.predicciones,
    }
    texto = _invoke(system, payload, "forecast")
    return {"analisis": texto.strip()}
