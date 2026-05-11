package com.utec.backend.e2e;

import com.utec.backend.model.Carrera;
import com.utec.backend.model.Edificio;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.InventarioItem;
import com.utec.backend.model.Reserva;
import com.utec.backend.model.ReservaItemSolicitado;
import com.utec.backend.model.TipoElemento;
import com.utec.backend.model.TipoEspacio;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.CarreraRepository;
import com.utec.backend.repository.EdificioRepository;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.InventarioItemRepository;
import com.utec.backend.repository.ReservaItemSolicitadoRepository;
import com.utec.backend.repository.ReservaRepository;
import com.utec.backend.repository.TipoElementoRepository;
import com.utec.backend.repository.TipoEspacioRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Carga determinística de datos para el perfil <code>e2e</code>.
 *
 * <p>Crea un usuario por rol (todos verificados, password BCrypt común
 * <code>Test1234!</code>), edificios, tipos de espacio, espacios, tipos de
 * elemento, ítems de inventario, una carrera y dos reservas en estados
 * representativos. Las pruebas Playwright asumen este estado tras el arranque.
 *
 * <p>Si la base ya tiene usuarios (por ejemplo el script reinició el backend
 * sin limpiar la base) la carga no se repite, para que las pruebas que dejaron
 * datos parciales no rompan el seed.
 */
@Slf4j
@Component
@Profile("e2e")
@RequiredArgsConstructor
public class E2EDataSeeder implements CommandLineRunner {

    public static final String SEED_PASSWORD = "Test1234!";

    private final UsuarioRepository usuarioRepository;
    private final EdificioRepository edificioRepository;
    private final TipoEspacioRepository tipoEspacioRepository;
    private final EspacioRepository espacioRepository;
    private final TipoElementoRepository tipoElementoRepository;
    private final InventarioItemRepository inventarioItemRepository;
    private final CarreraRepository carreraRepository;
    private final ReservaRepository reservaRepository;
    private final ReservaItemSolicitadoRepository reservaItemSolicitadoRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (usuarioRepository.count() > 0) {
            log.info("E2E seed: la base ya tiene usuarios, se omite la carga inicial.");
            return;
        }

        log.info("E2E seed: cargando datos iniciales para Playwright...");

        seedUsuarios();
        Edificio edificio = seedEdificio();
        TipoEspacio tipoSala = seedTipoEspacio();
        List<Espacio> espacios = seedEspacios(edificio, tipoSala);
        TipoElemento tipoProyector = seedTipoElemento();
        TipoElemento tipoNotebook = seedTipoElementoSecundario();
        seedInventario(espacios, tipoProyector, tipoNotebook);
        Carrera carrera = seedCarrera();
        List<Reserva> reservas = seedReservas(espacios, carrera);
        seedSolicitudInventario(reservas.get(2), tipoProyector);
        seedSolicitudInventarioParaRechazo(reservas.get(2), tipoProyector);

