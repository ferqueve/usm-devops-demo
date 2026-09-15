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
    except Exception as exc:
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
    # Error ponderado por volumen: con pocas reservas por dia el MAPE se dispara
    # y el modelo parece peor de lo que es.
    wape: float | None = None
    # Reservas ya aprobadas para cada dia del horizonte.
    reservadas: list[dict[str, Any]] | None = None


# --------- 1.4 Generación de copy de evento ---------

class GenerarEventoRequest(BaseModel):
    idea: str
    tipo: str | None = None  # EVENTO | CURSO


@router.post("/generar-evento")
def generar_evento(body: GenerarEventoRequest) -> dict:
    system = (
        "Sos el community manager de UTEC (Universidad Tecnológica del Uruguay). "
        "A partir de una idea breve para un evento o curso, generás el copy de difusión. "
        "Devolvé EXCLUSIVAMENTE un objeto JSON válido (sin markdown, sin ```), con esta forma: "
        '{\"titulo\": str, \"descripcion\": str, \"tags\": [str, ...]}. '
        "El título: atractivo, máximo 80 caracteres, sin comillas. "
        "La descripción: 2 a 4 oraciones en español, tono cercano y profesional, sin emojis excesivos. "
        "Los tags: 2 a 5 categorías cortas en singular (ej: 'IA', 'Workshop', 'Gratuito'). "
        "No inventes fecha, lugar ni cupo: eso lo completa el organizador aparte."
    )
    payload = {"idea": body.idea, "tipo": body.tipo or "EVENTO"}
    texto = _invoke(system, payload, "generar_evento")
    cleaned = texto.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback: si el modelo no devolvió JSON limpio, usamos el texto como descripción.
        data = {"titulo": body.idea[:80], "descripcion": cleaned, "tags": []}
    tags = data.get("tags") or []
    if isinstance(tags, list):
        tags = ",".join(str(t).strip() for t in tags if str(t).strip())
    return {
        "titulo": (data.get("titulo") or "").strip(),
        "descripcion": (data.get("descripcion") or "").strip(),
        "tags": tags,
    }


# --------- 1.5 Resumen de temarios de tutoría ---------

class ResumenTemarioRequest(BaseModel):
    materia: str | None = None
    temarios: list[str]


@router.post("/resumen-temario")
def resumen_temario(body: ResumenTemarioRequest) -> dict:
    system = (
        "Sos asistente de un docente de UTEC que va a dar una tutoría. "
        "Te paso la lista de lo que cada estudiante anotó que quiere repasar. "
        "Agrupá los pedidos por tema, ordenados del más pedido al menos pedido, y devolvé "
        "un resumen breve (2 a 4 oraciones, español rioplatense, tono práctico) que le sirva al "
        "docente para preparar la clase: qué temas priorizar y si hay dudas recurrentes. "
        "No inventes temas que no estén en la lista."
    )
    payload = {"materia": body.materia or "", "pedidos": body.temarios}
    texto = _invoke(system, payload, "resumen_temario")
    return {"resumen": texto.strip()}


@router.post("/analyze-forecast")
def analyze_forecast(body: AnalyzeForecastRequest) -> dict:
    system = (
        "Sos un analista que interpreta predicciones de demanda generadas por un modelo Prophet. "
        "Te paso histórico reciente, predicciones futuras (cada una con banda inferior y superior), "
        "las reservas ya aprobadas para cada día del horizonte y el error del modelo en validación "
        "(WAPE: error absoluto sobre el volumen total). Devolvé un análisis de 3 a 5 oraciones en "
        "español formal que cubra: tendencia general, picos o caídas anticipados con fecha aproximada, "
        "qué días ya tienen reservada casi toda la demanda esperada y cuáles tienen margen, y una "
        "recomendación operativa accionable (por ejemplo, liberar espacios extra cierto día). "
        "Si el error es alto (>40%), aclaralo brevemente como advertencia."
    )
    payload = {
        "error_wape_porcentaje": body.wape if body.wape is not None else body.mape,
        "historico_reciente": body.historico[-30:],  # acotar tokens
        "predicciones": body.predicciones,
        "reservadas": body.reservadas or [],
    }
    texto = _invoke(system, payload, "forecast")
    return {"analisis": texto.strip()}


# --------- 1.6 Análisis del pronóstico de inventario ---------

class TipoInventarioForecast(BaseModel):
    nombre: str
    stockDisponible: float | None = None
    picoEsperado: float | None = None
    fechaPico: str | None = None
    # Probabilidad (0 a 1) de que en algún día del horizonte se pida más de lo que hay.
    probFaltanteMax: float | None = None
    diasEnRiesgo: int | None = None
    riesgo: str | None = None
    # Lo que ya está pedido para la semana más cargada: si supera el stock, el faltante es un hecho.
    comprometidasMax: float | None = None


