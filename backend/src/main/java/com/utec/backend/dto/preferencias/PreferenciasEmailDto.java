package com.utec.backend.dto.preferencias;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PreferenciasEmailDto {
    private Map<String, Boolean> email;
}

