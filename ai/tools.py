"""Tools de solo lectura que el chatbot puede invocar.

El usuario_id y el rol que reciben las tools NUNCA vienen del prompt: los
inyecta el backend Spring desde el JWT autenticado y se pasan como contexto
al agente. Las tools los leen del contextvar correspondiente.

Cualquier tool sensible (consultas globales, inventario, mantenimiento) valida
el rol antes de ejecutar la query.
"""

from __future__ import annotations

import logging
from contextvars import ContextVar
from datetime import date, datetime, time
from typing import Any

from langchain_core.tools import ToolException, tool
from sqlalchemy import text

from db import buscar_espacios_similares, get_engine
from llm import get_embeddings

log = logging.getLogger("ai-svc.tools")


# Contexto de invocación: el endpoint /chat lo setea antes de correr el agente.
_current_usuario_id: ContextVar[int | None] = ContextVar(
    "current_usuario_id", default=None
)
_current_rol: ContextVar[str | None] = ContextVar("current_rol", default=None)


def set_usuario_actual(usuario_id: int | None, rol: str | None = None) -> None:
    _current_usuario_id.set(usuario_id)
    _current_rol.set(rol)


def _usuario_actual_o_error() -> int:
    uid = _current_usuario_id.get()
    if uid is None:
        raise ValueError("Sesión no identificada: el backend debe inyectar usuario_id.")
    return uid


def _requiere_rol(roles_permitidos: set[str]) -> None:
    """Raise ToolException si el rol actual no está autorizado.

    Usamos ToolException (no PermissionError) para que LangChain la pase como
    observación al LLM y éste pueda explicarle al usuario que falta permiso,
    en vez de propagar la excepción y romper el chat.
    """
    rol = _current_rol.get()
    if rol not in roles_permitidos:
        raise ToolException(
            f"Permiso denegado: esta consulta requiere alguno de los roles "
            f"{sorted(roles_permitidos)}; tu rol es {rol or 'desconocido'}."
        )


# Vocabulario relativo que algunos modelos open-weight (Llama, gpt-oss) suelen
# pasar como string en vez de resolver primero a fecha concreta. Lo aceptamos
# para que la herramienta no falle por culpa de un mal encadenamiento del LLM.
_RELATIVE_TODAY = {
    "hoy", "today", "fecha_de_hoy", "fecha_hoy", "ahora", "now",
    "current_date", "current", "actual",
}
_RELATIVE_TOMORROW = {"mañana", "manana", "tomorrow", "fecha_de_mañana", "fecha_de_manana"}
_RELATIVE_YESTERDAY = {"ayer", "yesterday", "fecha_de_ayer"}


def _parse_fecha_tolerante(valor: str | None, default_today: bool = True) -> date:
    """Parsea una fecha en YYYY-MM-DD o un alias relativo común.

    Si `valor` es None o vacío y `default_today=True`, devuelve hoy.
    Si es un alias conocido ('hoy', 'mañana', etc.), lo resuelve.
    Si es ISO, lo parsea. En cualquier otro caso lanza ValueError.
    """
    if not valor:
        if default_today:
            return date.today()
        raise ValueError("Falta la fecha.")
    v = valor.strip().lower()
    if v in _RELATIVE_TODAY:
        return date.today()
    if v in _RELATIVE_TOMORROW:
        from datetime import timedelta
        return date.today() + timedelta(days=1)
    if v in _RELATIVE_YESTERDAY:
        from datetime import timedelta
        return date.today() - timedelta(days=1)
    return date.fromisoformat(valor)


# ────────────────────────── Tools para cualquier usuario ──────────────────────


@tool
def obtener_fecha_actual(motivo: str = "consulta general") -> dict[str, str]:
    """Devuelve la fecha actual del servidor (YYYY-MM-DD) y el día de la semana.

    Útil cuando el usuario pregunta por "hoy", "mañana", "la semana que viene"
    y la IA necesita resolver esos términos a fechas concretas antes de llamar
    otras tools. El parámetro `motivo` es opcional; se pide sólo para
    compatibilizar con providers (como algunas versiones de Llama) que no
    saben enviar tool_calls sin argumentos.
    """
    _ = motivo  # no se usa, sólo está para que el LLM siempre envíe args
    hoy = date.today()
    dias_es = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
    return {"fecha": hoy.isoformat(), "dia_semana": dias_es[hoy.weekday()]}


