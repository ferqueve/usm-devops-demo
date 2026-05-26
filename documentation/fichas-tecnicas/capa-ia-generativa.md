# Capa de IA Generativa

## 1. Resumen ejecutivo

Esta capa es la tercera (y más nueva) capa de inteligencia del sistema, complementando al recomendador heurístico y al modelo de predicción de demanda. Su rol es transformar datos numéricos y operativos en texto comprensible para personas: resúmenes, explicaciones, búsquedas en lenguaje natural y diálogo asistido.

Ofrece cinco funcionalidades:

1. **Resumen automático de estadísticas** — interpreta el estado del sistema y lo presenta en un párrafo ejecutivo.
2. **Explicación de recomendaciones** — toma una recomendación generada por el motor heurístico y la reescribe en lenguaje claro.
3. **Análisis del forecast** — interpreta las predicciones del modelo de demanda y sugiere decisiones operativas.
4. **Búsqueda semántica de espacios** — permite encontrar un espacio describiéndolo en lenguaje natural ("salón grande con proyector").
5. **Asistente conversacional** — un chatbot que responde preguntas consultando datos reales del sistema.

Cada funcionalidad aparece en la pantalla donde es naturalmente útil: el resumen y el análisis del forecast en Estadísticas, la explicación dentro de cada tarjeta de recomendación, la búsqueda semántica en Espacios, y el asistente como un botón flotante disponible en todo el panel.

El sistema usa el modelo Gemini de Google como proveedor principal y, ante cualquier indisponibilidad o agotamiento de cuota, reintenta automáticamente con un proveedor de respaldo (Groq). El usuario final no percibe el cambio.

## 2. Cómo se usa

- **Estadísticas → Resumen ejecutivo con IA**: en la pantalla de Estadísticas hay un panel destacado con un botón "Generar resumen". Al pulsarlo, el asistente devuelve dos o tres oraciones describiendo el estado actual de las reservas, los hallazgos más relevantes y eventuales señales de alerta.
- **Estadísticas → Análisis del forecast**: dentro del bloque de Predicción de demanda, un botón "Analizar" produce una lectura en lenguaje natural de la curva: picos previstos, caídas y sugerencias operativas.
- **Recomendaciones → "Explicar con IA"**: cada tarjeta de recomendación incluye un botón discreto que humaniza el motivo técnico de la recomendación.
- **Espacios → "Buscar con IA"**: junto al buscador tradicional aparece un botón que abre un cuadro de búsqueda libre. El usuario escribe lo que necesita ("una sala chica para reuniones de cinco personas") y obtiene un ranking de espacios afines, con un porcentaje de afinidad y acceso directo al detalle.
- **Asistente flotante**: un botón en la esquina inferior derecha abre una ventana de chat. El asistente reconoce frases como "hoy", "la semana que viene" o "mis reservas pendientes" y consulta los datos reales del sistema para responder. Cada respuesta muestra qué herramientas usó (por ejemplo, "buscar_mis_reservas") para que el usuario entienda de dónde sale la información.

El acceso a las funcionalidades respeta el rol del usuario. Las consultas que tocan datos sensibles (reservas globales de toda la organización, inventario completo, ranking de usuarios) sólo se ejecutan si el rol lo permite; en caso contrario el asistente responde explicando la limitación.

## 3. Detalle técnico

### Arquitectura

La capa se implementa como un microservicio Python independiente llamado `ai-svc`. El backend Spring no llama a Google directamente; expone endpoints bajo `/api/v1/ai/...` que reenvían la petición al servicio Python (clase `AiService`). Esa separación tiene tres motivos: el ecosistema de IA generativa en Python es más rico y maduro (LangChain, integraciones con embeddings, agentes), el backend Java se mantiene liviano sin SDKs pesados, y se conserva la línea arquitectural ya presente con `ml-svc` (Java para lo transaccional, Python para lo analítico).

A diferencia de `ml-svc`, que es batch y duerme entre entrenamientos, `ai-svc` está siempre activo porque sus llamadas son sincrónicas y disparadas por el usuario.

```
┌─────────────────┐       ┌──────────────┐       ┌──────────────┐
│  Frontend       │──────▶│ utec-backend │──────▶│   ai-svc     │
│  (vistas con    │       │ AiController │       │   FastAPI    │
│   widgets IA)   │       │              │       │              │
└─────────────────┘       └──────────────┘       └──────┬───────┘
                                                        │
                                  ┌─────────────────────┼─────────────────────┐
                                  ▼                     ▼                     ▼
                          ┌──────────────┐      ┌──────────────┐      ┌──────────────────┐
                          │ Cadena LLM:  │      │  Postgres    │      │ pgvector         │
                          │ Gemini →     │      │ (lectura     │      │ (almacenamiento  │
                          │ Groq         │      │  por tools)  │      │  de embeddings)  │
                          └──────────────┘      └──────────────┘      └──────────────────┘
```

### Estructura del servicio

