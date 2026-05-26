"""Chatbot con function calling.

Usa langchain.agents para que Gemini decida qué tool invocar y con qué
parámetros. La identidad del usuario la inyecta el backend Spring, no se
toma del cuerpo del mensaje (seguridad).
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from pydantic import BaseModel

from llm import get_chat_models_chain
from tools import TOOLS, set_usuario_actual

router = APIRouter()
log = logging.getLogger("ai-svc.chat")


class MensajeHistorial(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    mensaje: str
    usuario_id: int
    rol: str
    historial: list[MensajeHistorial] = []


SYSTEM_PROMPT = """Sos el asistente de UTEC Space Manager, un sistema de reserva de espacios universitarios. Hablás en español rioplatense, cordial y profesional, tuteando al usuario. El rol del usuario actual se te pasa en cada turno (ADMIN, ANALISTA, DOCENTE, ESTUDIANTE, MANTENIMIENTO, EXTERNO).

REGLA 1 — Resolver fechas relativas con datos reales:
Si el usuario menciona "hoy", "mañana", "esta semana", "la próxima semana", "este mes", etc., llamá PRIMERO `obtener_fecha_actual` y usá la fecha concreta que devuelve (formato YYYY-MM-DD) en los parámetros de las siguientes herramientas. NUNCA pases strings simbólicos como "fecha_de_hoy" o "mañana" — siempre fechas reales. Nunca le pidas al usuario que te confirme la fecha de hoy.

REGLA 2 — Reservas propias vs reservas globales:
- Si el usuario pregunta por "mis" reservas, "tengo" reservas, "mi calendario", usá `buscar_mis_reservas`.
- Si el usuario pregunta por "las reservas" del sistema, totales, pendientes globales, "cuántas reservas hay hoy", y su rol es ADMIN o ANALISTA, usá `buscar_reservas_globales` (acepta filtro por estado: 'APROBADO', 'PENDIENTE', 'CANCELADO').
- Si el rol es DOCENTE/ESTUDIANTE/EXTERNO y pregunta por reservas globales, explicale que sólo podés mostrarle las propias y ofrecele consultarlas.

REGLA 3 — Encadenar herramientas:
Si una pregunta requiere dos pasos (fecha + búsqueda, listar carreras + estadística por carrera, etc.), encadenalas en la misma respuesta. No le pidas al usuario que vuelva a preguntar.

REGLA 4 — Nunca exponer detalles técnicos:
NUNCA menciones nombres de herramientas, IDs de usuarios, tablas, columnas ni códigos de error al usuario. Si una herramienta no existe para lo que pidió, decile en lenguaje natural qué podés hacer en su lugar (por ejemplo: "no puedo darte X, pero sí puedo mostrarte Y"). Si una herramienta lanza un error de permiso, explicá amablemente que esa consulta requiere otro rol y proponé una alternativa cuando la haya.

REGLA 5 — Honestidad:
Nunca inventes reservas, espacios, números ni nombres. Si una herramienta devuelve vacío o falla, decilo: "no encontré reservas en ese rango" es preferible a inventar. Si necesitás un dato del usuario actual (su ID, su rol), ya los tenés inyectados — no se los preguntes.

REGLA 6 — Estilo:
Respuestas de 2 a 4 oraciones por defecto, claras y con los datos concretos. Si la respuesta lista varios items (top de reservas, lista de espacios), usá una enumeración corta con guiones. No saludes en cada turno."""


def _build_prompt() -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="historial", optional=True),
            ("user", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )


def _build_agent_for(llm: BaseChatModel) -> AgentExecutor:
    """Construye un AgentExecutor con tools enlazadas al modelo dado.

    Cada provider necesita su propio agente porque `create_tool_calling_agent`
    enlaza las tools al BaseChatModel concreto (Gemini y Groq tienen
    formatos de tool call ligeramente distintos que sus parsers respectivos
    sí entienden).
    """
    for t in TOOLS:
        t.handle_tool_error = True
    agent = create_tool_calling_agent(llm, TOOLS, _build_prompt())
    return AgentExecutor(
        agent=agent,
        tools=TOOLS,
        verbose=False,
        max_iterations=4,
        return_intermediate_steps=True,
        handle_parsing_errors=True,
    )


@router.post("/chat")
def chat(body: ChatRequest) -> dict[str, Any]:
    """Ejecuta el chat probando la cadena de providers en orden.

    Si el primario tira un error (típicamente 429 por cuota), pasa al
    siguiente sin que el cliente lo perciba. Sólo si toda la cadena falla
    devuelve 502 con el último error.
    """
    set_usuario_actual(body.usuario_id, body.rol)
    historial_lc = [
        (m.role, m.content) for m in body.historial if m.role in ("user", "assistant")
    ]
    # Inyectamos el rol del usuario actual como contexto del mensaje, así el
    # LLM sabe qué herramientas restringidas puede invocar sin tener que
    # consultarlo. Lo hacemos al final del input (no del system prompt) para
    # que persista turno a turno y no requiera modificar el prompt cacheado.
    mensaje_con_contexto = (
        f"[contexto: el rol del usuario que te habla es {body.rol}]\n\n"
        f"{body.mensaje}"
    )
    try:
        chain = get_chat_models_chain()
        last_exc: Exception | None = None
        result: dict[str, Any] | None = None
        provider_usado: str | None = None
        for provider, llm in chain:
            try:
                executor = _build_agent_for(llm)
                result = executor.invoke(
                    {"input": mensaje_con_contexto, "historial": historial_lc}
                )
                provider_usado = provider
                break
            except Exception as exc:  # noqa: BLE001
                log.warning("Provider %s falló (%s); probando siguiente.", provider, exc)
                last_exc = exc

        if result is None:
            raise last_exc or RuntimeError("Sin providers disponibles.")
    except Exception as exc:  # noqa: BLE001
        log.exception("Chat falló en toda la cadena")
        raise HTTPException(status_code=502, detail=f"Chat error: {exc}") from exc
    finally:
        set_usuario_actual(None, None)

    output = result.get("output", "")
    pasos = result.get("intermediate_steps", []) or []
    tools_invocados: list[str] = []
    for paso in pasos:
        try:
            tools_invocados.append(paso[0].tool)
        except Exception:  # noqa: BLE001
            continue

    return {
        "respuesta": output,
        "tools_invocados": tools_invocados,
        "provider": provider_usado,
    }