@tool
def buscar_mis_reservas(
    desde: str | None = None, hasta: str | None = None
) -> list[dict[str, Any]]:
    """Devuelve las reservas del usuario autenticado entre dos fechas.

    `desde` y `hasta` aceptan formato YYYY-MM-DD o alias relativos como 'hoy',
    'mañana', 'ayer'. Si se omiten, ambos valores se asumen como hoy.
    Útil para "¿qué reservas tengo el viernes?" o "mis reservas de esta semana".
    Sólo trae reservas del usuario logueado, nunca de otros.
    """
    usuario_id = _usuario_actual_o_error()
    desde_d = _parse_fecha_tolerante(desde)
    hasta_d = _parse_fecha_tolerante(hasta)
    sql = text(
        """
        SELECT r.id, r.inicio, r.fin, r.estado, r.titulo, r.motivo_solicitud,
               e.nombre AS espacio_nombre
          FROM reserva r
          LEFT JOIN espacio e ON e.id = r.espacio_id
         WHERE r.usuario_id = :uid
           AND r.inicio::date BETWEEN :desde AND :hasta
         ORDER BY r.inicio
         LIMIT 50
        """
    )
    with get_engine().connect() as conn:
        rows = conn.execute(
            sql, {"uid": usuario_id, "desde": desde_d, "hasta": hasta_d},
        ).mappings().all()
    return [
        {
            "id": r["id"],
            "fecha_inicio": str(r["inicio"]),
            "fecha_fin": str(r["fin"]),
            "estado": r["estado"],
            "titulo": r["titulo"],
            "motivo": r["motivo_solicitud"],
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
    >= capacidad_min que no tengan reserva aprobada superpuesta.
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
                SELECT 1 FROM reserva re
                 WHERE re.espacio_id = e.id
                   AND re.estado = 'APROBADO'
                   AND re.inicio < :fin
                   AND re.fin    > :inicio
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
def buscar_espacio_semantico(query: str, top: int = 5) -> list[dict[str, Any]]:
    """Búsqueda semántica de espacios en lenguaje natural.

    Útil cuando el usuario describe lo que necesita sin nombrarlo exacto
    ("salón grande con proyector para taller"). Devuelve los top espacios
    rankeados por similitud coseno contra los embeddings indexados.
    """
    vector = get_embeddings().embed_query(query)
    return buscar_espacios_similares(vector, top=top)


@tool
def detalle_espacio(espacio_id: int) -> dict[str, Any]:
    """Devuelve los datos completos de un espacio: capacidad, tipo, edificio, estado."""
    sql = text(
        """
        SELECT e.id, e.nombre, e.capacidad, e.estado,
               te.nombre AS tipo, ed.nombre AS edificio
          FROM espacio e
          LEFT JOIN tipo_espacio te ON te.id = e.tipo_espacio_id
          LEFT JOIN edificio     ed ON ed.id = e.edificio_id
         WHERE e.id = :id AND e.deleted_at IS NULL
        """
    )
    with get_engine().connect() as conn:
        row = conn.execute(sql, {"id": espacio_id}).mappings().first()
    if not row:
        return {"error": f"No existe espacio con id {espacio_id}."}
    return dict(row)


@tool
def listar_inventario_de_espacio(espacio_id: int) -> list[dict[str, Any]]:
    """Lista los items de inventario asociados a un espacio (mesa, silla, proyector, etc).

    Disponible para cualquier rol autenticado: muestra qué hay físicamente
    en una sala específica, no datos sensibles.
    """
    sql = text(
        """
        SELECT i.id, i.cantidad, i.estado, i.observaciones,
               te.nombre AS tipo_elemento
          FROM inventario_item i
          LEFT JOIN tipo_elemento te ON te.id = i.tipo_elemento_id
         WHERE i.espacio_id = :id
           AND i.deleted_at IS NULL
           AND i.activo = true
         ORDER BY te.nombre
        """
    )
    with get_engine().connect() as conn:
        rows = conn.execute(sql, {"id": espacio_id}).mappings().all()
    return [dict(r) for r in rows]


@tool
def listar_edificios(motivo: str = "consulta general") -> list[dict[str, Any]]:
    """Devuelve la lista de edificios del campus con id, nombre y código.

    El parámetro `motivo` se ignora; existe sólo para compat con providers
    que no soportan tool_calls sin args.
    """
    _ = motivo
    sql = text(
        "SELECT id, nombre, codigo FROM edificio "
        "WHERE deleted_at IS NULL AND activo = true ORDER BY nombre"
    )
    with get_engine().connect() as conn:
        return [dict(r) for r in conn.execute(sql).mappings().all()]


@tool
def listar_carreras(motivo: str = "consulta general") -> list[dict[str, Any]]:
    """Devuelve la lista de carreras de UTEC con id, nombre y código.

    El parámetro `motivo` se ignora; existe sólo para compat con providers
    que no soportan tool_calls sin args.
    """
    _ = motivo
    sql = text(
        "SELECT id, nombre, codigo FROM carrera "
        "WHERE deleted_at IS NULL ORDER BY nombre"
    )
    with get_engine().connect() as conn:
        return [dict(r) for r in conn.execute(sql).mappings().all()]


@tool
def obtener_estadistica_global(tipo: str = "ocupacion", dias: int = 30) -> dict[str, Any]:
    """Devuelve una estadística agregada del sistema.

    Tipos válidos:
    - "ocupacion": reservas aprobadas vs total en los últimos N días.
    - "top_espacios": top 5 espacios por cantidad de reservas.
    - "por_carrera": cantidad de reservas por carrera.
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
            SELECT h.espacio_id, e.nombre AS espacio, SUM(h.cant_reservas) AS cant
              FROM hechos_reserva_diario h
              LEFT JOIN espacio e ON e.id = h.espacio_id
             WHERE h.fecha >= CURRENT_DATE - :dias AND h.estado = 'APROBADO'
             GROUP BY h.espacio_id, e.nombre
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
            SELECT h.carrera_id, c.nombre AS carrera, SUM(h.cant_reservas) AS cant
              FROM hechos_reserva_diario h
              LEFT JOIN carrera c ON c.id = h.carrera_id
             WHERE h.fecha >= CURRENT_DATE - :dias
               AND h.estado = 'APROBADO'
               AND h.carrera_id IS NOT NULL
             GROUP BY h.carrera_id, c.nombre
             ORDER BY cant DESC
             LIMIT 15
            """
        )
        with get_engine().connect() as conn:
            rows = conn.execute(sql, {"dias": dias}).mappings().all()
        return {"por_carrera": [dict(r) for r in rows], "ventana_dias": dias}

    raise ValueError(
        "Tipo inválido. Usar 'ocupacion', 'top_espacios' o 'por_carrera'."
    )


# ────────────────────── Tools para roles privilegiados ────────────────────────


@tool
def buscar_reservas_globales(
    desde: str | None = None,
    hasta: str | None = None,
    estado: str | None = None,
    espacio_id: int | None = None,
) -> list[dict[str, Any]]:
    """Lista reservas de TODOS los usuarios en un rango de fechas.

    `desde` y `hasta` aceptan YYYY-MM-DD o alias relativos ('hoy', 'mañana',
    'ayer'). Si se omiten ambos se asume hoy. Sólo accesible para ADMIN y
    ANALISTA. Acepta filtros opcionales por estado ('APROBADO', 'PENDIENTE',
    'CANCELADO') y por espacio_id. Devuelve hasta 30 filas.
    """
    _requiere_rol({"ADMIN", "ANALISTA"})
    desde_d = _parse_fecha_tolerante(desde)
    hasta_d = _parse_fecha_tolerante(hasta)
    sql = text(
        """
        SELECT r.id, r.inicio, r.fin, r.estado, r.titulo, r.motivo_solicitud,
               e.nombre AS espacio, u.email AS usuario_email,
               u.nombre AS usuario_nombre
          FROM reserva r
          LEFT JOIN espacio e ON e.id = r.espacio_id
          LEFT JOIN usuario u ON u.id = r.usuario_id
         WHERE r.inicio::date BETWEEN :desde AND :hasta
           AND (:estado IS NULL OR r.estado = :estado)
           AND (:eid IS NULL OR r.espacio_id = :eid)
         ORDER BY r.inicio
         LIMIT 30
        """
    )
    with get_engine().connect() as conn:
        rows = conn.execute(
            sql,
            {
                "desde": desde_d,
                "hasta": hasta_d,
                "estado": estado,
                "eid": espacio_id,
            },
        ).mappings().all()
    return [
        {
            "id": r["id"],
            "fecha_inicio": str(r["inicio"]),
            "fecha_fin": str(r["fin"]),
            "estado": r["estado"],
            "titulo": r["titulo"],
            "motivo": r["motivo_solicitud"],
            "espacio": r["espacio"],
            "usuario": r["usuario_nombre"],
            "email": r["usuario_email"],
        }
        for r in rows
    ]


@tool
def top_usuarios_reservadores(dias: int = 30, top: int = 10) -> list[dict[str, Any]]:
    """Ranking de usuarios con más reservas aprobadas en los últimos N días.

    Sólo accesible para ADMIN y ANALISTA.
    """
    _requiere_rol({"ADMIN", "ANALISTA"})
    sql = text(
        """
        SELECT u.id, u.nombre, u.email, COUNT(*) AS reservas
          FROM reserva r
          JOIN usuario u ON u.id = r.usuario_id
         WHERE r.estado = 'APROBADO'
           AND r.inicio >= now() - make_interval(days => :dias)
         GROUP BY u.id, u.nombre, u.email
         ORDER BY reservas DESC
         LIMIT :top
        """
    )
    with get_engine().connect() as conn:
        rows = conn.execute(sql, {"dias": dias, "top": top}).mappings().all()
    return [dict(r) for r in rows]


@tool
def buscar_inventario_global(nombre_tipo: str | None = None) -> list[dict[str, Any]]:
    """Lista inventario agrupado por tipo de elemento en todo el campus.

    Sólo accesible para ADMIN y MANTENIMIENTO. Si se pasa nombre_tipo (ej:
    "proyector", "silla"), filtra por coincidencia parcial case-insensitive.
    """
    _requiere_rol({"ADMIN", "MANTENIMIENTO"})
    sql = text(
        """
        SELECT te.nombre AS tipo_elemento,
               COUNT(*)                                          AS items,
               COALESCE(SUM(i.cantidad), 0)                      AS cantidad_total,
               SUM(CASE WHEN i.estado = 'DISPONIBLE' THEN 1 ELSE 0 END)     AS disponibles,
               SUM(CASE WHEN i.estado = 'MANTENIMIENTO' THEN 1 ELSE 0 END)  AS en_mantenimiento
          FROM inventario_item i
          JOIN tipo_elemento te ON te.id = i.tipo_elemento_id
         WHERE i.deleted_at IS NULL
           AND i.activo = true
           AND (:nombre IS NULL OR te.nombre ILIKE '%' || :nombre || '%')
         GROUP BY te.nombre
         ORDER BY cantidad_total DESC
         LIMIT 30
        """
    )
    with get_engine().connect() as conn:
        rows = conn.execute(sql, {"nombre": nombre_tipo}).mappings().all()
    return [dict(r) for r in rows]


@tool
def items_en_mantenimiento(motivo: str = "consulta general") -> list[dict[str, Any]]:
    """Lista items de inventario actualmente en estado MANTENIMIENTO con su espacio.

    Sólo accesible para ADMIN y MANTENIMIENTO. Útil para "qué hay que reparar".
    El parámetro `motivo` se ignora; existe sólo para compat con providers
    que no soportan tool_calls sin args.
    """
    _ = motivo
    _requiere_rol({"ADMIN", "MANTENIMIENTO"})
    sql = text(
        """
        SELECT i.id, te.nombre AS tipo_elemento, i.cantidad, i.observaciones,
               e.nombre AS espacio, i.updated_at
          FROM inventario_item i
          JOIN tipo_elemento te ON te.id = i.tipo_elemento_id
          LEFT JOIN espacio e ON e.id = i.espacio_id
         WHERE i.deleted_at IS NULL
           AND i.estado = 'MANTENIMIENTO'
         ORDER BY i.updated_at DESC
         LIMIT 30
        """
    )
    with get_engine().connect() as conn:
        rows = conn.execute(sql).mappings().all()
    return [
        {
            "id": r["id"],
            "tipo_elemento": r["tipo_elemento"],
            "cantidad": r["cantidad"],
            "observaciones": r["observaciones"],
            "espacio": r["espacio"],
            "actualizado": str(r["updated_at"]),
        }
        for r in rows
    ]


TOOLS = [
    obtener_fecha_actual,
    buscar_mis_reservas,
    buscar_espacios_disponibles,
    buscar_espacio_semantico,
    detalle_espacio,
    listar_inventario_de_espacio,
    listar_edificios,
    listar_carreras,
    obtener_estadistica_global,
    buscar_reservas_globales,
    top_usuarios_reservadores,
    buscar_inventario_global,
    items_en_mantenimiento,
]
