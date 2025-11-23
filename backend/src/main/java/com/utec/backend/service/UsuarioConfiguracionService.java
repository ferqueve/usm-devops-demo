package com.utec.backend.service;

import com.utec.backend.dto.preferencias.PreferenciasCompletasDto;
import com.utec.backend.dto.preferencias.PreferenciasEmailDto;
import com.utec.backend.dto.preferencias.PreferenciasVistaDto;
import com.utec.backend.model.Usuario;
import com.utec.backend.model.UsuarioConfiguracion;
import com.utec.backend.repository.UsuarioConfiguracionRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsuarioConfiguracionService {

    private final UsuarioConfiguracionRepository configuracionRepository;
    private final UsuarioRepository usuarioRepository;

    /**
     * Obtiene o crea las preferencias del usuario con valores por defecto
     */
    @Transactional
    public PreferenciasCompletasDto obtenerPreferencias(String userEmail) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + userEmail));
        
        UsuarioConfiguracion config = obtenerOcrearConfiguracion(usuario);
        
        return new PreferenciasCompletasDto(config.getPreferencias());
    }

    /**
     * Obtiene solo las preferencias de email filtradas por rol (excluyendo obligatorios)
     */
    @Transactional
    public PreferenciasEmailDto obtenerPreferenciasEmail(String userEmail) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + userEmail));
        
        UsuarioConfiguracion config = obtenerOcrearConfiguracion(usuario);
        
        Map<String, Object> preferencias = config.getPreferencias();
        @SuppressWarnings("unchecked")
        Map<String, Boolean> emailPrefs = (Map<String, Boolean>) preferencias.getOrDefault("email", new HashMap<>());
        
        // Obtener lista de emails permitidos para este rol
        Set<String> emailsPermitidos = obtenerEmailsPermitidosPorRol(usuario.getRolApp());
        
        // Excluir emails obligatorios (crear una copia para no modificar el original)
        Set<String> emailsObligatorios = getEmailsObligatorios();
        Set<String> emailsConfigurables = new HashSet<>(emailsPermitidos);
        emailsConfigurables.removeAll(emailsObligatorios);
        
        // Construir el mapa con las preferencias del usuario (o true por defecto)
        Map<String, Boolean> emailPrefsFiltradas = new HashMap<>();
        for (String key : emailsConfigurables) {
            emailPrefsFiltradas.put(key, emailPrefs.getOrDefault(key, true));
        }
        
        return new PreferenciasEmailDto(emailPrefsFiltradas);
    }

    /**
     * Obtiene solo las preferencias de vista filtradas por rol
     */
    @Transactional
    public PreferenciasVistaDto obtenerPreferenciasVista(String userEmail) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + userEmail));
        
        UsuarioConfiguracion config = obtenerOcrearConfiguracion(usuario);
        
        Map<String, Object> preferencias = config.getPreferencias();
        @SuppressWarnings("unchecked")
        Map<String, Object> vistaPrefs = (Map<String, Object>) preferencias.getOrDefault("vista", new HashMap<>());
        
        // Filtrar según el rol del usuario
        Map<String, Object> vistaPrefsFiltradas = filtrarPreferenciasVistaPorRol(vistaPrefs, usuario.getRolApp());
        
        return new PreferenciasVistaDto(vistaPrefsFiltradas);
    }

    /**
     * Actualiza las preferencias de email
     */
    @Transactional
    public PreferenciasEmailDto actualizarPreferenciasEmail(String userEmail, PreferenciasEmailDto dto) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + userEmail));
        
        UsuarioConfiguracion config = obtenerOcrearConfiguracion(usuario);
        
        // Asegurar que los emails obligatorios siempre estén en true
        Set<String> emailsObligatorios = getEmailsObligatorios();
        Map<String, Boolean> emailPrefs = dto.getEmail();
        for (String obligatorio : emailsObligatorios) {
            emailPrefs.put(obligatorio, true);
        }
        
        Map<String, Object> preferencias = config.getPreferencias();
        preferencias.put("email", emailPrefs);
        
        config.setPreferencias(preferencias);
        configuracionRepository.save(config);
        
        log.info("Preferencias de email actualizadas para usuario: {}", userEmail);
        
        return obtenerPreferenciasEmail(userEmail);
    }

    /**
     * Actualiza las preferencias de vista
     */
    @Transactional
    public PreferenciasVistaDto actualizarPreferenciasVista(String userEmail, PreferenciasVistaDto dto) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + userEmail));
        
        UsuarioConfiguracion config = obtenerOcrearConfiguracion(usuario);
        
        // Filtrar las preferencias de vista según el rol antes de guardar
        Map<String, Object> vistaPrefsFiltradas = filtrarPreferenciasVistaPorRol(dto.getVista(), usuario.getRolApp());
        
        Map<String, Object> preferencias = config.getPreferencias();
        preferencias.put("vista", vistaPrefsFiltradas);
        
        config.setPreferencias(preferencias);
        configuracionRepository.save(config);
        
        log.info("Preferencias de vista actualizadas para usuario: {}", userEmail);
        
        return obtenerPreferenciasVista(userEmail);
    }

    /**
     * Verifica si debe enviar un email según las preferencias del usuario
     */
    @Transactional(readOnly = true)
    public boolean debeEnviarEmail(String userEmail, String tipoEmail) {
        try {
            Usuario usuario = usuarioRepository.findByEmail(userEmail)
                    .orElse(null);
            
            if (usuario == null) {
                return true; // Si no existe usuario, enviar por defecto
            }
            
            UsuarioConfiguracion config = configuracionRepository.findByUsuarioId(usuario.getId())
                    .orElse(null);
            
            if (config == null || config.getPreferencias() == null) {
                return true; // Si no hay config, enviar por defecto
            }
            
            Map<String, Object> preferencias = config.getPreferencias();
            @SuppressWarnings("unchecked")
            Map<String, Boolean> emailPrefs = (Map<String, Boolean>) preferencias.getOrDefault("email", new HashMap<>());
            
            // Verificar si el tipo de email está permitido para este rol
            if (!esTipoEmailPermitidoParaRol(tipoEmail, usuario.getRolApp())) {
                return false;
            }
            
            // Verificar preferencia (por defecto true si no existe)
            return emailPrefs.getOrDefault(tipoEmail, true);
        } catch (Exception e) {
            log.error("Error al verificar preferencia de email para {}: {}", userEmail, e.getMessage());
            return true; // En caso de error, enviar por defecto
        }
    }

    /**
     * Obtiene o crea la configuración del usuario, manejando duplicados si existen
     */
    private UsuarioConfiguracion obtenerOcrearConfiguracion(Usuario usuario) {
        try {
            return configuracionRepository.findByUsuarioId(usuario.getId())
                    .orElseGet(() -> crearConfiguracionPorDefecto(usuario));
        } catch (Exception e) {
            // Si hay duplicados, eliminar todos y crear uno nuevo
            log.warn("Se detectaron configuraciones duplicadas para usuario {}: {}. Eliminando duplicados...", 
                    usuario.getId(), e.getMessage());
            
            // Buscar todas las configuraciones para este usuario y eliminar todas excepto la primera
            List<UsuarioConfiguracion> configs = configuracionRepository.findAll().stream()
                    .filter(c -> c.getUsuario() != null && c.getUsuario().getId().equals(usuario.getId()))
                    .toList();
            
            if (!configs.isEmpty()) {
                // Mantener solo la primera y eliminar el resto
                UsuarioConfiguracion primera = configs.get(0);
                for (int i = 1; i < configs.size(); i++) {
                    configuracionRepository.delete(configs.get(i));
                }
                log.info("Eliminados {} duplicados para usuario {}", configs.size() - 1, usuario.getId());
                return primera;
            }
            
            // Si no hay ninguna, crear una nueva
            return crearConfiguracionPorDefecto(usuario);
        }
    }

    /**
     * Crea una configuración con valores por defecto
     */
    private UsuarioConfiguracion crearConfiguracionPorDefecto(Usuario usuario) {
        Map<String, Object> preferencias = new HashMap<>();
        
        // Preferencias de email por defecto (todos true)
        Map<String, Boolean> emailPrefs = new HashMap<>();
        emailPrefs.put("verificacion", true);
        emailPrefs.put("restablecimientoPassword", true);
        emailPrefs.put("cambioRol", true);
        emailPrefs.put("cambioEstado", true);
        emailPrefs.put("cambioEmail", true);
        emailPrefs.put("reservaAprobada", true);
        emailPrefs.put("reservaRechazada", true);
        emailPrefs.put("reservaCancelada", true);
        emailPrefs.put("reservaActualizada", true);
        emailPrefs.put("nuevaSolicitudReserva", true);
        emailPrefs.put("recordatorioReserva", true);
        emailPrefs.put("nuevaSolicitudInventario", true);
        emailPrefs.put("estadoSolicitudInventario", true);
        
        // Preferencias de vista por defecto
        Map<String, Object> vistaPrefs = new HashMap<>();
        vistaPrefs.put("reservasViewMode", "calendar");
        vistaPrefs.put("reservasCalendarViewMode", "week");
        vistaPrefs.put("reservasPageSize", 10);
        vistaPrefs.put("espaciosViewMode", "cards");
        vistaPrefs.put("espaciosPageSize", 12);
        vistaPrefs.put("inventarioViewMode", "table");
        vistaPrefs.put("inventarioPageSize", 25);
        vistaPrefs.put("usuariosPageSize", 10);
        vistaPrefs.put("auditoriaPageSize", 20);
        
        preferencias.put("email", emailPrefs);
        preferencias.put("vista", vistaPrefs);
        
        UsuarioConfiguracion config = new UsuarioConfiguracion();
        config.setUsuario(usuario);
        config.setPreferencias(preferencias);
        
        return configuracionRepository.save(config);
    }

    /**
     * Obtiene los emails obligatorios (del admin y del sistema) que no se pueden desactivar
     */
    public Set<String> getEmailsObligatorios() {
        return Set.of(
            "verificacion", "restablecimientoPassword", "cambioRol", 
            "cambioEstado", "cambioEmail"
        );
    }

    /**
     * Obtiene la lista de emails permitidos para un rol específico
     */
    private Set<String> obtenerEmailsPermitidosPorRol(Usuario.RolApp rol) {
        Set<String> emailsPermitidos = new HashSet<>();
        
        // Todos los roles pueden recibir estos
        Set<String> todosLosRoles = Set.of(
            "verificacion", "restablecimientoPassword", "cambioRol", 
            "cambioEstado", "cambioEmail"
        );
        emailsPermitidos.addAll(todosLosRoles);
        
        // Solo DOCENTE
        if (rol == Usuario.RolApp.DOCENTE || rol == Usuario.RolApp.ADMIN) {
            emailsPermitidos.addAll(Set.of(
                "reservaAprobada", "reservaRechazada", "reservaActualizada", 
                "recordatorioReserva", "estadoSolicitudInventario"
            ));
        }
        
        // Solo ANALISTA
        if (rol == Usuario.RolApp.ANALISTA || rol == Usuario.RolApp.ADMIN) {
            emailsPermitidos.addAll(Set.of(
                "nuevaSolicitudReserva", "reservaCancelada", "reservaActualizada"
            ));
        }
        
        // Solo MANTENIMIENTO
        if (rol == Usuario.RolApp.MANTENIMIENTO || rol == Usuario.RolApp.ADMIN) {
            emailsPermitidos.add("nuevaSolicitudInventario");
        }
        
        return emailsPermitidos;
    }


    /**
     * Verifica si un tipo de email está permitido para un rol
     */
    private boolean esTipoEmailPermitidoParaRol(String tipoEmail, Usuario.RolApp rol) {
        Set<String> todosLosRoles = Set.of(
            "verificacion", "restablecimientoPassword", "cambioRol", 
            "cambioEstado", "cambioEmail"
        );
        
        Set<String> soloDocente = Set.of(
            "reservaAprobada", "reservaRechazada", "reservaActualizada", 
            "recordatorioReserva", "estadoSolicitudInventario"
        );
        
        Set<String> soloAnalista = Set.of(
            "nuevaSolicitudReserva", "reservaCancelada", "reservaActualizada"
        );
        
        Set<String> soloMantenimiento = Set.of("nuevaSolicitudInventario");
        
        if (todosLosRoles.contains(tipoEmail)) {
            return true;
        }
        
        if (soloDocente.contains(tipoEmail)) {
            return rol == Usuario.RolApp.DOCENTE || rol == Usuario.RolApp.ADMIN;
        }
        
        if (soloAnalista.contains(tipoEmail)) {
            return rol == Usuario.RolApp.ANALISTA || rol == Usuario.RolApp.ADMIN;
        }
        
        if (soloMantenimiento.contains(tipoEmail)) {
            return rol == Usuario.RolApp.MANTENIMIENTO || rol == Usuario.RolApp.ADMIN;
        }
        
        return false;
    }

    /**
     * Filtra las preferencias de vista según el rol del usuario
     */
    private Map<String, Object> filtrarPreferenciasVistaPorRol(Map<String, Object> vistaPrefs, Usuario.RolApp rol) {
        Map<String, Object> filtradas = new HashMap<>();
        
        // ADMIN: todas las preferencias
        if (rol == Usuario.RolApp.ADMIN) {
            return vistaPrefs;
        }
        
        // ANALISTA: reservas, espacios, inventario, estadísticas (NO usuarios, NO auditoria)
        if (rol == Usuario.RolApp.ANALISTA) {
            if (vistaPrefs.containsKey("reservasViewMode")) filtradas.put("reservasViewMode", vistaPrefs.get("reservasViewMode"));
            if (vistaPrefs.containsKey("reservasCalendarViewMode")) filtradas.put("reservasCalendarViewMode", vistaPrefs.get("reservasCalendarViewMode"));
            if (vistaPrefs.containsKey("reservasPageSize")) filtradas.put("reservasPageSize", vistaPrefs.get("reservasPageSize"));
            if (vistaPrefs.containsKey("espaciosViewMode")) filtradas.put("espaciosViewMode", vistaPrefs.get("espaciosViewMode"));
            if (vistaPrefs.containsKey("espaciosPageSize")) filtradas.put("espaciosPageSize", vistaPrefs.get("espaciosPageSize"));
            if (vistaPrefs.containsKey("inventarioViewMode")) filtradas.put("inventarioViewMode", vistaPrefs.get("inventarioViewMode"));
            if (vistaPrefs.containsKey("inventarioPageSize")) filtradas.put("inventarioPageSize", vistaPrefs.get("inventarioPageSize"));
            return filtradas;
        }
        
        // DOCENTE: solo reservas
        if (rol == Usuario.RolApp.DOCENTE) {
            if (vistaPrefs.containsKey("reservasViewMode")) filtradas.put("reservasViewMode", vistaPrefs.get("reservasViewMode"));
            if (vistaPrefs.containsKey("reservasCalendarViewMode")) filtradas.put("reservasCalendarViewMode", vistaPrefs.get("reservasCalendarViewMode"));
            if (vistaPrefs.containsKey("reservasPageSize")) filtradas.put("reservasPageSize", vistaPrefs.get("reservasPageSize"));
            return filtradas;
        }
        
        // MANTENIMIENTO: espacios, inventario, estadísticas (NO reservas, NO usuarios, NO auditoria)
        if (rol == Usuario.RolApp.MANTENIMIENTO) {
            if (vistaPrefs.containsKey("espaciosViewMode")) filtradas.put("espaciosViewMode", vistaPrefs.get("espaciosViewMode"));
            if (vistaPrefs.containsKey("espaciosPageSize")) filtradas.put("espaciosPageSize", vistaPrefs.get("espaciosPageSize"));
            if (vistaPrefs.containsKey("inventarioViewMode")) filtradas.put("inventarioViewMode", vistaPrefs.get("inventarioViewMode"));
            if (vistaPrefs.containsKey("inventarioPageSize")) filtradas.put("inventarioPageSize", vistaPrefs.get("inventarioPageSize"));
            return filtradas;
        }
        
        // ESTUDIANTE y EXTERNO: ninguna preferencia de vista relevante
        return filtradas;
    }
}

