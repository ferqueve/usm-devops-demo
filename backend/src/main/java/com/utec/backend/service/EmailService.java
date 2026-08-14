package com.utec.backend.service;

import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.dto.reserva_item_solicitado.ReservaItemSolicitadoResponseDto;
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
import java.util.function.BooleanSupplier;

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
    private static final String NA = "N/A";

    // Patrón de fecha para emails
    private static final String DATE_PATTERN = "dd/MM/yyyy HH:mm";

    // Colores HTML reutilizados en los emails de estado/notificación
    private static final String COLOR_ROJO_FONDO = "#f8d7da";
    private static final String COLOR_VERDE_FONDO = "#d1f2eb";
    private static final String COLOR_VERDE_BORDE = "#10b981";
    private static final String COLOR_ROJO_BORDE = "#dc3545";
    private static final String COLOR_GRIS_FONDO = "#f8f9fa";
    private static final String COLOR_GRIS_BORDE = "#6c757d";
    private static final String COLOR_GRIS_TEXTO = "#212529";

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
        return gmailApiService.sendHtmlEmail(to, subject, htmlBody);
    }

    /**
     * Devuelve el valor o "N/A" si es null.
     */
    private static String orNa(String value) {
        return value != null ? value : NA;
    }

    /**
     * Devuelve el valor o el fallback si es null.
     */
    private static String orDefault(String value, String fallback) {
        return value != null ? value : fallback;
    }

    /**
     * Crea un formateador con la zona horaria configurada para esta instancia.
     */
    private DateTimeFormatter dateFormatter() {
        return DateTimeFormatter.ofPattern(DATE_PATTERN).withZone(ZoneId.of(appTimezone));
    }

    /**
     * Construye un mapa de variables base con la URL del frontend ya seteada.
     */
    private Map<String, String> baseVariables() {
        Map<String, String> variables = new HashMap<>();
        variables.put(VAR_FRONTEND_URL, frontendUrl);
        return variables;
    }

    /**
     * Aplica las variables comunes derivadas de una reserva (espacio, usuario, fechas).
     * Cualquier campo null se reemplaza por "N/A".
     */
    private void putReservaVariables(Map<String, String> variables, ReservaResponseDto reserva) {
        DateTimeFormatter formatter = dateFormatter();
        variables.put(VAR_ESPACIO_NOMBRE, orNa(reserva.getEspacioNombre()));
        variables.put(VAR_USUARIO_NOMBRE, orNa(reserva.getUsuarioNombre()));
        variables.put(VAR_USUARIO_EMAIL, orNa(reserva.getUsuarioEmail()));
        variables.put(VAR_FECHA_INICIO, formatter.format(reserva.getInicio()));
        variables.put(VAR_FECHA_FIN, formatter.format(reserva.getFin()));
    }

    /**
     * Renderiza el contenido del template, lo envuelve en el layout base y lo envía.
     * Usa {@code backendUrl} como base para los assets del template wrapper.
     */
    private boolean renderAndSend(String to, String subject, String templateName, Map<String, String> variables) {
        return renderAndSend(to, subject, templateName, variables, backendUrl);
    }

    private boolean renderAndSend(String to, String subject, String templateName,
                                  Map<String, String> variables, String wrapperBaseUrl) {
        String htmlContent = emailTemplateService.loadTemplate(templateName, variables);
        String htmlBody = emailTemplateService.wrapInBaseTemplate(htmlContent, subject, wrapperBaseUrl);
        return sendHtmlEmailSafe(to, subject, htmlBody);
    }

    /**
     * Aplica el filtro de preferencias del usuario y, si corresponde, ejecuta el envío.
     *
     * @param to          destinatario
     * @param preferenceKey clave de configuración del usuario
     * @param sendAction  acción que realmente arma y envía el email cuando el envío está permitido
     * @return true si el email se envió, false si las preferencias lo bloquearon o falló el envío
     */
    private boolean sendIfAllowed(String to, String preferenceKey, BooleanSupplier sendAction) {
        if (!configuracionService.debeEnviarEmail(to, preferenceKey)) {
            log.debug("Email '{}' no enviado a {} por preferencias del usuario", preferenceKey, to);
            return false;
        }
        return sendAction.getAsBoolean();
    }

    /**
     * Envía una notificación HTML simple (texto libre) envuelta en el layout base.
     * Devuelve false si Gmail no está disponible o si falla el envío.
     */
    public boolean enviarNotificacionSimple(String to, String asunto, String mensaje) {
        String safe = (mensaje == null ? "" : mensaje)
                .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\n", "<br/>");
        String html = "<p>" + safe + "</p>";
        String body = emailTemplateService.wrapInBaseTemplate(html, asunto, backendUrl);
        return sendHtmlEmailSafe(to, asunto, body);
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
     */
    public boolean enviarEmailVerificacion(String to, String verificationToken) {
        return sendIfAllowed(to, "verificacion", () -> {
            String subject = "Verifica tu cuenta - UTEC Space Manager";
            Map<String, String> variables = baseVariables();
            variables.put("verificationUrl", frontendUrl + "/auth/verify?token=" + verificationToken);
            return renderAndSend(to, subject, "verificacion.html", variables);
        });
    }

    /**
     * Envía email de recuperación de contraseña con enlace usando Gmail API
     */
    public boolean enviarEmailRecuperacionPassword(String to, String resetToken) {
        return sendIfAllowed(to, "recuperacionPassword", () -> {
            String subject = "Recuperación de contraseña - UTEC Space Manager";
            Map<String, String> variables = baseVariables();
            variables.put("resetUrl", frontendUrl + "/auth/reset-password?token=" + resetToken);
            boolean enviado = renderAndSend(to, subject, "recuperacion-password.html", variables);
            if (!enviado) {
                log.error("Error al enviar email de recuperación de contraseña a {}: Gmail API retornó false", to);
            }
            return enviado;
        });
    }

    /**
     * Envía email con contraseña temporal restablecida por admin
     */
    public boolean enviarEmailRestablecimientoPassword(String to, String nuevaPassword) {
        return sendIfAllowed(to, "restablecimientoPassword", () -> {
            String subject = "Tu contraseña ha sido restablecida - UTEC Space Manager";
            Map<String, String> variables = baseVariables();
            variables.put("nuevaPassword", nuevaPassword);
            return renderAndSend(to, subject, "restablecimiento-password.html", variables);
        });
    }

    /**
     * Envía email de notificación al analista cuando un docente crea una nueva solicitud
     */
    public boolean enviarEmailNotificacionNuevaSolicitud(String to, ReservaResponseDto reserva) {
        return sendIfAllowed(to, "nuevaSolicitudReserva", () -> {
            String subject = "Nueva solicitud de reserva - UTEC Space Manager";
            Map<String, String> variables = baseVariables();
            putReservaVariables(variables, reserva);
            return renderAndSend(to, subject, "nueva-solicitud-reserva.html", variables);
        });
    }

    /**
     * Envía email de notificación al usuario cuando su reserva es aprobada
     */
    public boolean enviarEmailNotificacionReservaAprobada(String to, ReservaResponseDto reserva) {
        return sendIfAllowed(to, "reservaAprobada", () -> {
            String subject = "Tu reserva ha sido aprobada - UTEC Space Manager";
            Map<String, String> variables = baseVariables();
            putReservaVariables(variables, reserva);
            // Para notificaciones al usuario, el saludo cae al usuario; reemplazo del fallback
            variables.put(VAR_USUARIO_NOMBRE, orDefault(reserva.getUsuarioNombre(), DEFAULT_USUARIO));
            return renderAndSend(to, subject, "reserva-aprobada.html", variables);
        });
    }

    /**
     * Envía email de notificación al usuario cuando su reserva es rechazada
     */
    public boolean enviarEmailNotificacionReservaRechazada(String to, ReservaResponseDto reserva) {
        return sendIfAllowed(to, "reservaRechazada", () -> {
            String subject = "Tu solicitud de reserva ha sido rechazada - UTEC Space Manager";
            Map<String, String> variables = baseVariables();
            putReservaVariables(variables, reserva);
            variables.put(VAR_USUARIO_NOMBRE, orDefault(reserva.getUsuarioNombre(), DEFAULT_USUARIO));
            return renderAndSend(to, subject, "reserva-rechazada.html", variables);
        });
    }

    /**
     * Envía email de notificación al analista cuando un usuario cancela su reserva
     */
    public boolean enviarEmailNotificacionReservaCancelada(String to, ReservaResponseDto reserva) {
        return sendIfAllowed(to, "reservaCancelada", () -> {
            String subject = "Reserva cancelada - UTEC Space Manager";
            Map<String, String> variables = baseVariables();
            putReservaVariables(variables, reserva);
            return renderAndSend(to, subject, "reserva-cancelada.html", variables);
        });
    }

    /**
     * Envía email de recordatorio al usuario antes de su reserva
     */
    public boolean enviarEmailRecordatorioReserva(String to, ReservaResponseDto reserva, int horasAntes) {
        return sendIfAllowed(to, "recordatorioReserva", () -> {
            String subject = "Recordatorio: Tienes una reserva en " + horasAntes + " horas - UTEC Space Manager";
            Map<String, String> variables = baseVariables();
            putReservaVariables(variables, reserva);
            variables.put(VAR_USUARIO_NOMBRE, orDefault(reserva.getUsuarioNombre(), DEFAULT_USUARIO));
            variables.put("horasAntes", String.valueOf(horasAntes));
            return renderAndSend(to, subject, "recordatorio-reserva.html", variables);
        });
    }

    /**
     * Envía email de notificación cuando un admin cambia el rol de un usuario
     */
    public boolean enviarEmailNotificacionCambioRol(String to, String nombreUsuario, String rolAnterior, String rolNuevo) {
        return sendIfAllowed(to, "cambioRol", () -> {
            String subject = "Tu rol ha sido actualizado - UTEC Space Manager";
            Map<String, String> variables = baseVariables();
            variables.put(VAR_NOMBRE_USUARIO, orDefault(nombreUsuario, DEFAULT_USUARIO));
            variables.put("rolAnterior", orNa(rolAnterior));
            variables.put("rolNuevo", orNa(rolNuevo));
            return renderAndSend(to, subject, "cambio-rol.html", variables);
        });
    }

    /**
     * Envía email de notificación cuando un admin activa o desactiva un usuario
     */
    public boolean enviarEmailNotificacionCambioEstado(String to, String nombreUsuario, boolean activado) {
        return sendIfAllowed(to, "cambioEstado", () -> {
            String subject = subjectCambioEstado(activado);
            Map<String, String> variables = buildCambioEstadoVariables(nombreUsuario, activado, subject);
            return renderAndSend(to, subject, "cambio-estado.html", variables);
        });
    }

    private String subjectCambioEstado(boolean activado) {
        return activado
            ? "Tu cuenta ha sido activada - UTEC Space Manager"
            : "Tu cuenta ha sido desactivada - UTEC Space Manager";
    }

    private Map<String, String> buildCambioEstadoVariables(String nombreUsuario, boolean activado, String subject) {
        Map<String, String> variables = baseVariables();
        variables.put("tituloEstado", subject);
        variables.put(VAR_NOMBRE_USUARIO, orDefault(nombreUsuario, DEFAULT_USUARIO));
        variables.put("mensaje", mensajeCambioEstado(activado));
        variables.put("accion", activado ? "activada" : "desactivada");
        variables.put("mensajeAdicional", mensajeAdicionalCambioEstado(activado));
        putColoresCambioEstado(variables, activado);
        return variables;
    }

    private String mensajeCambioEstado(boolean activado) {
        return activado
            ? "Tu cuenta ha sido activada y ahora puedes acceder al sistema normalmente."
            : "Tu cuenta ha sido desactivada. Ya no podrás acceder al sistema. Si crees que esto es un error, por favor contacta al administrador.";
    }

    private String mensajeAdicionalCambioEstado(boolean activado) {
        return activado
            ? "Si tienes alguna pregunta, por favor contacta al administrador del sistema."
            : "Si tienes alguna pregunta o crees que esto es un error, por favor contacta al administrador del sistema inmediatamente.";
    }

    private void putColoresCambioEstado(Map<String, String> variables, boolean activado) {
        variables.put("colorFondo", activado ? COLOR_VERDE_FONDO : COLOR_ROJO_FONDO);
        variables.put("colorBorde", activado ? COLOR_VERDE_BORDE : COLOR_ROJO_BORDE);
        variables.put("colorMensajeFondo", activado ? "#dbeafe" : "#fff3cd");
        variables.put("colorMensajeBorde", activado ? "#3b82f6" : "#ffc107");
        variables.put("colorMensajeTexto", activado ? "#1e40af" : "#856404");
    }

    /**
     * Envía email de notificación cuando un admin cambia el email de un usuario
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
        Map<String, String> variables = baseVariables();
        variables.put(VAR_NOMBRE_USUARIO, orDefault(nombreUsuario, DEFAULT_USUARIO));
        variables.put("emailViejo", orNa(emailViejo));
        variables.put("emailNuevo", orNa(emailNuevo));
        // Conservamos el comportamiento previo: este template usa frontendUrl como base del wrapper
        return renderAndSend(destinatario, subject, "cambio-email.html", variables, frontendUrl);
    }

    /**
     * Envía email de notificación a personal de mantenimiento cuando hay una nueva solicitud de inventario
     */
    public boolean enviarEmailNotificacionNuevaSolicitudInventario(String to, ReservaResponseDto reserva, int cantidadItems) {
        return sendIfAllowed(to, "nuevaSolicitudInventario", () -> {
            String subject = "Nueva solicitud de inventario - UTEC Space Manager";
            Map<String, String> variables = baseVariables();
            putReservaVariables(variables, reserva);
            variables.put("reservaId", reserva.getId() != null ? reserva.getId().toString() : NA);
            variables.put("cantidadItems", String.valueOf(cantidadItems));
            return renderAndSend(to, subject, "nueva-solicitud-inventario.html", variables);
        });
    }

    /**
     * Envía email de notificación al usuario cuando se actualiza el estado de su solicitud de inventario
     */
    public boolean enviarEmailNotificacionEstadoSolicitudInventario(
            String to,
            ReservaItemSolicitadoResponseDto itemSolicitado,
            String estadoAnterior,
            String estadoNuevo) {
        return sendIfAllowed(to, "estadoSolicitudInventario", () -> {
            String subject = "Estado de tu solicitud de inventario actualizado - UTEC Space Manager";

            DateTimeFormatter formatter = dateFormatter();
            String fechaReserva = itemSolicitado.getReservaInicio() != null
                ? formatter.format(itemSolicitado.getReservaInicio())
                : NA;

            EstadoStyle style = resolveEstadoSolicitudInventarioStyle(estadoNuevo);

            String observacionesHtml = "";
            if (itemSolicitado.getObservaciones() != null && !itemSolicitado.getObservaciones().trim().isEmpty()) {
                observacionesHtml = String.format(
                    "<div style=\"margin: 20px 0; padding: 15px; background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px;\">" +
                    "<p style=\"margin: 0; color: #1e40af; font-size: 14px;\"><strong>Observaciones:</strong> %s</p></div>",
                    itemSolicitado.getObservaciones()
                );
            }

            Map<String, String> variables = baseVariables();
            variables.put(VAR_NOMBRE_USUARIO, orDefault(itemSolicitado.getSolicitanteNombre(), DEFAULT_USUARIO));
            variables.put("mensajeEstado", style.mensaje());
            variables.put("tipoElementoNombre", orNa(itemSolicitado.getTipoElementoNombre()));
            variables.put("cantidadSolicitada",
                    itemSolicitado.getCantidadSolicitada() != null ? itemSolicitado.getCantidadSolicitada().toString() : NA);
            variables.put(VAR_ESPACIO_NOMBRE, orNa(itemSolicitado.getEspacioNombre()));
            variables.put("fechaReserva", fechaReserva);
            variables.put("estadoAnterior", orNa(estadoAnterior));
            variables.put("estadoNuevo", orNa(estadoNuevo));
            variables.put("observaciones", observacionesHtml);
            variables.put("colorFondo", style.colorFondo());
            variables.put("colorBorde", style.colorBorde());
            variables.put("colorEstadoFondo", style.colorEstadoFondo());
            variables.put("colorEstadoTexto", style.colorEstadoTexto());

            return renderAndSend(to, subject, "estado-solicitud-inventario.html", variables);
        });
    }

    /**
     * Bundle inmutable con la paleta y mensaje a usar para cada estado de solicitud
     * de inventario. Mantiene el switch fuera del flujo principal de armado de variables.
     */
    private record EstadoStyle(
            String mensaje,
            String colorFondo,
            String colorBorde,
            String colorEstadoFondo,
            String colorEstadoTexto
    ) {}

    private EstadoStyle resolveEstadoSolicitudInventarioStyle(String estadoNuevo) {
        return switch (estadoNuevo == null ? "" : estadoNuevo) {
            case "APROBADO" -> new EstadoStyle(
                    "Tu solicitud de inventario ha sido aprobada. El item será preparado para la fecha de tu reserva.",
                    COLOR_VERDE_FONDO, COLOR_VERDE_BORDE, COLOR_VERDE_FONDO, "#065f46");
            case "RECHAZADO" -> new EstadoStyle(
                    "Lamentamos informarte que tu solicitud de inventario ha sido rechazada.",
                    COLOR_ROJO_FONDO, COLOR_ROJO_BORDE, COLOR_ROJO_FONDO, "#721c24");
            case "ENTREGADO" -> new EstadoStyle(
                    "¡Excelente! El item de inventario ha sido entregado y está disponible para tu reserva.",
                    COLOR_VERDE_FONDO, COLOR_VERDE_BORDE, COLOR_VERDE_FONDO, "#065f46");
            default -> new EstadoStyle(
                    "El estado de tu solicitud de inventario ha sido actualizado.",
                    COLOR_GRIS_FONDO, COLOR_GRIS_BORDE, COLOR_GRIS_FONDO, COLOR_GRIS_TEXTO);
        };
    }
}