        log.info("E2E seed: completado.");
    }

    private void seedUsuarios() {
        String hash = passwordEncoder.encode(SEED_PASSWORD);
        for (Usuario.RolApp rol : Usuario.RolApp.values()) {
            Usuario u = new Usuario();
            u.setEmail(emailFor(rol));
            u.setNombre(rol.name().toLowerCase() + " e2e");
            u.setPassword(hash);
            u.setRolApp(rol);
            u.setVerificado(true);
            usuarioRepository.save(u);
        }
        log.info("E2E seed: {} usuarios creados (un correo por rol).", Usuario.RolApp.values().length);
    }

    private Edificio seedEdificio() {
        Edificio e = new Edificio();
        e.setNombre("Edificio Central E2E");
        e.setCodigo("E2E-1");
        e.setDescripcion("Edificio sembrado para pruebas Playwright.");
        e.setActivo(true);
        return edificioRepository.save(e);
    }

    private TipoEspacio seedTipoEspacio() {
        TipoEspacio t = new TipoEspacio();
        t.setNombre("Sala E2E");
        t.setDescripcion("Tipo sembrado para pruebas Playwright.");
        t.setColor("#1f6feb");
        t.setActivo(true);
        return tipoEspacioRepository.save(t);
    }

    private List<Espacio> seedEspacios(Edificio edificio, TipoEspacio tipo) {
        Espacio s1 = new Espacio();
        s1.setNombre("Sala 101");
        s1.setCapacidad(30);
        s1.setEstado("DISPONIBLE");
        s1.setEdificioId(edificio.getId());
        s1.setTipoEspacioId(tipo.getId());

        Espacio s2 = new Espacio();
        s2.setNombre("Sala 202");
        s2.setCapacidad(20);
        s2.setEstado("DISPONIBLE");
        s2.setEdificioId(edificio.getId());
        s2.setTipoEspacioId(tipo.getId());

        return espacioRepository.saveAll(List.of(s1, s2));
    }

    private TipoElemento seedTipoElemento() {
        TipoElemento t = new TipoElemento();
        t.setNombre("Proyector E2E");
        t.setDescripcion("Tipo sembrado para pruebas Playwright.");
        t.setActivo(true);
        return tipoElementoRepository.save(t);
    }

    private TipoElemento seedTipoElementoSecundario() {
        TipoElemento t = new TipoElemento();
        t.setNombre("Notebook E2E");
        t.setDescripcion("Segundo tipo seedeado, usado por tests de filtros y CRUD.");
        t.setActivo(true);
        return tipoElementoRepository.save(t);
    }

    private void seedInventario(List<Espacio> espacios, TipoElemento proyector, TipoElemento notebook) {
        // Ítem principal usado por request-flow: Sala 101, DISPONIBLE, cantidad 2.
        InventarioItem disponibleEnSala101 = new InventarioItem();
        disponibleEnSala101.setEspacio(espacios.get(0));
        disponibleEnSala101.setTipoElemento(proyector);
        disponibleEnSala101.setCantidad(2);
        disponibleEnSala101.setEstado("DISPONIBLE");
        disponibleEnSala101.setActivo(true);

        // Ítem en MANTENIMIENTO para tests de filtro por estado y de edición.
        InventarioItem enMantenimiento = new InventarioItem();
        enMantenimiento.setEspacio(espacios.get(1));
        enMantenimiento.setTipoElemento(proyector);
        enMantenimiento.setCantidad(1);
        enMantenimiento.setEstado("MANTENIMIENTO");
        enMantenimiento.setActivo(true);
        enMantenimiento.setObservaciones("Proyector E2E en mantenimiento");

        // Ítem sin espacio asignado para el filtro "sin asignar" y el flujo
        // de asignación a un espacio.
        InventarioItem sinAsignar = new InventarioItem();
        sinAsignar.setEspacio(null);
        sinAsignar.setTipoElemento(proyector);
        sinAsignar.setCantidad(1);
        sinAsignar.setEstado("DISPONIBLE");
        sinAsignar.setActivo(true);

        // Ítem de tipo secundario para el flujo de eliminación.
        InventarioItem notebookItem = new InventarioItem();
        notebookItem.setEspacio(espacios.get(0));
        notebookItem.setTipoElemento(notebook);
        notebookItem.setCantidad(4);
        notebookItem.setEstado("DISPONIBLE");
        notebookItem.setActivo(true);

        // Dos ítems descartables solo para `bulk-actions.spec.ts`. Se siembran
        // al final para que queden como las dos últimas filas en el listado
        // ordenado por ID (la pestaña los identifica como las dos
        // sin observaciones específicas).
        InventarioItem bulkTarget1 = new InventarioItem();
        bulkTarget1.setEspacio(espacios.get(0));
        bulkTarget1.setTipoElemento(proyector);
        bulkTarget1.setCantidad(1);
        bulkTarget1.setEstado("DISPONIBLE");
        bulkTarget1.setActivo(true);
        bulkTarget1.setObservaciones("Bulk target 1 E2E");

        InventarioItem bulkTarget2 = new InventarioItem();
        bulkTarget2.setEspacio(espacios.get(1));
        bulkTarget2.setTipoElemento(proyector);
        bulkTarget2.setCantidad(1);
        bulkTarget2.setEstado("DISPONIBLE");
        bulkTarget2.setActivo(true);
        bulkTarget2.setObservaciones("Bulk target 2 E2E");

        inventarioItemRepository.saveAll(List.of(
                disponibleEnSala101, enMantenimiento, sinAsignar, notebookItem, bulkTarget1, bulkTarget2
        ));
    }

    private Carrera seedCarrera() {
        Carrera c = new Carrera();
        c.setNombre("Ingeniería en Sistemas");
        c.setCodigo("ITR-IS");
        return carreraRepository.save(c);
    }

    private List<Reserva> seedReservas(List<Espacio> espacios, Carrera carrera) {
        Usuario docente = usuarioRepository.findByEmail(emailFor(Usuario.RolApp.DOCENTE))
                .orElseThrow();
        Usuario admin = usuarioRepository.findByEmail(emailFor(Usuario.RolApp.ADMIN))
                .orElseThrow();
        Usuario analista = usuarioRepository.findByEmail(emailFor(Usuario.RolApp.ANALISTA))
                .orElseThrow();

        // Horarios deterministas: 10:00, 14:00 y 18:00 de mañana, en zona
        // local de Montevideo. Esto hace que las pruebas E2E que dependen
        // de horarios concretos (como el conflicto 409) sean estables.
        ZoneId tz = ZoneId.of("America/Montevideo");
        LocalDate manana = LocalDate.now(tz).plusDays(1);
        LocalDate ayer = LocalDate.now(tz).minusDays(1);
        LocalDate enCincoDias = LocalDate.now(tz).plusDays(5);
        java.time.Instant inicioPendienteAprobar = LocalDateTime.of(manana, LocalTime.of(10, 0)).atZone(tz).toInstant();
        java.time.Instant inicioPendienteRechazar = LocalDateTime.of(manana, LocalTime.of(14, 0)).atZone(tz).toInstant();
        java.time.Instant inicioAprobada = LocalDateTime.of(manana, LocalTime.of(18, 0)).atZone(tz).toInstant();
        java.time.Instant inicioCharlaAnalista = LocalDateTime.of(manana, LocalTime.of(12, 0)).atZone(tz).toInstant();
        java.time.Instant inicioPasada = LocalDateTime.of(ayer, LocalTime.of(10, 0)).atZone(tz).toInstant();
        java.time.Instant inicioBloqueoRecurrencia = LocalDateTime.of(enCincoDias, LocalTime.of(14, 0)).atZone(tz).toInstant();

        // Pendiente para el test de aprobación del admin.
        Reserva pendienteAprobar = new Reserva();
        pendienteAprobar.setEspacio(espacios.get(0));
        pendienteAprobar.setUsuario(docente);
        pendienteAprobar.setAnalistaAsignado(admin);
        pendienteAprobar.setCarrera(carrera);
        pendienteAprobar.setInicio(inicioPendienteAprobar);
        pendienteAprobar.setFin(inicioPendienteAprobar.plus(2, ChronoUnit.HOURS));
        pendienteAprobar.setEstado(Reserva.EstadoReserva.PENDIENTE);
        pendienteAprobar.setEsPublica(false);
        pendienteAprobar.setTitulo("Reunión de proyecto E2E");

        // Segunda pendiente para el test de rechazo: cada test consume su propio
        // recurso para mantenerse independiente del orden de ejecución.
        Reserva pendienteRechazar = new Reserva();
        pendienteRechazar.setEspacio(espacios.get(0));
        pendienteRechazar.setUsuario(docente);
        pendienteRechazar.setAnalistaAsignado(admin);
        pendienteRechazar.setCarrera(carrera);
        pendienteRechazar.setInicio(inicioPendienteRechazar);
        pendienteRechazar.setFin(inicioPendienteRechazar.plus(2, ChronoUnit.HOURS));
        pendienteRechazar.setEstado(Reserva.EstadoReserva.PENDIENTE);
        pendienteRechazar.setEsPublica(false);
        pendienteRechazar.setTitulo("Sesión de laboratorio E2E");

        // Aprobada en Sala 202 a las 18:00–20:00. Los tests de cancelación
        // del dueño (DOCENTE) y de conflicto 409 (ADMIN intentando crear
        // sobre este rango) la consumen.
        Reserva aprobada = new Reserva();
        aprobada.setEspacio(espacios.get(1));
        aprobada.setUsuario(docente);
        aprobada.setCarrera(carrera);
        aprobada.setInicio(inicioAprobada);
        aprobada.setFin(inicioAprobada.plus(2, ChronoUnit.HOURS));
        aprobada.setEstado(Reserva.EstadoReserva.APROBADO);
        aprobada.setEsPublica(true);
        aprobada.setTitulo("Clase abierta E2E");

        // Pendiente asignada al ANALISTA (no al admin). Sirve para validar el
        // aislamiento del panel "Pendientes" en /reservations: el analista la
        // ve, el admin no.
        Reserva pendienteAnalista = new Reserva();
        pendienteAnalista.setEspacio(espacios.get(0));
        pendienteAnalista.setUsuario(docente);
        pendienteAnalista.setAnalistaAsignado(analista);
        pendienteAnalista.setCarrera(carrera);
        pendienteAnalista.setInicio(inicioCharlaAnalista);
        pendienteAnalista.setFin(inicioCharlaAnalista.plus(2, ChronoUnit.HOURS));
        pendienteAnalista.setEstado(Reserva.EstadoReserva.PENDIENTE);
        pendienteAnalista.setEsPublica(false);
        pendienteAnalista.setTitulo("Charla docente E2E");

        // Aprobada ya pasada. Permite testear filtros temporales.
        Reserva pasada = new Reserva();
        pasada.setEspacio(espacios.get(1));
        pasada.setUsuario(docente);
        pasada.setCarrera(carrera);
        pasada.setInicio(inicioPasada);
        pasada.setFin(inicioPasada.plus(2, ChronoUnit.HOURS));
        pasada.setEstado(Reserva.EstadoReserva.APROBADO);
        pasada.setEsPublica(false);
        pasada.setTitulo("Tutoría pasada E2E");

        // APROBADA en Sala 101 a 5 días, 14:00-15:00. Solo se usa como
        // bloqueo en `recurring-conflict.spec.ts`: cuando el admin arma
        // una serie diaria sobre Sala 101 14:00, esta instancia se omite.
        Reserva bloqueoRecurrencia = new Reserva();
        bloqueoRecurrencia.setEspacio(espacios.get(0));
        bloqueoRecurrencia.setUsuario(docente);
        bloqueoRecurrencia.setCarrera(carrera);
        bloqueoRecurrencia.setInicio(inicioBloqueoRecurrencia);
        bloqueoRecurrencia.setFin(inicioBloqueoRecurrencia.plus(1, ChronoUnit.HOURS));
        bloqueoRecurrencia.setEstado(Reserva.EstadoReserva.APROBADO);
        bloqueoRecurrencia.setEsPublica(false);
        bloqueoRecurrencia.setTitulo("Bloqueo recurrencia E2E");

        List<Reserva> base = new java.util.ArrayList<>(List.of(
                pendienteAprobar, pendienteRechazar, aprobada, pendienteAnalista, pasada, bloqueoRecurrencia
        ));

        // Reservas históricas adicionales para que el listado del docente
        // supere 10 elementos y se active la paginación.
        for (int i = 2; i <= 10; i++) {
            LocalDate dia = LocalDate.now(tz).minusDays(i);
            java.time.Instant inicio = LocalDateTime.of(dia, LocalTime.of(9, 0)).atZone(tz).toInstant();
            Reserva historica = new Reserva();
            historica.setEspacio(espacios.get(0));
            historica.setUsuario(docente);
            historica.setCarrera(carrera);
            historica.setInicio(inicio);
            historica.setFin(inicio.plus(1, ChronoUnit.HOURS));
            historica.setEstado(Reserva.EstadoReserva.APROBADO);
            historica.setEsPublica(false);
            historica.setTitulo("Histórico " + i + " E2E");
            base.add(historica);
        }

        return reservaRepository.saveAll(base);
    }

    private void seedSolicitudInventario(Reserva reservaAprobada, TipoElemento tipo) {
        // Una solicitud PENDIENTE asociada a la reserva aprobada para que el
        // test de gestión de inventario pueda asignar item, aprobar y entregar.
        ReservaItemSolicitado solicitud = new ReservaItemSolicitado();
        solicitud.setReserva(reservaAprobada);
        solicitud.setTipoElemento(tipo);
        solicitud.setCantidadSolicitada(1);
        solicitud.setEstado(ReservaItemSolicitado.EstadoSolicitud.PENDIENTE);
        solicitud.setObservaciones("Solicitud principal E2E");
        reservaItemSolicitadoRepository.save(solicitud);
    }

    private void seedSolicitudInventarioParaRechazo(Reserva reservaAprobada, TipoElemento tipo) {
        // Segunda solicitud PENDIENTE para el test de rechazo. Mantenerla
        // separada hace que los tests sean independientes del orden.
        ReservaItemSolicitado solicitud = new ReservaItemSolicitado();
        solicitud.setReserva(reservaAprobada);
        solicitud.setTipoElemento(tipo);
        solicitud.setCantidadSolicitada(2);
        solicitud.setEstado(ReservaItemSolicitado.EstadoSolicitud.PENDIENTE);
        solicitud.setObservaciones("Solicitud para rechazo E2E");
        reservaItemSolicitadoRepository.save(solicitud);
    }

    public static String emailFor(Usuario.RolApp rol) {
        return rol.name().toLowerCase() + "@e2e.test";
    }
}
