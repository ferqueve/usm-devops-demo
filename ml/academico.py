"""Probabilidad de que cada inscripto vaya a su tutoría.

La pregunta de la pestaña es "¿cuántos van a ir?". Contar inscriptos no
alcanza: una parte grande de los que se anotan no va. Se estima una
probabilidad por inscripción y la asistencia esperada de una tutoría es la
suma de las de sus inscriptos.

Regresión logística y no algo más potente a propósito: son unos cientos de
inscripciones, y con eso un modelo flexible aprende de memoria. La logística
además deja leer cada factor como un odds ratio, que es lo que se muestra
en "Qué influye".

Lo delicado es la fuga de la etiqueta. `confirmada` vale true exactamente en
las que asistieron, `estado` ES la etiqueta y el feedback sólo existe si
fueron: nada de eso entra. Y todo lo "histórico" de una fila (su tasa
previa, cuántas veces se inscribió antes) se calcula sólo con tutorías que
ya habían terminado cuando empezó la suya; si no, la validación mide un
modelo que en la realidad no se puede usar.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, log_loss, roc_auc_score
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.preprocessing import StandardScaler

ZONA = ZoneInfo("America/Montevideo")

MIN_INSCRIPCIONES_ETIQUETADAS = 100
FRACCION_ENTRENAMIENTO = 0.75
BINS_CALIBRACION = 5

# Peso del promedio global en las tasas previas, en "inscripciones
# ficticias". Un estudiante que fue a la única tutoría en la que se anotó no
# tiene 100% de asistencia: con k=3 y base 0.55 queda en 0.66.
K_SUAVIZADO = 3

C_REGULARIZACION = 1.0

# Las tutorías que no se dieron o que la persona dejó no tienen asistencia
# que predecir: no suman a la etiqueta ni al cupo ocupado.
ESTADOS_INSCRIPCION_EXCLUIDOS = ("CANCELADA", "ESPERA")
ESTADO_ASISTIO = "ASISTIO"
ESTADO_TUTORIA_CANCELADA = "CANCELADA"
ESTADO_TUTORIA_CERRADA = "CERRADA"

# Probabilidades guardadas en NUMERIC(5,4): con cuatro decimales 0.99996 se
# redondea a 1.0000, y una probabilidad de 1 dice "seguro que va", que el
# modelo nunca puede afirmar.
PROB_MINIMA = 0.0001
PROB_MAXIMA = 0.9999

# (clave, nombre para mostrar). El orden es el de las columnas del modelo.
FEATURES: list[tuple[str, str]] = [
    ("tasa_previa_estudiante", "Asistencia previa del estudiante"),
    ("inscripciones_previas_estudiante", "Inscripciones previas del estudiante"),
    ("tasa_previa_materia", "Asistencia previa en la materia"),
    ("antelacion", "Antelación de la inscripción"),
    ("ocupacion", "Ocupación del cupo"),
    ("tiene_temario", "Dejó temario al inscribirse"),
    ("modalidad_virtual", "Modalidad virtual"),
    ("tipo_individual", "Tutoría individual"),
    ("franja_manana", "Horario de mañana (antes de las 12)"),
    ("franja_noche", "Horario de noche (desde las 18)"),
    ("fin_de_semana", "Cae en fin de semana"),
]
CLAVES = [clave for clave, _ in FEATURES]

# Columnas que se usan para construir las features. `estado` sólo entra como
# etiqueta; `confirmada` ni siquiera se lee.
COLUMNAS_REQUERIDAS = [
    "tutoria_reserva_id",
    "tutoria_id",
    "estudiante_id",
    "materia_id",
    "inicio",
    "fin",
    "cupo",
    "modalidad",
    "tipo",
    "created_at",
    "temario",
    "estado",
]


@dataclass
class ResultadoAcademico:
    """Resumen de un entrenamiento del modelo de asistencia."""

    sample_size: int
    holdout_size: int
    auc: float | None
    brier: float | None
    brier_base: float | None
    params: dict[str, Any]
    predicciones: list[dict[str, Any]] = field(default_factory=list)
    notas: str = ""


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------


def _utc(valores: pd.Series) -> pd.Series:
    return pd.to_datetime(valores, utc=True)


def preparar_inscripciones(inscripciones: pd.DataFrame, ahora: datetime) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Separa las inscripciones con resultado conocido de las que hay que predecir.

    Devuelve (etiquetadas, futuras). Etiquetadas: tutoría terminada antes de
    `ahora`, con `y` = 1 si asistió. Futuras: tutoría que todavía no empezó.
    Las que están en curso no son ninguna de las dos.

    `inscriptos` cuenta las inscripciones vigentes de la tutoría (sin las
    canceladas ni las en espera), que es el cupo realmente ocupado.

    De las pasadas quedan afuera dos casos en los que la etiqueta no dice lo
    que parece:

    - Tutorías sin asistencia registrada (ningún ASISTIO y no CERRADA).
      Marcar "no asistió" y no marcar nada dejan la inscripción igual, en
      AGENDADA; una tutoría grupal donde no hay ni un presente es casi
      siempre una en la que el docente no pasó lista. Contarlas como "nadie
      fue" le enseña al modelo qué docentes toman asistencia, no quién va.
    - Inscripciones cargadas después de que la tutoría terminó. Son cargas
      retroactivas (casi siempre de alguien que fue): nadie las pudo predecir
      y su antelación no significa nada.
    """
    faltan = [c for c in COLUMNAS_REQUERIDAS if c not in inscripciones.columns]
    if faltan:
        raise ValueError(f"Faltan columnas en las inscripciones: {faltan}")

    df = inscripciones.copy()
    df = df[~df["estado"].isin(ESTADOS_INSCRIPCION_EXCLUIDOS)]
    if "tutoria_estado" in df.columns:
        df = df[df["tutoria_estado"] != ESTADO_TUTORIA_CANCELADA]
    df["inicio"] = _utc(df["inicio"])
    df["fin"] = _utc(df["fin"])
    df["created_at"] = _utc(df["created_at"])
    df["inscriptos"] = df.groupby("tutoria_id")["tutoria_reserva_id"].transform("size")

    ahora_ts = pd.Timestamp(ahora)
    ahora_ts = ahora_ts.tz_localize("UTC") if ahora_ts.tzinfo is None else ahora_ts.tz_convert("UTC")

    pasadas = df[df["fin"] < ahora_ts].copy()
    con_presentes = pasadas.loc[pasadas["estado"] == ESTADO_ASISTIO, "tutoria_id"].unique()
    con_asistencia = pasadas["tutoria_id"].isin(con_presentes)
    if "tutoria_estado" in pasadas.columns:
        con_asistencia = con_asistencia | (pasadas["tutoria_estado"] == ESTADO_TUTORIA_CERRADA)
    cargada_antes = pasadas["created_at"].isna() | (pasadas["created_at"] < pasadas["fin"])
    etiquetadas = pasadas[con_asistencia & cargada_antes].copy()
    etiquetadas["y"] = (etiquetadas["estado"] == ESTADO_ASISTIO).astype(int)
    futuras = df[df["inicio"] >= ahora_ts].copy()
    orden = ["inicio", "tutoria_id", "tutoria_reserva_id"]
    return (
        etiquetadas.sort_values(orden).reset_index(drop=True),
        futuras.sort_values(orden).reset_index(drop=True),
    )


