"""Servicio HTTP del pipeline de ML.

Expone:

- `GET  /health`           — liveness probe + última fecha de histórico disponible.
- `POST /train`            — reservas: modelo global y uno por tipo de espacio (Prophet).
- `POST /train/inventario` — pico diario de equipamiento por tipo de elemento (binomial negativa).
- `POST /train/academico`  — probabilidad de asistencia a tutorías (regresión logística).
- `POST /train/todo`       — los tres, cada uno aislado de los fallos de los otros.

La intención es que los entrenamientos los invoquen dos clientes:
1. El `@Scheduled` semanal del backend (llama a `/train/todo`).
2. El backend Spring Boot (proxy desde un endpoint admin), para ejecuciones
   manuales bajo demanda.

No expone endpoints de lectura de predicciones: esas las sirve el backend
Spring leyendo directamente de la base de datos compartida.
"""

from __future__ import annotations

import logging
import os
from collections.abc import Callable
from datetime import UTC, datetime
from zoneinfo import ZoneInfo

from academico import entrenar_y_predecir_asistencia
from fastapi import FastAPI, HTTPException
from inventario import entrenar_y_predecir_inventario

from db import (
    cargar_historico_global,
    cargar_historico_por_tipo_espacio,
    cargar_inscripciones_tutorias,
    cargar_solicitudes_equipo,
    cargar_tipos_elemento,
    cargar_tipos_espacio,
    desactivar_modelos_previos,
    guardar_modelo,
    guardar_predicciones,
    guardar_predicciones_asistencia,
    guardar_predicciones_equipo,
    transaccion,
    ultima_fecha_historico,
)
from forecaster import entrenar_y_predecir, extender_hasta, motivo_omision_tipo, preparar_serie

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
log = logging.getLogger("ml-svc")

ZONA = ZoneInfo("America/Montevideo")

app = FastAPI(
    title="UTEC Space Manager · ML service",
    version="1.1.0",
    description=(
        "Predicciones de reservas (Prophet), equipamiento (binomial negativa) "
        "y asistencia a tutorías (regresión logística)."
    ),
)


def _hoy():
    # "Hoy" en Uruguay: el contenedor corre en UTC y a las 21:00 locales ya
    # seria manana, y el dia de hoy quedaria afuera del horizonte.
    return datetime.now(ZONA).date()


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "ultima_fecha_historico": str(ultima_fecha_historico() or ""),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


def _con_errores_http(nombre: str, entrenar: Callable[[], dict]) -> dict:
    """Traduce los fallos de un entrenamiento a HTTP: datos insuficientes → 422, el resto → 500."""
    try:
        return entrenar()
    except ValueError as exc:
        log.warning("Entrenamiento %s abortado: %s", nombre, exc)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        log.exception("Entrenamiento %s falló inesperadamente", nombre)
        raise HTTPException(status_code=500, detail=f"Error interno: {exc}") from exc


# ---------------------------------------------------------------------------
# Reservas
# ---------------------------------------------------------------------------


