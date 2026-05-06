package com.utec.backend.service;

import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Servicio para el envío de emails usando Gmail API
 */
@Service
@Slf4j
public class EmailService {

    // Claves de variables usadas en los templates HTML
    private static final String VAR_FRONTEND_URL = "frontendUrl";
    private static final String VAR_ESPACIO_NOMBRE = "espacioNombre";
    private static final String VAR_USUARIO_NOMBRE = "usuarioNombre";
    private static final String VAR_USUARIO_EMAIL = "usuarioEmail";
    private static final String VAR_FECHA_INICIO = "fechaInicio";
    private static final String VAR_FECHA_FIN = "fechaFin";
    private static final String VAR_NOMBRE_USUARIO = "nombreUsuario";

    // Valor por defecto cuando un campo de usuario es null
    private static final String DEFAULT_USUARIO = "Usuario";

    // Patrón de fecha para emails
    private static final String DATE_PATTERN = "dd/MM/yyyy HH:mm";

    // Colores HTML reutilizados en los emails de estado/notificación
    private static final String COLOR_ROJO_FONDO = "#f8d7da";
    private static final String COLOR_VERDE_FONDO = "#d1f2eb";
    private static final String COLOR_VERDE_BORDE = "#10b981";

    @Nullable
    private final GmailApiService gmailApiService;

    private final UsuarioRepository usuarioRepository;
    private final UsuarioConfiguracionService configuracionService;
    private final EmailTemplateService emailTemplateService;

    public EmailService(
            UsuarioRepository usuarioRepository,
            UsuarioConfiguracionService configuracionService,
            EmailTemplateService emailTemplateService,
            @Autowired(required = false) @Nullable GmailApiService gmailApiService) {
        this.usuarioRepository = usuarioRepository;
        this.configuracionService = configuracionService;
        this.gmailApiService = gmailApiService;
        this.emailTemplateService = emailTemplateService;
    }

