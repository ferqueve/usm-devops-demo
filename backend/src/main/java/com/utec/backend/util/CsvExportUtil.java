package com.utec.backend.util;

import com.utec.backend.dto.usuario.UsuarioResponseDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class CsvExportUtil {
    
    private final DateTimeFormatter dateFormatter;
    private static final String CSV_HEADER = "ID,Email,Nombre,Rol,Verificado,Activo,Fecha Registro";
    private static final String CSV_SEPARATOR = ",";
    private static final String CSV_QUOTE = "\"";
    
    public CsvExportUtil(@Value("${app.timezone:America/Montevideo}") String appTimezone) {
        this.dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss").withZone(ZoneId.of(appTimezone));
    }
    
    public String generateUsersCsv(List<UsuarioResponseDto> usuarios) {
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
               .append(escapeCSVField(Boolean.TRUE.equals(usuario.getVerificado()) ? "Sí" : "No"))
               .append(CSV_SEPARATOR)
               .append(escapeCSVField(Boolean.TRUE.equals(usuario.getActivo()) ? "Sí" : "No"))
               .append(CSV_SEPARATOR)
               .append(escapeCSVField(dateFormatter.format(usuario.getCreatedAt())))
               .append("\n");
        }
        
        return csv.toString();
    }
    
    private String escapeCSVField(String field) {
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
