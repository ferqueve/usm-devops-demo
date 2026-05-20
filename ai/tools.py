"""Tools de solo lectura que el chatbot puede invocar.

El usuario_id que reciben las tools NUNCA viene del prompt: lo inyecta el
backend Spring desde el JWT autenticado y se pasa como contexto al agente.
Las tools lo leen del contextvar correspondiente.
"""

from __future__ import annotations

import logging
from contextvars import ContextVar
from datetime import date, datetime, time
from typing import Any

from langchain_core.tools import tool
from sqlalchemy import text

from db import buscar_espacios_similares, get_engine
from llm import get_embeddings

log = logging.getLogger("ai-svc.tools")


# Contexto de invocación: el endpoint /chat lo setea antes de correr el agente.
_current_usuario_id: ContextVar[int | None] = ContextVar(
    "current_usuario_id", default=None
)


def set_usuario_actual(usuario_id: int | None) -> None:
    _current_usuario_id.set(usuario_id)


def _usuario_actual_o_error() -> int:
    uid = _current_usuario_id.get()
    if uid is None:
        raise ValueError("Sesión no identificada: el backend debe inyectar usuario_id.")
    return uid


@tool
def buscar_mis_reservas(desde: str, hasta: str) -> list[dict[str, Any]]:
    """Devuelve las reservas del usuario autenticado entre dos fechas (formato YYYY-MM-DD).

    Útil cuando el usuario pregunta cosas como "¿qué reservas tengo el viernes?",
    "mis reservas de la semana que viene" o similar. Sólo trae reservas del
    usuario logueado, nunca de otros.
    """
    usuario_id = _usuario_actual_o_error()
    fecha_desde = date.fromisoformat(desde)
    fecha_hasta = date.fromisoformat(hasta)
    sql = text(
        """
        SELECT r.id,
               r.fecha_inicio,
               r.fecha_fin,
               r.estado,
               r.motivo,
               e.nombre AS espacio_nombre
          FROM reserva r
          LEFT JOIN espacio e ON e.id = r.espacio_id
         WHERE r.usuario_id = :uid
           AND r.fecha_inicio::date BETWEEN :desde AND :hasta
         ORDER BY r.fecha_inicio
         LIMIT 50
        """
    )
    with get_engine().connect() as conn:
        rows = conn.execute(
            sql,
            {"uid": usuario_id, "desde": fecha_desde, "hasta": fecha_hasta},
        ).mappings().all()
    return [
        {
            "id": r["id"],
            "fecha_inicio": str(r["fecha_inicio"]),
            "fecha_fin": str(r["fecha_fin"]),
            "estado": r["estado"],
            "motivo": r["motivo"],
            "espacio": r["espacio_nombre"],
        }
        for r in rows
    ]


@tool
def buscar_espacios_disponibles(
    fecha: str,
    hora_inicio: str,
    hora_fin: str,
    capacidad_min: int = 1,
) -> list[dict[str, Any]]:
    """Devuelve espacios libres en un slot dado.

    fecha en YYYY-MM-DD, horas en HH:MM. Trae hasta 10 espacios con capacidad
    >= capacidad_min que no tengan reserva confirmada superpuesta. Útil para
    "buscame un salón para 30 personas el viernes a las 14".
    """
    fecha_obj = date.fromisoformat(fecha)
    inicio = datetime.combine(fecha_obj, time.fromisoformat(hora_inicio))
    fin = datetime.combine(fecha_obj, time.fromisoformat(hora_fin))
    sql = text(
        """
        SELECT e.id, e.nombre, e.capacidad, te.nombre AS tipo
          FROM espacio e
          LEFT JOIN tipo_espacio te ON te.id = e.tipo_espacio_id
         WHERE e.deleted_at IS NULL
           AND e.estado = 'DISPONIBLE'
           AND e.capacidad >= :cap
           AND NOT EXISTS (
                SELECT 1 FROM reserva r
                 WHERE r.espacio_id = e.id
                   AND r.estado = 'APROBADO'
                   AND r.fecha_inicio < :fin
                   AND r.fecha_fin    > :inicio
           )
         ORDER BY e.capacidad
         LIMIT 10
        """
    )
    with get_engine().connect() as conn:
        rows = conn.execute(
            sql, {"cap": capacidad_min, "inicio": inicio, "fin": fin}
        ).mappings().all()
    return [dict(r) for r in rows]


@tool
def obtener_estadistica_global(tipo: str = "ocupacion", dias: int = 30) -> dict[str, Any]:
    """Devuelve una estadística agregada del sistema.

    Tipos válidos:
    - "ocupacion": reservas aprobadas vs total en los últimos N días.
    - "top_espacios": top 5 espacios por cantidad de reservas.
    - "por_carrera": cantidad de reservas por carrera.

    dias controla la ventana temporal (default 30).
    """
    if tipo == "ocupacion":
        sql = text(
            """
            SELECT SUM(CASE WHEN estado = 'APROBADO' THEN cant_reservas ELSE 0 END) AS aprobadas,
                   SUM(cant_reservas) AS total
              FROM hechos_reserva_diario
             WHERE fecha >= CURRENT_DATE - :dias
            """
        )
        with get_engine().connect() as conn:
            row = conn.execute(sql, {"dias": dias}).mappings().first()
        aprob = row["aprobadas"] or 0
        total = row["total"] or 0
        return {
            "aprobadas": aprob,
            "total": total,
            "porcentaje": round(100 * aprob / total, 2) if total else 0,
            "ventana_dias": dias,
        }

    if tipo == "top_espacios":
        sql = text(
            """
            SELECT espacio_id, SUM(cant_reservas) AS cant
              FROM hechos_reserva_diario
             WHERE fecha >= CURRENT_DATE - :dias
               AND estado = 'APROBADO'
             GROUP BY espacio_id
             ORDER BY cant DESC
             LIMIT 5
            """
        )
        with get_engine().connect() as conn:
            rows = conn.execute(sql, {"dias": dias}).mappings().all()
        return {"top_espacios": [dict(r) for r in rows], "ventana_dias": dias}

    if tipo == "por_carrera":
        sql = text(
            """
            SELECT carrera_id, SUM(cant_reservas) AS cant
              FROM hechos_reserva_diario
             WHERE fecha >= CURRENT_DATE - :dias
               AND estado = 'APROBADO'
               AND carrera_id IS NOT NULL
             GROUP BY carrera_id
             ORDER BY cant DESC
            """
        )
        with get_engine().connect() as conn:
            rows = conn.execute(sql, {"dias": dias}).mappings().all()
        return {"por_carrera": [dict(r) for r in rows], "ventana_dias": dias}

    raise ValueError(
        "Tipo inválido. Usar 'ocupacion', 'top_espacios' o 'por_carrera'."
    )


@tool
def buscar_espacio_semantico(query: str, top: int = 5) -> list[dict[str, Any]]:
    """Búsqueda semántica de espacios en lenguaje natural.

    Útil cuando el usuario describe lo que necesita sin nombrarlo exacto, por
    ejemplo "salón grande con proyector para taller". Devuelve los top espacios
    rankeados por similitud coseno contra los embeddings indexados.
    """
    vector = get_embeddings().embed_query(query)
    return buscar_espacios_similares(vector, top=top)


TOOLS = [
    buscar_mis_reservas,
    buscar_espacios_disponibles,
    obtener_estadistica_global,
    buscar_espacio_semantico,
]
