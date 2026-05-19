"""Acceso a la base de datos compartida con el backend Spring Boot."""

import json
import os
from datetime import date
from typing import Iterable

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine


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


def desactivar_modelos_previos(scope: str, espacio_id: int | None) -> None:
    """Marca como inactivos los modelos previos del mismo ámbito.

    Garantiza que sólo haya un modelo activo por scope para que las queries
    de lectura del backend Spring siempre tomen el último entrenamiento.
    """
    with _engine.begin() as conn:
        conn.execute(
            text(
                """
                UPDATE modelo_forecast
                   SET activo = FALSE
                 WHERE scope = :scope
                   AND COALESCE(espacio_id, -1) = COALESCE(:espacio_id, -1)
                   AND activo = TRUE
                """
            ),
            {"scope": scope, "espacio_id": espacio_id},
        )


def guardar_modelo(
    scope: str,
    espacio_id: int | None,
    sample_size: int,
    holdout_size: int,
    mape: float | None,
    mae: float | None,
    params: dict,
    notas: str,
) -> int:
    """Persiste los metadatos del modelo y devuelve su id."""
    with _engine.begin() as conn:
        row = conn.execute(
            text(
                """
                INSERT INTO modelo_forecast (
                    scope, espacio_id, algoritmo, sample_size, holdout_size,
                    mape, mae, params_json, notas, activo
                ) VALUES (
                    :scope, :espacio_id, 'prophet', :sample_size, :holdout_size,
                    :mape, :mae, :params_json, :notas, TRUE
                )
                RETURNING id
                """
            ),
            {
                "scope": scope,
                "espacio_id": espacio_id,
                "sample_size": sample_size,
                "holdout_size": holdout_size,
                "mape": mape,
                "mae": mae,
                "params_json": json.dumps(params),
                "notas": notas,
            },
        ).fetchone()
        return int(row[0])


def guardar_predicciones(
    modelo_id: int,
    espacio_id: int | None,
    predicciones: Iterable[dict],
) -> int:
    """Inserta las predicciones generadas. Devuelve cuántas filas insertó.

    Cada predicción es un dict con `fecha_objetivo`, `prediccion`,
    `banda_inferior`, `banda_superior`.
    """
    rows = list(predicciones)
    if not rows:
        return 0
    with _engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO prediccion_reserva (
                    modelo_id, fecha_objetivo, espacio_id,
                    prediccion, banda_inferior, banda_superior
                ) VALUES (
                    :modelo_id, :fecha_objetivo, :espacio_id,
                    :prediccion, :banda_inferior, :banda_superior
                )
                """
            ),
            [
                {
                    "modelo_id": modelo_id,
                    "fecha_objetivo": r["fecha_objetivo"],
                    "espacio_id": espacio_id,
                    "prediccion": float(r["prediccion"]),
                    "banda_inferior": float(r["banda_inferior"]) if r.get("banda_inferior") is not None else None,
                    "banda_superior": float(r["banda_superior"]) if r.get("banda_superior") is not None else None,
                }
                for r in rows
            ],
        )
    return len(rows)


def ultima_fecha_historico() -> date | None:
    with _engine.connect() as conn:
        row = conn.execute(text("SELECT MAX(fecha) FROM hechos_reserva_diario")).fetchone()
    return row[0] if row and row[0] else None