def _entrenar_tipo_espacio(tipo: dict, historico_tipos, hasta_global, hoy) -> dict:
    """Entrena un tipo de espacio. Nunca lanza: devuelve el estado para la respuesta."""
    base = {"tipo_espacio_id": tipo["id"], "nombre": tipo["nombre"], "wape": None, "wape_ingenuo": None}
    try:
        serie = historico_tipos[historico_tipos["tipo_espacio_id"] == tipo["id"]][["ds", "y"]]
        serie = extender_hasta(serie, hasta_global) if not serie.empty else serie
        motivo = motivo_omision_tipo(preparar_serie(serie, hasta=hoy))
        if motivo is None:
            resultado = entrenar_y_predecir(serie, hoy=hoy)
        else:
            resultado = None
    except ValueError as exc:
        resultado, motivo = None, str(exc)
    except Exception as exc:
        log.exception("Entrenamiento del tipo de espacio %s falló", tipo["nombre"])
        return {**base, "status": "error", "detalle": f"Error interno: {exc}"}

    try:
        with transaccion() as conn:
            # Un tipo que hoy no alcanza para entrenar también pierde su modelo
            # anterior: si no, la pantalla seguiría mostrando predicciones de un
            # entrenamiento viejo como si fueran las actuales.
            desactivar_modelos_previos(conn, scope="tipo_espacio", tipo_espacio_id=tipo["id"])
            if resultado is None:
                log.info("Tipo de espacio %s omitido: %s", tipo["nombre"], motivo)
                return {**base, "status": "omitido", "detalle": motivo}
            modelo_id = guardar_modelo(
                conn,
                scope="tipo_espacio",
                algoritmo="prophet",
                tipo_espacio_id=tipo["id"],
                sample_size=resultado.sample_size,
                holdout_size=resultado.holdout_size,
                mape=resultado.mape,
                mae=resultado.mae,
                params=resultado.params,
                notas=resultado.notas,
            )
            insertadas = guardar_predicciones(conn, modelo_id, resultado.predicciones, tipo_espacio_id=tipo["id"])
    except Exception as exc:
        log.exception("No se pudo guardar el modelo del tipo de espacio %s", tipo["nombre"])
        return {**base, "status": "error", "detalle": f"Error interno: {exc}"}

    return {
        **base,
        "status": "ok",
        "modelo_id": modelo_id,
        "wape": resultado.params.get("wape"),
        "wape_ingenuo": resultado.params.get("wape_ingenuo"),
        "predicciones_generadas": insertadas,
        "detalle": resultado.notas,
    }


def entrenar_reservas() -> dict:
    log.info("Iniciando entrenamiento del modelo global de demanda")
    historico = cargar_historico_global()
    log.info("Histórico cargado: %s filas", len(historico))
    hoy = _hoy()
    resultado = entrenar_y_predecir(historico, hoy=hoy)

    with transaccion() as conn:
        desactivar_modelos_previos(conn, scope="global")
        modelo_id = guardar_modelo(
            conn,
            scope="global",
            algoritmo="prophet",
            sample_size=resultado.sample_size,
            holdout_size=resultado.holdout_size,
            mape=resultado.mape,
            mae=resultado.mae,
            params=resultado.params,
            notas=resultado.notas,
        )
        insertadas = guardar_predicciones(conn, modelo_id, resultado.predicciones)
    log.info(
        "Entrenamiento global exitoso: modelo_id=%s wape=%s predicciones=%s",
        modelo_id,
        resultado.params.get("wape"),
        insertadas,
    )

    # Por tipo de espacio, después del global y sin poder romperlo: un tipo
    # con poca historia o que falla queda informado en su fila y el global
    # ya está guardado.
    tipos_espacio: list[dict] = []
    try:
        historico_tipos = cargar_historico_por_tipo_espacio()
        hasta_global = preparar_serie(historico, hasta=hoy)["ds"].max()
        for tipo in cargar_tipos_espacio():
            estado = _entrenar_tipo_espacio(tipo, historico_tipos, hasta_global, hoy)
            log.info("Tipo de espacio %s: %s wape=%s", tipo["nombre"], estado["status"], estado["wape"])
            tipos_espacio.append(estado)
    except Exception as exc:
        log.exception("No se pudieron cargar los tipos de espacio")
        tipos_espacio.append(
            {
                "tipo_espacio_id": None,
                "nombre": None,
                "status": "error",
                "wape": None,
                "wape_ingenuo": None,
                "detalle": f"Error interno: {exc}",
            }
        )

    return {
        "status": "ok",
        "modelo_id": modelo_id,
        "sample_size": resultado.sample_size,
        "holdout_size": resultado.holdout_size,
        "mape": resultado.mape,
        "wape": resultado.params.get("wape"),
        "wape_ingenuo": resultado.params.get("wape_ingenuo"),
        "mae": resultado.mae,
        "predicciones_generadas": insertadas,
        "tipos_espacio": tipos_espacio,
    }