```
ai/
├── main.py            # Aplicación FastAPI y registro de rutas
├── llm.py             # Selección de proveedor LLM y cadena de fallback
├── db.py              # Acceso a Postgres (sólo lectura, salvo embeddings)
├── tools.py           # Herramientas que el chatbot puede invocar
├── routes/
│   ├── insights.py    # Resumen, explicación y análisis (un endpoint por feature)
│   ├── search.py      # Búsqueda semántica de espacios
│   ├── admin.py       # Reindexación de embeddings
│   └── chat.py        # Asistente conversacional
├── Dockerfile
├── requirements.txt
└── README.md
```

### Endpoints y permisos

| Método | Ruta backend | Permiso |
|---|---|---|
| POST | `/api/v1/ai/insights/stats-summary` | `estadisticas:ver_reservas` |
| POST | `/api/v1/ai/insights/explain-recomendacion` | autenticado |
| POST | `/api/v1/ai/insights/analyze-forecast` | `estadisticas:ver_reservas` |
| GET  | `/api/v1/ai/search/espacios?q&top` | autenticado |
| POST | `/api/v1/ai/admin/reindex-embeddings` | `sistema:administrar` |
| POST | `/api/v1/ai/chat` | autenticado |

`AiService` actúa como proxy entre el backend Spring y el servicio Python. Si `ai-svc` está caído o tarda demasiado, devuelve una respuesta estructurada describiendo la causa en vez de propagar la excepción.

### Modelos en uso

| Capacidad | Modelo primario | Modelo de respaldo | Dimensión |
|---|---|---|---|
| Generación de texto | `gemini-2.5-flash` (Google) | `llama-3.3-70b-versatile` (Groq) | — |
| Embeddings | `gemini-embedding-001` (Google) | sin respaldo | 3072 |

Los nombres de modelo viven en variables de entorno para no acoplar el código a una versión concreta.

### Multi-proveedor con fallback automático

El módulo `ai/llm.py` no construye un único cliente LLM, sino una **cadena ordenada de proveedores**. La variable `LLM_PROVIDERS` lista los proveedores por prioridad (por defecto `gemini,groq`). El primero es el primario; los siguientes son respaldos. Si un proveedor no tiene su clave configurada se descarta silenciosamente al iniciar el servicio.

Cuando llega una solicitud al endpoint `/chat`, el servicio prueba los proveedores en orden: construye un agente con el primero e intenta resolver la consulta; si falla (típicamente por agotamiento de la cuota gratuita), captura el error y reintenta con el siguiente. La respuesta incluye un campo `provider` que indica quién respondió finalmente, lo que facilita auditar el comportamiento sin abrir logs.

La motivación de esta arquitectura es práctica: el nivel gratuito de Gemini para el modelo conversacional se agota rápido, y disponer de un segundo proveedor permite sostener la demo o la operación sin necesidad de activar un plan de pago. Groq ofrece un nivel gratuito generoso sin requisito de tarjeta de crédito, lo que lo hace ideal como respaldo.

Para que el fallback se active rápido, los clientes de ambos proveedores están configurados con un único intento antes de propagar el error. Los SDK oficiales traen reintentos internos que esperan decenas de segundos entre intentos; deshabilitarlos asegura que un 429 caiga al respaldo en menos de un segundo.

Los embeddings son un caso aparte: ningún proveedor con nivel gratuito ofrece embeddings comparables, por lo que dependen exclusivamente de Gemini. La cuota de embeddings es independiente y mucho más amplia que la de generación de texto, así que en la práctica esta dependencia no compromete la búsqueda semántica aunque el chat haya agotado su cuota.

### Búsqueda semántica

El pipeline de indexación recorre los espacios activos y, para cada uno, arma un texto descriptivo del estilo `"Espacio Sala 203. Capacidad 30 personas. Tipo Salón con proyector. Edificio A. Estado DISPONIBLE."`. Ese texto se transforma en un vector de 3072 dimensiones con el modelo de embeddings y se guarda en la tabla `ai_embedding_espacio`. La indexación es manual (botón de administrador) y se actualiza completa cada vez que se ejecuta.

La búsqueda calcula el embedding de la consulta del usuario en el momento y la compara contra los vectores almacenados mediante distancia coseno (operador `<=>` de pgvector). La tabla no lleva índice vectorial porque los índices aproximados de pgvector aceptan hasta 2.000 dimensiones, y este modelo devuelve 3.072. Para el volumen de espacios del sistema el costo de un escaneo secuencial es marginal (decenas de milisegundos por consulta).

### Esquema `ai_embedding_espacio`

| Columna | Tipo | Notas |
|---|---|---|
| id | `BIGSERIAL` | clave primaria |
| espacio_id | `BIGINT UNIQUE` | referencia lógica al espacio |
| texto_indexado | `TEXT` | texto exacto que se embedió |
| embedding | `vector(3072)` | salida del modelo de embeddings |
| model_version | `VARCHAR(50)` | identifica el modelo que generó el vector |
| updated_at | `TIMESTAMPTZ` | momento de la última indexación |

