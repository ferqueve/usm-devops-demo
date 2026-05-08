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

import java.time.Instant;
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
        seedInventario(espacios.get(0), tipoProyector);
        Carrera carrera = seedCarrera();
        List<Reserva> reservas = seedReservas(espacios, carrera);
        seedSolicitudInventario(reservas.get(2), tipoProyector);

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

    private void seedInventario(Espacio espacio, TipoElemento tipo) {
        InventarioItem item = new InventarioItem();
        item.setEspacio(espacio);
        item.setTipoElemento(tipo);
        item.setCantidad(2);
        item.setEstado("DISPONIBLE");
        item.setActivo(true);
        inventarioItemRepository.save(item);
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

        Instant manana10 = Instant.now()
                .plus(1, ChronoUnit.DAYS)
                .truncatedTo(ChronoUnit.HOURS);

        // Pendiente para el test de aprobación del admin.
        Reserva pendienteAprobar = new Reserva();
        pendienteAprobar.setEspacio(espacios.get(0));
        pendienteAprobar.setUsuario(docente);
        pendienteAprobar.setAnalistaAsignado(admin);
        pendienteAprobar.setCarrera(carrera);
        pendienteAprobar.setInicio(manana10);
        pendienteAprobar.setFin(manana10.plus(2, ChronoUnit.HOURS));
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
        pendienteRechazar.setInicio(manana10.plus(8, ChronoUnit.HOURS));
        pendienteRechazar.setFin(manana10.plus(10, ChronoUnit.HOURS));
        pendienteRechazar.setEstado(Reserva.EstadoReserva.PENDIENTE);
        pendienteRechazar.setEsPublica(false);
        pendienteRechazar.setTitulo("Sesión de laboratorio E2E");

        // Aprobada: la usa el test de cancelación del docente
        // (sólo APROBADO + esFutura permite cancelar desde la UI).
        Reserva aprobada = new Reserva();
        aprobada.setEspacio(espacios.get(1));
        aprobada.setUsuario(docente);
        aprobada.setCarrera(carrera);
        aprobada.setInicio(manana10.plus(4, ChronoUnit.HOURS));
        aprobada.setFin(manana10.plus(6, ChronoUnit.HOURS));
        aprobada.setEstado(Reserva.EstadoReserva.APROBADO);
        aprobada.setEsPublica(true);
        aprobada.setTitulo("Clase abierta E2E");

        return reservaRepository.saveAll(List.of(pendienteAprobar, pendienteRechazar, aprobada));
    }

    private void seedSolicitudInventario(Reserva reservaAprobada, TipoElemento tipo) {
        // Una solicitud PENDIENTE asociada a la reserva aprobada para que el
        // test de gestión de inventario pueda asignar item, aprobar y entregar.
        ReservaItemSolicitado solicitud = new ReservaItemSolicitado();
        solicitud.setReserva(reservaAprobada);
        solicitud.setTipoElemento(tipo);
        solicitud.setCantidadSolicitada(1);
        solicitud.setEstado(ReservaItemSolicitado.EstadoSolicitud.PENDIENTE);
        reservaItemSolicitadoRepository.save(solicitud);
    }

    public static String emailFor(Usuario.RolApp rol) {
        return rol.name().toLowerCase() + "@e2e.test";
    }
}