# ---------------------------------------------------------------------------
# Inventario
# ---------------------------------------------------------------------------


def entrenar_inventario() -> dict:
    log.info("Iniciando entrenamiento del modelo de demanda de equipamiento")
    solicitudes = cargar_solicitudes_equipo()
    tipos = cargar_tipos_elemento()
    log.info("Solicitudes cargadas: %s filas, %s tipos de elemento", len(solicitudes), len(tipos))
    resultado = entrenar_y_predecir_inventario(solicitudes, tipos, hoy=_hoy())

    with transaccion() as conn:
        desactivar_modelos_previos(conn, scope="inventario")
        modelo_id = guardar_modelo(
            conn,
            scope="inventario",
            algoritmo="binomial_negativa",
            sample_size=resultado.sample_size,
            holdout_size=resultado.holdout_size,
            mape=None,
            mae=None,
            params=resultado.params,
            notas=resultado.notas,
        )
        insertadas = guardar_predicciones_equipo(conn, modelo_id, resultado.predicciones)
    log.info(
        "Entrenamiento de inventario exitoso: modelo_id=%s wape=%s predicciones=%s",
        modelo_id,
        resultado.wape,
        insertadas,
    )
    return {
        "status": "ok",
        "modelo_id": modelo_id,
        "tipos": resultado.tipos,
        "wape": resultado.wape,
        "wape_ingenuo": resultado.wape_ingenuo,
        "predicciones_generadas": insertadas,
    }


# ---------------------------------------------------------------------------
# Académico
# ---------------------------------------------------------------------------


def entrenar_academico() -> dict:
    log.info("Iniciando entrenamiento del modelo de asistencia a tutorías")
    inscripciones = cargar_inscripciones_tutorias()
    log.info("Inscripciones cargadas: %s filas", len(inscripciones))
    resultado = entrenar_y_predecir_asistencia(inscripciones, ahora=datetime.now(UTC))

    with transaccion() as conn:
        desactivar_modelos_previos(conn, scope="academico")
        modelo_id = guardar_modelo(
            conn,
            scope="academico",
            algoritmo="regresion_logistica",
            sample_size=resultado.sample_size,
            holdout_size=resultado.holdout_size,
            mape=None,
            mae=None,
            params=resultado.params,
            notas=resultado.notas,
        )
        insertadas = guardar_predicciones_asistencia(conn, modelo_id, resultado.predicciones)
    log.info(
        "Entrenamiento académico exitoso: modelo_id=%s auc=%s brier=%s/%s predicciones=%s",
        modelo_id,
        resultado.auc,
        resultado.brier,
        resultado.brier_base,
        insertadas,
    )
    return {
        "status": "ok",
        "modelo_id": modelo_id,
        "auc": resultado.auc,
        "brier": resultado.brier,
        "brier_base": resultado.brier_base,
        "muestras": resultado.sample_size,
        "predicciones_generadas": insertadas,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.post("/train")
def train() -> dict:
    return _con_errores_http("de reservas", entrenar_reservas)


@app.post("/train/inventario")
def train_inventario() -> dict:
    return _con_errores_http("de inventario", entrenar_inventario)


@app.post("/train/academico")
def train_academico() -> dict:
    return _con_errores_http("académico", entrenar_academico)


@app.post("/train/todo")
def train_todo() -> dict:
    """Corre los tres entrenamientos; el fallo de uno no frena a los demás.

    Siempre responde 200: el reentrenamiento programado no tiene que perder
    el modelo de inventario porque reservas se quedó sin datos esa semana.
    El estado de cada uno viaja en su clave.
    """
    respuesta = {}
    for clave, nombre, entrenar in (
        ("reservas", "de reservas", entrenar_reservas),
        ("inventario", "de inventario", entrenar_inventario),
        ("academico", "académico", entrenar_academico),
    ):
        try:
            respuesta[clave] = _con_errores_http(nombre, entrenar)
        except HTTPException as exc:
            respuesta[clave] = {"status": "error", "detalle": exc.detail}
    return respuesta
