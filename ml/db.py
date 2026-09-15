"""Acceso a la base de datos compartida con el backend Spring Boot."""

import json
import math
import os
from collections.abc import Iterable, Iterator
from contextlib import contextmanager
from datetime import date

import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection, Engine


def _build_url() -> str:
    """Construye la URL de conexión a Postgres.

    Acepta `DATABASE_URL` (formato Railway/Heroku) o las variables sueltas
    `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
    """
    raw = os.getenv("DATABASE_URL")
    if raw:
        # Railway entrega 'postgres://...' pero SQLAlchemy quiere 'postgresql://'.
        if raw.startswith("postgres://"):
            raw = raw.replace("postgres://", "postgresql://", 1)
        return raw

    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "utec_db")
    user = os.getenv("DB_USER", "ut_user")
    password = os.getenv("DB_PASSWORD", "")
    return f"postgresql://{user}:{password}@{host}:{port}/{name}"


_engine: Engine = create_engine(_build_url(), pool_pre_ping=True)


@contextmanager
def transaccion() -> Iterator[Connection]:
    """Una transacción para desactivar el modelo anterior y guardar el nuevo con sus predicciones.

    Si algo falla a mitad de camino (una predicción que no entra en la
    columna, se cae la conexión) no queda el ámbito sin modelo activo ni un
    modelo activo sin predicciones: vuelve todo atrás y sigue valiendo el
    anterior.
    """
    with _engine.begin() as conn:
        yield conn


# ---------------------------------------------------------------------------
# Lecturas
# ---------------------------------------------------------------------------


def cargar_historico_global() -> pd.DataFrame:
    """Lee la demanda agregada por día desde la tabla de hechos.

    Devuelve un DataFrame con las columnas que Prophet espera (`ds`, `y`).
    Sólo cuenta reservas APROBADAS porque es la señal de demanda real
    confirmada, no de solicitudes que pudieron rechazarse.
    """
    query = text(
        """
        SELECT fecha::date AS ds,
               SUM(cant_reservas)::int AS y
        FROM hechos_reserva_diario
        WHERE estado = 'APROBADO'
        GROUP BY fecha
        ORDER BY fecha
        """
    )
    with _engine.connect() as conn:
        df = pd.read_sql(query, conn)
    df["ds"] = pd.to_datetime(df["ds"])
    return df


def cargar_tipos_espacio() -> list[dict]:
    """Tipos de espacio vigentes, con id y nombre."""
    query = text(
        """
        SELECT id, nombre
        FROM tipo_espacio
        WHERE deleted_at IS NULL
        ORDER BY id
        """
    )
    with _engine.connect() as conn:
        return [{"id": int(r.id), "nombre": r.nombre} for r in conn.execute(query)]


def cargar_historico_por_tipo_espacio() -> pd.DataFrame:
    """Reservas APROBADAS por día y tipo de espacio (`tipo_espacio_id`, `ds`, `y`).

    Cuenta también los espacios dados de baja: mientras existieron, esa
    demanda fue real y es parte de la historia del tipo.
    """
    query = text(
        """
        SELECT e.tipo_espacio_id,
               h.fecha::date AS ds,
               SUM(h.cant_reservas)::int AS y
        FROM hechos_reserva_diario h
        JOIN espacio e ON e.id = h.espacio_id
        WHERE h.estado = 'APROBADO'
          AND e.tipo_espacio_id IS NOT NULL
        GROUP BY e.tipo_espacio_id, h.fecha
        ORDER BY e.tipo_espacio_id, h.fecha
        """
    )
    with _engine.connect() as conn:
        df = pd.read_sql(query, conn)
    df["ds"] = pd.to_datetime(df["ds"])
    return df


def cargar_tipos_elemento() -> dict[int, str]:
    """Tipos de elemento vigentes (id → nombre)."""
    query = text(
        """
        SELECT id, nombre
        FROM tipo_elemento
        WHERE deleted_at IS NULL
          AND COALESCE(activo, TRUE)
        ORDER BY id
        """
    )
    with _engine.connect() as conn:
        return {int(r.id): r.nombre for r in conn.execute(query)}


