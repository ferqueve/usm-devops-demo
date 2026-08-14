package com.utec.backend.util;

import com.utec.backend.model.Carrera;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.InventarioItem;
import com.utec.backend.model.Reserva;
import com.utec.backend.model.ReservaItemSolicitado;
import com.utec.backend.model.TipoElemento;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.CarreraRepository;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.InventarioItemRepository;
import com.utec.backend.repository.ReservaItemSolicitadoRepository;
import com.utec.backend.repository.ReservaRepository;
import com.utec.backend.repository.TipoElementoRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.UUID;

/**
 * Generador incremental de "tráfico" de aplicación para el perfil dev.
 *
 * Cada invocación:
 *   1. Asegura un pool grande de usuarios (~110, idempotente por email).
 *   2. Inserta reservas en bloques temporales relativos a {@code now()}:
 *      - 90..30 días atrás (pasado lejano, casi todas APROBADAS)
 *      - 30..0 días atrás (pasado reciente)
 *      - 0..14 días adelante (futuro próximo, mix con PENDIENTES)
 *      - 14..60 días adelante (futuro lejano, más PENDIENTES)
 *   3. Para ~35% de las reservas genera ReservaItemSolicitado con estado
 *      coherente a la edad y al estado de la reserva.
 *
 * No borra ni reemplaza nada: cada corrida añade movimientos nuevos al pool
 * actual y evita colisiones de espacio/horario con lo que ya existe.
 */
