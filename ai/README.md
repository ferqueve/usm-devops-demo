# ai-svc

Servicio Python de la capa de IA generativa. FastAPI + LangChain + Gemini 2.5 Flash + pgvector.

Ver ficha técnica `documentation/fichas-tecnicas/capa-ia-generativa.md`.

## Local

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # completar GEMINI_API_KEY y DATABASE_URL
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## Docker

```bash
docker compose up ai-svc
```

## Railway

Servicio `ai-svc` en el proyecto `usm-utec`. Deploy con `railway up` desde esta carpeta. Variables requeridas:

- `DATABASE_URL` (referencia al Postgres compartido)
- `GEMINI_API_KEY`
- `LLM_PROVIDER=gemini` (default)
- `LLM_MODEL=gemini-2.5-flash`
- `EMBEDDING_MODEL=gemini-embedding-001`

## Endpoints

- `GET  /health`
- `POST /insights/stats-summary`
- `POST /insights/explain-recomendacion`
- `POST /insights/analyze-forecast`
- `GET  /search/espacios?q=...`
- `POST /admin/reindex-espacios`
- `POST /chat` (fase 3, hoy responde 501)

## Cambiar provider LLM

Setear `LLM_PROVIDER=groq` + `GROQ_API_KEY` + `LLM_MODEL=llama-3.3-70b-versatile`. Features de prompt simple y chatbot siguen funcionando; búsqueda semántica no (Groq no tiene embeddings).
