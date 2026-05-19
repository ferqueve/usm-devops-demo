# Ficha técnica · Pipeline de Machine Learning

## 1. Resumen ejecutivo

UTEC Space Manager incorpora un subsistema de **pronóstico de demanda** que predice la cantidad esperada de reservas aprobadas en los próximos treinta días. El subsistema está implementado como un servicio Python independiente (denominado **`ml-svc`**) que ejecuta el modelo `Prophet` de Meta sobre la capa analítica del sistema y persiste sus predicciones en la misma base de datos compartida con el backend. La pantalla `/statistics` muestra el resultado como un gráfico de líneas con el histórico real, la curva predicha y una banda de confianza, acompañado por las métricas de calidad del modelo activo.

La incorporación de un servicio Python amplía el stack del proyecto a tres lenguajes (Java para OLTP, TypeScript para UI, Python para ML), aplicando el principio de **lenguaje adecuado para cada dominio**. La elección de Prophet sobre alternativas más sofisticadas (TensorFlow, redes neuronales recurrentes) responde a la naturaleza del problema: serie temporal con poca historia y estacionalidad fuerte, condiciones en las que los modelos clásicos superan a las redes profundas.

El pipeline se entrena automáticamente todas las semanas y puede dispararse manualmente desde un endpoint administrativo del backend.

---

## 2. Cómo se usa

Esta ficha cubre el detalle técnico. Para la guía orientada al usuario final, ver el manual de usuario, sección **"12. Estadísticas y Reportes"** (subsección *Predicción de demanda*).

Flujo end-to-end:

1. El usuario abre la pestaña **Reservas** de `/statistics`. Dentro del bloque de métricas analíticas se renderiza la sección *Predicción de demanda · próximos 30 días*.
2. El componente del frontend hace dos llamadas paralelas al backend: `GET /api/v1/stats/ml/forecast` y `GET /api/v1/stats/ml/calidad-modelo`.
3. El backend Spring lee las tablas `modelo_forecast` y `prediccion_reserva` (escritas por `ml-svc`) y compone la respuesta. **No invoca al servicio Python en el camino crítico de lectura.**
4. La UI dibuja el histórico real (línea azul institucional), la predicción (línea cyan punteada) y la banda de confianza al 80 %. El panel lateral muestra algoritmo, MAPE, MAE, tamaño de muestra y fecha del último entrenamiento.
5. Para reentrenar manualmente, el administrador presiona *Reentrenar*; el backend hace `POST` proxy a `ml-svc/train` y refresca la vista cuando termina.

En paralelo, el servicio `ml-svc` ejecuta `POST /train` cada domingo a las 04:00 (Railway cron). El entrenamiento toma menos de un minuto en el volumen actual; el resultado deja activo un único modelo por ámbito (los previos quedan marcados como inactivos pero se preservan para auditoría).

---

## 3. Detalle técnico

### 3.1 Arquitectura: shared database, decoupled processing

```
   ┌───────────────┐
   │   Postgres    │  (compartido entre todos los servicios)
   └──┬──────────┬─┘
      │ lee     │ escribe predicciones
      │ histó-  │ y modelos
      │ rico    │
      ▼         │
   ┌───────────────┐
   │    ml-svc     │  FastAPI · Python · Prophet
   │   (Docker)    │
   └──┬─────────┬──┘
      │         │
      │     POST /train (manual)
      │     ┌───┘
      │     │
      │  ┌──┴──────────┐  ┌──────────────┐
      │  │  backend    │──▶  frontend    │
      │  │ Spring Boot │  │  React/TS    │
      │  └──┬──────────┘  └──────────────┘
      │     │ lee predicciones
      │     ▼
      │  ┌──────────────┐
      └─▶│  Postgres    │
   Railway cron   (mismo)
   (semanal)
```

