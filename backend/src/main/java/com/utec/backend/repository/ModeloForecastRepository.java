package com.utec.backend.repository;

import com.utec.backend.model.ModeloForecast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ModeloForecastRepository extends JpaRepository<ModeloForecast, Long> {

    @Query("SELECT m FROM ModeloForecast m WHERE m.scope = :scope AND m.activo = true ORDER BY m.trainedAt DESC")
    Optional<ModeloForecast> findActivoByScope(@Param("scope") String scope);
}
