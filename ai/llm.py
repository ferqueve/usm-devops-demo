"""Fábrica abstracta de LLM y embeddings.

La idea es que el resto del código nunca importe directamente al provider
(Google, Groq, OpenAI). Cambiar de provider = setear LLM_PROVIDER y reiniciar.
"""

from __future__ import annotations

import os
from functools import lru_cache

from langchain_core.embeddings import Embeddings
from langchain_core.language_models.chat_models import BaseChatModel


def _provider() -> str:
    return os.getenv("LLM_PROVIDER", "gemini").lower()


@lru_cache(maxsize=1)
def get_chat_model() -> BaseChatModel:
    provider = _provider()
    model_name = os.getenv("LLM_MODEL", "gemini-2.5-flash")

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.3,
        )

    if provider == "groq":
        from langchain_groq import ChatGroq  # type: ignore

        return ChatGroq(
            model=model_name,
            groq_api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.3,
        )

    raise ValueError(f"LLM_PROVIDER desconocido: {provider}")


@lru_cache(maxsize=1)
def get_embeddings() -> Embeddings:
    provider = _provider()
    model_name = os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")

    if provider == "gemini":
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        return GoogleGenerativeAIEmbeddings(
            model=f"models/{model_name}",
            google_api_key=os.getenv("GEMINI_API_KEY"),
        )

    raise ValueError(
        f"Embeddings no soportadas para LLM_PROVIDER={provider}. "
        "Sólo gemini ofrece embeddings free."
    )