Migración asociada: `023-create-ai-tables.xml`.

### Asistente conversacional

El asistente está construido como un agente de LangChain que decide cuándo y con qué parámetros invocar una herramienta. Las herramientas son funciones Python registradas en `tools.py`; cada una expone una operación de lectura sobre la base de datos. El agente recibe un prompt de sistema que le explica su rol, el contexto del usuario (rol, identificador) y la lista de herramientas disponibles, y resuelve en hasta cuatro iteraciones por consulta.

Las herramientas disponibles cubren los casos de uso más comunes:

| Herramienta | Visible para | Propósito |
|---|---|---|
| `obtener_fecha_actual` | todos | resuelve referencias como "hoy" o "esta semana" |
| `buscar_mis_reservas` | todos | reservas del usuario autenticado en un rango |
| `buscar_espacios_disponibles` | todos | espacios libres en un slot horario |
| `buscar_espacio_semantico` | todos | búsqueda semántica de espacios |
| `detalle_espacio` | todos | datos completos de un espacio |
| `listar_inventario_de_espacio` | todos | inventario de un espacio puntual |
| `listar_edificios` | todos | catálogo de edificios |
| `listar_carreras` | todos | catálogo de carreras |
| `obtener_estadistica_global` | todos | ocupación, top de espacios o reservas por carrera |
| `buscar_reservas_globales` | administrador, analista | reservas de toda la organización |
| `top_usuarios_reservadores` | administrador, analista | ranking de usuarios por cantidad de reservas |
| `buscar_inventario_global` | administrador, mantenimiento | inventario agregado por tipo |
| `items_en_mantenimiento` | administrador, mantenimiento | items en estado de mantenimiento |

La identidad del usuario nunca se toma del prompt: el backend Spring la inyecta a partir del token JWT al reenviar la solicitud, y el servicio Python la expone a las herramientas mediante una variable de contexto. De este modo, aunque el modelo decida invocar `buscar_mis_reservas`, las filas devueltas son siempre del usuario autenticado.

El control de acceso por rol se hace dentro de cada herramienta restringida: si el rol no autoriza, la herramienta lanza un error tipado que LangChain entrega al agente como observación. El agente entonces explica al usuario, en lenguaje natural, que no tiene permiso para esa consulta y, si corresponde, ofrece una alternativa. El cliente nunca recibe un mensaje técnico ni un código HTTP de error.

La respuesta al frontend incluye la lista de herramientas que el modelo invocó, que la interfaz renderiza como etiquetas debajo de cada mensaje para que el usuario vea sobre qué datos basó su respuesta.

### Prompts

Los prompts viven dentro del código (en `routes/insights.py` y `routes/chat.py`), no en archivos externos, porque son cortos y conviven con la lógica de cada feature. Las pautas comunes son: tono profesional en español rioplatense, respuestas acotadas (dos a cuatro oraciones por defecto), y prohibición explícita de inventar datos cuando una herramienta no devuelve resultados.

## 4. Métricas y evidencia

| Indicador | Valor observado |
|---|---|
| Modelos en uso | `gemini-2.5-flash`, `llama-3.3-70b-versatile`, `gemini-embedding-001` |
| Cuota gratuita aprovechada | nivel gratuito de Google + nivel gratuito de Groq |
| Costo mensual | 0 USD estimado en operación de demostración |
| Dimensión de embeddings | 3.072 |
| Espacios indexados | depende del catálogo; consultable con `SELECT count(*) FROM ai_embedding_espacio` |
| Latencia chat (con encadenamiento de 1–2 herramientas) | 2 a 6 segundos |
| Latencia resumen ejecutivo | 1 a 3 segundos |
| Disponibilidad del chat ante agotamiento de cuota Gemini | sostenida vía respaldo Groq, transparente al usuario |

## 5. Riesgos y limitaciones

- **Dependencia de proveedores externos**: la capa requiere conectividad a Google y Groq. Una caída simultánea de ambos proveedores deja al chat inoperativo. La cadena de respaldo mitiga incidentes individuales pero no caídas concurrentes.
- **Embeddings sin respaldo**: la búsqueda semántica depende exclusivamente del modelo de embeddings de Google. Si Google interrumpe el servicio, la búsqueda semántica queda inhabilitada hasta su reposición, aunque el resto de las funcionalidades sigue operativa.
- **Memoria del asistente acotada a la sesión**: el historial conversacional se mantiene del lado del cliente y se pierde al cerrar el navegador. No hay persistencia entre sesiones.
- **Herramientas de sólo lectura**: el asistente puede consultar pero no operar sobre el sistema. Decisión deliberada de seguridad: cualquier operación que modifique datos se realiza por las vistas operativas con sus controles habituales.
- **Reducción de cuotas gratuitas**: los niveles gratuitos de los proveedores LLM han sido recortados durante 2026. La cadena multi-proveedor reduce la exposición, pero el comportamiento del sistema bajo carga sostenida en un entorno productivo requeriría evaluar planes de pago o proveedores adicionales.
