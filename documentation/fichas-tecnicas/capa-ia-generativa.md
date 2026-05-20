# Capa de IA Generativa

## 1. Resumen ejecutivo

Tercera capa de inteligencia del sistema (ver [Capas de inteligencia](capas-de-inteligencia.md)). Mientras la primera capa es heurística determinística y la segunda es ML predictivo entrenado offline, esta capa orquesta llamadas a un modelo generativo en línea (Gemini 2.5 Flash de Google) para producir cinco funcionalidades dirigidas al usuario:

1. **Resumen automático de estadísticas** — interpretación en lenguaje natural del estado del sistema.
2. **Explicación de recomendaciones** — humanización de la salida del recomendador heurístico.
3. **Análisis del forecast Prophet** — síntesis accionable de las predicciones del modelo de demanda.
4. **Búsqueda semántica de espacios (RAG)** — recuperación por similitud vectorial usando embeddings.
5. **Chatbot con function calling** — agente conversacional que consulta la base de datos a través de un conjunto acotado de herramientas de sólo lectura.

Las funcionalidades viven en una página dedicada `/asistente` (acceso para analista y admin) que actúa como entorno de prueba previo a la integración en las pantallas operativas correspondientes.

El acceso al modelo se hace siempre a través de una abstracción (`langchain`) que permite cambiar de proveedor con una sola variable de entorno; la implementación inicial usa Gemini por el costo cero de su nivel gratuito en el momento del desarrollo.

## 2. Cómo se usa

### Página `/asistente`

La página agrupa las cinco funcionalidades en paneles independientes:

- **Resumen automático**: botón "Generar resumen" envía la última fotografía de estadísticas al servicio y devuelve un párrafo ejecutivo.
- **Explicación de recomendación**: ejemplo precargado con una recomendación heurística que se reescribe en lenguaje natural.
- **Análisis de forecast**: ejemplo con histórico y predicciones que se interpretan en clave operativa.
- **Búsqueda semántica**: campo de texto libre que devuelve los espacios más similares al concepto consultado. Incluye un botón de reindexación accesible sólo para administradores.
- **Chatbot**: cuadro de conversación que mantiene historial dentro de la sesión y muestra como etiquetas las herramientas que el modelo invocó para responder.

### Integración futura

La página `/asistente` es deliberadamente un sandbox. Una vez validado el comportamiento por feature, las funcionalidades migran a su contexto natural:

| Feature | Destino sugerido |
|---|---|
| Resumen de estadísticas | Cabecera de `/statistics` |
| Explicación de recomendación | Botón "¿Por qué?" en las tarjetas del recomendador |
| Análisis de forecast | Sección de Predicción de demanda en `/statistics` |
| Búsqueda semántica | Barra superior de `/rooms` |
| Chatbot | Widget flotante global, persistente en `DashboardLayout` |

## 3. Detalle técnico

### Arquitectura

La capa de IA se implementa como un microservicio Python independiente (`ai-svc`) que el backend Spring proxy-ea desde `/api/v1/ai/...`. La separación responde a tres razones: (1) el ecosistema de LangChain para RAG y agentes con herramientas es más maduro en Python, (2) mantiene al backend Java sin dependencias pesadas de cliente LLM, (3) clarifica la narrativa polyglot ya defendida en el sistema (Java para el plano transaccional, Python para inteligencia).

A diferencia de `ml-svc` (batch, dormido entre invocaciones), `ai-svc` se mantiene siempre activo dado que las llamadas son sincrónicas desde la UI y el costo extra es marginal (~300 MB RAM ocupados).

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│  Frontend   │──────▶│ utec-backend │──────▶│   ai-svc     │
│  /asistente │       │ AiController │       │   FastAPI    │
└─────────────┘       └──────────────┘       └──────┬───────┘
                                                    │
                                  ┌─────────────────┼─────────────────┐
                                  ▼                 ▼                 ▼
                          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                          │   Gemini     │  │  Postgres    │  │   pgvector   │
                          │  (text gen)  │  │ (queries)    │  │ (embeddings) │
                          └──────────────┘  └──────────────┘  └──────────────┘
