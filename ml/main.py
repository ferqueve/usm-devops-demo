"""Servicio HTTP del pipeline de ML.

Expone dos endpoints:

- `GET  /health`  — liveness probe + última fecha de histórico disponible.
- `POST /train`   — dispara un entrenamiento completo del modelo global.

La intención es que `POST /train` lo invoquen dos clientes:
1. Railway cron, semanalmente, para reentrenamiento programado.
2. El backend Spring Boot (proxy desde un endpoint admin), para ejecuciones
   manuales bajo demanda.

No expone endpoints de lectura de predicciones: esas las sirve el backend
Spring leyendo directamente de la base de datos compartida.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime

from fastapi import FastAPI, HTTPException

from db import (
    cargar_historico_global,
    desactivar_modelos_previos,
    guardar_modelo,
    guardar_predicciones,
    ultima_fecha_historico,
)
from forecaster import entrenar_y_predecir

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
log = logging.getLogger("ml-svc")

app = FastAPI(
    title="UTEC Space Manager · ML service",
    version="1.0.0",
    description="Forecasting de demanda de reservas con Prophet.",
)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "ultima_fecha_historico": str(ultima_fecha_historico() or ""),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@app.post("/train")
def train() -> dict:
    log.info("Iniciando entrenamiento del modelo global de demanda")
    try:
        historico = cargar_historico_global()
        log.info("Histórico cargado: %s filas", len(historico))
        resultado = entrenar_y_predecir(historico)

        desactivar_modelos_previos(scope="global", espacio_id=None)
        modelo_id = guardar_modelo(
            scope="global",
            espacio_id=None,
            sample_size=resultado.sample_size,
            holdout_size=resultado.holdout_size,
            mape=resultado.mape,
            mae=resultado.mae,
            params=resultado.params,
            notas=resultado.notas,
        )
        insertadas = guardar_predicciones(
            modelo_id=modelo_id,
            espacio_id=None,
            predicciones=resultado.predicciones,
        )
        log.info(
            "Entrenamiento exitoso: modelo_id=%s mape=%s mae=%s predicciones=%s",
            modelo_id,
            resultado.mape,
            resultado.mae,
            insertadas,
        )
        return {
            "status": "ok",
            "modelo_id": modelo_id,
            "sample_size": resultado.sample_size,
            "holdout_size": resultado.holdout_size,
            "mape": resultado.mape,
            "mae": resultado.mae,
            "predicciones_generadas": insertadas,
        }
    except ValueError as exc:
        log.warning("Entrenamiento abortado: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        log.exception("Entrenamiento falló inesperadamente")
        raise HTTPException(status_code=500, detail=f"Error interno: {exc}") from exc
