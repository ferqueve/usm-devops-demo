package com.utec.backend.repository;

import com.utec.backend.model.EventoInscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventoInscripcionRepository extends JpaRepository<EventoInscripcion, Long> {

    List<EventoInscripcion> findByEventoIdAndDeletedAtIsNull(Long eventoId);

    List<EventoInscripcion> findByUsuarioIdAndDeletedAtIsNull(Long usuarioId);

    boolean existsByEventoIdAndUsuarioIdAndDeletedAtIsNull(Long eventoId, Long usuarioId);

    long countByEventoIdAndDeletedAtIsNull(Long eventoId);
}