class AnalyzeInventarioForecastRequest(BaseModel):
    wape: float | None = None
    tipos: list[TipoInventarioForecast]


# Los tipos sin riesgo no le aportan nada al análisis y le gastan tokens:
# se mandan primero los que pueden faltar y se corta ahí.
_ORDEN_RIESGO = {"sin_stock": 0, "alto": 1, "medio": 2, "bajo": 3}


@router.post("/analyze-inventario-forecast")
def analyze_inventario_forecast(body: AnalyzeInventarioForecastRequest) -> dict:
    system = (
        "Sos un analista de operaciones de una universidad. Te paso un pronóstico de demanda de "
        "equipamiento (proyectores, sillas, computadoras…) para los próximos 30 días: para cada tipo, "
        "el stock disponible hoy, el pico esperado de unidades pedidas a la vez, la fecha de ese pico, "
        "la probabilidad máxima de que se pida más de lo que hay (0 a 1), cuántos días superan el 50% "
        "de probabilidad, un nivel de riesgo (sin_stock, alto, medio, bajo) y el máximo de unidades ya "
        "comprometidas. Devolvé un análisis de 3 a 5 oraciones en español rioplatense, tono práctico, "
        "sin bullet points, que diga: qué tipos van a faltar y cuándo, cuántas unidades extra conviene "
        "conseguir (diferencia entre el pico esperado y el stock) o cómo redistribuir o reprogramar, y "
        "si lo ya comprometido supera el stock, que eso ya es un faltante seguro. Si ningún tipo tiene "
        "riesgo, decilo en una oración. Si el error del modelo (WAPE) es mayor a 40%, advertilo. "
        "No inventes tipos ni números que no estén en el payload."
    )
    tipos = sorted(body.tipos, key=lambda t: (_ORDEN_RIESGO.get(t.riesgo or "", 9), -(t.probFaltanteMax or 0)))
    payload = {
        "error_wape_porcentaje": body.wape,
        "tipos": [t.model_dump() for t in tipos[:15]],
    }
    texto = _invoke(system, payload, "inventario_forecast")
    return {"analisis": texto.strip()}


# --------- 1.7 Análisis de la asistencia esperada a tutorías ---------

class TutoriaProxima(BaseModel):
    materia: str
    inicio: str
    cupo: int | None = None
    inscriptos: int
    esperados: float | None = None
    riesgo: str


class FactorAsistencia(BaseModel):
    nombre: str
    oddsRatio: float


class AnalyzeAsistenciaRequest(BaseModel):
    auc: float | None = None
    tasaBase: float | None = None
    resumen: dict[str, Any] = {}
    proximas: list[TutoriaProxima] = []
    factores: list[FactorAsistencia] = []


@router.post("/analyze-asistencia")
def analyze_asistencia(body: AnalyzeAsistenciaRequest) -> dict:
    system = (
        "Sos un asistente de coordinación académica de una universidad. Te paso la predicción de "
        "asistencia a las próximas tutorías, hecha con una regresión logística: un resumen, la lista "
        "de tutorías (materia, inicio, cupo, inscriptos, asistentes esperados y un riesgo: vacia, baja, "
        "normal, alta —alta quiere decir que se llena o desborda—, sin_prediccion) y los factores que "
        "más pesan, con su odds ratio (mayor a 1 sube las chances de asistir, menor a 1 las baja). "
        "Devolvé un análisis de 3 a 5 oraciones en español rioplatense, tono práctico, sin bullet points, "
        "que diga: qué tutorías van a quedar casi vacías y cuáles se desbordan (con materia y fecha), "
        "qué factores pesan más explicados en lenguaje llano, y una recomendación accionable (por "
        "ejemplo, recordar a los inscriptos, fusionar tutorías vacías o abrir otra franja). "
        "Si el AUC es menor a 0.6, advertí que el modelo todavía no distingue bien quién va a ir y que "
        "los números son orientativos. No inventes tutorías ni números que no estén en el payload."
    )
    payload = {
        "auc": body.auc,
        "tasa_base_asistencia": body.tasaBase,
        "resumen": body.resumen,
        # Acotar tokens: el frontend ya manda las 25 más relevantes, pero no hay que confiar en eso.
        "proximas": [t.model_dump() for t in body.proximas[:25]],
        "factores": [f.model_dump() for f in body.factores[:12]],
    }
    texto = _invoke(system, payload, "asistencia")
    return {"analisis": texto.strip()}