def cargar_solicitudes_equipo() -> pd.DataFrame:
    """Equipamiento pedido en reservas, con el intervalo en que se usa.

    Quedan afuera las solicitudes borradas o RECHAZADAS y las de reservas
    CANCELADAS: ninguna saca un equipo del depósito. Las PENDIENTES cuentan,
    porque son demanda que alguien pidió aunque todavía no se resolvió.
    """
    query = text(
        """
        SELECT ris.tipo_elemento_id,
               r.inicio,
               r.fin,
               ris.cantidad_solicitada AS cantidad
        FROM reserva_item_solicitado ris
        JOIN reserva r ON r.id = ris.reserva_id
        WHERE ris.deleted_at IS NULL
          AND ris.estado <> 'RECHAZADO'
          AND r.estado <> 'CANCELADO'
          AND r.inicio IS NOT NULL
        """
    )
    with _engine.connect() as conn:
        return pd.read_sql(query, conn)


def cargar_inscripciones_tutorias() -> pd.DataFrame:
    """Inscripciones a tutorías con los datos de la tutoría que usa el modelo de asistencia.

    `confirmada` NO se lee a propósito: vale true exactamente en las que
    asistieron, y cualquier cosa que la use aprende la etiqueta. `estado`
    sólo se usa como etiqueta de las tutorías ya terminadas.
    """
    query = text(
        """
        SELECT tr.id AS tutoria_reserva_id,
               tr.tutoria_id,
               tr.estudiante_id,
               tr.estado,
               tr.created_at,
               tr.temario,
               t.materia_id,
               t.inicio,
               t.fin,
               t.cupo,
               t.modalidad,
               t.tipo,
               t.estado AS tutoria_estado
        FROM tutoria_reserva tr
        JOIN tutoria t ON t.id = tr.tutoria_id
        WHERE tr.deleted_at IS NULL
          AND t.deleted_at IS NULL
        """
    )
    with _engine.connect() as conn:
        return pd.read_sql(query, conn)


def ultima_fecha_historico() -> date | None:
    with _engine.connect() as conn:
        row = conn.execute(text("SELECT MAX(fecha) FROM hechos_reserva_diario")).fetchone()
    return row[0] if row and row[0] else None


# ---------------------------------------------------------------------------
# Escrituras (todas dentro de una `transaccion()`)
# ---------------------------------------------------------------------------


def _json_limpio(valor):
    """Deja los params listos para JSON estándar.

    `json.dumps` escribe NaN tal cual, que no es JSON válido y el backend no
    lo puede parsear; y no sabe serializar los enteros de numpy.
    """
    if isinstance(valor, dict):
        return {str(k): _json_limpio(v) for k, v in valor.items()}
    if isinstance(valor, (list, tuple)):
        return [_json_limpio(v) for v in valor]
    if isinstance(valor, np.generic):
        valor = valor.item()
    if isinstance(valor, float) and not math.isfinite(valor):
        return None
    return valor


def desactivar_modelos_previos(
    conn: Connection,
    scope: str,
    espacio_id: int | None = None,
    tipo_espacio_id: int | None = None,
) -> None:
    """Marca como inactivos los modelos previos del mismo ámbito.

    Garantiza que sólo haya un modelo activo por (scope, espacio,
    tipo de espacio) para que las queries de lectura del backend Spring
    siempre tomen el último entrenamiento. Sin el tipo de espacio en la
    condición, entrenar "Aula" apagaría el modelo de "Laboratorio".
    """
    conn.execute(
        text(
            """
            UPDATE modelo_forecast
               SET activo = FALSE
             WHERE scope = :scope
               AND COALESCE(espacio_id, -1) = COALESCE(:espacio_id, -1)
               AND COALESCE(tipo_espacio_id, -1) = COALESCE(:tipo_espacio_id, -1)
               AND activo = TRUE
            """
        ),
        {"scope": scope, "espacio_id": espacio_id, "tipo_espacio_id": tipo_espacio_id},
    )


