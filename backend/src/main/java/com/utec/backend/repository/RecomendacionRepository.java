package com.utec.backend.repository;

import com.utec.backend.model.Recomendacion;
import com.utec.backend.model.TipoRecomendacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecomendacionRepository extends JpaRepository<Recomendacion, Long> {
    
    /**
     * Obtener top 20 recomendaciones por usuario ordenadas por puntaje descendente
     */
    @Query("SELECT r FROM Recomendacion r WHERE r.usuario.id = :usuarioId ORDER BY r.puntaje DESC")
    List<Recomendacion> findTop20ByUsuarioIdOrderByPuntajeDesc(@Param("usuarioId") Long usuarioId);
    
    /**
     * Obtener recomendaciones por usuario y tipo
     */
    List<Recomendacion> findByUsuarioIdAndTipoRecomendacion(Long usuarioId, TipoRecomendacion tipoRecomendacion);
    
    /**
     * Eliminar todas las recomendaciones de un usuario
     */
    @Modifying
    @Query("DELETE FROM Recomendacion r WHERE r.usuario.id = :usuarioId")
    void deleteByUsuarioId(@Param("usuarioId") Long usuarioId);
    
    /**
     * Obtener recomendaciones por tipo (para mantenimiento/admin)
     */
    List<Recomendacion> findByTipoRecomendacion(TipoRecomendacion tipoRecomendacion);
    
    /**
     * Obtener recomendaciones por usuario, tipo y espacio
     */
    Recomendacion findByUsuarioIdAndEspacioIdAndTipoRecomendacion(
        Long usuarioId, 
        Long espacioId, 
        TipoRecomendacion tipoRecomendacion
    );
    
    /**
     * Contar recomendaciones por usuario
     */
    Long countByUsuarioId(Long usuarioId);
}

