package com.utec.backend.repository;

import com.utec.backend.model.ModeloForecast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModeloForecastRepository extends JpaRepository<ModeloForecast, Long> {

    @Query("SELECT m FROM ModeloForecast m WHERE m.scope = :scope AND m.activo = true ORDER BY m.trainedAt DESC")
    Optional<ModeloForecast> findActivoByScope(@Param("scope") String scope);

    /**
     * El activo más reciente de un ámbito. ml-svc desactiva los previos al
     * reentrenar, pero si dos entrenamientos se pisan quedan dos activos un
     * instante: con un Optional a secas la lectura explotaría por resultado
     * no único.
     */
    Optional<ModeloForecast> findFirstByScopeAndActivoTrueOrderByTrainedAtDesc(String scope);

    /** El activo de reservas de un tipo de espacio (scope tipo_espacio). */
    Optional<ModeloForecast> findFirstByScopeAndTipoEspacioIdAndActivoTrueOrderByTrainedAtDesc(
            String scope, Long tipoEspacioId);

    /** Todos los activos de un ámbito, el más nuevo primero (hay uno por tipo de espacio). */
    List<ModeloForecast> findByScopeAndActivoTrueOrderByTrainedAtDesc(String scope);
}
