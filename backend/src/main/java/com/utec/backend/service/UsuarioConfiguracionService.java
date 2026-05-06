package com.utec.backend.service;

import com.utec.backend.dto.preferencias.PreferenciasCompletasDto;
import com.utec.backend.dto.preferencias.PreferenciasEmailDto;
import com.utec.backend.dto.preferencias.PreferenciasVistaDto;
import com.utec.backend.model.Usuario;
import com.utec.backend.model.UsuarioConfiguracion;
import com.utec.backend.repository.UsuarioConfiguracionRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Slf4j
public class UsuarioConfiguracionService {

    private static final String MSG_USUARIO_NO_ENCONTRADO = "Usuario no encontrado: ";

    // Claves del mapa de preferencias (categorías)
    private static final String KEY_EMAIL = "email";
    private static final String KEY_VISTA = "vista";

    // Tipos de email
    private static final String EMAIL_VERIFICACION = "verificacion";
    private static final String EMAIL_RESTABLECIMIENTO_PASSWORD = "restablecimientoPassword";
    private static final String EMAIL_CAMBIO_EMAIL = "cambioEmail";
    private static final String EMAIL_CAMBIO_ROL = "cambioRol";
    private static final String EMAIL_CAMBIO_ESTADO = "cambioEstado";
    private static final String EMAIL_RESERVA_APROBADA = "reservaAprobada";
    private static final String EMAIL_RESERVA_RECHAZADA = "reservaRechazada";
    private static final String EMAIL_RESERVA_CANCELADA = "reservaCancelada";
    private static final String EMAIL_RESERVA_ACTUALIZADA = "reservaActualizada";
    private static final String EMAIL_NUEVA_SOLICITUD_RESERVA = "nuevaSolicitudReserva";
    private static final String EMAIL_RECORDATORIO_RESERVA = "recordatorioReserva";
    private static final String EMAIL_NUEVA_SOLICITUD_INVENTARIO = "nuevaSolicitudInventario";
    private static final String EMAIL_ESTADO_SOLICITUD_INVENTARIO = "estadoSolicitudInventario";

    // Claves de preferencias de vista
    private static final String VISTA_RESERVAS_VIEW_MODE = "reservasViewMode";
    private static final String VISTA_RESERVAS_CALENDAR_VIEW_MODE = "reservasCalendarViewMode";
    private static final String VISTA_RESERVAS_PAGE_SIZE = "reservasPageSize";
    private static final String VISTA_ESPACIOS_VIEW_MODE = "espaciosViewMode";
    private static final String VISTA_ESPACIOS_PAGE_SIZE = "espaciosPageSize";
    private static final String VISTA_INVENTARIO_VIEW_MODE = "inventarioViewMode";
    private static final String VISTA_INVENTARIO_PAGE_SIZE = "inventarioPageSize";

    private final UsuarioConfiguracionRepository configuracionRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioConfiguracionService self;

    public UsuarioConfiguracionService(
            UsuarioConfiguracionRepository configuracionRepository,
            UsuarioRepository usuarioRepository,
            @Lazy @Autowired UsuarioConfiguracionService self) {
        this.configuracionRepository = configuracionRepository;
        this.usuarioRepository = usuarioRepository;
        this.self = self;
    }