@Service
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class TrafficSeedService {

    private static final ZoneId ZONE = ZoneId.of("America/Montevideo");
    private static final int START_HOUR = 8;
    private static final int END_HOUR = 22;
    private static final int SLOT_MINUTES = 30;
    private static final int MAX_ATTEMPTS_PER_RESERVA = 5;

    private final UsuarioRepository usuarioRepository;
    private final EspacioRepository espacioRepository;
    private final CarreraRepository carreraRepository;
    private final TipoElementoRepository tipoElementoRepository;
    private final InventarioItemRepository inventarioItemRepository;
    private final ReservaRepository reservaRepository;
    private final ReservaItemSolicitadoRepository reservaItemSolicitadoRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.dev-seed-password:password}")
    private String devSeedPassword;

    @Transactional
    public Map<String, Object> generarTrafico(double multiplier) {
        long t0 = System.currentTimeMillis();
        Random rnd = new Random();

        UsuariosPool pool = asegurarPoolUsuarios();
        List<Espacio> espacios = espacioRepository.findAll().stream()
                .filter(e -> e.getDeletedAt() == null)
                .toList();
        List<Carrera> carreras = carreraRepository.findAll();
        List<TipoElemento> tipos = tipoElementoRepository.findAll().stream()
                .filter(t -> Boolean.TRUE.equals(t.getActivo()))
                .toList();
        Map<Long, List<InventarioItem>> inventarioPorEspacio = indexarInventarioPorEspacio();
        Set<SlotKey> slotsOcupados = cargarSlotsExistentes();

        Instant now = Instant.now();
        List<Bucket> buckets = List.of(
                new Bucket("pasado-lejano", -90, -30, (int) (2400 * multiplier), 95, 0, 5),
                new Bucket("pasado-reciente", -30, -1, (int) (1600 * multiplier), 88, 4, 8),
                new Bucket("futuro-proximo", 0, 14, (int) (1500 * multiplier), 65, 30, 5),
                new Bucket("futuro-lejano", 14, 60, (int) (4500 * multiplier), 45, 50, 5)
        );

        Map<String, Object> summary = new LinkedHashMap<>();
        EnumMap<Reserva.EstadoReserva, Integer> conteoEstados = new EnumMap<>(Reserva.EstadoReserva.class);
        int reservasInsertadas = 0;
        int reservasDescartadas = 0;
        int itemsInsertados = 0;

        for (Bucket bucket : buckets) {
            BucketResult result = generarBucket(bucket, now, espacios, carreras, tipos,
                    inventarioPorEspacio, slotsOcupados, pool, rnd);
            summary.put(bucket.nombre, Map.of(
                    "reservas", result.reservas,
                    "items", result.items,
                    "intentos", result.intentos,
                    "descartadas", result.descartadas
            ));
            reservasInsertadas += result.reservas;
            reservasDescartadas += result.descartadas;
            itemsInsertados += result.items;
            for (Map.Entry<Reserva.EstadoReserva, Integer> e : result.porEstado.entrySet()) {
                conteoEstados.merge(e.getKey(), e.getValue(), Integer::sum);
            }
        }

        long t1 = System.currentTimeMillis();
        Map<String, Object> totales = new LinkedHashMap<>();
        totales.put("reservasInsertadas", reservasInsertadas);
        totales.put("reservasDescartadas", reservasDescartadas);
        totales.put("itemsInsertados", itemsInsertados);
        totales.put("porEstado", conteoEstados);
        totales.put("usuariosCreados", pool.creados);
        totales.put("usuariosTotal", pool.total);
        totales.put("durationMs", t1 - t0);
        summary.put("totales", totales);
        log.info("Tráfico generado: {} reservas, {} items en {} ms",
                reservasInsertadas, itemsInsertados, t1 - t0);
        return summary;
    }

    // ===================== USUARIOS =====================

    private UsuariosPool asegurarPoolUsuarios() {
        UsuariosPool pool = new UsuariosPool();
        String passwordHash = passwordEncoder.encode(devSeedPassword);

        List<UsuarioPlantilla> plantillas = new ArrayList<>();
        plantillas.add(new UsuarioPlantilla("analista2@utec.edu.uy", "Analista Dos", Usuario.RolApp.ANALISTA));
        plantillas.add(new UsuarioPlantilla("analista3@utec.edu.uy", "Analista Tres", Usuario.RolApp.ANALISTA));
        for (int i = 1; i <= 15; i++) {
            plantillas.add(new UsuarioPlantilla(
                    String.format("docente%02d@utec.edu.uy", i),
                    "Docente " + i,
                    Usuario.RolApp.DOCENTE));
        }
        for (int i = 1; i <= 80; i++) {
            plantillas.add(new UsuarioPlantilla(
                    String.format("estudiante%02d@utec.edu.uy", i),
                    "Estudiante " + i,
                    Usuario.RolApp.ESTUDIANTE));
        }
        for (int i = 1; i <= 10; i++) {
            plantillas.add(new UsuarioPlantilla(
                    String.format("externo%02d@gmail.com", i),
                    "Externo " + i,
                    Usuario.RolApp.EXTERNO));
        }
        plantillas.add(new UsuarioPlantilla("mantenimiento2@utec.edu.uy", "Mantenimiento Dos", Usuario.RolApp.MANTENIMIENTO));
        plantillas.add(new UsuarioPlantilla("mantenimiento3@utec.edu.uy", "Mantenimiento Tres", Usuario.RolApp.MANTENIMIENTO));

        for (UsuarioPlantilla p : plantillas) {
            Usuario u = usuarioRepository.findByEmail(p.email).orElse(null);
            if (u == null) {
                u = new Usuario();
                u.setEmail(p.email);
                u.setNombre(p.nombre);
                u.setPassword(passwordHash);
                u.setRolApp(p.rol);
                u.setVerificado(true);
                u = usuarioRepository.save(u);
                pool.creados++;
            }
            pool.add(p.rol, u);
        }
        // Sumamos también los usuarios base del seed inicial.
        for (Usuario.RolApp rol : Usuario.RolApp.values()) {
            for (Usuario u : usuarioRepository.findAll()) {
                if (u.getRolApp() == rol && u.getDeletedAt() == null) {
                    pool.add(rol, u);
                }
            }
        }
        pool.total = pool.allCount();
        return pool;
    }

    // ===================== BUCKETS =====================

    private BucketResult generarBucket(Bucket bucket, Instant now,
                                       List<Espacio> espacios, List<Carrera> carreras,
                                       List<TipoElemento> tipos,
                                       Map<Long, List<InventarioItem>> inventarioPorEspacio,
                                       Set<SlotKey> slotsOcupados,
                                       UsuariosPool pool, Random rnd) {
        BucketResult result = new BucketResult();
        int objetivo = bucket.cantidad;

        for (int i = 0; i < objetivo; i++) {
            boolean creada = false;
            for (int intento = 0; intento < MAX_ATTEMPTS_PER_RESERVA && !creada; intento++) {
                result.intentos++;
                Espacio esp = espacios.get(rnd.nextInt(espacios.size()));
                Slot slot = elegirSlot(bucket, now, rnd);
                SlotKey key = new SlotKey(esp.getId(), slot.inicio, slot.fin);
                if (slotsOcupados.contains(key) || haySolapamiento(slotsOcupados, esp.getId(), slot)) {
                    continue;
                }
                Usuario solicitante = elegirSolicitante(pool, rnd);
                if (solicitante == null) {
                    return result;
                }
                Usuario analista = pool.pickRandom(Usuario.RolApp.ANALISTA, rnd);
                Carrera carrera = elegirCarreraSegunRol(carreras, solicitante.getRolApp(), rnd);
                Reserva.EstadoReserva estado = elegirEstado(bucket, rnd);

                Reserva r = new Reserva();
                r.setEspacio(esp);
                r.setUsuario(solicitante);
                r.setCarrera(carrera);
                r.setAnalistaAsignado(analista);
                r.setInicio(slot.inicio);
                r.setFin(slot.fin);
                r.setEstado(estado);
                r.setEsPublica(solicitante.getRolApp() == Usuario.RolApp.EXTERNO || rnd.nextDouble() < 0.15);
                r.setTitulo(generarTitulo(solicitante, esp, rnd));
                if (solicitante.getRolApp() == Usuario.RolApp.DOCENTE
                        || solicitante.getRolApp() == Usuario.RolApp.EXTERNO) {
                    r.setMotivoSolicitud(generarMotivo(solicitante, rnd));
                }
                if (estado == Reserva.EstadoReserva.CANCELADO) {
                    r.setMensajeAnalista("Cancelada automáticamente por seed.");
                }
                try {
                    reservaRepository.save(r);
                } catch (RuntimeException e) {
                    // Hubo violación de unicidad u otra colisión; saltamos.
                    continue;
                }
                slotsOcupados.add(key);
                creada = true;
                result.reservas++;
                result.porEstado.merge(estado, 1, Integer::sum);

                // Solicitudes de inventario: ~35% de reservas.
                if (estado != Reserva.EstadoReserva.CANCELADO && rnd.nextDouble() < 0.35) {
                    int items = generarItemsSolicitados(r, bucket, tipos, inventarioPorEspacio, rnd);
                    result.items += items;
                }
            }
            if (!creada) {
                result.descartadas++;
            }
        }
        return result;
    }

    private Slot elegirSlot(Bucket bucket, Instant now, Random rnd) {
        LocalDate base = LocalDate.now(ZONE);
        int diaOffset = bucket.diaInicio + rnd.nextInt(bucket.diaFin - bucket.diaInicio + 1);
        LocalDate dia = base.plusDays(diaOffset);
        // L-V denso, S menos, D casi nada
        DayOfWeek dow = dia.getDayOfWeek();
        if (dow == DayOfWeek.SUNDAY && rnd.nextDouble() < 0.95) {
            dia = dia.plusDays(1);
        }
        if (dow == DayOfWeek.SATURDAY && rnd.nextDouble() < 0.6) {
            dia = dia.plusDays(rnd.nextBoolean() ? 1 : 2);
        }
        // Distribución horaria con picos 10-12 y 16-19
        int hora = elegirHora(rnd);
        int minuto = rnd.nextBoolean() ? 0 : SLOT_MINUTES;
        int duracionSlots = 1 + rnd.nextInt(4); // 30, 60, 90, 120 min
        LocalDateTime inicioLdt = LocalDateTime.of(dia, java.time.LocalTime.of(hora, minuto));
        LocalDateTime finLdt = inicioLdt.plusMinutes((long) SLOT_MINUTES * duracionSlots);
        if (finLdt.getHour() >= END_HOUR + 1) {
            finLdt = LocalDateTime.of(dia, java.time.LocalTime.of(END_HOUR, 0));
        }
        return new Slot(
                inicioLdt.atZone(ZONE).toInstant(),
                finLdt.atZone(ZONE).toInstant()
        );
    }

    private int elegirHora(Random rnd) {
        // Pico mañana 10-12, pico tarde 16-19, llano resto.
        double r = rnd.nextDouble();
        if (r < 0.30) return 10 + rnd.nextInt(2);
        if (r < 0.65) return 16 + rnd.nextInt(3);
        return START_HOUR + rnd.nextInt(END_HOUR - START_HOUR);
    }

    private boolean haySolapamiento(Set<SlotKey> ocupados, Long espacioId, Slot slot) {
        // Chequeo barato: si hay algún slot del mismo espacio cuyo rango se solapa.
        // Como en memoria son pocos miles, iteramos sobre el set filtrado por espacio.
        for (SlotKey k : ocupados) {
            if (!k.espacioId.equals(espacioId)) continue;
            if (slot.inicio.isBefore(k.fin) && slot.fin.isAfter(k.inicio)) {
                return true;
            }
        }
        return false;
    }

    private Set<SlotKey> cargarSlotsExistentes() {
        Set<SlotKey> set = new HashSet<>();
        for (Reserva r : reservaRepository.findAll()) {
            if (r.getEstado() != Reserva.EstadoReserva.CANCELADO) {
                set.add(new SlotKey(r.getEspacio().getId(), r.getInicio(), r.getFin()));
            }
        }
        return set;
    }

    private Reserva.EstadoReserva elegirEstado(Bucket bucket, Random rnd) {
        int r = rnd.nextInt(100);
        if (r < bucket.pctAprobado) return Reserva.EstadoReserva.APROBADO;
        if (r < bucket.pctAprobado + bucket.pctPendiente) return Reserva.EstadoReserva.PENDIENTE;
        return Reserva.EstadoReserva.CANCELADO;
    }

    private Usuario elegirSolicitante(UsuariosPool pool, Random rnd) {
        // Pesos: DOCENTE 45%, ANALISTA 25%, EXTERNO 15%, ESTUDIANTE 10% (sí, ellos también algunas),
        // ADMIN 5%. MANTENIMIENTO no reserva por permisos.
        double r = rnd.nextDouble();
        Usuario.RolApp rol;
        if (r < 0.45) rol = Usuario.RolApp.DOCENTE;
        else if (r < 0.70) rol = Usuario.RolApp.ANALISTA;
        else if (r < 0.85) rol = Usuario.RolApp.EXTERNO;
        else if (r < 0.95) rol = Usuario.RolApp.ESTUDIANTE;
        else rol = Usuario.RolApp.ADMIN;
        Usuario u = pool.pickRandom(rol, rnd);
        if (u == null) u = pool.pickRandom(Usuario.RolApp.DOCENTE, rnd);
        return u;
    }

    private Carrera elegirCarreraSegunRol(List<Carrera> carreras, Usuario.RolApp rol, Random rnd) {
        if (carreras.isEmpty()) return null;
        double prob;
        switch (rol) {
            case EXTERNO: return null;
            case DOCENTE: prob = 0.7; break;
            case ANALISTA: prob = 0.5; break;
            case ESTUDIANTE: prob = 0.9; break;
            default: prob = 0.3;
        }
        return rnd.nextDouble() < prob ? carreras.get(rnd.nextInt(carreras.size())) : null;
    }

    private String generarTitulo(Usuario u, Espacio esp, Random rnd) {
        String[] motivos = {
                "Clase de %s", "Reunión de equipo", "Taller práctico",
                "Examen parcial", "Defensa de tesis", "Charla invitada",
                "Hackathon", "Capacitación", "Evento institucional",
                "Tutoría", "Workshop", "Demo de proyecto"
        };
        String[] temas = {"Algoritmos", "Bases de Datos", "Redes", "Ética", "Probabilidad",
                "Cálculo", "Programación", "Sistemas Operativos", "IA", "Proyecto Integrador"};
        String tpl = motivos[rnd.nextInt(motivos.length)];
        String titulo = tpl.contains("%s") ? String.format(tpl, temas[rnd.nextInt(temas.length)]) : tpl;
        // Suffix corto único para evitar colisiones visuales y para trazar la corrida.
        return titulo + " #" + UUID.randomUUID().toString().substring(0, 4).toUpperCase(Locale.ROOT);
    }

    private String generarMotivo(Usuario u, Random rnd) {
        String[] motivos = {
                "Necesito un aula con proyector para la clase",
                "Voy a recibir alumnos visitantes",
                "Reunión de coordinación con otros docentes",
                "Evento abierto a la comunidad",
                "Espacio para presentación de avances",
                "Trabajo en grupo del proyecto integrador"
        };
        return motivos[rnd.nextInt(motivos.length)];
    }

    // ===================== ITEMS =====================

    private int generarItemsSolicitados(Reserva reserva, Bucket bucket,
                                        List<TipoElemento> tipos,
                                        Map<Long, List<InventarioItem>> inventarioPorEspacio,
                                        Random rnd) {
        int cantidadItems = 1 + rnd.nextInt(3); // 1-3 ítems por reserva
        int insertados = 0;
        Set<Long> tiposUsados = new HashSet<>();
        List<InventarioItem> inventarioEspacio = inventarioPorEspacio.getOrDefault(
                reserva.getEspacio().getId(), Collections.emptyList());
        for (int i = 0; i < cantidadItems; i++) {
            TipoElemento tipo = tipos.get(rnd.nextInt(tipos.size()));
            if (!tiposUsados.add(tipo.getId())) continue;
            ReservaItemSolicitado item = new ReservaItemSolicitado();
            item.setReserva(reserva);
            item.setTipoElemento(tipo);
            item.setCantidadSolicitada(1 + rnd.nextInt(3));
            ReservaItemSolicitado.EstadoSolicitud estadoSolicitud =
                    elegirEstadoSolicitud(bucket, reserva.getEstado(), rnd);
            item.setEstado(estadoSolicitud);
            if (estadoSolicitud == ReservaItemSolicitado.EstadoSolicitud.APROBADO
                    || estadoSolicitud == ReservaItemSolicitado.EstadoSolicitud.ENTREGADO) {
                InventarioItem disp = inventarioEspacio.stream()
                        .filter(ii -> Boolean.TRUE.equals(ii.getActivo())
                                && "DISPONIBLE".equalsIgnoreCase(ii.getEstado())
                                && ii.getTipoElemento() != null
                                && ii.getTipoElemento().getId().equals(tipo.getId()))
                        .findFirst()
                        .orElse(null);
                if (disp != null) {
                    item.setInventarioItem(disp);
                } else if (estadoSolicitud == ReservaItemSolicitado.EstadoSolicitud.ENTREGADO) {
                    // Sin item disponible: degradar a APROBADO sin item? No, ENTREGADO requiere item,
                    // así que la dejamos APROBADO si no hay item disponible (consistente con validación).
                    item.setEstado(ReservaItemSolicitado.EstadoSolicitud.APROBADO);
                }
                if (item.getInventarioItem() == null
                        && item.getEstado() == ReservaItemSolicitado.EstadoSolicitud.APROBADO) {
                    item.setEstado(ReservaItemSolicitado.EstadoSolicitud.PENDIENTE);
                }
            }
            if (rnd.nextDouble() < 0.25) {
                item.setObservaciones("Observaciones de prueba para item " + tipo.getNombre());
            }
            try {
                reservaItemSolicitadoRepository.save(item);
                insertados++;
            } catch (RuntimeException e) {
                // ignore individual failures
            }
        }
        return insertados;
    }

    private ReservaItemSolicitado.EstadoSolicitud elegirEstadoSolicitud(Bucket bucket,
                                                                         Reserva.EstadoReserva reservaEstado,
                                                                         Random rnd) {
        if (reservaEstado == Reserva.EstadoReserva.PENDIENTE) {
            return ReservaItemSolicitado.EstadoSolicitud.PENDIENTE;
        }
        // Reserva APROBADA o CANCELADA (no llegamos a items de canceladas en gerenciar arriba, pero por sí acaso)
        if (bucket.diaFin <= 0) {
            // pasado: mayoría ENTREGADOS, algunos RECHAZADOS
            int r = rnd.nextInt(100);
            if (r < 80) return ReservaItemSolicitado.EstadoSolicitud.ENTREGADO;
            if (r < 92) return ReservaItemSolicitado.EstadoSolicitud.RECHAZADO;
            return ReservaItemSolicitado.EstadoSolicitud.APROBADO;
        }
        // futuro: aprobados, algunos pendientes, pocos rechazados
        int r = rnd.nextInt(100);
        if (r < 55) return ReservaItemSolicitado.EstadoSolicitud.APROBADO;
        if (r < 90) return ReservaItemSolicitado.EstadoSolicitud.PENDIENTE;
        return ReservaItemSolicitado.EstadoSolicitud.RECHAZADO;
    }

    private Map<Long, List<InventarioItem>> indexarInventarioPorEspacio() {
        Map<Long, List<InventarioItem>> map = new HashMap<>();
        for (InventarioItem ii : inventarioItemRepository.findAll()) {
            if (Boolean.TRUE.equals(ii.getActivo()) && ii.getEspacio() != null) {
                map.computeIfAbsent(ii.getEspacio().getId(), k -> new ArrayList<>()).add(ii);
            }
        }
        return map;
    }

    // ===================== TIPOS AUXILIARES =====================

    private static final class Bucket {
        final String nombre;
        final int diaInicio;
        final int diaFin;
        final int cantidad;
        final int pctAprobado;
        final int pctPendiente;
        final int pctCancelado;

        Bucket(String nombre, int diaInicio, int diaFin, int cantidad,
               int pctAprobado, int pctPendiente, int pctCancelado) {
            this.nombre = nombre;
            this.diaInicio = diaInicio;
            this.diaFin = diaFin;
            this.cantidad = cantidad;
            this.pctAprobado = pctAprobado;
            this.pctPendiente = pctPendiente;
            this.pctCancelado = pctCancelado;
        }
    }

    private static final class BucketResult {
        int reservas;
        int items;
        int intentos;
        int descartadas;
        final EnumMap<Reserva.EstadoReserva, Integer> porEstado = new EnumMap<>(Reserva.EstadoReserva.class);
    }

    private static final class Slot {
        final Instant inicio;
        final Instant fin;

        Slot(Instant inicio, Instant fin) {
            this.inicio = inicio;
            this.fin = fin;
        }
    }

    private static final class SlotKey {
        final Long espacioId;
        final Instant inicio;
        final Instant fin;

        SlotKey(Long espacioId, Instant inicio, Instant fin) {
            this.espacioId = espacioId;
            this.inicio = inicio;
            this.fin = fin;
        }

        @Override
        public boolean equals(Object o) {
            if (!(o instanceof SlotKey)) return false;
            SlotKey s = (SlotKey) o;
            return espacioId.equals(s.espacioId) && inicio.equals(s.inicio) && fin.equals(s.fin);
        }

        @Override
        public int hashCode() {
            return espacioId.hashCode() * 31 + inicio.hashCode();
        }
    }

    private static final class UsuariosPool {
        final Map<Usuario.RolApp, List<Usuario>> porRol = new EnumMap<>(Usuario.RolApp.class);
        int creados;
        int total;

        void add(Usuario.RolApp rol, Usuario u) {
            porRol.computeIfAbsent(rol, k -> new ArrayList<>()).add(u);
        }

        Usuario pickRandom(Usuario.RolApp rol, Random rnd) {
            List<Usuario> list = porRol.get(rol);
            if (list == null || list.isEmpty()) return null;
            return list.get(rnd.nextInt(list.size()));
        }

        int allCount() {
            Set<Long> seen = new HashSet<>();
            for (List<Usuario> l : porRol.values()) {
                for (Usuario u : l) {
                    seen.add(u.getId());
                }
            }
            return seen.size();
        }
    }

    private static final class UsuarioPlantilla {
        final String email;
        final String nombre;
        final Usuario.RolApp rol;

        UsuarioPlantilla(String email, String nombre, Usuario.RolApp rol) {
            this.email = email;
            this.nombre = nombre;
            this.rol = rol;
        }
    }
}
