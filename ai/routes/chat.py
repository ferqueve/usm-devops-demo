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
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from pydantic import BaseModel

from llm import get_chat_model
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


SYSTEM_PROMPT = (
    "Sos el asistente de UTEC Space Manager, un sistema de reserva de espacios "
    "universitarios. Hablás en español de Uruguay, cordial pero profesional, "
    "tuteando al usuario. "
    "Tenés tools para consultar la base de datos cuando hagan falta. Usalas con "
    "criterio: si el usuario te pregunta algo sobre sus reservas, espacios, "
    "disponibilidad o estadísticas, llamá la tool correspondiente. Si la "
    "pregunta es general (explicar el sistema, ayuda, etc.), respondé directo. "
    "Si necesitás datos del usuario actual, no le preguntes su ID — ya lo "
    "tenés inyectado en el contexto. "
    "Nunca inventes reservas, espacios ni números: si no podés obtener el dato "
    "con una tool, decilo honestamente. Respondé corto, 2-4 oraciones."
)


def _build_agent():
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="historial", optional=True),
            ("user", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )
    llm = get_chat_model()
    agent = create_tool_calling_agent(llm, TOOLS, prompt)
    return AgentExecutor(
        agent=agent,
        tools=TOOLS,
        verbose=False,
        max_iterations=4,
        return_intermediate_steps=True,
    )


@router.post("/chat")
def chat(body: ChatRequest) -> dict[str, Any]:
    set_usuario_actual(body.usuario_id)
    try:
        executor = _build_agent()
        historial_lc = [
            (m.role, m.content) for m in body.historial if m.role in ("user", "assistant")
        ]
        result = executor.invoke({"input": body.mensaje, "historial": historial_lc})
    except Exception as exc:  # noqa: BLE001
        log.exception("Chat falló")
        raise HTTPException(status_code=502, detail=f"Chat error: {exc}") from exc
    finally:
        set_usuario_actual(None)

    output = result.get("output", "")
    pasos = result.get("intermediate_steps", []) or []
    tools_invocados: list[str] = []
    for paso in pasos:
        try:
            tools_invocados.append(paso[0].tool)
        except Exception:  # noqa: BLE001
            continue

    return {"respuesta": output, "tools_invocados": tools_invocados}