def tasas_previas(
    filas: pd.DataFrame,
    historia: pd.DataFrame,
    clave: str,
    base: float,
    corte: pd.Timestamp | None = None,
    k: float = K_SUAVIZADO,
) -> tuple[np.ndarray, np.ndarray]:
    """Tasa de asistencia previa suavizada y cantidad de inscripciones previas.

    Para cada fila cuenta, dentro de `historia` (filas etiquetadas con `y`),
    las del mismo `clave` (estudiante o materia) cuya tutoría terminó
    ESTRICTAMENTE antes de que empezara la de la fila, y antes de `corte` si
    viene. Así una fila nunca ve su propia etiqueta (su tutoría no terminó
    antes de empezar) ni la de tutorías posteriores.

    `corte` simula el momento de la predicción: al predecir hoy una tutoría
    de dentro de dos semanas, lo que pase en el medio todavía no se sabe.

    Devuelve (tasa suavizada, n previas). Tasa = (asistió + k·base) / (n + k):
    sin historia es la base, y con mucha historia pesa la propia.
    """
    n_filas = len(filas)
    n_prev = np.zeros(n_filas, dtype=float)
    asistio_prev = np.zeros(n_filas, dtype=float)
    if n_filas == 0:
        return n_prev, n_prev.copy()

    limite = _utc(filas["inicio"])
    if corte is not None:
        corte_ts = pd.Timestamp(corte)
        corte_ts = corte_ts.tz_localize("UTC") if corte_ts.tzinfo is None else corte_ts.tz_convert("UTC")
        limite = limite.where(limite <= corte_ts, corte_ts)
    limite_ns = limite.map(lambda t: t.value).to_numpy(dtype=np.int64)

    if not historia.empty:
        hist = historia.assign(_fin=_utc(historia["fin"])).sort_values("_fin")
        grupos = {}
        for valor, grupo in hist.groupby(clave, sort=False):
            fines = grupo["_fin"].map(lambda t: t.value).to_numpy(dtype=np.int64)
            acumulado = np.cumsum(grupo["y"].to_numpy(dtype=float))
            grupos[valor] = (fines, acumulado)

        for i, (valor, tope) in enumerate(zip(filas[clave].to_numpy(), limite_ns, strict=True)):
            if valor not in grupos:
                continue
            fines, acumulado = grupos[valor]
            # side="left": cuántos fines son estrictamente menores que el tope.
            j = int(np.searchsorted(fines, tope, side="left"))
            if j > 0:
                n_prev[i] = j
                asistio_prev[i] = acumulado[j - 1]

    tasa = (asistio_prev + k * base) / (n_prev + k)
    return tasa, n_prev


