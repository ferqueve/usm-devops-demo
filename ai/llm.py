"""Fábrica abstracta de LLM y embeddings con fallback multi-provider.

El resto del código nunca importa al provider directamente. La cadena de
fallback no se arma a nivel de modelo (porque `create_tool_calling_agent`
necesita un BaseChatModel concreto para enlazar las tools), sino que
`get_chat_models_chain()` expone la lista ordenada y el endpoint /chat
construye un agente por modelo y los reintenta en orden ante un error.

Variables de entorno relevantes:
- LLM_PROVIDERS: lista CSV, primero = primario. Ej: "gemini,groq".
- LLM_MODEL_<provider>: nombre del modelo para cada provider (ej.
  LLM_MODEL_GEMINI=gemini-2.5-flash, LLM_MODEL_GROQ=llama-3.3-70b-versatile).
- GEMINI_API_KEY, GROQ_API_KEY: credenciales.
- EMBEDDING_MODEL: modelo de embeddings de Gemini (único provider soportado).

Compatibilidad: `LLM_PROVIDER` (singular) y `LLM_MODEL` se respetan si están
seteadas, para no romper despliegues existentes.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache

from langchain_core.embeddings import Embeddings
from langchain_core.language_models.chat_models import BaseChatModel

log = logging.getLogger("ai-svc.llm")


_DEFAULT_MODELS = {
    "gemini": "gemini-2.5-flash",
    "groq": "llama-3.3-70b-versatile",
}


def _providers_chain() -> list[str]:
    """Devuelve la lista ordenada de providers (primario primero).

    Si está seteado el singular `LLM_PROVIDER` lo respeta como único provider
    (compatibilidad). Si está seteado `LLM_PROVIDERS` (plural, CSV) lo parsea.
    Default: gemini con groq como fallback.
    """
    singular = os.getenv("LLM_PROVIDER")
    if singular:
        return [singular.lower().strip()]
    csv = os.getenv("LLM_PROVIDERS", "gemini,groq")
    return [p.lower().strip() for p in csv.split(",") if p.strip()]


def _model_for(provider: str) -> str:
    specific = os.getenv(f"LLM_MODEL_{provider.upper()}")
    if specific:
        return specific
    legacy = os.getenv("LLM_MODEL")
    if legacy and len(_providers_chain()) == 1:
        return legacy
    return _DEFAULT_MODELS.get(provider, "")


def _build_one(provider: str) -> BaseChatModel:
    model = _model_for(provider)
    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=model,
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.3,
            # Sin retries internos: queremos que un 429 pase rápido al fallback
            # de la cadena (Groq) en vez de esperar 30s entre reintentos.
            max_retries=1,
        )
    if provider == "groq":
        from langchain_groq import ChatGroq  # type: ignore

        return ChatGroq(
            model=model,
            groq_api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.3,
            max_retries=1,
        )
    raise ValueError(f"LLM provider desconocido: {provider}")


@lru_cache(maxsize=1)
def get_chat_models_chain() -> list[tuple[str, BaseChatModel]]:
    """Lista ordenada de (nombre_provider, modelo) lista para usar.

    El primero es el primario; los siguientes son fallbacks que el endpoint
    /chat va a probar en orden ante un error del anterior. Providers cuyo
    init falle (típicamente falta de API key) se descartan con un warning.
    """
    chain = _providers_chain()
    out: list[tuple[str, BaseChatModel]] = []
    for p in chain:
        try:
            out.append((p, _build_one(p)))
        except Exception as exc:  # noqa: BLE001
            log.warning("Saltando provider %s (no inicializa): %s", p, exc)
    if not out:
        raise ValueError("Ningún LLM provider inicializable en LLM_PROVIDERS.")
    log.info("LLM chain: %s", " -> ".join(p for p, _ in out))
    return out


def get_chat_model() -> BaseChatModel:
    """Devuelve el primario para usos sencillos. Mantener por compat."""
    return get_chat_models_chain()[0][1]


def invoke_with_fallback(messages, log_label: str = "llm") -> tuple[str, str]:
    """Invoca el LLM probando la cadena de providers en orden.

    Pensado para features sin tools (insights de prompt simple). Devuelve
    una tupla (texto_respuesta, provider_usado). Si toda la cadena falla,
    levanta el último error.
    """
    chain = get_chat_models_chain()
    last_exc: Exception | None = None
    for provider, llm in chain:
        try:
            result = llm.invoke(messages)
            text = getattr(result, "content", None) or str(result)
            return text, provider
        except Exception as exc:  # noqa: BLE001
            log.warning("%s: provider %s falló (%s); probando siguiente.",
                        log_label, provider, exc)
            last_exc = exc
    raise last_exc or RuntimeError("Cadena LLM vacía.")


@lru_cache(maxsize=1)
def get_embeddings() -> Embeddings:
    """Embeddings sólo vía Gemini: ningún provider free ofrece alternativa decente.

    Si Gemini se queda sin cuota, la búsqueda semántica devuelve error pero
    el chat (que usa get_chat_model con fallback) sigue funcionando.
    """
    model = os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")
    from langchain_google_genai import GoogleGenerativeAIEmbeddings

    return GoogleGenerativeAIEmbeddings(
        model=f"models/{model}",
        google_api_key=os.getenv("GEMINI_API_KEY"),
    )
