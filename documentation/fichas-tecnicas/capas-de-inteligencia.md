# Ficha técnica · Capas de inteligencia del sistema

## 1. Resumen ejecutivo

UTEC Space Manager incorpora **tres capas progresivas de inteligencia**, cada una resolviendo un tipo distinto de problema con la herramienta más adecuada a su naturaleza. Las tres conviven en la misma plataforma, se complementan entre sí y constituyen una progresión natural en complejidad y autonomía: desde reglas explícitas codificadas por el equipo de desarrollo, pasando por modelos estadísticos que aprenden patrones a partir de datos, hasta sistemas generativos basados en modelos de lenguaje grandes.

| Capa | Naturaleza | Estado | Ficha técnica detallada |
|---|---|---|---|
| **1. Recomendaciones heurísticas** | Reglas explícitas + scoring determinístico | Operativa | [`sistema-de-recomendaciones.md`](./sistema-de-recomendaciones.md) |
| **2. Machine Learning** | Modelo estadístico aprendido (Prophet) | Operativa | [`pipeline-de-ml.md`](./pipeline-de-ml.md) |
| **3. Inteligencia Artificial generativa** | Modelos de lenguaje (LLM) | Operativa | [`capa-ia-generativa.md`](./capa-ia-generativa.md) |

La existencia de esta progresión es una **decisión arquitectónica deliberada**, no un accidente histórico. Cada capa aporta un tipo de valor distinto que las otras no pueden cubrir bien, y las tres juntas trazan una narrativa coherente sobre cómo un sistema de gestión universitaria moderno puede incorporar inteligencia computacional sin caer en la trampa de aplicar la herramienta más sofisticada a problemas que no la necesitan.

Esta ficha cumple un rol de **mapa**: presenta cada capa en términos de qué problema resuelve, cómo está implementada, cuáles son sus limitaciones y cuándo conviene elegirla. Para el detalle técnico de cada una, las fichas específicas profundizan en código, esquemas y métricas.

---

## 2. Capa 1 — Recomendaciones heurísticas

### Qué es

Un sistema de recomendaciones basado en **reglas explícitas y puntajes determinísticos**. El equipo de desarrollo codifica las heurísticas (por ejemplo: "si un usuario reservó N veces el espacio X en los últimos 30 días, recomendárselo con un peso proporcional al uso reciente") y el sistema calcula puntajes entre 0 y 1 que se combinan para producir un ranking final.

### Qué resuelve

Sugerencias contextuales en el flujo cotidiano del usuario:

- Espacios candidatos al crear una reserva, considerando historial, capacidad, ubicación y disponibilidad.
- Horarios óptimos basados en patrones de uso pasados.
- Espacios similares a uno dado, para ofrecer alternativas cuando el preferido no está disponible.
- Items recomendados a solicitar junto con una reserva.
- Reasignación de items y necesidades de compra para el equipo de mantenimiento.
- Asignación de analistas a reservas en función de carga y especialización.

### Cómo está implementado

Conjunto de servicios bajo `backend/.../service/Recomendacion*.java`. La entidad `Recomendacion` persiste el resultado en base de datos con un campo `puntaje` decimal y un `tipoRecomendacion` enum que distingue las categorías. Las recomendaciones se cachean en Redis para responder rápido durante el uso transaccional, y un scheduler nocturno recalcula las top-N por usuario en horario de bajo tráfico.

### Características y limitaciones

- **Explicable**: para cada recomendación el sistema puede listar las reglas que la generaron y los pesos aplicados.
- **Predecible**: el mismo input siempre da el mismo output (es determinístico).
- **Sin requerimiento de volumen de datos**: funciona desde el primer usuario.
- **Costo de evolución**: cada cambio de comportamiento requiere modificar código y desplegar. Adaptarse a un nuevo patrón observado no es automático.
- **Sesgo del diseñador**: las reglas reflejan la intuición del equipo, no necesariamente la realidad estadística del uso.

### Cuándo elegir esta capa

Cuando el problema tiene una **lógica de negocio identificable y estable**, cuando se necesita explicabilidad total, y cuando el volumen de datos es bajo o nulo. Es la elección por defecto para cualquier sugerencia operativa que pueda razonarse desde el dominio.

---

## 3. Capa 2 — Machine Learning (estadístico)

### Qué es

Un modelo estadístico que **aprende patrones a partir del histórico de datos** y los proyecta hacia el futuro. La implementación actual usa **Prophet** (Meta) para pronosticar series temporales de demanda de reservas, pero el patrón es generalizable: el modelo descubre tendencias y estacionalidades que el equipo de desarrollo no codificó explícitamente.

### Qué resuelve

Predicción de la **cantidad esperada de reservas aprobadas en los próximos treinta días**, con banda de confianza al 80 %. La predicción se refresca cada semana, integrando los datos recién observados al modelo.

