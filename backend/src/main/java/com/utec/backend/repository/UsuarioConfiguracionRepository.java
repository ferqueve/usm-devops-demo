package com.utec.backend.repository;

import com.utec.backend.model.UsuarioConfiguracion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioConfiguracionRepository extends JpaRepository<UsuarioConfiguracion, Long> {
    
    Optional<UsuarioConfiguracion> findByUsuarioId(Long usuarioId);
}