El patrón aplicado es **"shared database, decoupled processing"**: dos servicios independientes comparten la base de datos como única fuente de verdad. El backend Java no invoca a Python en el camino caliente de lectura — sólo lo proxea para disparar entrenamiento. Esta separación garantiza que el rendimiento del path crítico no dependa de la disponibilidad del servicio Python y permite que `ml-svc` pueda estar incluso suspendido (cold start en Railway) sin afectar la experiencia del usuario.

### 3.2 Esquema de persistencia

Migración Liquibase: `backend/src/main/resources/db/changelog/cambiosdb/022-create-ml-tables.xml`.

#### Tabla `modelo_forecast`

Metadatos de cada entrenamiento.

| Columna | Tipo | Significado |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `scope` | VARCHAR(50) | `global` (toda la institución) o `espacio` (un espacio específico) |
| `espacio_id` | BIGINT NULL | Identificador del espacio cuando el ámbito es por espacio |
| `algoritmo` | VARCHAR(50) | Nombre del algoritmo (`prophet`) |
| `trained_at` | TIMESTAMPTZ | Marca temporal del entrenamiento |
| `sample_size` | INTEGER | Cantidad de observaciones usadas |
| `holdout_size` | INTEGER | Cantidad de observaciones reservadas para validación |
| `mape` | NUMERIC(6,2) | Mean Absolute Percentage Error sobre el holdout |
| `mae` | NUMERIC(10,2) | Mean Absolute Error sobre el holdout |
| `params_json` | TEXT | Hiperparámetros serializados como JSON |
| `notas` | TEXT | Texto humano con la descripción del entrenamiento |
| `activo` | BOOLEAN | Indica si éste es el modelo en uso para su ámbito |

Índice compuesto: `(scope, espacio_id, activo)` para resolver en una sola lectura "cuál es el modelo activo de este ámbito".

#### Tabla `prediccion_reserva`

Cada fila es una predicción puntual.

| Columna | Tipo | Significado |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `modelo_id` | BIGINT (FK) | Modelo que generó la predicción; con `ON DELETE CASCADE` |
| `fecha_objetivo` | DATE | Día predicho |
| `espacio_id` | BIGINT NULL | NULL si la predicción es global |
| `prediccion` | NUMERIC(10,2) | Valor central pronosticado |
| `banda_inferior` | NUMERIC(10,2) | Límite inferior del intervalo de confianza |
| `banda_superior` | NUMERIC(10,2) | Límite superior del intervalo de confianza |
| `generated_at` | TIMESTAMPTZ | Marca temporal de la generación |

Índices secundarios por `fecha_objetivo` y por `modelo_id`.

El criterio de **un único modelo activo por ámbito** se mantiene desde el código Python: antes de insertar un nuevo modelo se ejecuta un `UPDATE ... SET activo = FALSE` sobre los previos del mismo `scope`. Los modelos viejos no se borran — quedan disponibles para auditoría y eventual rollback manual.

### 3.3 Servicio Python `ml-svc`

Ubicación: `ml/` en la raíz del repositorio.

```
ml/
├── Dockerfile          # python:3.11-slim + build-essential + libpq-dev
├── requirements.txt    # fastapi, uvicorn, pandas, sqlalchemy, prophet, ...
├── main.py             # FastAPI: GET /health, POST /train
├── forecaster.py       # Clase ProphetForecaster y lógica de validación
├── db.py               # SQLAlchemy + queries de lectura/escritura
├── .env.example
└── README.md
```

**`main.py`** expone dos endpoints:

| Endpoint | Verbo | Propósito |
|---|---|---|
| `/health` | GET | Liveness probe + última fecha de histórico disponible |
| `/train` | POST | Entrena el modelo global, persiste resultado |

**`forecaster.py`** encapsula el modelo:

- Instancia un `Prophet` con `yearly_seasonality=True`, `weekly_seasonality=True`, `seasonality_mode="additive"`, `interval_width=0.80`.
- Implementa un flujo de validación en dos pasos: entrena en `train`, predice el `holdout` (últimos 28 días), calcula MAPE/MAE, y luego reentrena en el dataset completo para generar las predicciones futuras. Esta separación es la práctica estándar en ML: la métrica de calidad se mide sobre datos no vistos pero el modelo final aprovecha toda la historia disponible.
- Horizonte de predicción: **30 días** hacia adelante a partir de la última fecha del histórico.
- Volumen mínimo requerido: 30 observaciones diarias; por debajo aborta con HTTP 422 y mensaje explícito.

**`db.py`** maneja la conexión Postgres. Acepta `DATABASE_URL` (formato Railway/Heroku) o variables sueltas `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`. La cadena `postgres://` se normaliza a `postgresql://` para SQLAlchemy.

### 3.4 Integración con el backend Java

Archivos:

- `backend/.../model/ModeloForecast.java`, `PrediccionReserva.java` — entidades JPA.
- `backend/.../repository/ModeloForecastRepository.java`, `PrediccionReservaRepository.java` — repos con queries derivadas.
- `backend/.../service/ForecastingService.java` — lectura de la capa ML y proxy al servicio Python.
- `backend/.../controller/StatsController.java` — endpoints públicos.

Endpoints REST:

| Endpoint | Método | Permiso | Función |
|---|---|---|---|
| `/api/v1/stats/ml/forecast` | GET | `estadisticas:ver_reservas` | Devuelve histórico contextual + predicciones del modelo activo global |
| `/api/v1/stats/ml/calidad-modelo` | GET | `estadisticas:ver_reservas` | Metadata del modelo activo (algoritmo, MAPE, MAE, fecha) |
| `/api/v1/stats/ml/reentrenar` | POST | `hasRole('ADMIN')` | Proxy a `ml-svc/train` |

La URL del servicio Python se inyecta vía la propiedad `app.ml-service-url` (variable de entorno `ML_SERVICE_URL`).

### 3.5 Frontend

Componente `frontend/src/components/statistics/ForecastDemanda.tsx`. Características:

- Carga en paralelo `forecast` y `calidad-modelo` con `Promise.all`.
- Combina histórico y predicciones en una única serie unificada por fecha (`Map` por `fecha`) para que `recharts` los pueda dibujar como un `ComposedChart`.
- Renderiza dos áreas superpuestas (banda superior cyan translúcida y banda inferior blanca) para simular la banda de confianza, una línea azul institucional para el histórico y una línea cyan punteada para la predicción.
- El panel lateral muestra metadata del modelo. Si el usuario es ADMIN aparece un botón *Reentrenar* que invoca el endpoint proxy.
- Distintivo visual ML: badge "ML" + ícono `Sparkles` en el encabezado, para que se distinga claramente de las métricas calculadas determinísticamente.

Cliente API: `frontend/src/lib/api/stats.ts` con los tipos `ForecastDemanda`, `ForecastHistoricoPunto`, `ForecastPrediccionPunto`, `CalidadModelo`.

### 3.6 Decisiones de diseño

#### Prophet sobre alternativas

Se descartaron tres familias de alternativas:

- **Modelos de deep learning** (LSTM, Transformer): requieren miles de observaciones para entrenar sin overfitting. Con un volumen típico de un sistema universitario (cientos a miles de observaciones diarias) el costo de implementación no se justifica.
- **ARIMA / SARIMA clásicos**: competentes en series estacionarias pero requieren un proceso manual de identificación de orden y diferenciación. Prophet automatiza esa selección y maneja estacionalidades múltiples sin intervención.
- **Modelos custom en Java puro** (Holt-Winters): implementables pero limitan la futura sofisticación (intervalos de confianza, regressores externos, cambio de régimen) y no permiten incorporar el ecosistema de validación cruzada y análisis exploratorio que ofrece Python.

Prophet fue creado por Meta específicamente para series de negocio con **poco volumen, alta estacionalidad y necesidad de interpretabilidad**, condiciones que describen exactamente el caso.

#### Servicio Python independiente

