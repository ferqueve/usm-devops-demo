"""Pronóstico de demanda de reservas usando Prophet.

Prophet (Meta) es una elección deliberada para este proyecto: está pensado
para series temporales de negocio con poca historia (semanas o meses, no
años), estacionalidad fuerte y huecos en los datos, condiciones que
encajan con el volumen real esperado en una universidad de tamaño medio.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import timedelta
from typing import Any

import numpy as np
import pandas as pd
from prophet import Prophet


HOLDOUT_DIAS_DEFAULT = 28
HORIZONTE_DIAS_DEFAULT = 30
MIN_OBSERVACIONES_REQUERIDAS = 30


@dataclass
class ResultadoEntrenamiento:
    """Resumen de un entrenamiento exitoso."""

    sample_size: int
    holdout_size: int
    mape: float | None
    mae: float | None
    params: dict[str, Any]
    predicciones: list[dict[str, Any]] = field(default_factory=list)
    notas: str = ""


def _construir_modelo() -> Prophet:
    """Instancia un Prophet con hiperparámetros razonables para el dominio.

    - Estacionalidad semanal habilitada (patrón clases lunes-viernes).
    - Estacionalidad anual habilitada (ciclos académicos).
    - Estacionalidad diaria desactivada (el grano es diario).
    - Modo aditivo (no multiplicativo) porque la variabilidad no escala con
      el nivel en estos volúmenes.
    """
    return Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        seasonality_mode="additive",
        interval_width=0.80,
    )


def _calcular_mape(real: np.ndarray, pred: np.ndarray) -> float | None:
    mask = real > 0
    if not mask.any():
        return None
    return float(np.mean(np.abs((real[mask] - pred[mask]) / real[mask])) * 100)


def _calcular_mae(real: np.ndarray, pred: np.ndarray) -> float:
    return float(np.mean(np.abs(real - pred)))


def entrenar_y_predecir(
    historico: pd.DataFrame,
    *,
    holdout_dias: int = HOLDOUT_DIAS_DEFAULT,
    horizonte_dias: int = HORIZONTE_DIAS_DEFAULT,
) -> ResultadoEntrenamiento:
    """Entrena el modelo, valida en un holdout y genera predicciones futuras.

    El flujo en dos pasos (validar con holdout → reentrenar con todo →
    predecir) es la práctica estándar: la métrica de calidad se mide sobre
    datos nunca vistos, pero las predicciones finales se hacen con el
    modelo entrenado en todo el histórico disponible.
    """
    historico = historico.dropna(subset=["ds", "y"]).sort_values("ds").reset_index(drop=True)
    n = len(historico)
    if n < MIN_OBSERVACIONES_REQUERIDAS:
        raise ValueError(
            f"Histórico insuficiente para entrenar: {n} observaciones, se requieren "
            f"al menos {MIN_OBSERVACIONES_REQUERIDAS}."
        )

    holdout_efectivo = min(holdout_dias, n // 4)
    train = historico.iloc[:-holdout_efectivo].copy()
    holdout = historico.iloc[-holdout_efectivo:].copy()

    # Validación: entrenar en train, predecir holdout, medir error.
    modelo_val = _construir_modelo()
    modelo_val.fit(train)
    futuro_val = modelo_val.make_future_dataframe(periods=holdout_efectivo, freq="D", include_history=False)
    pred_val = modelo_val.predict(futuro_val)

    real = holdout["y"].to_numpy(dtype=float)
    yhat = pred_val["yhat"].to_numpy(dtype=float)
    mape = _calcular_mape(real, yhat)
    mae = _calcular_mae(real, yhat)

    # Modelo final: reentrenado sobre todo el histórico.
    modelo_final = _construir_modelo()
    modelo_final.fit(historico)
    futuro = modelo_final.make_future_dataframe(periods=horizonte_dias, freq="D", include_history=False)
    forecast = modelo_final.predict(futuro)

    predicciones = [
        {
            "fecha_objetivo": row["ds"].date(),
            "prediccion": max(0.0, float(row["yhat"])),
            "banda_inferior": max(0.0, float(row["yhat_lower"])),
            "banda_superior": float(row["yhat_upper"]),
        }
        for _, row in forecast.iterrows()
    ]

    params = {
        "yearly_seasonality": True,
        "weekly_seasonality": True,
        "daily_seasonality": False,
        "seasonality_mode": "additive",
        "interval_width": 0.80,
        "holdout_dias": holdout_efectivo,
        "horizonte_dias": horizonte_dias,
    }
    rango = f"{historico['ds'].min().date()} → {historico['ds'].max().date()}"
    notas = (
        f"Entrenado sobre {n} observaciones ({rango}). "
        f"Validación: últimos {holdout_efectivo} días como holdout."
    )

    return ResultadoEntrenamiento(
        sample_size=n,
        holdout_size=holdout_efectivo,
        mape=mape,
        mae=mae,
        params=params,
        predicciones=predicciones,
        notas=notas,
    )