def construir_features(
    filas: pd.DataFrame,
    historia: pd.DataFrame,
    base: float,
    corte: pd.Timestamp | None = None,
) -> pd.DataFrame:
    """Matriz de features (columnas `CLAVES`) para `filas`, usando sólo `historia` para lo previo."""
    inicio = _utc(filas["inicio"])
    local = inicio.dt.tz_convert(ZONA)
    hora = local.dt.hour + local.dt.minute / 60.0

    tasa_est, n_est = tasas_previas(filas, historia, "estudiante_id", base, corte)
    tasa_mat, _ = tasas_previas(filas, historia, "materia_id", base, corte)

    # Inscripciones hechas después de que empezó la tutoría (cargas tardías o
    # datos importados) cuentan como antelación cero, no negativa.
    horas_antes = (inicio - _utc(filas["created_at"])).dt.total_seconds() / 3600.0
    antelacion = np.log1p(horas_antes.fillna(0).clip(lower=0).to_numpy(dtype=float))

    cupo = pd.to_numeric(filas["cupo"], errors="coerce").to_numpy(dtype=float)
    inscriptos = pd.to_numeric(filas["inscriptos"], errors="coerce").fillna(0).to_numpy(dtype=float)
    ocupacion = np.where(cupo > 0, inscriptos / np.where(cupo > 0, cupo, 1.0), 1.0)

    temario = filas["temario"].fillna("").astype(str).str.strip() != ""

    x = pd.DataFrame(
        {
            "tasa_previa_estudiante": tasa_est,
            "inscripciones_previas_estudiante": np.log1p(n_est),
            "tasa_previa_materia": tasa_mat,
            "antelacion": antelacion,
            "ocupacion": ocupacion,
            "tiene_temario": temario.to_numpy(dtype=float),
            "modalidad_virtual": (filas["modalidad"] == "VIRTUAL").to_numpy(dtype=float),
            "tipo_individual": (filas["tipo"] == "INDIVIDUAL").to_numpy(dtype=float),
            "franja_manana": (hora < 12).to_numpy(dtype=float),
            "franja_noche": (hora >= 18).to_numpy(dtype=float),
            "fin_de_semana": (local.dt.dayofweek >= 5).to_numpy(dtype=float),
        },
        index=filas.index,
    )
    return x[CLAVES]


# ---------------------------------------------------------------------------
# Validación y métricas
# ---------------------------------------------------------------------------


def dividir_temporal(
    etiquetadas: pd.DataFrame, fraccion: float = FRACCION_ENTRENAMIENTO
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Timestamp]:
    """75% más antiguo para entrenar, 25% más reciente para evaluar.

    El corte cae en un instante de inicio y no en una fila: las inscripciones
    de una misma tutoría (o de tutorías simultáneas) quedan todas del mismo
    lado. Si no, el modelo entrenaría con la mitad de los inscriptos de una
    tutoría y se evaluaría con la otra mitad.
    """
    ordenadas = etiquetadas.sort_values("inicio").reset_index(drop=True)
    n = len(ordenadas)
    inicios = _utc(ordenadas["inicio"])
    corte = inicios.iloc[min(int(n * fraccion), n - 1)]
    entrenamiento = ordenadas[inicios < corte]
    evaluacion = ordenadas[inicios >= corte]
    if entrenamiento.empty:
        raise ValueError("Todas las tutorías etiquetadas empiezan en el mismo momento: no hay pasado con qué validar.")
    return entrenamiento.reset_index(drop=True), evaluacion.reset_index(drop=True), corte