Se descartó la opción de embeber un modelo entrenado offline dentro del backend Java porque eliminaría la posibilidad de reentrenamiento en producción. También se descartó la opción de tener el backend Java llamando al servicio Python en el path caliente (cada vez que el usuario abre la pantalla), porque introduciría una dependencia de disponibilidad y latencia innecesaria.

La opción elegida — **escritura asíncrona en base compartida, lectura desde el backend** — es la práctica estándar en sistemas de ML productivos: separa el entrenamiento (lento, batch) del serving (rápido, transaccional).

#### Reentrenamiento programado semanal

La cadencia se eligió equilibrando cuatro factores:

1. **Frescura del dato**: en un sistema universitario los patrones cambian a escala de semanas, no días.
2. **Costo computacional**: Prophet con cientos de observaciones entrena en segundos; reentrenar diario sería despilfarro.
3. **Estabilidad de las predicciones**: reentrenamientos demasiado frecuentes generan oscilaciones en las predicciones que confunden al usuario.
4. **Tolerancia a fallos**: si una ejecución semanal falla, la próxima recupera la consistencia.

#### Métrica de calidad MAPE

Se reporta MAPE (Mean Absolute Percentage Error) como métrica primaria porque es interpretable por usuarios no técnicos ("el modelo se equivoca en promedio en un X %"). Se complementa con MAE (Mean Absolute Error) en unidades absolutas para casos en que el dato real sea cero (donde MAPE diverge). Ambas se calculan sobre un holdout de los últimos 28 días que no participó en el entrenamiento.

---

## 4. Catálogo del pipeline

### Dataset

El modelo se entrena sobre la serie agregada **demanda diaria global de reservas aprobadas**, derivada de la tabla `hechos_reserva_diario`:

```sql
SELECT fecha, SUM(cant_reservas) AS y
FROM hechos_reserva_diario
WHERE estado = 'APROBADO'
GROUP BY fecha
ORDER BY fecha;
```

Se eligió aprobadas (en lugar del total) porque representa la **demanda confirmada**, libre del ruido de reservas que el sistema pudo haber rechazado.

### Features

Prophet no requiere feature engineering manual. Internamente descompone la serie como:

```
y(t) = g(t)   tendencia (crecimiento lineal o logístico)
     + s(t)   estacionalidad (suma de Fourier para semana y año)
     + h(t)   holidays (sin uso por ahora)
     + ε(t)   ruido
```

Los parámetros `weekly_seasonality=True` y `yearly_seasonality=True` activan las estacionalidades semanal y anual; la diaria se desactiva porque el grano del modelo es diario.

### Hiperparámetros

| Parámetro | Valor | Justificación |
|---|---|---|
| `seasonality_mode` | `additive` | La variabilidad no escala con el nivel de la serie en este volumen |
| `interval_width` | `0.80` | Banda de confianza al 80 %, compromiso entre amplitud y cobertura |
| `weekly_seasonality` | `True` | Patrón clases lunes a viernes claramente presente |
| `yearly_seasonality` | `True` | Ciclos académicos (vacaciones, exámenes) |
| `daily_seasonality` | `False` | Grano del modelo es diario, sin sub-componente horario |

### Validación

Holdout temporal: los últimos 28 días (o `n / 4` si la serie es chica) se reservan como conjunto de validación. El modelo se entrena en los días anteriores, predice esos 28 días y se computa el error. Luego se reentrena sobre toda la serie para generar las predicciones futuras.

Esta es la práctica recomendada para series temporales: el holdout debe ser **temporalmente posterior** al entrenamiento, no aleatorio, para no introducir *data leakage*.

---

## 5. Evidencia y consideraciones operativas

### 5.1 Métricas del primer entrenamiento

Sobre el dataset sintético del entorno de desarrollo (~152 días con datos, 9 321 reservas en total):