    /**
     * Obtiene o crea las preferencias del usuario con valores por defecto
     */
    @Transactional
    public PreferenciasCompletasDto obtenerPreferencias(String userEmail) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new com.utec.backend.exception.UsuarioNotFoundException(MSG_USUARIO_NO_ENCONTRADO + userEmail));
        
        UsuarioConfiguracion config = obtenerOcrearConfiguracion(usuario);
        
        return new PreferenciasCompletasDto(config.getPreferencias());
    }

    /**
     * Obtiene solo las preferencias de email filtradas por rol
     */
    @Transactional
    public PreferenciasEmailDto obtenerPreferenciasEmail(String userEmail) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new com.utec.backend.exception.UsuarioNotFoundException(MSG_USUARIO_NO_ENCONTRADO + userEmail));
        
        UsuarioConfiguracion config = obtenerOcrearConfiguracion(usuario);
        
        Map<String, Boolean> emailPrefs = readBooleanMap(config.getPreferencias(), KEY_EMAIL);

        // Obtener lista de emails permitidos para este rol
        Set<String> emailsPermitidos = obtenerEmailsPermitidosPorRol(usuario.getRolApp());
        
        // Construir el mapa con las preferencias del usuario (o true por defecto)
        Map<String, Boolean> emailPrefsFiltradas = new HashMap<>();
        for (String key : emailsPermitidos) {
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
                .orElseThrow(() -> new com.utec.backend.exception.UsuarioNotFoundException(MSG_USUARIO_NO_ENCONTRADO + userEmail));
        
        UsuarioConfiguracion config = obtenerOcrearConfiguracion(usuario);
        
        Map<String, Object> vistaPrefs = readObjectMap(config.getPreferencias(), KEY_VISTA);

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
                .orElseThrow(() -> new com.utec.backend.exception.UsuarioNotFoundException(MSG_USUARIO_NO_ENCONTRADO + userEmail));
        
        UsuarioConfiguracion config = obtenerOcrearConfiguracion(usuario);
        
        Map<String, Boolean> emailPrefs = dto.getEmail();
        
        Map<String, Object> preferencias = config.getPreferencias();
        preferencias.put(KEY_EMAIL, emailPrefs);
        
        config.setPreferencias(preferencias);
        configuracionRepository.save(config);
        
        log.info("Preferencias de email actualizadas para usuario: {}", userEmail);
        
        return self.obtenerPreferenciasEmail(userEmail);
    }

    /**
     * Actualiza las preferencias de vista
     */
    @Transactional
    public PreferenciasVistaDto actualizarPreferenciasVista(String userEmail, PreferenciasVistaDto dto) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new com.utec.backend.exception.UsuarioNotFoundException(MSG_USUARIO_NO_ENCONTRADO + userEmail));
        
        UsuarioConfiguracion config = obtenerOcrearConfiguracion(usuario);
        
        // Filtrar las preferencias de vista según el rol antes de guardar
        Map<String, Object> vistaPrefsFiltradas = filtrarPreferenciasVistaPorRol(dto.getVista(), usuario.getRolApp());
        
        Map<String, Object> preferencias = config.getPreferencias();
        preferencias.put(KEY_VISTA, vistaPrefsFiltradas);
        
        config.setPreferencias(preferencias);
        configuracionRepository.save(config);
        
        log.info("Preferencias de vista actualizadas para usuario: {}", userEmail);
        
        return self.obtenerPreferenciasVista(userEmail);
    }

    /**
     * Verifica si debe enviar un email según las preferencias del usuario
     * Los emails obligatorios siempre se envían (no están en las preferencias)
     */
    @Transactional(readOnly = true)
    public boolean debeEnviarEmail(String userEmail, String tipoEmail) {
        try {
            // Emails obligatorios siempre se envían
            Set<String> emailsObligatorios = getEmailsObligatorios();
            if (emailsObligatorios.contains(tipoEmail)) {
                return true;
            }
            
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
            
            Map<String, Boolean> emailPrefs = readBooleanMap(config.getPreferencias(), KEY_EMAIL);

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
     * Obtiene o crea la configuración del usuario
     * Si no existe, la crea. Si existe, la retorna para actualizar.
     */
    private UsuarioConfiguracion obtenerOcrearConfiguracion(Usuario usuario) {
        return configuracionRepository.findByUsuarioId(usuario.getId())
                .orElseGet(() -> crearConfiguracionPorDefecto(usuario));
    }

    /**
     * Crea una configuración con valores por defecto
     */
    private UsuarioConfiguracion crearConfiguracionPorDefecto(Usuario usuario) {
        Map<String, Object> preferencias = new HashMap<>();
        
        // Preferencias de email por defecto (solo configurables)
        Map<String, Boolean> emailPrefs = new HashMap<>();
        emailPrefs.put(EMAIL_RESERVA_APROBADA, true);
        emailPrefs.put(EMAIL_RESERVA_RECHAZADA, true);
        emailPrefs.put(EMAIL_RESERVA_CANCELADA, true);
        emailPrefs.put(EMAIL_RESERVA_ACTUALIZADA, true);
        emailPrefs.put(EMAIL_NUEVA_SOLICITUD_RESERVA, true);
        emailPrefs.put(EMAIL_RECORDATORIO_RESERVA, true);
        emailPrefs.put(EMAIL_NUEVA_SOLICITUD_INVENTARIO, true);
        emailPrefs.put(EMAIL_ESTADO_SOLICITUD_INVENTARIO, true);

        // Preferencias de vista por defecto
        Map<String, Object> vistaPrefs = new HashMap<>();
        vistaPrefs.put(VISTA_RESERVAS_VIEW_MODE, "calendar");
        vistaPrefs.put(VISTA_RESERVAS_CALENDAR_VIEW_MODE, "week");
        vistaPrefs.put(VISTA_RESERVAS_PAGE_SIZE, 10);
        vistaPrefs.put(VISTA_ESPACIOS_VIEW_MODE, "cards");
        vistaPrefs.put(VISTA_ESPACIOS_PAGE_SIZE, 12);
        vistaPrefs.put(VISTA_INVENTARIO_VIEW_MODE, "table");
        vistaPrefs.put(VISTA_INVENTARIO_PAGE_SIZE, 25);
        vistaPrefs.put("usuariosPageSize", 10);
        vistaPrefs.put("auditoriaPageSize", 20);

        preferencias.put(KEY_EMAIL, emailPrefs);
        preferencias.put(KEY_VISTA, vistaPrefs);
        
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
            EMAIL_VERIFICACION, EMAIL_RESTABLECIMIENTO_PASSWORD, "recuperacionPassword",
            EMAIL_CAMBIO_ROL, EMAIL_CAMBIO_ESTADO, EMAIL_CAMBIO_EMAIL
        );
    }

    /**
     * Obtiene la lista de emails permitidos para un rol específico
     */
    private Set<String> obtenerEmailsPermitidosPorRol(Usuario.RolApp rol) {
        Set<String> emailsPermitidos = new HashSet<>();
        
        // Todos los roles pueden recibir estos
        Set<String> todosLosRoles = Set.of(
            EMAIL_VERIFICACION, EMAIL_RESTABLECIMIENTO_PASSWORD, EMAIL_CAMBIO_ROL,
            EMAIL_CAMBIO_ESTADO, EMAIL_CAMBIO_EMAIL
        );
        emailsPermitidos.addAll(todosLosRoles);

        // Solo DOCENTE
        if (rol == Usuario.RolApp.DOCENTE || rol == Usuario.RolApp.ADMIN) {
            emailsPermitidos.addAll(Set.of(
                EMAIL_RESERVA_APROBADA, EMAIL_RESERVA_RECHAZADA, EMAIL_RESERVA_ACTUALIZADA,
                EMAIL_RECORDATORIO_RESERVA, EMAIL_ESTADO_SOLICITUD_INVENTARIO
            ));
        }

        // Solo ANALISTA
        if (rol == Usuario.RolApp.ANALISTA || rol == Usuario.RolApp.ADMIN) {
            emailsPermitidos.addAll(Set.of(
                EMAIL_NUEVA_SOLICITUD_RESERVA, EMAIL_RESERVA_CANCELADA, EMAIL_RESERVA_ACTUALIZADA
            ));
        }

        // Solo MANTENIMIENTO
        if (rol == Usuario.RolApp.MANTENIMIENTO || rol == Usuario.RolApp.ADMIN) {
            emailsPermitidos.add(EMAIL_NUEVA_SOLICITUD_INVENTARIO);
        }
        
        return emailsPermitidos;
    }


    /**
     * Verifica si un tipo de email está permitido para un rol
     */
    private boolean esTipoEmailPermitidoParaRol(String tipoEmail, Usuario.RolApp rol) {
        Set<String> todosLosRoles = Set.of(
            EMAIL_VERIFICACION, EMAIL_RESTABLECIMIENTO_PASSWORD, EMAIL_CAMBIO_ROL,
            EMAIL_CAMBIO_ESTADO, EMAIL_CAMBIO_EMAIL
        );

        Set<String> soloDocente = Set.of(
            EMAIL_RESERVA_APROBADA, EMAIL_RESERVA_RECHAZADA, EMAIL_RESERVA_ACTUALIZADA,
            EMAIL_RECORDATORIO_RESERVA, EMAIL_ESTADO_SOLICITUD_INVENTARIO
        );

        Set<String> soloAnalista = Set.of(
            EMAIL_NUEVA_SOLICITUD_RESERVA, EMAIL_RESERVA_CANCELADA, EMAIL_RESERVA_ACTUALIZADA
        );

        Set<String> soloMantenimiento = Set.of(EMAIL_NUEVA_SOLICITUD_INVENTARIO);
        
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
    private static final List<String> CLAVES_RESERVAS = List.of(
            VISTA_RESERVAS_VIEW_MODE,
            VISTA_RESERVAS_CALENDAR_VIEW_MODE,
            VISTA_RESERVAS_PAGE_SIZE);

    private static final List<String> CLAVES_ESPACIOS = List.of(
            VISTA_ESPACIOS_VIEW_MODE,
            VISTA_ESPACIOS_PAGE_SIZE);

    private static final List<String> CLAVES_INVENTARIO = List.of(
            VISTA_INVENTARIO_VIEW_MODE,
            VISTA_INVENTARIO_PAGE_SIZE);

    private static final Map<Usuario.RolApp, List<String>> CLAVES_PERMITIDAS_POR_ROL = Map.of(
            Usuario.RolApp.ANALISTA, concatenar(CLAVES_RESERVAS, CLAVES_ESPACIOS, CLAVES_INVENTARIO),
            Usuario.RolApp.DOCENTE, CLAVES_RESERVAS,
            Usuario.RolApp.MANTENIMIENTO, concatenar(CLAVES_ESPACIOS, CLAVES_INVENTARIO));

    @SafeVarargs
    private static List<String> concatenar(List<String>... listas) {
        List<String> all = new ArrayList<>();
        for (List<String> l : listas) {
            all.addAll(l);
        }
        return List.copyOf(all);
    }

    private Map<String, Object> filtrarPreferenciasVistaPorRol(Map<String, Object> vistaPrefs, Usuario.RolApp rol) {
        if (rol == Usuario.RolApp.ADMIN) {
            return vistaPrefs;
        }
        List<String> clavesPermitidas = CLAVES_PERMITIDAS_POR_ROL.getOrDefault(rol, List.of());
        return copiarClavesPermitidas(vistaPrefs, clavesPermitidas);
    }

    private Map<String, Object> copiarClavesPermitidas(Map<String, Object> origen, List<String> claves) {
        Map<String, Object> filtradas = new HashMap<>();
        for (String clave : claves) {
            if (origen.containsKey(clave)) {
                filtradas.put(clave, origen.get(clave));
            }
        }
        return filtradas;
    }

    /**
     * Extrae el sub-mapa {@code String → Boolean} bajo la clave indicada, validando
     * tipos en runtime. Permite trabajar con el JSON deserializado sin casts unchecked.
     */
    private static Map<String, Boolean> readBooleanMap(Map<String, Object> source, String key) {
        Object raw = source.get(key);
        Map<String, Boolean> result = new HashMap<>();
        if (raw instanceof Map<?, ?> map) {
            map.forEach((k, v) -> {
                if (k instanceof String sk && v instanceof Boolean bv) {
                    result.put(sk, bv);
                }
            });
        }
        return result;
    }

    /**
     * Extrae el sub-mapa {@code String → Object} bajo la clave indicada, validando
     * la clave en runtime. Permite trabajar con el JSON deserializado sin casts unchecked.
     */
    private static Map<String, Object> readObjectMap(Map<String, Object> source, String key) {
        Object raw = source.get(key);
        Map<String, Object> result = new HashMap<>();
        if (raw instanceof Map<?, ?> map) {
            map.forEach((k, v) -> {
                if (k instanceof String sk) {
                    result.put(sk, v);
                }
            });
        }
        return result;
    }
}

