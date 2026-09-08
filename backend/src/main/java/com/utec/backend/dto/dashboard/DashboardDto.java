package com.utec.backend.dto.dashboard;

import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.dto.reserva.ReservaStatsDto;
import com.utec.backend.dto.usuario.UsuarioStatsDto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Todo lo que necesita la pantalla de inicio, en una sola respuesta.
 *
 * Antes el frontend armaba el dashboard con doce llamadas en paralelo -- una
 * por metrica -- contra un pool de diez conexiones: las dos ultimas esperaban a
 * que se liberara una. Ademas descargaba listas enteras (todos los espacios,
 * todas las reservas del mes) para terminar mostrando un contador.
 *
 * Este DTO lo reemplaza. Los campos que un rol no usa vienen en null: un
 * ESTUDIANTE no recibe la cola de pendientes ni las metricas de inventario,
 * porque su pantalla no las muestra y ademas no tiene permiso para verlas.
 *
 * @param stats                          contadores de la tira superior
 * @param proximasReservas               las diez proximas aprobadas del campus
 * @param misReservas                    las ultimas del usuario (roles que reservan)
 * @param reservasPendientes             cola por aprobar (roles que aprueban)
 * @param reservaStats                   agregado de reservas: global para quien aprueba, personal para el resto
 * @param userStats                      metricas de usuarios (solo ADMIN)
 * @param inventarioStats                metricas de inventario (roles que lo administran)
 * @param solicitudesInventarioPendientes solicitudes de items sin responder
 */
public record DashboardDto(
        Stats stats,
        List<ReservaResponseDto> proximasReservas,
        List<ReservaResponseDto> misReservas,
        List<ReservaResponseDto> reservasPendientes,
        ReservaStatsDto reservaStats,
        UsuarioStatsDto userStats,
        Map<String, Object> inventarioStats,
        long solicitudesInventarioPendientes,

        /** Materias que dicta (DOCENTE) o que cursa (ESTUDIANTE). */
        List<MateriaBreve> misMaterias,
        /** Franjas de tutoria que dicta (DOCENTE) o que tiene agendadas (ESTUDIANTE). */
        List<TutoriaBreve> misTutorias,
        /** Proximos eventos que le tocan al rol. */
        List<EventoBreve> eventos,
        /** Items que piden reparacion (MANTENIMIENTO). */
        List<ItemAtencion> inventarioAtencion,
        /** Espacios que no estan operativos (MANTENIMIENTO). */
        List<EspacioBreve> espaciosFueraDeServicio,
        /** Ultimos movimientos del sistema (ADMIN). */
        List<Actividad> actividadReciente,
        /** Estado de los componentes (ADMIN). */
        Salud salud,
        /** Impacto acumulado de la digitalizacion (ADMIN y MANTENIMIENTO). */
        Sostenibilidad sostenibilidad,
        /** Espacios con mas solicitudes en cola (ANALISTA y ADMIN). */
        List<EspacioPresion> espaciosConPresion,
        /**
         * Para graficar: creditos por semestre (ESTUDIANTE) e inscriptos por
         * materia (DOCENTE). Se calculan sobre todas sus materias, no sobre las
         * que entran en el panel.
         */
        List<Serie> creditosPorSemestre,
        List<Serie> inscriptosPorMateria
) {

    /** Una materia, con lo justo para listarla. */
    public record MateriaBreve(Long id, String nombre, String codigo, Integer creditos,
                               Long inscriptos, String docenteNombre, Integer semestre) {
    }

    /** Una franja de tutoria. */
    public record TutoriaBreve(Long id, Long materiaId, String materiaNombre, Instant inicio, Instant fin,
                               String espacioNombre, String docenteNombre, long agendados, int cupo) {
    }

    /** Un evento proximo. */
    public record EventoBreve(Long id, String titulo, Instant inicio, String espacioNombre,
                              long inscriptos, Integer cupo, boolean inscrito) {
    }

    /** Un item de inventario que pide atencion, con el motivo ya redactado. */
    public record ItemAtencion(Long id, String titulo, String motivo, int urgencia) {
    }

    /** Un espacio que no esta operativo. */
    public record EspacioBreve(Long id, String nombre, String estado, String edificio) {
    }

    /** Un movimiento del registro de auditoria. */
    public record Actividad(Instant cuando, String usuario, String accion, String entidad) {
    }

    /**
     * Salud del sistema.
     *
     * @param caidos nombres de los componentes que no estan UP
     */
    public record Salud(String estado, int componentes, List<String> caidos) {
    }

    /** Lo que ahorro la digitalizacion, en los tres numeros que se muestran. */
    public record Sostenibilidad(long hojasEvitadas, double arbolesSalvados, double co2EvitadoKg) {
    }

    /** Un espacio y cuantas solicitudes tiene esperando. */
    public record EspacioPresion(Long id, String nombre, long pendientes) {
    }

    /** Un par etiqueta/valor, para los graficos de barras. */
    public record Serie(String nombre, long valor) {
    }

    /**
     * Los numeros de la tira de tarjetas. Todos salen de agregados en la base:
     * ninguno se calcula recorriendo una lista.
     *
     * @param promedioReservasPorEspacio razon, no porcentaje: aprobadas sobre espacios
     */
    public record Stats(
            long totalReservas,
            long reservasHoy,
            long reservasPendientes,
            long reservasAprobadas,
            long reservasCanceladas,
            long totalEspacios,
            long espaciosDisponibles,
            long espaciosOcupados,
            long espaciosEnMantenimiento,
            double capacidadPromedio,
            long totalUsuarios,
            long usuariosActivos,
            long usuariosNuevosHoy,
            double promedioReservasPorEspacio,

            /** Materias que el usuario dicta o cursa, y los creditos que suman. */
            long materias,
            long creditos,
            /** Inscriptos en las materias que dicta (DOCENTE). */
            long inscriptos,
            /** Franjas de tutoria propias y clases seguidas asistidas (ESTUDIANTE). */
            long tutorias,
            long racha,
            /** Tutorias a las que el estudiante ya asistio. */
            long tutoriasAsistidas,
            /** Solicitudes que este analista ya resolvio. */
            long resueltasPorMi,
            /** Eventos proximos que le tocan al rol. */
            long eventosProximos
    ) {
    }
}
