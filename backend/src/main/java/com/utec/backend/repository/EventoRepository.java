package com.utec.backend.repository;

import com.utec.backend.model.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventoRepository extends JpaRepository<Evento, Long> {

    List<Evento> findByDeletedAtIsNull();

    List<Evento> findByEsPublicoTrueAndDeletedAtIsNull();

    List<Evento> findByEstadoAndDeletedAtIsNull(String estado);
}