| Indicador | Valor |
|---|---|
| `sample_size` | 152 observaciones diarias |
| `holdout_size` | 28 días |
| MAPE | 105.7 % |
| MAE | 19.9 reservas |
| Tiempo de entrenamiento | < 5 segundos |
| Predicciones generadas | 30 días futuros |

El MAPE elevado es **esperado y honesto**: el seeder genera reservas con un patrón sintético que no es naturalmente forecasteable (sin tendencia estable, ni estacionalidad real). Con datos productivos reales —donde los ciclos académicos se reflejan— las cifras serán sustantivamente mejores.

Este punto es importante reportarlo así, sin maquillar: el valor del pipeline no está en el accuracy en demo, sino en la infraestructura que permite reentrenar, monitorear y mejorar conforme entran datos reales.

### 5.2 Resiliencia y operación

- **Cold start del servicio Python**: en Railway free tier, `ml-svc` puede dormir entre ejecuciones. La primera invocación al despertar tarda 5-10 segundos. Esto no afecta a los usuarios porque el path crítico (lectura del forecast) no toca a `ml-svc`.
- **Fallo del entrenamiento**: si una ejecución programada falla, las predicciones existentes siguen vigentes hasta el próximo intento exitoso. Los modelos se versionan automáticamente; el más reciente con `activo = TRUE` es el que se sirve.
- **Health check**: el servicio expone `GET /health` con la última fecha del histórico disponible, útil para alertar si el dato fuente quedó desactualizado.
- **Volumen insuficiente**: si la tabla tiene menos de 30 observaciones, `POST /train` devuelve HTTP 422 con un mensaje claro. Este caso aparece en instalaciones nuevas y se resuelve solo con el paso del tiempo.

### 5.3 Plan de evolución

La arquitectura admite crecimiento sin reescritura:

- **Forecasting por espacio**: agregar un endpoint `POST /train/{espacio_id}` y un bucle externo que itere sobre espacios con volumen suficiente. El esquema de tablas ya tiene la columna `espacio_id` preparada.
- **Regressores externos**: Prophet acepta `add_regressor` para meter variables exógenas (calendario académico, clima, eventos). Sumar uno requiere extender `forecaster.py` con la lectura del dato adicional.
- **Modelos alternativos**: la columna `algoritmo` en `modelo_forecast` permite que coexistan varios; el frontend puede ofrecer un selector si en el futuro se entrena en paralelo con SARIMA o XGBoost para comparar.
- **A/B de modelos**: marcar dos como activos en diferentes ámbitos y comparar métricas. La infraestructura ya lo soporta sin cambios estructurales.

### 5.4 Análisis exploratorio

El notebook `documentation/ml/exploracion_demanda.ipynb` documenta el análisis previo que llevó a la elección de Prophet: visualización de la serie, identificación de estacionalidades, prueba comparativa con un baseline naïve (predicción = promedio histórico), y discusión de la métrica reportada. Es evidencia del trabajo de análisis que antecede a la implementación productiva.

---

## Apéndice — paths críticos

- Migración: `backend/src/main/resources/db/changelog/cambiosdb/022-create-ml-tables.xml`
- Entidades: `backend/src/main/java/com/utec/backend/model/ModeloForecast.java`, `PrediccionReserva.java`
- Repositorios: `backend/src/main/java/com/utec/backend/repository/ModeloForecastRepository.java`, `PrediccionReservaRepository.java`
- Servicio backend: `backend/src/main/java/com/utec/backend/service/ForecastingService.java`
- Controller: `backend/src/main/java/com/utec/backend/controller/StatsController.java`
- Servicio Python: `ml/main.py`, `ml/forecaster.py`, `ml/db.py`
- Dockerfile: `ml/Dockerfile`
- Cliente API frontend: `frontend/src/lib/api/stats.ts`
- Componente frontend: `frontend/src/components/statistics/ForecastDemanda.tsx`
- Notebook exploratorio: `documentation/ml/exploracion_demanda.ipynb`
- Property de configuración: `app.ml-service-url` en `backend/src/main/resources/application.properties`
