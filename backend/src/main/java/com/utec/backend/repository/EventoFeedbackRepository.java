package com.utec.backend.repository;

import com.utec.backend.model.EventoFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventoFeedbackRepository extends JpaRepository<EventoFeedback, Long> {

    List<EventoFeedback> findByEventoIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long eventoId);

    Optional<EventoFeedback> findByEventoIdAndUsuarioIdAndDeletedAtIsNull(Long eventoId, Long usuarioId);

    boolean existsByEventoIdAndUsuarioIdAndDeletedAtIsNull(Long eventoId, Long usuarioId);
}
