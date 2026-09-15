"""Pronóstico de demanda de reservas usando Prophet.

Prophet (Meta) es una elección deliberada para este proyecto: está pensado
para series temporales de negocio con poca historia (semanas o meses, no
años), estacionalidad fuerte y huecos en los datos, condiciones que
encajan con el volumen real esperado en una universidad de tamaño medio.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Any

import numpy as np
import pandas as pd
from prophet import Prophet

HOLDOUT_DIAS_DEFAULT = 28
HORIZONTE_DIAS_DEFAULT = 30
MIN_OBSERVACIONES_REQUERIDAS = 30

# Un tipo de espacio con menos que esto no tiene serie propia: Prophet le
# ajustaría una estacionalidad semanal a puro ruido, y con menos de una
# reserva por día el WAPE lo domina un par de días sueltos.
MIN_DIAS_CON_DATOS_POR_TIPO = 30
MIN_VOLUMEN_MEDIO_POR_TIPO = 1.0

# Prophet necesita ver el ciclo repetirse para aprender la estacionalidad
# anual. Con menos de dos años la inventa: con 37 días la banda superior
# llegaba a -2203 reservas.
DIAS_MINIMOS_ESTACIONALIDAD_ANUAL = 730

INTERVALO = 0.80


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


def preparar_serie(historico: pd.DataFrame, hasta: date | None = None) -> pd.DataFrame:
    """Deja la serie lista para Prophet: un valor por día, sin huecos.

    La tabla de hechos solo tiene filas para los días con reservas. Un
    domingo sin ninguna no aparece, y para Prophet un día ausente es un dato
    desconocido, no un cero: aprendía que el campus nunca baja de cierto
    nivel y sobreestimaba los fines de semana.

    `hasta` excluye ese día y los siguientes: una reserva aprobada para la
    semana que viene es demanda ya comprometida, no historia.
    """
    serie = historico.dropna(subset=["ds", "y"]).copy()
    serie["ds"] = pd.to_datetime(serie["ds"])
    if hasta is not None:
        serie = serie[serie["ds"] < pd.Timestamp(hasta)]
    if serie.empty:
        return serie[["ds", "y"]]

    serie = serie.groupby("ds", as_index=True)["y"].sum()
    dias = pd.date_range(serie.index.min(), serie.index.max(), freq="D")
    serie = serie.reindex(dias, fill_value=0)
    return pd.DataFrame({"ds": serie.index, "y": serie.to_numpy(dtype=float)})


def extender_hasta(historico: pd.DataFrame, ultimo_dia: date | pd.Timestamp | None) -> pd.DataFrame:
    """Estira la serie de un tipo de espacio hasta el último día con datos del campus.

    Si un tipo no tuvo reservas en sus últimos días, su serie terminaría antes
    que la global, el relleno con ceros cortaría ahí y Prophet arrancaría el
    horizonte en una fecha pasada. Se agrega una fila en cero en ese último
    día: no inventa demanda, sólo declara que ese día se sabe que no hubo.
    Hacia atrás no se estira: antes de su primera reserva el tipo pudo no
    existir, y eso no es lo mismo que cero.
    """
    if ultimo_dia is None or historico.empty:
        return historico
    ultimo = pd.Timestamp(ultimo_dia)
    if pd.to_datetime(historico["ds"]).max() >= ultimo:
        return historico
    return pd.concat([historico, pd.DataFrame({"ds": [ultimo], "y": [0]})], ignore_index=True)


def motivo_omision_tipo(serie: pd.DataFrame) -> str | None:
    """Dice por qué una serie por tipo de espacio no alcanza para entrenar, o None si alcanza.

    `serie` tiene que venir de `preparar_serie` (ya sin huecos), así el
    volumen medio cuenta también los días en cero.
    """
    if serie.empty:
        return "Sin reservas aprobadas en el histórico."
    dias_con_datos = int((serie["y"] > 0).sum())
    if dias_con_datos < MIN_DIAS_CON_DATOS_POR_TIPO:
        return (
            f"Solo {dias_con_datos} días con reservas; hacen falta al menos "
            f"{MIN_DIAS_CON_DATOS_POR_TIPO}."
        )
    media = float(serie["y"].mean())
    if media < MIN_VOLUMEN_MEDIO_POR_TIPO:
        return (
            f"Volumen medio de {media:.2f} reservas por día; con menos de "
            f"{MIN_VOLUMEN_MEDIO_POR_TIPO:g} por día la serie es casi toda ceros."
        )
    return None


def _construir_modelo(anual: bool) -> Prophet:
    """Instancia un Prophet con hiperparámetros razonables para el dominio.

    - Estacionalidad semanal habilitada (patrón clases lunes-viernes).
    - Estacionalidad anual solo con dos años de historia (ver la constante).
    - Estacionalidad diaria desactivada (el grano es diario).
    - Modo aditivo (no multiplicativo) porque la variabilidad no escala con
      el nivel en estos volúmenes.
    """
    return Prophet(
        yearly_seasonality=anual,
        weekly_seasonality=True,
        daily_seasonality=False,
        seasonality_mode="additive",
        interval_width=INTERVALO,
    )


def _calcular_mape(real: np.ndarray, pred: np.ndarray) -> float | None:
    mask = real > 0
    if not mask.any():
        return None
    return float(np.mean(np.abs((real[mask] - pred[mask]) / real[mask])) * 100)


def _calcular_wape(real: np.ndarray, pred: np.ndarray) -> float | None:
    """Error absoluto sobre el volumen total, en %.

    Es la métrica que se muestra. El MAPE promedia errores relativos día a
    día, y un día con una sola reserva pesa lo mismo que uno con cincuenta:
    predecir 15 donde hubo 1 es un 1400% de error y arrastra el promedio
    entero. Con el WAPE ese día pesa lo que pesa su volumen.
    """
    total = float(np.sum(real))
    if total <= 0:
        return None
    return float(np.sum(np.abs(real - pred)) / total * 100)


def _calcular_mae(real: np.ndarray, pred: np.ndarray) -> float:
    return float(np.mean(np.abs(real - pred)))


def _recortar(yhat: float, inferior: float, superior: float) -> tuple[float, float, float]:
    """No hay reservas negativas, y la banda tiene que contener a la predicción.

    Antes se recortaban la predicción y la banda inferior pero no la
    superior, que quedaba por debajo de las otras dos.
    """
    pred = max(0.0, yhat)
    return pred, min(max(0.0, inferior), pred), max(pred, superior)


def entrenar_y_predecir(
    historico: pd.DataFrame,
    *,
    hoy: date | None = None,
    holdout_dias: int = HOLDOUT_DIAS_DEFAULT,
    horizonte_dias: int = HORIZONTE_DIAS_DEFAULT,
) -> ResultadoEntrenamiento:
    """Entrena el modelo, valida en un holdout y genera predicciones futuras.

    El flujo en dos pasos (validar con holdout → reentrenar con todo →
    predecir) es la práctica estándar: la métrica de calidad se mide sobre
    datos nunca vistos, pero las predicciones finales se hacen con el
    modelo entrenado en todo el histórico disponible.
    """
    historico = preparar_serie(historico, hasta=hoy)
    n = len(historico)
    if n < MIN_OBSERVACIONES_REQUERIDAS:
        raise ValueError(
            f"Histórico insuficiente para entrenar: {n} días, se requieren "
            f"al menos {MIN_OBSERVACIONES_REQUERIDAS}."
        )

    anual = n >= DIAS_MINIMOS_ESTACIONALIDAD_ANUAL
    holdout_efectivo = min(holdout_dias, n // 4)
    train = historico.iloc[:-holdout_efectivo].copy()
    holdout = historico.iloc[-holdout_efectivo:].copy()

    # Validación: entrenar en train, predecir holdout, medir error.
    modelo_val = _construir_modelo(anual)
    modelo_val.fit(train)
    futuro_val = modelo_val.make_future_dataframe(periods=holdout_efectivo, freq="D", include_history=False)
    pred_val = modelo_val.predict(futuro_val)

    real = holdout["y"].to_numpy(dtype=float)
    yhat = np.clip(pred_val["yhat"].to_numpy(dtype=float), 0, None)
    mape = _calcular_mape(real, yhat)
    wape = _calcular_wape(real, yhat)
    mae = _calcular_mae(real, yhat)

    # Referencia: repetir la última semana conocida. Si el modelo no le gana
    # a esto, no está aprendiendo nada que valga la pena. Tiene que ser la
    # última semana ANTES del holdout: "el mismo día de la semana pasada" a
    # partir del octavo día ya usa datos del período que se está prediciendo,
    # y le gana a cualquier modelo haciendo trampa.
    ultima_semana = train["y"].to_numpy(dtype=float)[-7:]
    ingenuo = np.resize(ultima_semana, holdout_efectivo)
    wape_ingenuo = _calcular_wape(real, ingenuo)

    validacion = [
        {
            "fecha": row.ds.date().isoformat(),
            "real": int(real[i]),
            "prediccion": round(float(yhat[i]), 2),
            "ingenuo": int(ingenuo[i]),
        }
        for i, row in enumerate(holdout.itertuples())
    ]

    # Modelo final: reentrenado sobre todo el histórico.
    modelo_final = _construir_modelo(anual)
    modelo_final.fit(historico)
    futuro = modelo_final.make_future_dataframe(periods=horizonte_dias, freq="D", include_history=False)
    forecast = modelo_final.predict(futuro)

    predicciones = []
    for _, row in forecast.iterrows():
        pred, inferior, superior = _recortar(
            float(row["yhat"]), float(row["yhat_lower"]), float(row["yhat_upper"])
        )
        predicciones.append(
            {
                "fecha_objetivo": row["ds"].date(),
                "prediccion": pred,
                "banda_inferior": inferior,
                "banda_superior": superior,
            }
        )

    params = {
        "yearly_seasonality": anual,
        "weekly_seasonality": True,
        "daily_seasonality": False,
        "seasonality_mode": "additive",
        "interval_width": INTERVALO,
        "holdout_dias": holdout_efectivo,
        "horizonte_dias": horizonte_dias,
        "wape": None if wape is None else round(wape, 2),
        "wape_ingenuo": None if wape_ingenuo is None else round(wape_ingenuo, 2),
        "desde": historico["ds"].min().date().isoformat(),
        "hasta": historico["ds"].max().date().isoformat(),
        # Los mismos datos con los nombres del resto de los modelos
        # (inventario, académico). Las claves de arriba se quedan porque el
        # backend ya las lee del modelo global.
        "estacionalidad_anual": anual,
        "historico_desde": historico["ds"].min().date().isoformat(),
        "historico_hasta": historico["ds"].max().date().isoformat(),
        "validacion": validacion,
    }
    rango = f"{historico['ds'].min().date()} → {historico['ds'].max().date()}"
    notas = (
        f"Entrenado sobre {n} días ({rango}). "
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
