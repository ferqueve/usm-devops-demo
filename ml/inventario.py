"""Pronóstico de demanda de equipamiento por tipo de elemento.

La pregunta es "¿va a alcanzar?", y lo que decide eso no es cuántas
unidades se piden en el día sino cuántas se usan A LA VEZ: diez pedidos de
un proyector de 8 a 9 y otros diez de 10 a 11 necesitan diez proyectores,
no veinte. Por eso la serie objetivo es el pico diario de unidades
simultáneas, que es lo que después se compara contra el stock.

El pico es un conteo chico, con muchos días en cero o en uno y variación
por día de la semana. Prophet asume ruido normal y aditivo, que con
conteos así da bandas negativas y simétricas donde no corresponde. Un GLM
de conteos (Poisson) con día de la semana y tendencia es más honesto, y la
binomial negativa agrega la sobredispersión que el Poisson no tiene: si
los días varían más de lo que explica la media, las bandas se ensanchan.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Any
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd
from scipy.stats import nbinom, poisson
from sklearn.linear_model import PoissonRegressor

ZONA = ZoneInfo("America/Montevideo")

HOLDOUT_DIAS = 28
HORIZONTE_DIAS = 30
INTERVALO = 0.80
MIN_DIAS_HISTORICO = 30
MIN_DIAS_CON_PEDIDOS = 20

# Por debajo de esto la varianza extra no se distingue de cero y la
# binomial negativa (n = 1/alpha) se vuelve numéricamente inestable: es un
# Poisson.
ALPHA_MINIMO = 1e-6

# Penalización L2 chica: no cambia las predicciones de forma apreciable,
# pero hace que el problema tenga solución única aunque el one-hot del día
# de la semana y la marca de fin de semana sean colineales.
REGULARIZACION = 1e-3

DIAS_POR_ANIO = 365.0

# La tendencia entra achicada (en décadas en vez de años), lo que equivale a
# penalizar su coeficiente 100 veces más que el resto: sólo sobrevive una
# pendiente que sostienen muchos meses. Con la tendencia libre, una serie que
# sube en otoño y baja en invierno se proyectaba subiendo y perdía contra el
# ingenuo; en backtests semanales sobre los datos locales la versión suave
# queda en ~43% de WAPE contra ~53% del ingenuo, y la libre por encima de él.
ESCALA_TENDENCIA = 0.1


@dataclass
class ResultadoInventario:
    """Resumen de un entrenamiento de inventario."""

    sample_size: int
    holdout_size: int
    wape: float | None
    wape_ingenuo: float | None
    params: dict[str, Any]
    tipos: list[dict[str, Any]] = field(default_factory=list)
    predicciones: list[dict[str, Any]] = field(default_factory=list)
    notas: str = ""


# ---------------------------------------------------------------------------
# Serie objetivo: pico de unidades simultáneas por tipo y día
# ---------------------------------------------------------------------------


def _a_hora_local(valores: pd.Series, zona: ZoneInfo) -> pd.Series:
    """Pasa a hora de pared de Montevideo, sin zona.

    El día de una reserva es el día en Uruguay: una de 22:00 a 23:00 locales
    en UTC ya es el día siguiente y caería en otra fecha.
    """
    ts = pd.to_datetime(valores, utc=True)
    return ts.dt.tz_convert(zona).dt.tz_localize(None)


def _segmentos_por_dia(solicitudes: pd.DataFrame) -> pd.DataFrame:
    """Parte en días las solicitudes que cruzan la medianoche.

    Casi ninguna lo hace, pero si una reserva va de 23:00 a 01:00 ocupa el
    equipo en los dos días, y el pico de cada uno la tiene que ver.
    """
    df = solicitudes.copy()
    df["fecha"] = df["inicio"].dt.normalize()
    cruza = df["fin"] > df["fecha"] + pd.Timedelta(days=1)
    if not cruza.any():
        return df

    partes = [df[~cruza]]
    filas = []
    for fila in df[cruza].itertuples(index=False):
        dia = fila.inicio.normalize()
        while dia < fila.fin:
            siguiente = dia + pd.Timedelta(days=1)
            inicio = max(fila.inicio, dia)
            fin = min(fila.fin, siguiente)
            if fin > inicio:
                filas.append(
                    {
                        "tipo_elemento_id": fila.tipo_elemento_id,
                        "inicio": inicio,
                        "fin": fin,
                        "cantidad": fila.cantidad,
                        "fecha": dia,
                    }
                )
            dia = siguiente
    partes.append(pd.DataFrame(filas, columns=df.columns))
    return pd.concat(partes, ignore_index=True)


def picos_diarios(solicitudes: pd.DataFrame, zona: ZoneInfo = ZONA) -> pd.DataFrame:
    """Pico de unidades simultáneas por tipo de elemento y día local.

    Espera las columnas `tipo_elemento_id`, `inicio`, `fin` y `cantidad`
    (instantes en UTC o con zona). Devuelve `tipo_elemento_id`, `fecha`
    (Timestamp a medianoche) y `pico` (int). Sólo aparecen los días con
    pedidos: el relleno con ceros depende del rango, y lo decide quien llama.

    Barrido por eventos: cada solicitud suma su cantidad al empezar y la
    resta al terminar; el máximo de la suma acumulada es el pico. Cuando una
    termina justo cuando empieza otra, primero se resta y después se suma:
    un proyector que se devuelve a las 10:00 puede salir a las 10:00.
    """
    columnas = ["tipo_elemento_id", "fecha", "pico"]
    if solicitudes.empty:
        return pd.DataFrame(columns=columnas)

    df = solicitudes.dropna(subset=["tipo_elemento_id", "inicio", "cantidad"]).copy()
    df = df[df["cantidad"] > 0]
    if df.empty:
        return pd.DataFrame(columns=columnas)

    df["inicio"] = _a_hora_local(df["inicio"], zona)
    fin = _a_hora_local(df["fin"], zona) if "fin" in df else pd.Series(pd.NaT, index=df.index)
    # Una solicitud sin fin o con el fin antes del inicio es un dato roto,
    # pero el pedido existió: se cuenta como un uso de un minuto en vez de
    # tirarlo (con largo cero el barrido la restaría antes de sumarla).
    minimo = df["inicio"] + pd.Timedelta(minutes=1)
    df["fin"] = fin.where(fin.notna() & (fin >= minimo), minimo)
    df["tipo_elemento_id"] = df["tipo_elemento_id"].astype("int64")
    df["cantidad"] = df["cantidad"].astype("int64")

    df = _segmentos_por_dia(df[["tipo_elemento_id", "inicio", "fin", "cantidad"]])

    eventos = pd.concat(
        [
            pd.DataFrame(
                {
                    "tipo_elemento_id": df["tipo_elemento_id"],
                    "fecha": df["fecha"],
                    "t": df["inicio"],
                    "delta": df["cantidad"],
                }
            ),
            pd.DataFrame(
                {
                    "tipo_elemento_id": df["tipo_elemento_id"],
                    "fecha": df["fecha"],
                    "t": df["fin"],
                    "delta": -df["cantidad"],
                }
            ),
        ],
        ignore_index=True,
    )
    # delta ascendente: en el mismo instante los fines (negativos) van primero.
    eventos = eventos.sort_values(["tipo_elemento_id", "fecha", "t", "delta"], kind="mergesort")
    eventos["en_uso"] = eventos.groupby(["tipo_elemento_id", "fecha"])["delta"].cumsum()
    picos = eventos.groupby(["tipo_elemento_id", "fecha"], as_index=False)["en_uso"].max()
    picos = picos.rename(columns={"en_uso": "pico"})
    picos["pico"] = picos["pico"].clip(lower=0).astype("int64")
    return picos[columnas]


def serie_de_tipo(picos: pd.DataFrame, tipo_elemento_id: int, fechas: pd.DatetimeIndex) -> np.ndarray:
    """Pico diario de un tipo sobre `fechas`, con cero en los días sin pedidos.

    Igual que en reservas: un día sin fila no es un dato faltante, es un día
    en que nadie pidió ese equipo. Sin el cero el modelo cree que siempre se
    pide algo.
    """
    del_tipo = picos[picos["tipo_elemento_id"] == tipo_elemento_id]
    serie = del_tipo.groupby("fecha")["pico"].max()
    serie.index = pd.to_datetime(serie.index)
    return serie.reindex(fechas, fill_value=0).to_numpy(dtype=float)


# ---------------------------------------------------------------------------
# Modelo: GLM de Poisson + sobredispersión de binomial negativa
# ---------------------------------------------------------------------------


def construir_features(fechas: pd.DatetimeIndex, origen: pd.Timestamp) -> np.ndarray:
    """Día de la semana (one-hot lun..dom), tendencia suave y fin de semana.

    La tendencia es el tiempo desde el inicio del histórico, escalado con
    `ESCALA_TENDENCIA` para que la penalización L2 la frene (ver la constante).
    """
    fechas = pd.DatetimeIndex(fechas)
    dia = fechas.dayofweek.to_numpy()
    one_hot = np.eye(7)[dia]
    dias = (fechas - pd.Timestamp(origen)).days.to_numpy(dtype=float)
    tendencia = dias / DIAS_POR_ANIO * ESCALA_TENDENCIA
    fin_de_semana = (dia >= 5).astype(float)
    return np.column_stack([one_hot, tendencia, fin_de_semana])


def estimar_alpha(y: np.ndarray, mu: np.ndarray) -> float:
    """Sobredispersión de la binomial negativa por momentos (Var = mu + alpha·mu²).

    Es la regresión auxiliar de Cameron y Trivedi sin intercepto: lo que la
    varianza observada excede a la de Poisson, ((y - mu)² - y), contra mu².
    Si los datos varían menos que un Poisson sale negativo, y ahí no hay
    sobredispersión que agregar: se queda en cero.
    """
    y = np.asarray(y, dtype=float)
    mu = np.asarray(mu, dtype=float)
    denominador = float(np.sum(mu**2))
    if denominador <= 0:
        return 0.0
    alpha = float(np.sum((y - mu) ** 2 - y)) / denominador
    return max(0.0, alpha)


def bandas(mu: np.ndarray, alpha: float, intervalo: float = INTERVALO) -> tuple[np.ndarray, np.ndarray]:
    """Cuantiles del intervalo central para cada media, sin negativos y conteniendo a la media.

    Con alpha ≈ 0 la binomial negativa degenera en Poisson y se usa esa
    directamente. Los cuantiles son enteros (es un conteo), así que con
    medias chicas el superior puede quedar por debajo de la media (media
    0.3 → percentil 90 = 0 o 1): se estira para que la banda la contenga.
    """
    mu = np.clip(np.asarray(mu, dtype=float), 0.0, None)
    cola = (1.0 - intervalo) / 2.0
    inferior = np.zeros_like(mu)
    superior = np.zeros_like(mu)
    positiva = mu > 0
    if positiva.any():
        m = mu[positiva]
        if alpha < ALPHA_MINIMO:
            inferior[positiva] = poisson.ppf(cola, m)
            superior[positiva] = poisson.ppf(1.0 - cola, m)
        else:
            n = 1.0 / alpha
            p = n / (n + m)
            inferior[positiva] = nbinom.ppf(cola, n, p)
            superior[positiva] = nbinom.ppf(1.0 - cola, n, p)
    inferior = np.clip(np.nan_to_num(inferior, nan=0.0), 0.0, None)
    superior = np.nan_to_num(superior, nan=0.0)
    return np.minimum(inferior, mu), np.maximum(superior, mu)


def ingenuo(entrenamiento: np.ndarray, dias: int) -> np.ndarray:
    """Repite la última semana de entrenamiento, que es la anterior al holdout.

    Si se usara "el mismo día de la semana pasada" dentro del holdout, a
    partir del octavo día la referencia miraría el período que se está
    evaluando y le ganaría a cualquier modelo haciendo trampa.
    """
    return np.resize(np.asarray(entrenamiento, dtype=float)[-7:], dias)


def calcular_wape(real: np.ndarray, pred: np.ndarray) -> float | None:
    """Error absoluto sobre el volumen total, en %. Ver `forecaster._calcular_wape`."""
    total = float(np.sum(real))
    if total <= 0:
        return None
    return float(np.sum(np.abs(np.asarray(real) - np.asarray(pred))) / total * 100)


@dataclass
class AjusteTipo:
    modelo: PoissonRegressor
    alpha: float
    origen: pd.Timestamp

    def media(self, fechas: pd.DatetimeIndex) -> np.ndarray:
        return np.clip(self.modelo.predict(construir_features(fechas, self.origen)), 0.0, None)


def ajustar(fechas: pd.DatetimeIndex, y: np.ndarray, origen: pd.Timestamp) -> AjusteTipo:
    modelo = PoissonRegressor(alpha=REGULARIZACION, max_iter=1000)
    modelo.fit(construir_features(fechas, origen), np.asarray(y, dtype=float))
    ajuste = AjusteTipo(modelo=modelo, alpha=0.0, origen=pd.Timestamp(origen))
    ajuste.alpha = estimar_alpha(y, ajuste.media(fechas))
    return ajuste


def multiplicadores_dia_semana(ajuste: AjusteTipo) -> list[float]:
    """Cuánto se pide cada día (lun..dom) respecto de un día promedio.

    El GLM trabaja en escala log, así que exp(coef) es un multiplicador. El
    del sábado y el domingo incluye el coeficiente de fin de semana, y los
    siete se dividen por su promedio para que "1.3" se lea como "un 30% más
    que un día cualquiera" sin depender de dónde quedó el intercepto.
    """
    coef = ajuste.modelo.coef_
    efecto = coef[:7] + coef[8] * np.array([0, 0, 0, 0, 0, 1, 1], dtype=float)
    mult = np.exp(efecto)
    return [round(float(v), 3) for v in mult / mult.mean()]


def tendencia_semanal_pct(ajuste: AjusteTipo) -> float:
    """Cuánto cambia la media de una semana a la siguiente por la tendencia, en %."""
    por_semana = ajuste.modelo.coef_[7] * ESCALA_TENDENCIA * 7.0 / DIAS_POR_ANIO
    return round(float(np.expm1(por_semana) * 100), 2)


def _redondear(valor: float | None, decimales: int = 2) -> float | None:
    return None if valor is None else round(float(valor), decimales)


# ---------------------------------------------------------------------------
# Entrenamiento completo
# ---------------------------------------------------------------------------


def entrenar_y_predecir_inventario(
    solicitudes: pd.DataFrame,
    tipos: dict[int, str],
    *,
    hoy: date,
    holdout_dias: int = HOLDOUT_DIAS,
    horizonte_dias: int = HORIZONTE_DIAS,
) -> ResultadoInventario:
    """Valida cada tipo en un holdout, reentrena con todo y predice desde hoy.

    `tipos` son los tipos de elemento a considerar (id → nombre). Los que no
    tienen historia suficiente quedan como omitidos, con el motivo, pero no
    frenan a los demás.
    """
    picos = picos_diarios(solicitudes)
    hoy_ts = pd.Timestamp(hoy)
    if picos.empty:
        raise ValueError("No hay pedidos de equipamiento para entrenar.")

    picos["fecha"] = pd.to_datetime(picos["fecha"])
    historico = picos[picos["fecha"] < hoy_ts]
    comprometido = picos[picos["fecha"] >= hoy_ts]
    if historico.empty:
        raise ValueError("No hay pedidos de equipamiento anteriores a hoy.")

    # Mismo rango para todos los tipos: si un tipo no tuvo pedidos el último
    # día del histórico, ese día es un cero, no el fin de su serie.
    desde = historico["fecha"].min()
    hasta = historico["fecha"].max()
    fechas = pd.date_range(desde, hasta, freq="D")
    n = len(fechas)
    if n < MIN_DIAS_HISTORICO:
        raise ValueError(
            f"Histórico de pedidos insuficiente: {n} días, se requieren al menos {MIN_DIAS_HISTORICO}."
        )

    holdout = min(holdout_dias, n // 4)
    fechas_train, fechas_holdout = fechas[:-holdout], fechas[-holdout:]
    horizonte = pd.date_range(hoy_ts, periods=horizonte_dias, freq="D")

    error_modelo = error_ingenuo = volumen_holdout = 0.0
    resumen: list[dict[str, Any]] = []
    params_tipos: dict[str, dict[str, Any]] = {}
    predicciones: list[dict[str, Any]] = []

    for tipo_id, nombre in sorted(tipos.items()):
        y = serie_de_tipo(historico, tipo_id, fechas)
        dias_con_pedidos = int((y > 0).sum())
        media_historica = round(float(y.mean()), 2)

        if dias_con_pedidos < MIN_DIAS_CON_PEDIDOS:
            detalle = (
                f"Solo {dias_con_pedidos} días con pedidos en el histórico; hacen falta al "
                f"menos {MIN_DIAS_CON_PEDIDOS} para estimar su patrón."
            )
            params_tipos[str(tipo_id)] = {
                "nombre": nombre,
                "status": "omitido",
                "detalle": detalle,
                "media_historica": media_historica,
                "alpha": None,
                "wape": None,
                "wape_ingenuo": None,
                "coef_dia_semana": None,
                "tendencia_semanal_pct": None,
            }
            resumen.append(
                {
                    "tipo_elemento_id": tipo_id,
                    "nombre": nombre,
                    "status": "omitido",
                    "wape": None,
                    "wape_ingenuo": None,
                    "detalle": detalle,
                }
            )
            continue

        # Validación: el modelo nunca ve los últimos `holdout` días.
        y_train, y_holdout = y[:-holdout], y[-holdout:]
        ajuste_val = ajustar(fechas_train, y_train, desde)
        pred_holdout = ajuste_val.media(fechas_holdout)
        ref_holdout = ingenuo(y_train, holdout)
        wape = calcular_wape(y_holdout, pred_holdout)
        wape_ingenuo = calcular_wape(y_holdout, ref_holdout)
        error_modelo += float(np.sum(np.abs(y_holdout - pred_holdout)))
        error_ingenuo += float(np.sum(np.abs(y_holdout - ref_holdout)))
        volumen_holdout += float(np.sum(y_holdout))

        # Modelo final con todo el histórico.
        ajuste = ajustar(fechas, y, desde)
        mu = np.round(ajuste.media(horizonte), 2)
        inferior, superior = bandas(mu, ajuste.alpha)
        ya_pedido = serie_de_tipo(comprometido, tipo_id, horizonte)

        for i, fecha in enumerate(horizonte):
            predicciones.append(
                {
                    "tipo_elemento_id": tipo_id,
                    "fecha_objetivo": fecha.date(),
                    "prediccion": float(mu[i]),
                    "banda_inferior": round(float(inferior[i]), 2),
                    "banda_superior": round(float(superior[i]), 2),
                    "comprometidas": int(ya_pedido[i]),
                }
            )

        params_tipos[str(tipo_id)] = {
            "nombre": nombre,
            "status": "ok",
            "detalle": None,
            "alpha": round(ajuste.alpha, 4),
            "wape": _redondear(wape),
            "wape_ingenuo": _redondear(wape_ingenuo),
            "media_historica": media_historica,
            "coef_dia_semana": multiplicadores_dia_semana(ajuste),
            "tendencia_semanal_pct": tendencia_semanal_pct(ajuste),
            "dias_con_pedidos": dias_con_pedidos,
        }
        resumen.append(
            {
                "tipo_elemento_id": tipo_id,
                "nombre": nombre,
                "status": "ok",
                "wape": _redondear(wape),
                "wape_ingenuo": _redondear(wape_ingenuo),
                "detalle": None,
            }
        )

    if not predicciones:
        raise ValueError(
            "Ningún tipo de elemento tiene historia suficiente: hacen falta al menos "
            f"{MIN_DIAS_CON_PEDIDOS} días con pedidos."
        )

    # El agregado pesa cada tipo por su volumen, igual que el WAPE por tipo
    # pesa cada día: no es el promedio de los porcentajes.
    wape_total = error_modelo / volumen_holdout * 100 if volumen_holdout > 0 else None
    wape_ingenuo_total = error_ingenuo / volumen_holdout * 100 if volumen_holdout > 0 else None

    params = {
        "horizonte_dias": horizonte_dias,
        "holdout_dias": holdout,
        "intervalo": INTERVALO,
        "historico_desde": desde.date().isoformat(),
        "historico_hasta": hasta.date().isoformat(),
        "wape": _redondear(wape_total),
        "wape_ingenuo": _redondear(wape_ingenuo_total),
        "regularizacion_l2": REGULARIZACION,
        "escala_tendencia": ESCALA_TENDENCIA,
        "tipos": params_tipos,
    }
    ok = sum(1 for t in resumen if t["status"] == "ok")
    notas = (
        f"Pico diario de unidades simultáneas, {ok} de {len(resumen)} tipos entrenados sobre "
        f"{n} días ({desde.date()} → {hasta.date()}). Validación: últimos {holdout} días. "
        f"Horizonte: {horizonte_dias} días desde {hoy}."
    )
    return ResultadoInventario(
        sample_size=n,
        holdout_size=holdout,
        wape=_redondear(wape_total),
        wape_ingenuo=_redondear(wape_ingenuo_total),
        params=params,
        tipos=resumen,
        predicciones=predicciones,
        notas=notas,
    )