A diferencia de las recomendaciones heurísticas (que actúan sobre el presente: "qué espacio sugerirte ahora"), el ML actúa sobre el futuro: anticipa demanda agregada para apoyar decisiones de planificación, asignación de recursos y comunicación con la comunidad universitaria en períodos de pico esperado.

### Cómo está implementado

Servicio Python independiente (`ml/`) que corre FastAPI con dos endpoints (`/health`, `/train`). El entrenamiento se ejecuta semanalmente (Railway cron, domingos 04:00 UTC) y consume el histórico desde la capa analítica (`hechos_reserva_diario`). El modelo final se persiste en las tablas `modelo_forecast` y `prediccion_reserva` de Postgres, que el backend Java lee directamente para servir el forecast a la UI. La comunicación entre servicios es **asíncrona vía base de datos**, no HTTP en el path crítico.

### Características y limitaciones

- **Aprendizaje no supervisado del patrón**: el modelo descubre estacionalidades semanales y anuales sin que nadie las codifique a mano.
- **Cuantifica la incertidumbre**: cada predicción viene con una banda de confianza.
- **Reentrenable**: se adapta solo al cambio de patrones a medida que entran nuevos datos.
- **Caja semi-transparente**: Prophet permite descomponer la predicción en componentes (tendencia, estacionalidad), pero no es tan trivial de explicar como una regla.
- **Requiere volumen de datos**: el sistema necesita al menos 30 observaciones diarias para comenzar a entrenar. La calidad del modelo mejora a medida que crece la historia.
- **Falible y honesto al respecto**: las métricas (MAPE, MAE) se reportan abiertamente y el usuario sabe cuál es el error promedio del modelo activo.

### Cuándo elegir esta capa

Cuando el problema involucra **patrones temporales no triviales** que serían tediosos o imposibles de codificar a mano, y cuando hay suficiente historia para que un modelo aprenda algo útil. Es la elección para forecasting, detección de tendencias y eventualmente clustering o segmentación.

---

## 4. Capa 3 — Inteligencia Artificial generativa

### Qué es

Modelos de lenguaje grande (Large Language Models, LLMs) que **comprenden y generan texto en lenguaje natural**. A diferencia de las capas anteriores, el LLM no resuelve un problema acotado con una respuesta numérica, sino que **opera sobre lenguaje libre**, lo que abre un espacio de aplicaciones cualitativamente distinto: conversación, generación de contenido, comprensión semántica de pedidos abiertos, asistencia conversacional.

### Qué resuelve en este sistema

La capa está implementada con cinco funcionalidades agrupadas en la página `/asistente` (acceso para analista y admin):

- **Resumen automático de estadísticas**: interpretación en lenguaje natural del estado del sistema, pensada para encabezar el dashboard de estadísticas.
- **Explicación de recomendaciones**: humaniza la salida del recomendador heurístico (capa 1), reescribiendo el campo `razon` en un texto más natural.
- **Análisis del forecast Prophet**: síntesis accionable de las predicciones del modelo de demanda (capa 2), con identificación de tendencias, picos y sugerencias operativas.
- **Búsqueda semántica de espacios (RAG)**: consulta en lenguaje natural sobre el catálogo de espacios, resuelta por similitud de embeddings vectoriales almacenados en pgvector.
- **Chatbot con function calling**: agente conversacional que consulta la base de datos a través de un conjunto acotado de herramientas de sólo lectura (reservas propias, espacios disponibles, estadísticas globales, búsqueda semántica).

Las cinco están en `/asistente` como sandbox para validar comportamiento antes de migrarlas a su contexto natural en otras pantallas (resumen sobre `/statistics`, explicación en cards del recomendador, etc.).

### Cómo está implementada

Microservicio Python independiente `ai-svc` (FastAPI + LangChain), proxy-eado por el backend Spring vía `/api/v1/ai/...`. El proveedor de LLM se abstrae con LangChain para no acoplar el código a una API concreta; la implementación inicial usa Gemini 2.5 Flash para texto y `gemini-embedding-001` (3072 dim.) para embeddings.

La interacción del chatbot con el LLM es **acotada por tools** (tool use, function calling): el modelo no inventa disponibilidad de espacios; consulta los endpoints reales del backend y sólo formatea la respuesta. Patrón estándar de LLM como interfaz, sistema determinístico como fuente de verdad. La identidad del usuario se inyecta desde el JWT del backend, no desde el prompt, para que el agente no pueda acceder a datos de otros usuarios aunque se lo pida explícitamente.

Detalle técnico en [`capa-ia-generativa.md`](./capa-ia-generativa.md).

### Características y limitaciones esperadas