    @Value("${gmail.api.from-email:usm.utec.uy@gmail.com}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    @Value("${app.timezone:America/Montevideo}")
    private String appTimezone;

    /**
     * Verifica si el servicio de email está disponible
     */
    private boolean isEmailAvailable() {
        return gmailApiService != null && gmailApiService.isAvailable();
    }

    /**
     * Envía un email HTML de forma segura (chequea disponibilidad primero)
     */
    private boolean sendHtmlEmailSafe(String to, String subject, String htmlBody) {
        if (!isEmailAvailable()) {
            log.warn("Cannot send email to {}: Gmail API is not available", to);
            return false;
        }
        return sendHtmlEmailSafe(to, subject, htmlBody);
    }

    /**
     * Verifica la configuración de email enviando un email de prueba
     *
     * @param to Email del destinatario para la prueba
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean verificarConfiguracionEmail(String to) {
        if (!isEmailAvailable()) {
            log.warn("Cannot send verification email to {}: Gmail API is not available", to);
            return false;
        }
        return gmailApiService.verificarConfiguracionGmailApi(to);
    }

    /**
     * Verifica el email del usuario y marca su cuenta como verificada
     *
     * @param email Email del usuario a verificar
     * @return true si se verificó correctamente, false si no se encontró el usuario
     */
    public boolean verificarEmailUsuario(String email) {
        try {
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            if (usuarioOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                usuario.setVerificado(true);
                usuarioRepository.save(usuario);
                log.info("Usuario {} verificado exitosamente", email);
                return true;
            } else {
                log.warn("Usuario con email {} no encontrado para verificación", email);
                return false;
            }
        } catch (Exception e) {
            log.error("Error al verificar usuario con email {}: {}", email, e.getMessage());
            return false;
        }
    }

    /**
     * Envía email de verificación con enlace usando Gmail API
     *
     * @param to Email del destinatario
     * @param verificationToken Token de verificación
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailVerificacion(String to, String verificationToken) {
        if (!configuracionService.debeEnviarEmail(to, "verificacion")) {
            log.debug("Email de verificación no enviado a {} por preferencias del usuario", to);
            return false;
        }
        
        String subject = "Verifica tu cuenta - UTEC Space Manager";
        String verificationUrl = frontendUrl + "/auth/verify?token=" + verificationToken;
        
        Map<String, String> variables = new HashMap<>();
        variables.put("verificationUrl", verificationUrl);
        
        String htmlContent = emailTemplateService.loadTemplate("verificacion.html", variables);
        String htmlBody = emailTemplateService.wrapInBaseTemplate(htmlContent, subject, backendUrl);

        return sendHtmlEmailSafe(to, subject, htmlBody);
    }

    /**
     * Envía email de recuperación de contraseña con enlace usando Gmail API
     *
     * @param to Email del destinatario
     * @param resetToken Token de recuperación de contraseña
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailRecuperacionPassword(String to, String resetToken) {
        if (!configuracionService.debeEnviarEmail(to, "recuperacionPassword")) {
            log.warn("Email de recuperación de contraseña no enviado a {} por preferencias del usuario", to);
            return false;
        }
        
        String subject = "Recuperación de contraseña - UTEC Space Manager";
        String resetUrl = frontendUrl + "/auth/reset-password?token=" + resetToken;
        
        Map<String, String> variables = new HashMap<>();
        variables.put("resetUrl", resetUrl);
        
        String htmlContent = emailTemplateService.loadTemplate("recuperacion-password.html", variables);
        String htmlBody = emailTemplateService.wrapInBaseTemplate(htmlContent, subject, backendUrl);

        boolean enviado = sendHtmlEmailSafe(to, subject, htmlBody);
        if (!enviado) {
            log.error("Error al enviar email de recuperación de contraseña a {}: Gmail API retornó false", to);
        }
        return enviado;
    }

    /**
     * Envía email con contraseña temporal restablecida por admin
     *
     * @param to Email del destinatario
     * @param nuevaPassword Nueva contraseña temporal
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailRestablecimientoPassword(String to, String nuevaPassword) {
        if (!configuracionService.debeEnviarEmail(to, "restablecimientoPassword")) {
            log.debug("Email de restablecimiento de contraseña no enviado a {} por preferencias del usuario", to);
            return false;
        }
        String subject = "Tu contraseña ha sido restablecida - UTEC Space Manager";
        
        Map<String, String> variables = new HashMap<>();
        variables.put("nuevaPassword", nuevaPassword);
        variables.put(VAR_FRONTEND_URL, frontendUrl);
        
        String htmlContent = emailTemplateService.loadTemplate("restablecimiento-password.html", variables);
        String htmlBody = emailTemplateService.wrapInBaseTemplate(htmlContent, subject, backendUrl);

        return sendHtmlEmailSafe(to, subject, htmlBody);
    }

    /**
     * Envía email de notificación al analista cuando un docente crea una nueva solicitud
     *
     * @param to Email del analista
     * @param reserva DTO de la reserva creada
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailNotificacionNuevaSolicitud(String to, ReservaResponseDto reserva) {
        if (!configuracionService.debeEnviarEmail(to, "nuevaSolicitudReserva")) {
            log.debug("Email de nueva solicitud no enviado a {} por preferencias del usuario", to);
            return false;
        }
        String subject = "Nueva solicitud de reserva - UTEC Space Manager";
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DATE_PATTERN).withZone(ZoneId.of(appTimezone));
        String fechaInicio = formatter.format(reserva.getInicio());
        String fechaFin = formatter.format(reserva.getFin());
        
        Map<String, String> variables = new HashMap<>();
        variables.put(VAR_ESPACIO_NOMBRE, reserva.getEspacioNombre() != null ? reserva.getEspacioNombre() : "N/A");
        variables.put(VAR_USUARIO_NOMBRE, reserva.getUsuarioNombre() != null ? reserva.getUsuarioNombre() : "N/A");
        variables.put(VAR_USUARIO_EMAIL, reserva.getUsuarioEmail() != null ? reserva.getUsuarioEmail() : "N/A");
        variables.put(VAR_FECHA_INICIO, fechaInicio);
        variables.put(VAR_FECHA_FIN, fechaFin);
        variables.put(VAR_FRONTEND_URL, frontendUrl);
        
        String htmlContent = emailTemplateService.loadTemplate("nueva-solicitud-reserva.html", variables);
        String htmlBody = emailTemplateService.wrapInBaseTemplate(htmlContent, subject, backendUrl);

        return sendHtmlEmailSafe(to, subject, htmlBody);
    }

    /**
     * Envía email de notificación al usuario cuando su reserva es aprobada
     *
     * @param to Email del usuario
     * @param reserva DTO de la reserva aprobada
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailNotificacionReservaAprobada(String to, ReservaResponseDto reserva) {
        if (!configuracionService.debeEnviarEmail(to, "reservaAprobada")) {
            log.debug("Email de reserva aprobada no enviado a {} por preferencias del usuario", to);
            return false;
        }
        String subject = "Tu reserva ha sido aprobada - UTEC Space Manager";
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DATE_PATTERN).withZone(ZoneId.of(appTimezone));
        String fechaInicio = formatter.format(reserva.getInicio());
        String fechaFin = formatter.format(reserva.getFin());
        
        Map<String, String> variables = new HashMap<>();
        variables.put(VAR_USUARIO_NOMBRE, reserva.getUsuarioNombre() != null ? reserva.getUsuarioNombre() : DEFAULT_USUARIO);
        variables.put(VAR_ESPACIO_NOMBRE, reserva.getEspacioNombre() != null ? reserva.getEspacioNombre() : "N/A");
        variables.put(VAR_FECHA_INICIO, fechaInicio);
        variables.put(VAR_FECHA_FIN, fechaFin);
        variables.put(VAR_FRONTEND_URL, frontendUrl);
        
        String htmlContent = emailTemplateService.loadTemplate("reserva-aprobada.html", variables);
        String htmlBody = emailTemplateService.wrapInBaseTemplate(htmlContent, subject, backendUrl);

        return sendHtmlEmailSafe(to, subject, htmlBody);
    }

    /**
     * Envía email de notificación al usuario cuando su reserva es rechazada
     *
     * @param to Email del usuario
     * @param reserva DTO de la reserva rechazada
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailNotificacionReservaRechazada(String to, ReservaResponseDto reserva) {
        if (!configuracionService.debeEnviarEmail(to, "reservaRechazada")) {
            log.debug("Email de reserva rechazada no enviado a {} por preferencias del usuario", to);
            return false;
        }
        String subject = "Tu solicitud de reserva ha sido rechazada - UTEC Space Manager";
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DATE_PATTERN).withZone(ZoneId.of(appTimezone));
        String fechaInicio = formatter.format(reserva.getInicio());
        String fechaFin = formatter.format(reserva.getFin());
        
        Map<String, String> variables = new HashMap<>();
        variables.put(VAR_USUARIO_NOMBRE, reserva.getUsuarioNombre() != null ? reserva.getUsuarioNombre() : DEFAULT_USUARIO);
        variables.put(VAR_ESPACIO_NOMBRE, reserva.getEspacioNombre() != null ? reserva.getEspacioNombre() : "N/A");
        variables.put(VAR_FECHA_INICIO, fechaInicio);
        variables.put(VAR_FECHA_FIN, fechaFin);
        variables.put(VAR_FRONTEND_URL, frontendUrl);
        
        String htmlContent = emailTemplateService.loadTemplate("reserva-rechazada.html", variables);
        String htmlBody = emailTemplateService.wrapInBaseTemplate(htmlContent, subject, backendUrl);

        return sendHtmlEmailSafe(to, subject, htmlBody);
    }

    /**
     * Envía email de notificación al analista cuando un usuario cancela su reserva
     *
     * @param to Email del analista
     * @param reserva DTO de la reserva cancelada
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailNotificacionReservaCancelada(String to, ReservaResponseDto reserva) {
        if (!configuracionService.debeEnviarEmail(to, "reservaCancelada")) {
            log.debug("Email de reserva cancelada no enviado a {} por preferencias del usuario", to);
            return false;
        }
        String subject = "Reserva cancelada - UTEC Space Manager";
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DATE_PATTERN).withZone(ZoneId.of(appTimezone));
        String fechaInicio = formatter.format(reserva.getInicio());
        String fechaFin = formatter.format(reserva.getFin());
        
        Map<String, String> variables = new HashMap<>();
        variables.put(VAR_ESPACIO_NOMBRE, reserva.getEspacioNombre() != null ? reserva.getEspacioNombre() : "N/A");
        variables.put(VAR_USUARIO_NOMBRE, reserva.getUsuarioNombre() != null ? reserva.getUsuarioNombre() : "N/A");
        variables.put(VAR_USUARIO_EMAIL, reserva.getUsuarioEmail() != null ? reserva.getUsuarioEmail() : "N/A");
        variables.put(VAR_FECHA_INICIO, fechaInicio);
        variables.put(VAR_FECHA_FIN, fechaFin);
        variables.put(VAR_FRONTEND_URL, frontendUrl);
        
        String htmlContent = emailTemplateService.loadTemplate("reserva-cancelada.html", variables);
        String htmlBody = emailTemplateService.wrapInBaseTemplate(htmlContent, subject, backendUrl);

        return sendHtmlEmailSafe(to, subject, htmlBody);
    }

    /**
     * Envía email de recordatorio al usuario antes de su reserva
     *
     * @param to Email del usuario
     * @param reserva DTO de la reserva
     * @param horasAntes Horas antes de la reserva (ej: 24)
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailRecordatorioReserva(String to, ReservaResponseDto reserva, int horasAntes) {
        if (!configuracionService.debeEnviarEmail(to, "recordatorioReserva")) {
            log.debug("Email de recordatorio de reserva no enviado a {} por preferencias del usuario", to);
            return false;
        }
        String subject = "Recordatorio: Tienes una reserva en " + horasAntes + " horas - UTEC Space Manager";
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DATE_PATTERN).withZone(ZoneId.of(appTimezone));
        String fechaInicio = formatter.format(reserva.getInicio());
        String fechaFin = formatter.format(reserva.getFin());
        
        Map<String, String> variables = new HashMap<>();
        variables.put(VAR_USUARIO_NOMBRE, reserva.getUsuarioNombre() != null ? reserva.getUsuarioNombre() : DEFAULT_USUARIO);
        variables.put(VAR_ESPACIO_NOMBRE, reserva.getEspacioNombre() != null ? reserva.getEspacioNombre() : "N/A");
        variables.put(VAR_FECHA_INICIO, fechaInicio);
        variables.put(VAR_FECHA_FIN, fechaFin);
        variables.put("horasAntes", String.valueOf(horasAntes));
        variables.put(VAR_FRONTEND_URL, frontendUrl);
        
        String htmlContent = emailTemplateService.loadTemplate("recordatorio-reserva.html", variables);
        String htmlBody = emailTemplateService.wrapInBaseTemplate(htmlContent, subject, backendUrl);

        return sendHtmlEmailSafe(to, subject, htmlBody);
    }

    /**
     * Envía email de notificación cuando un admin cambia el rol de un usuario
     *
     * @param to Email del usuario
     * @param nombreUsuario Nombre del usuario
     * @param rolAnterior Rol anterior del usuario
     * @param rolNuevo Nuevo rol del usuario
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailNotificacionCambioRol(String to, String nombreUsuario, String rolAnterior, String rolNuevo) {
        if (!configuracionService.debeEnviarEmail(to, "cambioRol")) {
            log.debug("Email de cambio de rol no enviado a {} por preferencias del usuario", to);
            return false;
        }
        String subject = "Tu rol ha sido actualizado - UTEC Space Manager";
        
        Map<String, String> variables = new HashMap<>();
        variables.put(VAR_NOMBRE_USUARIO, nombreUsuario != null ? nombreUsuario : DEFAULT_USUARIO);
        variables.put("rolAnterior", rolAnterior != null ? rolAnterior : "N/A");
        variables.put("rolNuevo", rolNuevo != null ? rolNuevo : "N/A");
        variables.put(VAR_FRONTEND_URL, frontendUrl);
        
        String htmlContent = emailTemplateService.loadTemplate("cambio-rol.html", variables);
        String htmlBody = emailTemplateService.wrapInBaseTemplate(htmlContent, subject, backendUrl);

        return sendHtmlEmailSafe(to, subject, htmlBody);
    }

    /**
     * Envía email de notificación cuando un admin activa o desactiva un usuario
     *
     * @param to Email del usuario
     * @param nombreUsuario Nombre del usuario
     * @param activado true si fue activado, false si fue desactivado
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailNotificacionCambioEstado(String to, String nombreUsuario, boolean activado) {
        if (!configuracionService.debeEnviarEmail(to, "cambioEstado")) {
            log.debug("Email de cambio de estado no enviado a {} por preferencias del usuario", to);
            return false;
        }
        String subject = activado 
            ? "Tu cuenta ha sido activada - UTEC Space Manager"
            : "Tu cuenta ha sido desactivada - UTEC Space Manager";
        
        String accion = activado ? "activada" : "desactivada";
        String mensaje = activado 
            ? "Tu cuenta ha sido activada y ahora puedes acceder al sistema normalmente."
            : "Tu cuenta ha sido desactivada. Ya no podrás acceder al sistema. Si crees que esto es un error, por favor contacta al administrador.";
        
        Map<String, String> variables = new HashMap<>();
        variables.put("tituloEstado", subject);
        variables.put(VAR_NOMBRE_USUARIO, nombreUsuario != null ? nombreUsuario : DEFAULT_USUARIO);
        variables.put("mensaje", mensaje);
        variables.put("accion", accion);
        variables.put("mensajeAdicional", activado 
            ? "Si tienes alguna pregunta, por favor contacta al administrador del sistema."
            : "Si tienes alguna pregunta o crees que esto es un error, por favor contacta al administrador del sistema inmediatamente.");
        variables.put(VAR_FRONTEND_URL, frontendUrl);
        variables.put("colorFondo", activado ? COLOR_VERDE_FONDO : COLOR_ROJO_FONDO);
        variables.put("colorBorde", activado ? COLOR_VERDE_BORDE : "#dc3545");
        variables.put("colorMensajeFondo", activado ? "#dbeafe" : "#fff3cd");
        variables.put("colorMensajeBorde", activado ? "#3b82f6" : "#ffc107");
        variables.put("colorMensajeTexto", activado ? "#1e40af" : "#856404");
        
        String htmlContent = emailTemplateService.loadTemplate("cambio-estado.html", variables);
        String htmlBody = emailTemplateService.wrapInBaseTemplate(htmlContent, subject, backendUrl);

        return sendHtmlEmailSafe(to, subject, htmlBody);
    }

    /**
     * Envía email de notificación cuando un admin cambia el email de un usuario
     *
     * @param toEmailViejo Email anterior del usuario
     * @param toEmailNuevo Email nuevo del usuario
     * @param nombreUsuario Nombre del usuario
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailNotificacionCambioEmail(String toEmailViejo, String toEmailNuevo, String nombreUsuario) {
        boolean enviarViejo = configuracionService.debeEnviarEmail(toEmailViejo, "cambioEmail");
        boolean enviarNuevo = configuracionService.debeEnviarEmail(toEmailNuevo, "cambioEmail");

        if (!enviarViejo && !enviarNuevo) {
            log.debug("Email de cambio de email no enviado por preferencias del usuario");
            return false;
        }
        String subject = "Tu email ha sido actualizado - UTEC Space Manager";

        boolean enviadoViejo = !enviarViejo
                || enviarCambioEmailA(toEmailViejo, toEmailViejo, toEmailNuevo, nombreUsuario, subject);
        boolean enviadoNuevo = !enviarNuevo
                || enviarCambioEmailA(toEmailNuevo, toEmailViejo, toEmailNuevo, nombreUsuario, subject);

        return enviadoViejo && enviadoNuevo;
    }

    private boolean enviarCambioEmailA(String destinatario, String emailViejo, String emailNuevo,
                                       String nombreUsuario, String subject) {
        Map<String, String> variables = new HashMap<>();
        variables.put(VAR_NOMBRE_USUARIO, nombreUsuario != null ? nombreUsuario : DEFAULT_USUARIO);
        variables.put("emailViejo", emailViejo != null ? emailViejo : "N/A");
        variables.put("emailNuevo", emailNuevo != null ? emailNuevo : "N/A");
        variables.put(VAR_FRONTEND_URL, frontendUrl);

        String htmlContent = emailTemplateService.loadTemplate("cambio-email.html", variables);
        String htmlBody = emailTemplateService.wrapInBaseTemplate(htmlContent, subject, frontendUrl);
        return sendHtmlEmailSafe(destinatario, subject, htmlBody);
    }

    /**
     * Envía email de notificación cuando se actualiza una reserva (cambios de horario)
     *
     * @param toEmail Email del destinatario (usuario o analista)
     * @param reserva DTO de la reserva actualizada
     * @param horarioAnterior Fecha/hora anterior (formato string)
     * @param esAnalista true si el destinatario es el analista, false si es el usuario
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailNotificacionReservaActualizada(String toEmail, ReservaResponseDto reserva, String horarioAnterior, boolean esAnalista) {
        if (!configuracionService.debeEnviarEmail(toEmail, "reservaActualizada")) {
            log.debug("Email de reserva actualizada no enviado a {} por preferencias del usuario", toEmail);
            return false;
        }
        String subject = "Reserva actualizada - UTEC Space Manager";
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DATE_PATTERN).withZone(ZoneId.of(appTimezone));
        String fechaInicioNueva = formatter.format(reserva.getInicio());
        String fechaFinNueva = formatter.format(reserva.getFin());
        
        String destinatario;
        if (esAnalista) {
            destinatario = "Hola,";
        } else {
            String nombreUsuario = reserva.getUsuarioNombre() != null ? reserva.getUsuarioNombre() : DEFAULT_USUARIO;
            destinatario = "Hola " + nombreUsuario + ",";
        }
        String mensaje = esAnalista 
            ? "Se ha actualizado una reserva que está asignada a ti."
            : "Tu reserva ha sido actualizada.";
        
        Map<String, String> variables = new HashMap<>();
        variables.put("destinatario", destinatario);
        variables.put("mensaje", mensaje);
        variables.put(VAR_ESPACIO_NOMBRE, reserva.getEspacioNombre() != null ? reserva.getEspacioNombre() : "N/A");
        variables.put("horarioAnterior", horarioAnterior != null ? horarioAnterior : "N/A");
        variables.put("fechaInicioNueva", fechaInicioNueva);
        variables.put("fechaFinNueva", fechaFinNueva);
        variables.put("estado", reserva.getEstado() != null ? reserva.getEstado().toString() : "N/A");
        variables.put("mensajeAdicional", esAnalista 
            ? "Por favor, revisa los cambios y contacta al usuario si es necesario."
            : "Por favor, ten en cuenta el nuevo horario de tu reserva.");
        variables.put(VAR_FRONTEND_URL, frontendUrl);
        
        String htmlContent = emailTemplateService.loadTemplate("reserva-actualizada.html", variables);
        String htmlBody = emailTemplateService.wrapInBaseTemplate(htmlContent, subject, backendUrl);

        return sendHtmlEmailSafe(toEmail, subject, htmlBody);
    }

    /**
     * Envía email de notificación a personal de mantenimiento cuando hay una nueva solicitud de inventario
     *
     * @param to Email del personal de mantenimiento
     * @param reserva DTO de la reserva con items solicitados
     * @param cantidadItems Cantidad de items solicitados
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailNotificacionNuevaSolicitudInventario(String to, ReservaResponseDto reserva, int cantidadItems) {
        if (!configuracionService.debeEnviarEmail(to, "nuevaSolicitudInventario")) {
            log.debug("Email de nueva solicitud de inventario no enviado a {} por preferencias del usuario", to);
            return false;
        }
        String subject = "Nueva solicitud de inventario - UTEC Space Manager";
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DATE_PATTERN).withZone(ZoneId.of(appTimezone));
        String fechaInicio = formatter.format(reserva.getInicio());
        String fechaFin = formatter.format(reserva.getFin());
        
        Map<String, String> variables = new HashMap<>();
        variables.put("reservaId", reserva.getId() != null ? reserva.getId().toString() : "N/A");
        variables.put(VAR_ESPACIO_NOMBRE, reserva.getEspacioNombre() != null ? reserva.getEspacioNombre() : "N/A");
        variables.put(VAR_USUARIO_NOMBRE, reserva.getUsuarioNombre() != null ? reserva.getUsuarioNombre() : "N/A");
        variables.put(VAR_USUARIO_EMAIL, reserva.getUsuarioEmail() != null ? reserva.getUsuarioEmail() : "N/A");
        variables.put(VAR_FECHA_INICIO, fechaInicio);
        variables.put(VAR_FECHA_FIN, fechaFin);
        variables.put("cantidadItems", String.valueOf(cantidadItems));
        variables.put(VAR_FRONTEND_URL, frontendUrl);
        
        String htmlContent = emailTemplateService.loadTemplate("nueva-solicitud-inventario.html", variables);
        String htmlBody = emailTemplateService.wrapInBaseTemplate(htmlContent, subject, backendUrl);

        return sendHtmlEmailSafe(to, subject, htmlBody);
    }

    /**
     * Envía email de notificación al usuario cuando se actualiza el estado de su solicitud de inventario
     *
     * @param to Email del usuario
     * @param itemSolicitado DTO de la solicitud de inventario
     * @param estadoAnterior Estado anterior de la solicitud
     * @param estadoNuevo Nuevo estado de la solicitud
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailNotificacionEstadoSolicitudInventario(
            String to, 
            com.utec.backend.dto.reserva_item_solicitado.ReservaItemSolicitadoResponseDto itemSolicitado,
            String estadoAnterior,
            String estadoNuevo) {
        if (!configuracionService.debeEnviarEmail(to, "estadoSolicitudInventario")) {
            log.debug("Email de estado de solicitud de inventario no enviado a {} por preferencias del usuario", to);
            return false;
        }
        
        String subject = "Estado de tu solicitud de inventario actualizado - UTEC Space Manager";
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DATE_PATTERN).withZone(ZoneId.of(appTimezone));
        String fechaReserva = itemSolicitado.getReservaInicio() != null 
            ? formatter.format(itemSolicitado.getReservaInicio()) 
            : "N/A";
        
        String mensajeEstado = "";
        String colorFondo = "#f8f9fa";
        String colorBorde = "#6c757d";
        String colorEstadoFondo = "#f8f9fa";
        String colorEstadoTexto = "#212529";
        
        switch (estadoNuevo) {
            case "APROBADO":
                mensajeEstado = "Tu solicitud de inventario ha sido aprobada. El item será preparado para la fecha de tu reserva.";
                colorFondo = COLOR_VERDE_FONDO;
                colorBorde = COLOR_VERDE_BORDE;
                colorEstadoFondo = COLOR_VERDE_FONDO;
                colorEstadoTexto = "#065f46";
                break;
            case "RECHAZADO":
                mensajeEstado = "Lamentamos informarte que tu solicitud de inventario ha sido rechazada.";
                colorFondo = COLOR_ROJO_FONDO;
                colorBorde = "#dc3545";
                colorEstadoFondo = COLOR_ROJO_FONDO;
                colorEstadoTexto = "#721c24";
                break;
            case "ENTREGADO":
                mensajeEstado = "¡Excelente! El item de inventario ha sido entregado y está disponible para tu reserva.";
                colorFondo = COLOR_VERDE_FONDO;
                colorBorde = COLOR_VERDE_BORDE;
                colorEstadoFondo = COLOR_VERDE_FONDO;
                colorEstadoTexto = "#065f46";
                break;
            default:
                mensajeEstado = "El estado de tu solicitud de inventario ha sido actualizado.";
        }
        
        String observacionesHtml = "";
        if (itemSolicitado.getObservaciones() != null && !itemSolicitado.getObservaciones().trim().isEmpty()) {
            observacionesHtml = String.format(
                "<div style=\"margin: 20px 0; padding: 15px; background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px;\">" +
                "<p style=\"margin: 0; color: #1e40af; font-size: 14px;\"><strong>Observaciones:</strong> %s</p></div>",
                itemSolicitado.getObservaciones()
            );
        }
        
        Map<String, String> variables = new HashMap<>();
        variables.put(VAR_NOMBRE_USUARIO, itemSolicitado.getSolicitanteNombre() != null ? itemSolicitado.getSolicitanteNombre() : DEFAULT_USUARIO);
        variables.put("mensajeEstado", mensajeEstado);
        variables.put("tipoElementoNombre", itemSolicitado.getTipoElementoNombre() != null ? itemSolicitado.getTipoElementoNombre() : "N/A");
        variables.put("cantidadSolicitada", itemSolicitado.getCantidadSolicitada() != null ? itemSolicitado.getCantidadSolicitada().toString() : "N/A");
        variables.put(VAR_ESPACIO_NOMBRE, itemSolicitado.getEspacioNombre() != null ? itemSolicitado.getEspacioNombre() : "N/A");
        variables.put("fechaReserva", fechaReserva);
        variables.put("estadoAnterior", estadoAnterior != null ? estadoAnterior : "N/A");
        variables.put("estadoNuevo", estadoNuevo != null ? estadoNuevo : "N/A");
        variables.put("observaciones", observacionesHtml);
        variables.put("colorFondo", colorFondo);
        variables.put("colorBorde", colorBorde);
        variables.put("colorEstadoFondo", colorEstadoFondo);
        variables.put("colorEstadoTexto", colorEstadoTexto);
        variables.put(VAR_FRONTEND_URL, frontendUrl);
        
        String htmlContent = emailTemplateService.loadTemplate("estado-solicitud-inventario.html", variables);
        String htmlBody = emailTemplateService.wrapInBaseTemplate(htmlContent, subject, backendUrl);

        return sendHtmlEmailSafe(to, subject, htmlBody);
    }
}
