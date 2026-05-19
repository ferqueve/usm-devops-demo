# ml-svc · pipeline de Machine Learning

Servicio Python complementario al backend Spring Boot. Entrena un modelo
Prophet sobre la tabla de hechos `hechos_reserva_diario` para pronosticar
la demanda de reservas, y persiste tanto el metadato del modelo como las
predicciones generadas en la base de datos compartida.

El backend Spring no llama a este servicio en el camino crítico: lee las
predicciones directamente de Postgres. La única interacción HTTP es el
disparo manual del reentrenamiento desde un endpoint administrativo.

## Endpoints

- `GET  /health` — liveness probe + última fecha de histórico disponible.
- `POST /train` — entrena el modelo global, persiste el modelo nuevo y
  desactiva los anteriores, y guarda las próximas 30 predicciones diarias.

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
4. Crear un cron en Railway que ejecute `curl -X POST $RAILWAY_URL/train`
   con la expresión `0 4 * * 0` (domingos 4 AM UTC).

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

## Modelo

- Algoritmo: **Prophet** (Meta / Facebook) con estacionalidad semanal y
  anual habilitadas, modo aditivo.
- Métrica de calidad: **MAPE** y **MAE** sobre un holdout de los últimos
  28 días.
- Horizonte de predicción: **30 días** hacia el futuro a partir de la
  última fecha del histórico.
- Volumen mínimo requerido: 30 observaciones diarias.

Ver `forecaster.py` y la ficha técnica `documentation/fichas-tecnicas/pipeline-de-ml.md`
para los detalles.

## Notebook exploratorio

El proceso de selección del modelo y validación inicial está documentado
en `documentation/ml/exploracion_demanda.ipynb`, pensado como evidencia
del trabajo de análisis previo a la implementación.