def calibracion(y: np.ndarray, p: np.ndarray, bins: int = BINS_CALIBRACION) -> list[dict[str, Any]]:
    """Predicho medio vs. real por tramo de probabilidad.

    Si en el tramo 0.6-0.8 el modelo predijo 0.7 y fue el 70%, está bien
    calibrado. Los tramos vacíos quedan con n=0 y valores null, para que el
    gráfico muestre los cinco siempre en el mismo lugar.
    """
    y = np.asarray(y, dtype=float)
    p = np.asarray(p, dtype=float)
    idx = np.minimum((p * bins).astype(int), bins - 1)
    idx = np.maximum(idx, 0)
    resultado = []
    for b in range(bins):
        mascara = idx == b
        n = int(mascara.sum())
        resultado.append(
            {
                "desde": round(b / bins, 2),
                "hasta": round((b + 1) / bins, 2),
                "predicho": round(float(p[mascara].mean()), 4) if n else None,
                "real": round(float(y[mascara].mean()), 4) if n else None,
                "n": n,
            }
        )
    return resultado


def metricas(y: np.ndarray, p: np.ndarray, tasa_entrenamiento: float) -> dict[str, Any]:
    """AUC, Brier (modelo y línea base), log loss, exactitud @0.5 y calibración.

    La línea base predice siempre la tasa de entrenamiento: si el Brier del
    modelo no le gana, el modelo no sabe nada que no sepa un promedio.
    El AUC queda null si la evaluación tiene una sola clase (no está definido).
    """
    y = np.asarray(y, dtype=int)
    p = np.clip(np.asarray(p, dtype=float), 1e-6, 1 - 1e-6)
    auc = float(roc_auc_score(y, p)) if len(np.unique(y)) == 2 else None
    return {
        "auc": None if auc is None else round(auc, 4),
        "brier": round(float(brier_score_loss(y, p)), 4),
        "brier_base": round(float(np.mean((y - tasa_entrenamiento) ** 2)), 4),
        "log_loss": round(float(log_loss(y, p, labels=[0, 1])), 4),
        "exactitud": round(float(np.mean((p >= 0.5).astype(int) == y)), 4),
        "calibracion": calibracion(y, p),
    }


def historico_semanal(filas: pd.DataFrame, y: np.ndarray, p: np.ndarray) -> list[dict[str, Any]]:
    """Inscriptos, asistentes y esperados (suma de probabilidades) por semana, lunes a domingo."""
    if len(filas) == 0:
        return []
    fecha_local = _utc(filas["inicio"]).dt.tz_convert(ZONA).dt.tz_localize(None).dt.normalize()
    lunes = fecha_local - pd.to_timedelta(fecha_local.dt.dayofweek, unit="D")
    tabla = pd.DataFrame({"semana": lunes.to_numpy(), "y": np.asarray(y, dtype=float), "p": np.asarray(p, dtype=float)})
    agrupado = tabla.groupby("semana").agg(inscriptos=("y", "size"), asistieron=("y", "sum"), esperados=("p", "sum"))
    return [
        {
            "semana": pd.Timestamp(semana).date().isoformat(),
            "inscriptos": int(fila.inscriptos),
            "asistieron": int(fila.asistieron),
            "esperados": round(float(fila.esperados), 2),
        }
        for semana, fila in agrupado.sort_index().iterrows()
    ]


def _modelo() -> Pipeline:
    # Estandarizar hace comparables los coeficientes (un odds ratio "por
    # desvío estándar" en todas las features) y que la penalización L2 no
    # castigue más a la que casualmente tiene números grandes.
    return make_pipeline(StandardScaler(), LogisticRegression(C=C_REGULARIZACION, max_iter=1000))


def _ajustar(x: pd.DataFrame, y: np.ndarray) -> Pipeline:
    if len(np.unique(y)) < 2:
        raise ValueError(
            "Todas las inscripciones de entrenamiento tienen el mismo resultado: no hay nada que aprender."
        )
    modelo = _modelo()
    modelo.fit(x.to_numpy(dtype=float), y)
    return modelo


def factores(modelo: Pipeline) -> list[dict[str, Any]]:
    """Odds ratio por +1 desvío estándar de cada feature, del más al menos influyente.

    Como las features entran estandarizadas, exp(coef) es cuánto se
    multiplican las chances de asistir cuando la feature sube un desvío. Una
    feature constante (p. ej. todas las tutorías a la misma hora) queda con
    coeficiente 0 y odds ratio 1: no influye porque no varía.
    """
    coef = modelo.named_steps["logisticregression"].coef_[0]
    lista = [
        {"clave": clave, "nombre": nombre, "odds_ratio": round(float(np.exp(c)), 4), "coef": round(float(c), 4)}
        for (clave, nombre), c in zip(FEATURES, coef, strict=True)
    ]
    return sorted(lista, key=lambda f: abs(f["coef"]), reverse=True)


