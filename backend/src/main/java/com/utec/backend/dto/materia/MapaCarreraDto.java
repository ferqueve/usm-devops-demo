package com.utec.backend.dto.materia;

import java.util.List;

/**
 * Mapa de correlativas de una carrera: nodos (materias) conectados por
 * prerrequisitos, con el estado de avance del estudiante autenticado.
 */
public record MapaCarreraDto(
        Long carreraId,
        String carreraNombre,
        List<Nodo> materias,
        int totalMaterias,
        int materiasAprobadas,
        int totalCreditos,
        int creditosAprobados,
        boolean conProgreso) {

    /**
     * Un nodo del mapa. {@code estado} es la situación del estudiante frente a
     * la materia: APROBADA | CURSANDO | DISPONIBLE | BLOQUEADA, o null cuando el
     * usuario no es estudiante (se muestra solo la estructura).
     */
    public record Nodo(
            Long id,
            String nombre,
            String codigo,
            Integer semestre,
            Integer creditos,
            Long docenteId,
            String docenteNombre,
            long totalInscriptos,
            List<Long> prerrequisitoIds,
            String estado) {
    }
}
