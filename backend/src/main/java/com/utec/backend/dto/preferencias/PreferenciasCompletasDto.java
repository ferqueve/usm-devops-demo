package com.utec.backend.dto.preferencias;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PreferenciasCompletasDto {
    private Map<String, Object> preferencias;
}

