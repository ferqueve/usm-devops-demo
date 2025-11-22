package com.utec.backend.service;

import com.utec.backend.dto.reserva.ReservaResponseDto;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

/**
 * Servicio para el envío de emails usando Gmail API
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final GmailApiService gmailApiService;
    private final UsuarioRepository usuarioRepository;

    @Value("${gmail.api.from-email:usm.utec.uy@gmail.com}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Verifica la configuración de email enviando un email de prueba
     *
     * @param to Email del destinatario para la prueba
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean verificarConfiguracionEmail(String to) {
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
        String subject = "Verifica tu cuenta - UTEC Space Manager";
        String verificationUrl = frontendUrl + "/auth/verify?token=" + verificationToken;
        
        String bodyText = """
            ¡Bienvenido a UTEC Space Manager!
            
            Para completar tu registro, por favor verifica tu email haciendo clic en el siguiente enlace:
            
            {verificationUrl}
            
            Este enlace expirará en 24 horas.
            
            Si no solicitaste este registro, puedes ignorar este email.
            
            Saludos,
            Equipo UTEC Space Manager
            """.replace("{verificationUrl}", verificationUrl);

        return gmailApiService.sendEmail(to, subject, bodyText);
    }

    /**
     * Envía email con contraseña temporal restablecida por admin
     *
     * @param to Email del destinatario
     * @param nuevaPassword Nueva contraseña temporal
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailRestablecimientoPassword(String to, String nuevaPassword) {
        String subject = "Tu contraseña ha sido restablecida - UTEC Space Manager";
        
        String bodyText = """
            Tu contraseña ha sido restablecida por un administrador.
            
            Tu nueva contraseña temporal es:
            
            {nuevaPassword}
            
            Por favor, cambia esta contraseña después de iniciar sesión.
            
            Saludos,
            Equipo UTEC Space Manager
            """.replace("{nuevaPassword}", nuevaPassword);

        return gmailApiService.sendEmail(to, subject, bodyText);
    }

    /**
     * Envía email de notificación al analista cuando un docente crea una nueva solicitud
     *
     * @param to Email del analista
     * @param reserva DTO de la reserva creada
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailNotificacionNuevaSolicitud(String to, ReservaResponseDto reserva) {
        String subject = "Nueva solicitud de reserva - UTEC Space Manager";
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String fechaInicio = reserva.getInicio().format(formatter);
        String fechaFin = reserva.getFin().format(formatter);
        
        String bodyText = """
            Hola,
            
            Has recibido una nueva solicitud de reserva que requiere tu revisión.
            
            Detalles de la solicitud:
            - Espacio: {espacioNombre}
            - Solicitante: {usuarioNombre} ({usuarioEmail})
            - Fecha y hora: {fechaInicio} - {fechaFin}
            - Estado: PENDIENTE
            
            Por favor, revisa y aprueba o rechaza esta solicitud en el sistema.
            
            Puedes acceder al sistema en: {frontendUrl}
            
            Saludos,
            Equipo UTEC Space Manager
            """
            .replace("{espacioNombre}", reserva.getEspacioNombre() != null ? reserva.getEspacioNombre() : "N/A")
            .replace("{usuarioNombre}", reserva.getUsuarioNombre() != null ? reserva.getUsuarioNombre() : "N/A")
            .replace("{usuarioEmail}", reserva.getUsuarioEmail() != null ? reserva.getUsuarioEmail() : "N/A")
            .replace("{fechaInicio}", fechaInicio)
            .replace("{fechaFin}", fechaFin)
            .replace("{frontendUrl}", frontendUrl);

        return gmailApiService.sendEmail(to, subject, bodyText);
    }

    /**
     * Envía email de notificación al usuario cuando su reserva es aprobada
     *
     * @param to Email del usuario
     * @param reserva DTO de la reserva aprobada
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailNotificacionReservaAprobada(String to, ReservaResponseDto reserva) {
        String subject = "Tu reserva ha sido aprobada - UTEC Space Manager";
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String fechaInicio = reserva.getInicio().format(formatter);
        String fechaFin = reserva.getFin().format(formatter);
        
        String bodyText = """
            Hola {usuarioNombre},
            
            ¡Excelente noticia! Tu solicitud de reserva ha sido aprobada.
            
            Detalles de tu reserva:
            - Espacio: {espacioNombre}
            - Fecha y hora: {fechaInicio} - {fechaFin}
            - Estado: APROBADO
            
            Te recordamos que debes estar presente en el espacio en el horario reservado.
            
            Puedes ver todos tus detalles de reserva en: {frontendUrl}/reservas
            
            Saludos,
            Equipo UTEC Space Manager
            """
            .replace("{usuarioNombre}", reserva.getUsuarioNombre() != null ? reserva.getUsuarioNombre() : "Usuario")
            .replace("{espacioNombre}", reserva.getEspacioNombre() != null ? reserva.getEspacioNombre() : "N/A")
            .replace("{fechaInicio}", fechaInicio)
            .replace("{fechaFin}", fechaFin)
            .replace("{frontendUrl}", frontendUrl);

        return gmailApiService.sendEmail(to, subject, bodyText);
    }

    /**
     * Envía email de notificación al usuario cuando su reserva es rechazada
     *
     * @param to Email del usuario
     * @param reserva DTO de la reserva rechazada
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailNotificacionReservaRechazada(String to, ReservaResponseDto reserva) {
        String subject = "Tu solicitud de reserva ha sido rechazada - UTEC Space Manager";
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String fechaInicio = reserva.getInicio().format(formatter);
        String fechaFin = reserva.getFin().format(formatter);
        
        String bodyText = """
            Hola {usuarioNombre},
            
            Lamentamos informarte que tu solicitud de reserva ha sido rechazada.
            
            Detalles de la solicitud rechazada:
            - Espacio: {espacioNombre}
            - Fecha y hora solicitada: {fechaInicio} - {fechaFin}
            - Estado: CANCELADO
            
            Si tienes dudas sobre el motivo del rechazo, por favor contacta al analista asignado o al administrador del sistema.
            
            Puedes crear una nueva solicitud de reserva en: {frontendUrl}/reservas
            
            Saludos,
            Equipo UTEC Space Manager
            """
            .replace("{usuarioNombre}", reserva.getUsuarioNombre() != null ? reserva.getUsuarioNombre() : "Usuario")
            .replace("{espacioNombre}", reserva.getEspacioNombre() != null ? reserva.getEspacioNombre() : "N/A")
            .replace("{fechaInicio}", fechaInicio)
            .replace("{fechaFin}", fechaFin)
            .replace("{frontendUrl}", frontendUrl);

        return gmailApiService.sendEmail(to, subject, bodyText);
    }

    /**
     * Envía email de notificación al analista cuando un usuario cancela su reserva
     *
     * @param to Email del analista
     * @param reserva DTO de la reserva cancelada
     * @return true si se envió correctamente, false en caso contrario
     */
    public boolean enviarEmailNotificacionReservaCancelada(String to, ReservaResponseDto reserva) {
        String subject = "Reserva cancelada - UTEC Space Manager";
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String fechaInicio = reserva.getInicio().format(formatter);
        String fechaFin = reserva.getFin().format(formatter);
        
        String bodyText = """
            Hola,
            
            Se ha cancelado una reserva que estaba asignada a ti.
            
            Detalles de la reserva cancelada:
            - Espacio: {espacioNombre}
            - Usuario: {usuarioNombre} ({usuarioEmail})
            - Fecha y hora: {fechaInicio} - {fechaFin}
            - Estado: CANCELADO
            
            El espacio queda disponible nuevamente para otras reservas.
            
            Puedes ver más detalles en: {frontendUrl}
            
            Saludos,
            Equipo UTEC Space Manager
            """
            .replace("{espacioNombre}", reserva.getEspacioNombre() != null ? reserva.getEspacioNombre() : "N/A")
            .replace("{usuarioNombre}", reserva.getUsuarioNombre() != null ? reserva.getUsuarioNombre() : "N/A")
            .replace("{usuarioEmail}", reserva.getUsuarioEmail() != null ? reserva.getUsuarioEmail() : "N/A")
            .replace("{fechaInicio}", fechaInicio)
            .replace("{fechaFin}", fechaFin)
            .replace("{frontendUrl}", frontendUrl);

        return gmailApiService.sendEmail(to, subject, bodyText);
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
        String subject = "Recordatorio: Tienes una reserva en " + horasAntes + " horas - UTEC Space Manager";
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String fechaInicio = reserva.getInicio().format(formatter);
        String fechaFin = reserva.getFin().format(formatter);
        
        String bodyText = """
            Hola {usuarioNombre},
            
            Este es un recordatorio de que tienes una reserva programada.
            
            Detalles de tu reserva:
            - Espacio: {espacioNombre}
            - Fecha y hora: {fechaInicio} - {fechaFin}
            - Estado: APROBADO
            
            Te recordamos que debes estar presente en el espacio en el horario reservado.
            
            Puedes ver todos tus detalles de reserva en: {frontendUrl}/reservas
            
            Saludos,
            Equipo UTEC Space Manager
            """
            .replace("{usuarioNombre}", reserva.getUsuarioNombre() != null ? reserva.getUsuarioNombre() : "Usuario")
            .replace("{espacioNombre}", reserva.getEspacioNombre() != null ? reserva.getEspacioNombre() : "N/A")
            .replace("{fechaInicio}", fechaInicio)
            .replace("{fechaFin}", fechaFin)
            .replace("{frontendUrl}", frontendUrl);

        return gmailApiService.sendEmail(to, subject, bodyText);
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
        String subject = "Tu rol ha sido actualizado - UTEC Space Manager";
        
        String bodyText = """
            Hola {nombreUsuario},
            
            Un administrador ha actualizado tu rol en el sistema.
            
            Cambio de rol:
            - Rol anterior: {rolAnterior}
            - Nuevo rol: {rolNuevo}
            
            Si tienes alguna pregunta sobre este cambio, por favor contacta al administrador del sistema.
            
            Puedes acceder al sistema en: {frontendUrl}
            
            Saludos,
            Equipo UTEC Space Manager
            """
            .replace("{nombreUsuario}", nombreUsuario != null ? nombreUsuario : "Usuario")
            .replace("{rolAnterior}", rolAnterior != null ? rolAnterior : "N/A")
            .replace("{rolNuevo}", rolNuevo != null ? rolNuevo : "N/A")
            .replace("{frontendUrl}", frontendUrl);

        return gmailApiService.sendEmail(to, subject, bodyText);
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
        String subject = activado 
            ? "Tu cuenta ha sido activada - UTEC Space Manager"
            : "Tu cuenta ha sido desactivada - UTEC Space Manager";
        
        String accion = activado ? "activada" : "desactivada";
        String mensaje = activado 
            ? "Tu cuenta ha sido activada y ahora puedes acceder al sistema normalmente."
            : "Tu cuenta ha sido desactivada. Ya no podrás acceder al sistema. Si crees que esto es un error, por favor contacta al administrador.";
        
        String bodyText = """
            Hola {nombreUsuario},
            
            {mensaje}
            
            Estado de la cuenta: {accion}
            
            {mensajeAdicional}
            
            Puedes acceder al sistema en: {frontendUrl}
            
            Saludos,
            Equipo UTEC Space Manager
            """
            .replace("{nombreUsuario}", nombreUsuario != null ? nombreUsuario : "Usuario")
            .replace("{mensaje}", mensaje)
            .replace("{accion}", accion)
            .replace("{mensajeAdicional}", activado 
                ? "Si tienes alguna pregunta, por favor contacta al administrador del sistema."
                : "Si tienes alguna pregunta o crees que esto es un error, por favor contacta al administrador del sistema inmediatamente.")
            .replace("{frontendUrl}", frontendUrl);

        return gmailApiService.sendEmail(to, subject, bodyText);
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
        String subject = "Tu email ha sido actualizado - UTEC Space Manager";
        
        // Enviar al email viejo
        String bodyTextEmailViejo = """
            Hola {nombreUsuario},
            
            Un administrador ha actualizado tu dirección de email en el sistema.
            
            Cambio de email:
            - Email anterior: {emailViejo}
            - Email nuevo: {emailNuevo}
            
            A partir de ahora, debes usar el nuevo email para iniciar sesión.
            
            Si no solicitaste este cambio, contacta al administrador inmediatamente.
            
            Saludos,
            Equipo UTEC Space Manager
            """
            .replace("{nombreUsuario}", nombreUsuario != null ? nombreUsuario : "Usuario")
            .replace("{emailViejo}", toEmailViejo != null ? toEmailViejo : "N/A")
            .replace("{emailNuevo}", toEmailNuevo != null ? toEmailNuevo : "N/A");

        boolean enviadoViejo = gmailApiService.sendEmail(toEmailViejo, subject, bodyTextEmailViejo);
        
        // Enviar al email nuevo
        String bodyTextEmailNuevo = """
            Hola {nombreUsuario},
            
            Un administrador ha actualizado tu dirección de email en el sistema.
            
            Tu nuevo email es: {emailNuevo}
            
            A partir de ahora, debes usar este email para iniciar sesión en el sistema.
            
            Puedes acceder al sistema en: {frontendUrl}
            
            Saludos,
            Equipo UTEC Space Manager
            """
            .replace("{nombreUsuario}", nombreUsuario != null ? nombreUsuario : "Usuario")
            .replace("{emailNuevo}", toEmailNuevo != null ? toEmailNuevo : "N/A")
            .replace("{frontendUrl}", frontendUrl);

        boolean enviadoNuevo = gmailApiService.sendEmail(toEmailNuevo, subject, bodyTextEmailNuevo);
        
        return enviadoViejo && enviadoNuevo;
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
        String subject = "Reserva actualizada - UTEC Space Manager";
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String fechaInicioNueva = reserva.getInicio().format(formatter);
        String fechaFinNueva = reserva.getFin().format(formatter);
        
        String destinatario = esAnalista ? "Hola," : "Hola " + (reserva.getUsuarioNombre() != null ? reserva.getUsuarioNombre() : "Usuario") + ",";
        String mensaje = esAnalista 
            ? "Se ha actualizado una reserva que está asignada a ti."
            : "Tu reserva ha sido actualizada.";
        
        String bodyText = """
            {destinatario}
            
            {mensaje}
            
            Detalles de la reserva actualizada:
            - Espacio: {espacioNombre}
            - Horario anterior: {horarioAnterior}
            - Nuevo horario: {fechaInicioNueva} - {fechaFinNueva}
            - Estado: {estado}
            
            {mensajeAdicional}
            
            Puedes ver los detalles completos en: {frontendUrl}/reservas
            
            Saludos,
            Equipo UTEC Space Manager
            """
            .replace("{destinatario}", destinatario)
            .replace("{mensaje}", mensaje)
            .replace("{espacioNombre}", reserva.getEspacioNombre() != null ? reserva.getEspacioNombre() : "N/A")
            .replace("{horarioAnterior}", horarioAnterior != null ? horarioAnterior : "N/A")
            .replace("{fechaInicioNueva}", fechaInicioNueva)
            .replace("{fechaFinNueva}", fechaFinNueva)
            .replace("{estado}", reserva.getEstado() != null ? reserva.getEstado().toString() : "N/A")
            .replace("{mensajeAdicional}", esAnalista 
                ? "Por favor, revisa los cambios y contacta al usuario si es necesario."
                : "Por favor, ten en cuenta el nuevo horario de tu reserva.")
            .replace("{frontendUrl}", frontendUrl);

        return gmailApiService.sendEmail(toEmail, subject, bodyText);
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
        String subject = "Nueva solicitud de inventario - UTEC Space Manager";
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String fechaInicio = reserva.getInicio().format(formatter);
        String fechaFin = reserva.getFin().format(formatter);
        
        String bodyText = """
            Hola,
            
            Has recibido una nueva solicitud de inventario que requiere tu atención.
            
            Detalles de la solicitud:
            - Reserva ID: {reservaId}
            - Espacio: {espacioNombre}
            - Solicitante: {usuarioNombre} ({usuarioEmail})
            - Fecha y hora de la reserva: {fechaInicio} - {fechaFin}
            - Cantidad de items solicitados: {cantidadItems}
            
            Por favor, revisa y gestiona las solicitudes de inventario en el sistema.
            
            Puedes acceder al sistema en: {frontendUrl}
            
            Saludos,
            Equipo UTEC Space Manager
            """
            .replace("{reservaId}", reserva.getId() != null ? reserva.getId().toString() : "N/A")
            .replace("{espacioNombre}", reserva.getEspacioNombre() != null ? reserva.getEspacioNombre() : "N/A")
            .replace("{usuarioNombre}", reserva.getUsuarioNombre() != null ? reserva.getUsuarioNombre() : "N/A")
            .replace("{usuarioEmail}", reserva.getUsuarioEmail() != null ? reserva.getUsuarioEmail() : "N/A")
            .replace("{fechaInicio}", fechaInicio)
            .replace("{fechaFin}", fechaFin)
            .replace("{cantidadItems}", String.valueOf(cantidadItems))
            .replace("{frontendUrl}", frontendUrl);

        return gmailApiService.sendEmail(to, subject, bodyText);
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
        
        String subject = "Estado de tu solicitud de inventario actualizado - UTEC Space Manager";
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String fechaReserva = itemSolicitado.getReservaInicio() != null 
            ? itemSolicitado.getReservaInicio().format(formatter) 
            : "N/A";
        
        String mensajeEstado = "";
        switch (estadoNuevo) {
            case "APROBADO":
                mensajeEstado = "Tu solicitud de inventario ha sido aprobada. El item será preparado para la fecha de tu reserva.";
                break;
            case "RECHAZADO":
                mensajeEstado = "Lamentamos informarte que tu solicitud de inventario ha sido rechazada.";
                break;
            case "ENTREGADO":
                mensajeEstado = "¡Excelente! El item de inventario ha sido entregado y está disponible para tu reserva.";
                break;
            default:
                mensajeEstado = "El estado de tu solicitud de inventario ha sido actualizado.";
        }
        
        String bodyText = """
            Hola {nombreUsuario},
            
            {mensajeEstado}
            
            Detalles de la solicitud:
            - Item solicitado: {tipoElementoNombre}
            - Cantidad: {cantidadSolicitada}
            - Espacio: {espacioNombre}
            - Fecha de la reserva: {fechaReserva}
            - Estado anterior: {estadoAnterior}
            - Estado actual: {estadoNuevo}
            
            {observaciones}
            
            Puedes ver los detalles completos en: {frontendUrl}/reservas
            
            Saludos,
            Equipo UTEC Space Manager
            """
            .replace("{nombreUsuario}", itemSolicitado.getSolicitanteNombre() != null ? itemSolicitado.getSolicitanteNombre() : "Usuario")
            .replace("{mensajeEstado}", mensajeEstado)
            .replace("{tipoElementoNombre}", itemSolicitado.getTipoElementoNombre() != null ? itemSolicitado.getTipoElementoNombre() : "N/A")
            .replace("{cantidadSolicitada}", itemSolicitado.getCantidadSolicitada() != null ? itemSolicitado.getCantidadSolicitada().toString() : "N/A")
            .replace("{espacioNombre}", itemSolicitado.getEspacioNombre() != null ? itemSolicitado.getEspacioNombre() : "N/A")
            .replace("{fechaReserva}", fechaReserva)
            .replace("{estadoAnterior}", estadoAnterior != null ? estadoAnterior : "N/A")
            .replace("{estadoNuevo}", estadoNuevo != null ? estadoNuevo : "N/A")
            .replace("{observaciones}", itemSolicitado.getObservaciones() != null && !itemSolicitado.getObservaciones().trim().isEmpty()
                ? "Observaciones: " + itemSolicitado.getObservaciones()
                : "")
            .replace("{frontendUrl}", frontendUrl);

        return gmailApiService.sendEmail(to, subject, bodyText);
    }
}
