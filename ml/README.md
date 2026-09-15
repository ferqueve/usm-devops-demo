# ml-svc · pipeline de Machine Learning

Servicio Python complementario al backend Spring Boot. Entrena los modelos
de la sección Predicciones y persiste tanto el metadato de cada modelo
(`modelo_forecast`) como sus predicciones en la base de datos compartida:

- **Reservas**: Prophet sobre `hechos_reserva_diario`, global y por tipo de
  espacio (`prediccion_reserva`).
- **Inventario**: pico diario de unidades simultáneas pedidas por tipo de
  elemento, con un GLM de Poisson y sobredispersión de binomial negativa
  (`prediccion_demanda_equipo`).
- **Académico**: probabilidad de asistencia de cada inscripción a una
  tutoría futura, con regresión logística (`prediccion_asistencia`).

El backend Spring no llama a este servicio en el camino crítico: lee las
predicciones directamente de Postgres. La única interacción HTTP es el
disparo manual del reentrenamiento desde un endpoint administrativo.

## Endpoints

- `GET  /health` — liveness probe + última fecha de histórico disponible.
- `POST /train` — reservas: modelo global y uno por tipo de espacio (los tipos
  con poca historia se omiten sin romper el global). Guarda las próximas 30
  predicciones diarias de cada uno.
- `POST /train/inventario` — pico esperado de equipamiento por tipo de
  elemento para los próximos 30 días, con banda del 80% y las unidades ya
  comprometidas. 422 si no hay historia suficiente.
- `POST /train/academico` — probabilidad de asistencia de las inscripciones a
  tutorías futuras. 422 con menos de 100 inscripciones pasadas etiquetadas.
- `POST /train/todo` — los tres, aislados: responde 200 aunque alguno falle,
  con el estado de cada uno.

Cada entrenamiento desactiva el modelo anterior de su mismo ámbito (scope,
espacio, tipo de espacio) en la misma transacción en la que guarda el nuevo.

## Correr local

```bash
cd ml
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # ajustar credenciales si hace falta
uvicorn main:app --reload --port 8000
```

Probar el entrenamiento:

```bash
curl -X POST http://localhost:8000/train
```

## Correr con Docker

```bash
cd ml
docker build -t utec-ml-svc .
docker run --rm -p 8000:8000 \
  -e DATABASE_URL=postgresql://ut_user:postgres@host.docker.internal:5432/utec_db \
  utec-ml-svc
```

## Deploy en Railway

1. Crear un servicio nuevo apuntando a la subcarpeta `ml/` del repo.
2. Inyectar la variable `DATABASE_URL` referenciando el plugin Postgres
   compartido con el backend (Railway lo expone como `${{Postgres.DATABASE_URL}}`).
3. Configurar el `Health Check Path` en `/health`.
4. El reentrenamiento semanal lo dispara el `@Scheduled` del backend contra
   `POST /train/todo`; no hace falta un cron propio en Railway.

## Variables de entorno

| Variable | Default | Notas |
|---|---|---|
| `DATABASE_URL` | — | URL completa de Postgres. Si no se define, se construye a partir de `DB_*` |
| `DB_HOST` | `localhost` | |
| `DB_PORT` | `5432` | |
| `DB_NAME` | `utec_db` | |
| `DB_USER` | `ut_user` | |
| `DB_PASSWORD` | (vacío) | |
| `PORT` | `8000` | puerto HTTP |
| `LOG_LEVEL` | `INFO` | nivel de logging |

## Modelos

- **Reservas** (`forecaster.py`): Prophet con estacionalidad semanal (la
  anual sólo con dos años de historia), modo aditivo. Métrica: WAPE sobre un
  holdout de 28 días contra un ingenuo que repite la última semana anterior
  al holdout. Horizonte: 30 días. Mínimo: 30 días de historia; por tipo de
  espacio, además, 30 días con reservas y al menos 1 reserva por día de media.
- **Inventario** (`inventario.py`): serie = pico de unidades simultáneas por
  día (barrido de eventos inicio/fin, hora de Montevideo). `PoissonRegressor`
  con día de la semana, fin de semana y una tendencia suave; alpha de
  binomial negativa por momentos; bandas 80% con `scipy.stats.nbinom`. Mismo
  holdout e ingenuo que reservas. Un tipo con menos de 20 días con pedidos se
  omite.
- **Académico** (`academico.py`): `LogisticRegression` sobre features
  estandarizadas, sin fuga (nada de `confirmada`, `estado` ni feedback; las
  tasas previas sólo con tutorías que ya habían terminado). Validación
  temporal 75/25 con AUC, Brier contra la línea base, log loss, exactitud y
  calibración. No se usan como etiqueta las tutorías sin asistencia
  registrada ni las inscripciones cargadas después de la tutoría.

Ver también la ficha técnica `documentation/fichas-tecnicas/pipeline-de-ml.md`.

## Tests

```bash
docker exec usm_ml_local python -m pytest
```

## Datos locales para Académico

La base de desarrollo no trae tutorías futuras ni una historia de asistencia
utilizable. `scripts/seed_local_tutorias_futuras.sql` siembra ambas (sólo en
local, marcadas con `tags='seed-local-predicciones'`, idempotente); después
hay que correr `POST /train/academico`.

## Notebook exploratorio

El proceso de selección del modelo y validación inicial está documentado
en `documentation/ml/exploracion_demanda.ipynb`, pensado como evidencia
del trabajo de análisis previo a la implementación.