```

### Estructura del servicio

```
ai/
├── main.py            # FastAPI app, registra routers
├── llm.py             # Fábrica de ChatModel y Embeddings vía LangChain
├── db.py              # Acceso SQLAlchemy a Postgres compartido
├── tools.py           # Tools del agente (sólo lectura)
├── routes/
│   ├── insights.py    # Endpoints de prompt simple (1.1, 1.2, 1.3)
│   ├── search.py      # RAG de espacios
│   ├── admin.py       # Reindexación de embeddings
│   └── chat.py        # Chatbot con function calling
├── Dockerfile
├── requirements.txt
└── README.md
```

### Endpoints

| Método | Ruta backend | Ruta ai-svc | Permiso |
|---|---|---|---|
| POST | `/api/v1/ai/insights/stats-summary` | `/insights/stats-summary` | `estadisticas:ver_reservas` |
| POST | `/api/v1/ai/insights/explain-recomendacion` | `/insights/explain-recomendacion` | `isAuthenticated` |
| POST | `/api/v1/ai/insights/analyze-forecast` | `/insights/analyze-forecast` | `estadisticas:ver_reservas` |
| GET | `/api/v1/ai/search/espacios?q&top` | `/search/espacios` | `isAuthenticated` |
| POST | `/api/v1/ai/admin/reindex-embeddings` | `/admin/reindex-espacios` | `sistema:administrar` |
| POST | `/api/v1/ai/chat` | `/chat` | `isAuthenticated` |

El proxy Spring (`AiService`) sigue el mismo patrón que `ForecastingService`: si `ai-svc` no responde, devuelve un `Map` con la causa del fallo en lugar de propagar la excepción al cliente.

### Modelo

| Capacidad | Modelo | Dimensión |
|---|---|---|
| Text generation | `gemini-2.5-flash` | — |
| Embeddings | `gemini-embedding-001` | 3072 |

Los nombres viven en variables de entorno (`LLM_MODEL`, `EMBEDDING_MODEL`) para no acoplar el código a versiones concretas.

### Abstracción de proveedor

`ai/llm.py` decide en tiempo de arranque qué cliente instanciar según la variable `LLM_PROVIDER`. Por defecto usa Gemini; cambiar a otro proveedor compatible con LangChain (Groq, OpenAI, Anthropic) requiere modificar esa única variable. El resto del código del servicio nunca importa el SDK del proveedor directamente.

La limitación actual es que sólo Gemini ofrece embeddings dentro del free tier; si se cambia el proveedor para text generation, las funcionalidades de RAG y chatbot continúan dependiendo de Gemini para los embeddings, lo cual está explicitado tanto en código como en este documento.

### RAG (búsqueda semántica)

El pipeline de indexación lee todos los espacios activos y construye para cada uno un texto sintético del estilo `"Espacio Sala 203. Capacidad 30 personas. Tipo Salón con proyector. Edificio A. Estado DISPONIBLE."`. Ese texto se transforma en un vector de 3072 dimensiones con `gemini-embedding-001` y se persiste en la tabla `ai_embedding_espacio` mediante `UPSERT` por `espacio_id`.

La búsqueda usa el operador `<=>` (distancia coseno) de pgvector. El índice `ivfflat` con `lists=50` ofrece una buena relación tiempo-calidad para volúmenes del orden de cientos de espacios; al crecer significativamente conviene revisar el parámetro.

### Esquema `ai_embedding_espacio`

| Columna | Tipo | Notas |
|---|---|---|
| id | `BIGSERIAL` | PK |
| espacio_id | `BIGINT UNIQUE` | clave lógica al espacio (sin FK declarada para tolerar borrados) |
| texto_indexado | `TEXT` | texto exacto que se embedió, útil para debug y reindex |
| embedding | `vector(3072)` | salida del modelo de embeddings |
| model_version | `VARCHAR(50)` | identifica el modelo que generó el vector |
| updated_at | `TIMESTAMPTZ` | momento de la última indexación |

Migración: `023-create-ai-tables.xml`.

### Chatbot con function calling

Implementado con `create_tool_calling_agent` de LangChain. Gemini decide cuáles de las herramientas registradas en `tools.py` debe invocar y con qué parámetros, hasta un máximo de cuatro iteraciones por consulta.

Las herramientas disponibles son todas de lectura:

- `buscar_mis_reservas(desde, hasta)`
- `buscar_espacios_disponibles(fecha, hora_inicio, hora_fin, capacidad_min)`
- `obtener_estadistica_global(tipo, dias)`
- `buscar_espacio_semantico(query, top)`

La identidad del usuario nunca se pasa a través del prompt: el backend Spring la inyecta en el `payload` reescribiendo `usuario_id` y `rol` con los valores derivados del JWT, y el servicio Python expone el `usuario_id` resultante a las herramientas a través de un `ContextVar` (`set_usuario_actual`). De este modo, aunque el agente decida invocar `buscar_mis_reservas`, las filas que obtiene están siempre filtradas por el usuario autenticado.

La respuesta devuelve además la lista de tools invocadas, que la UI renderiza como etiquetas para que el usuario vea sobre qué datos basó su respuesta el modelo.

### Prompts

Los prompts del sistema viven en el código fuente (`routes/insights.py` y `routes/chat.py`), no en archivos externos, porque son chicos y forman parte de la lógica de cada feature. Pautas comunes:

- Tono profesional en español rioplatense.
- Salida acotada (2–4 oraciones por defecto).
- Prohibición explícita de inventar datos.

## 4. Métricas y evidencia

| Indicador | Valor inicial |
|---|---|
| Modelos en uso | `gemini-2.5-flash`, `gemini-embedding-001` |
| Cuota Gemini consumida | Dentro del free tier (1.500 req/día) |
| Costo mensual | USD 0 estimado |
| Dimensión de embeddings | 3072 |
| Cantidad de espacios indexados | Variable según seed/datos productivos; consultar `SELECT count(*) FROM ai_embedding_espacio` |
| Latencia chat (con 1–2 tools) | 2–6 segundos en promedio |
| Latencia stats-summary | 1–3 segundos en promedio |

## 5. Riesgos, limitaciones y trabajo futuro

- **Reducción del free tier de Gemini**: Google ha venido recortando cuotas durante 2026. La abstracción vía LangChain reduce el costo de cambio de proveedor, pero la dependencia para embeddings es real en el corto plazo.
- **Memoria del chatbot**: el historial se mantiene únicamente del lado del cliente, dentro de la sesión activa. No hay persistencia entre sesiones; agregarla requeriría una tabla `ai_conversacion` y manejo de sumarización.
- **Reindexación de embeddings**: hoy es completa (reescribe la totalidad de `ai_embedding_espacio`). Para volúmenes mayores conviene un esquema incremental disparado por cambios en `espacio`.
- **Tools sólo lectura**: el chatbot puede consultar pero no operar. Una eventual incorporación de herramientas de escritura (crear reserva, cancelar) debe acompañarse de confirmación explícita en la UI y un patrón de propuesta-aprobación.
- **Caché**: por simplicidad inicial las respuestas no se cachean. Un cache Redis sobre `stats-summary` y `analyze-forecast` (donde la entrada cambia pocas veces al día) reduciría llamadas al modelo en escenarios de uso real.
