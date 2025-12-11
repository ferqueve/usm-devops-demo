package com.utec.backend.dto.reserva;

import com.utec.backend.dto.reserva_item_solicitado.ReservaItemSolicitadoCreateDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaCreateDto {
    
    @NotNull(message = "El ID del espacio es requerido")
    private Long espacioId;
    
    private Long carreraId; // Opcional
    
    @NotNull(message = "La fecha de inicio es requerida")
    private Instant inicio;
    
    @NotNull(message = "La fecha de fin es requerida")
    private Instant fin;
    
    @NotBlank(message = "El título es requerido")
    private String titulo;
    
    private String motivoSolicitud; // Opcional
    
    private List<ReservaItemSolicitadoCreateDto> itemsSolicitados; // Opcional
    
    // Campos para reservas recurrentes/periódicas
    private TipoRecurrencia tipoRecurrencia; // Opcional: DIARIA, SEMANAL, MENSUAL, null = no recurrente
    private Instant fechaFinRecurrencia; // Opcional: fecha hasta la cual se repite
    
    // Campo para asignar analista (solo para docentes)
    private Long analistaId; // Opcional: ID del analista al cual se asigna la solicitud
    
    // Campo para marcar reserva como pública (opcional para usuarios internos)
    private Boolean esPublica; // Opcional: si es true, la reserva será pública
    
    public enum TipoRecurrencia {
        DIARIA,    // Todos los días
        SEMANAL,   // Misma hora, mismo día de la semana
        MENSUAL    // Misma hora, mismo día del mes
    }
}

