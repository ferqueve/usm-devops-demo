package com.utec.backend.util;

import com.utec.backend.dto.usuario.UsuarioResponseDto;

import java.time.format.DateTimeFormatter;
import java.util.List;

public class CsvExportUtil {
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final String CSV_HEADER = "ID,Email,Nombre,Rol,Verificado,Activo,Fecha Registro";
    private static final String CSV_SEPARATOR = ",";
    private static final String CSV_QUOTE = "\"";
    
    public static String generateUsersCsv(List<UsuarioResponseDto> usuarios) {
        StringBuilder csv = new StringBuilder();
        
        // Agregar encabezados
        csv.append(CSV_HEADER).append("\n");
        
        // Agregar datos de usuarios
        for (UsuarioResponseDto usuario : usuarios) {
            csv.append(escapeCSVField(usuario.getId().toString()))
               .append(CSV_SEPARATOR)
               .append(escapeCSVField(usuario.getEmail()))
               .append(CSV_SEPARATOR)
               .append(escapeCSVField(usuario.getNombre()))
               .append(CSV_SEPARATOR)
               .append(escapeCSVField(usuario.getRolApp().name()))
               .append(CSV_SEPARATOR)
               .append(escapeCSVField(usuario.getVerificado() ? "Sí" : "No"))
               .append(CSV_SEPARATOR)
               .append(escapeCSVField(usuario.getActivo() ? "Sí" : "No"))
               .append(CSV_SEPARATOR)
               .append(escapeCSVField(usuario.getCreatedAt().format(DATE_FORMATTER)))
               .append("\n");
        }
        
        return csv.toString();
    }
    
    private static String escapeCSVField(String field) {
        if (field == null) {
            return "";
        }
        
        // Si el campo contiene comas, comillas o saltos de línea, lo encerramos en comillas
        if (field.contains(CSV_SEPARATOR) || field.contains(CSV_QUOTE) || field.contains("\n")) {
            // Escapar comillas dobles duplicándolas
            String escapedField = field.replace(CSV_QUOTE, CSV_QUOTE + CSV_QUOTE);
            return CSV_QUOTE + escapedField + CSV_QUOTE;
        }
        
        return field;
    }
}