- **Capacidad amplísima sobre lenguaje**: no requiere reglas codificadas ni datos de entrenamiento propios.
- **No determinístico**: dos invocaciones idénticas pueden devolver respuestas distintas, lo que exige diseñar la UX considerando esa variabilidad.
- **Caja negra**: la respuesta del modelo no es trazable a una regla o a un dato concreto; sólo puede ser auditada como conjunto.
- **Costo por uso**: a diferencia de las capas anteriores que corren sobre infraestructura ya pagada, el LLM se factura por token. El diseño debe contemplar caching, rate-limiting y cuotas por usuario.
- **Riesgo de alucinación**: el modelo puede inventar información plausible pero falsa. El patrón de tool use lo mitiga al obligar al modelo a buscar datos en lugar de generarlos.

### Cuándo elegir esta capa

Cuando el problema involucra **comprensión o generación de lenguaje natural** y no puede resolverse bien con reglas ni con un modelo estadístico clásico. El criterio práctico es: si la interacción natural sería conversacional o si la salida esperada es texto libre, esta capa es la adecuada.

---

## 5. Comparación entre las tres capas

| Dimensión | Capa 1 · Heurística | Capa 2 · ML | Capa 3 · IA generativa |
|---|---|---|---|
| **Tipo de problema** | Decisión acotada sobre el presente | Predicción cuantitativa del futuro | Comprensión / generación de lenguaje |
| **Conocimiento previo necesario** | Reglas de dominio explícitas | Histórico de datos numéricos | Pre-entrenamiento del modelo (externo) |
| **Volumen de datos requerido** | Cualquiera, incluso cero | Decenas a miles de observaciones | Cero datos propios (LLM ya pre-entrenado) |
| **Determinismo** | Total | Estadístico con banda de confianza | No determinístico |
| **Explicabilidad** | Total (regla explícita) | Media (descomposición en componentes) | Baja (justificación post-hoc) |
| **Costo operativo** | Nulo (CPU del backend) | Bajo (entrenamiento semanal) | Por token consumido |
| **Capacidad de adaptación** | Manual (cambiar código) | Automática (reentrenamiento) | Inmediata por prompt |
| **Riesgo de error visible** | Bajo (la regla está mal) | Medio (MAPE conocido) | Alto (puede alucinar) |

Las tres capas no compiten; resuelven problemas distintos. La elección entre ellas no se hace por preferencia tecnológica sino por **encaje entre la naturaleza del problema y la naturaleza de la herramienta**.

---

## 6. Stack tecnológico por capa

| Capa | Lenguaje principal | Tecnologías | Servicio |
|---|---|---|---|
| 1 · Heurística | Java | Spring Boot, JPA, Redis | dentro del `utec-backend` |
| 2 · ML | Python | FastAPI, Prophet, pandas, SQLAlchemy | `ml-svc` (proceso separado) |
| 3 · IA generativa | Python | FastAPI, LangChain, Google Generative AI SDK, pgvector | `ai-svc` (proceso separado, siempre activo) |

La incorporación progresiva de lenguajes (Java → Java + Python → Java + Python + Python) refleja un principio guía del proyecto: **cada capa usa el lenguaje y el ecosistema más adecuado a su dominio**, en lugar de forzar una única tecnología para problemas heterogéneos.

---

## 7. Plan de evolución

Con las tres capas operativas, la evolución natural está orientada a profundizar cada una:

- **Capa 1**: enriquecer las heurísticas combinando señales adicionales del histórico ya disponible.
- **Capa 2**: explorar modelos por espacio individual (cuando el volumen lo justifique), agregar predicción de cancelaciones, evaluar Prophet vs. otros métodos (ARIMA, modelos de gradient boosting con features temporales).
- **Capa 3**: migrar las funcionalidades desde la página `/asistente` a su contexto natural en producción (resumen sobre `/statistics`, explicación de recomendación en cards, widget de chatbot flotante global), agregar memoria persistente para el chatbot, evaluar caching de respuestas para reducir consumo de tokens.

Las decisiones de proveedor de LLM y control de costo se revisan periódicamente: la abstracción vía LangChain permite intercambiar proveedor (Gemini, Groq, OpenAI, Anthropic) modificando una sola variable de entorno, lo que reduce el riesgo de quedar atado a las políticas de free tier de un único proveedor.

---

## Apéndice — Lecturas relacionadas

- [`sistema-de-recomendaciones.md`](./sistema-de-recomendaciones.md) — detalle técnico de la capa 1.
- [`pipeline-de-ml.md`](./pipeline-de-ml.md) — detalle técnico de la capa 2.
- [`sistema-de-estadisticas.md`](./sistema-de-estadisticas.md) — capa analítica (OLAP) que provee la materia prima de datos para las capas 2 y 3.
- [`arquitectura-y-estructura.md`](./arquitectura-y-estructura.md) — estructura general del repositorio y de los servicios desplegados.