def guardar_modelo(
    conn: Connection,
    *,
    scope: str,
    algoritmo: str,
    sample_size: int,
    holdout_size: int,
    mape: float | None,
    mae: float | None,
    params: dict,
    notas: str,
    espacio_id: int | None = None,
    tipo_espacio_id: int | None = None,
) -> int:
    """Persiste los metadatos del modelo y devuelve su id."""
    # `mape` es NUMERIC(6,2). En un tipo de espacio con días de una sola
    # reserva el MAPE puede pasar el 10.000% (predecir 150 donde hubo 1) y el
    # INSERT fallaría por desborde, perdiendo el modelo por una métrica que ni
    # siquiera es la que se muestra (es el WAPE).
    if mape is not None:
        mape = None if not math.isfinite(mape) else min(float(mape), 9999.99)
    row = conn.execute(
        text(
            """
            INSERT INTO modelo_forecast (
                scope, espacio_id, tipo_espacio_id, algoritmo, sample_size, holdout_size,
                mape, mae, params_json, notas, activo
            ) VALUES (
                :scope, :espacio_id, :tipo_espacio_id, :algoritmo, :sample_size, :holdout_size,
                :mape, :mae, :params_json, :notas, TRUE
            )
            RETURNING id
            """
        ),
        {
            "scope": scope,
            "espacio_id": espacio_id,
            "tipo_espacio_id": tipo_espacio_id,
            "algoritmo": algoritmo,
            "sample_size": int(sample_size),
            "holdout_size": int(holdout_size),
            "mape": mape,
            "mae": mae,
            "params_json": json.dumps(_json_limpio(params), ensure_ascii=False, allow_nan=False),
            "notas": notas,
        },
    ).fetchone()
    return int(row[0])


def guardar_predicciones(
    conn: Connection,
    modelo_id: int,
    predicciones: Iterable[dict],
    espacio_id: int | None = None,
    tipo_espacio_id: int | None = None,
) -> int:
    """Inserta predicciones de reservas. Devuelve cuántas filas insertó.

    Cada predicción es un dict con `fecha_objetivo`, `prediccion`,
    `banda_inferior`, `banda_superior`.
    """
    rows = list(predicciones)
    if not rows:
        return 0
    conn.execute(
        text(
            """
            INSERT INTO prediccion_reserva (
                modelo_id, fecha_objetivo, espacio_id, tipo_espacio_id,
                prediccion, banda_inferior, banda_superior
            ) VALUES (
                :modelo_id, :fecha_objetivo, :espacio_id, :tipo_espacio_id,
                :prediccion, :banda_inferior, :banda_superior
            )
            """
        ),
        [
            {
                "modelo_id": modelo_id,
                "fecha_objetivo": r["fecha_objetivo"],
                "espacio_id": espacio_id,
                "tipo_espacio_id": tipo_espacio_id,
                "prediccion": float(r["prediccion"]),
                "banda_inferior": float(r["banda_inferior"]) if r.get("banda_inferior") is not None else None,
                "banda_superior": float(r["banda_superior"]) if r.get("banda_superior") is not None else None,
            }
            for r in rows
        ],
    )
    return len(rows)


def guardar_predicciones_equipo(conn: Connection, modelo_id: int, predicciones: Iterable[dict]) -> int:
    """Inserta el pico esperado por tipo de elemento y día. Devuelve cuántas filas insertó."""
    rows = list(predicciones)
    if not rows:
        return 0
    conn.execute(
        text(
            """
            INSERT INTO prediccion_demanda_equipo (
                modelo_id, tipo_elemento_id, fecha_objetivo,
                prediccion, banda_inferior, banda_superior, comprometidas
            ) VALUES (
                :modelo_id, :tipo_elemento_id, :fecha_objetivo,
                :prediccion, :banda_inferior, :banda_superior, :comprometidas
            )
            """
        ),
        [
            {
                "modelo_id": modelo_id,
                "tipo_elemento_id": int(r["tipo_elemento_id"]),
                "fecha_objetivo": r["fecha_objetivo"],
                "prediccion": float(r["prediccion"]),
                "banda_inferior": float(r["banda_inferior"]),
                "banda_superior": float(r["banda_superior"]),
                "comprometidas": int(r["comprometidas"]),
            }
            for r in rows
        ],
    )
    return len(rows)


def guardar_predicciones_asistencia(conn: Connection, modelo_id: int, predicciones: Iterable[dict]) -> int:
    """Inserta la probabilidad de asistencia de cada inscripción futura. Devuelve cuántas filas insertó."""
    rows = list(predicciones)
    if not rows:
        return 0
    conn.execute(
        text(
            """
            INSERT INTO prediccion_asistencia (
                modelo_id, tutoria_id, tutoria_reserva_id, probabilidad
            ) VALUES (
                :modelo_id, :tutoria_id, :tutoria_reserva_id, :probabilidad
            )
            """
        ),
        [
            {
                "modelo_id": modelo_id,
                "tutoria_id": int(r["tutoria_id"]),
                "tutoria_reserva_id": int(r["tutoria_reserva_id"]),
                "probabilidad": float(r["probabilidad"]),
            }
            for r in rows
        ],
    )
    return len(rows)