# ---------------------------------------------------------------------------
# Entrenamiento completo
# ---------------------------------------------------------------------------


def entrenar_y_predecir_asistencia(inscripciones: pd.DataFrame, *, ahora: datetime) -> ResultadoAcademico:
    """Valida en el 25% más reciente, reentrena con todo y predice las tutorías futuras."""
    etiquetadas, futuras = preparar_inscripciones(inscripciones, ahora)
    n = len(etiquetadas)
    if n < MIN_INSCRIPCIONES_ETIQUETADAS:
        raise ValueError(
            f"Inscripciones con asistencia conocida insuficientes: {n}, se requieren al menos "
            f"{MIN_INSCRIPCIONES_ETIQUETADAS}."
        )

    # Validación temporal.
    entrenamiento, evaluacion, corte = dividir_temporal(etiquetadas)
    tasa_train = float(entrenamiento["y"].mean())
    x_train = construir_features(entrenamiento, entrenamiento, tasa_train)
    x_eval = construir_features(evaluacion, entrenamiento, tasa_train, corte=corte)
    modelo_val = _ajustar(x_train, entrenamiento["y"].to_numpy())
    p_eval = modelo_val.predict_proba(x_eval.to_numpy(dtype=float))[:, 1]
    y_eval = evaluacion["y"].to_numpy()
    resultado_val = metricas(y_eval, p_eval, tasa_train)

    # Modelo final con todas las etiquetadas.
    tasa_base = float(etiquetadas["y"].mean())
    x_todo = construir_features(etiquetadas, etiquetadas, tasa_base)
    modelo = _ajustar(x_todo, etiquetadas["y"].to_numpy())

    predicciones: list[dict[str, Any]] = []
    if not futuras.empty:
        x_fut = construir_features(futuras, etiquetadas, tasa_base, corte=pd.Timestamp(ahora))
        p_fut = np.clip(modelo.predict_proba(x_fut.to_numpy(dtype=float))[:, 1], PROB_MINIMA, PROB_MAXIMA)
        predicciones = [
            {
                "tutoria_id": int(fila.tutoria_id),
                "tutoria_reserva_id": int(fila.tutoria_reserva_id),
                "probabilidad": round(float(p), 4),
            }
            for fila, p in zip(futuras.itertuples(index=False), p_fut, strict=True)
        ]

    fechas_eval = _utc(evaluacion["inicio"]).dt.tz_convert(ZONA)
    fechas_todo = _utc(etiquetadas["inicio"]).dt.tz_convert(ZONA)
    params = {
        "muestras": n,
        "entrenamiento": {
            "desde": fechas_todo.min().date().isoformat(),
            "hasta": fechas_todo.max().date().isoformat(),
        },
        "validacion": {
            "desde": fechas_eval.min().date().isoformat(),
            "hasta": fechas_eval.max().date().isoformat(),
            "n": len(evaluacion),
            "n_entrenamiento": len(entrenamiento),
        },
        "tasa_base": round(tasa_base, 4),
        "tasa_entrenamiento_validacion": round(tasa_train, 4),
        "auc": resultado_val["auc"],
        "brier": resultado_val["brier"],
        "brier_base": resultado_val["brier_base"],
        "log_loss": resultado_val["log_loss"],
        "exactitud": resultado_val["exactitud"],
        "calibracion": resultado_val["calibracion"],
        "factores": factores(modelo),
        "historico_semanal": historico_semanal(evaluacion, y_eval, p_eval),
        "c": C_REGULARIZACION,
        "k_suavizado": K_SUAVIZADO,
        "fraccion_entrenamiento": FRACCION_ENTRENAMIENTO,
        "futuras": {
            "tutorias": int(futuras["tutoria_id"].nunique()) if not futuras.empty else 0,
            "inscripciones": len(futuras),
        },
    }
    notas = (
        f"Regresión logística sobre {n} inscripciones de tutorías pasadas "
        f"({params['entrenamiento']['desde']} → {params['entrenamiento']['hasta']}). "
        f"Validación temporal: {len(evaluacion)} inscripciones más recientes "
        f"({params['validacion']['desde']} → {params['validacion']['hasta']})."
    )
    return ResultadoAcademico(
        sample_size=n,
        holdout_size=len(evaluacion),
        auc=resultado_val["auc"],
        brier=resultado_val["brier"],
        brier_base=resultado_val["brier_base"],
        params=params,
        predicciones=predicciones,
        notas=notas,
    )
