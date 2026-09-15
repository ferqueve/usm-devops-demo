package com.utec.backend.service;

import com.utec.backend.dto.stats.AprobacionReservasDto;
import com.utec.backend.dto.stats.Comparacion;
import com.utec.backend.dto.stats.ExternosDto;
import com.utec.backend.dto.stats.FiltroReservas;
import com.utec.backend.dto.stats.NovedadDto;
import com.utec.backend.dto.stats.OpcionesFiltroDto;
import com.utec.backend.dto.stats.Periodo;
import com.utec.backend.dto.stats.ResumenReservasDto;
import com.utec.backend.repository.EstadisticasReservaConsultas;
import com.utec.backend.repository.EstadisticasReservaConsultas.FilaHeatmap;
import com.utec.backend.repository.EstadisticasReservaConsultas.FilaRespuesta;
import com.utec.backend.repository.EstadisticasReservaConsultas.FilaSerie;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.utec.backend.service.CalculosEstadisticos.*;

/**
 * Estadísticas de reservas que alimentan la página /statistics.
 *
 * Todo se calcula en vivo sobre la tabla transaccional con los filtros
 * comunes: las tablas de hechos no tienen rol ni tipo de espacio, y los
 * números de la pantalla tienen que estar al día.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EstadisticasReservaService {

    private static final int DEFAULT_TOP_USUARIOS = 10;
    static final int TOP_ORGANIZADORES_EXTERNOS = 10;

    /** Hasta estos días la serie va por día; hasta el siguiente, por semana. */
    private static final long DIAS_SERIE_DIARIA = 45;
    private static final long DIAS_SERIE_SEMANAL = 200;

    static final Tramos TRAMOS_RESPUESTA = new Tramos(
            List.of("< 1 h", "1–4 h", "4–24 h", "1–3 días", "> 3 días"), new double[]{1, 4, 24, 72});
    /** En días enteros del campus: 0 es el mismo día, 1–2, 3–7, 8–30 y más. */
    static final Tramos TRAMOS_ANTELACION = new Tramos(
            List.of("Mismo día", "1–2 días", "3–7 días", "8–30 días", "Más de 30 días"), new double[]{1, 3, 8, 31});
    static final Tramos TRAMOS_ANTIGUEDAD = new Tramos(
            List.of("< 24 h", "1–3 días", "3–7 días", "> 7 días"), new double[]{24, 72, 168});

    // Umbrales de las novedades: por debajo de esto el cambio es ruido de volumen chico.
    static final double NOVEDAD_OCUPACION_MINIMA_PCT = 10;
    static final long NOVEDAD_CARRERA_MINIMO_RESUELTAS = 20;
    static final long NOVEDAD_VOLUMEN_MINIMO = 30;
    static final int NOVEDADES_MAXIMAS = 6;
    /** Sin este tope, un período con más reservas en general llena la lista con un cambio por rol. */
    static final int NOVEDADES_MAXIMAS_POR_TIPO = 2;

    private static final String[] DIAS_CORTOS = {"Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"};

    private final EstadisticasReservaConsultas consultas;
    private final Clock clock;

    private enum Unidad {
        DIA("day", "dia"), SEMANA("week", "semana"), MES("month", "mes");

        final String postgres;
        final String nombre;

        Unidad(String postgres, String nombre) {
            this.postgres = postgres;
            this.nombre = nombre;
        }
    }

    // ---------------------------------------------------------------- resumen

    /**
     * Resumen de las reservas que empiezan entre {@code desde} y {@code hasta},
     * inclusive, con el período de comparación: los mismos días inmediatamente
     * antes o las mismas fechas del año pasado.
     */
    public ResumenReservasDto resumen(LocalDate desde, LocalDate hasta, FiltroReservas filtro, String comparar) {
        Periodo periodo = new Periodo(desde, hasta);
        Comparacion comparacion = Comparacion.de(comparar);
        Periodo anterior = periodo.anterior(comparacion);
        Instant ahora = clock.instant();

        long dias = periodo.dias();
        Unidad unidad = dias <= DIAS_SERIE_DIARIA ? Unidad.DIA
                : dias <= DIAS_SERIE_SEMANAL ? Unidad.SEMANA
                : Unidad.MES;

        List<ResumenReservasDto.PuntoSerie> serie =
                serie(unidad, periodo, consultas.seriePorEstado(unidad.postgres, periodo, filtro));
        // Por día la serie ya es diaria: no hace falta pedirla dos veces.
        List<ResumenReservasDto.PuntoSerie> diario = unidad == Unidad.DIA ? serie
                : serie(Unidad.DIA, periodo, consultas.seriePorEstado(Unidad.DIA.postgres, periodo, filtro));

        return new ResumenReservasDto(
                desde,
                hasta,
                consultas.totales(periodo, ahora, filtro),
                consultas.totales(anterior, ahora, filtro),
                anterior.desde(),
                anterior.hasta(),
                comparacion.valor(),
                consultas.contarEspacios(filtro),
                unidad.nombre,
                serie,
                diario,
                consultas.porRol(periodo, filtro)
        );
    }

    /** Un punto por día, semana o mes del período, con cero los que no tienen reservas. */
    private static List<ResumenReservasDto.PuntoSerie> serie(Unidad unidad, Periodo periodo, List<FilaSerie> filas) {
        Map<LocalDate, Map<String, Long>> porPeriodo = new HashMap<>();
        for (FilaSerie fila : filas) {
            porPeriodo.computeIfAbsent(fila.periodo(), k -> new HashMap<>()).put(fila.estado(), fila.cantidad());
        }

        List<ResumenReservasDto.PuntoSerie> serie = new ArrayList<>();
        for (LocalDate p = truncar(unidad, periodo.desde()); !p.isAfter(periodo.hasta()); p = siguiente(unidad, p)) {
            Map<String, Long> estados = porPeriodo.getOrDefault(p, Map.of());
            serie.add(new ResumenReservasDto.PuntoSerie(
                    p,
                    estados.getOrDefault("APROBADO", 0L),
                    estados.getOrDefault("PENDIENTE", 0L),
                    estados.getOrDefault("CANCELADO", 0L)));
        }
        return serie;
    }

    private static LocalDate truncar(Unidad unidad, LocalDate fecha) {
        return switch (unidad) {
            case DIA -> fecha;
            case SEMANA -> fecha.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case MES -> fecha.withDayOfMonth(1);
        };
    }

    private static LocalDate siguiente(Unidad unidad, LocalDate fecha) {
        return switch (unidad) {
            case DIA -> fecha.plusDays(1);
            case SEMANA -> fecha.plusWeeks(1);
            case MES -> fecha.plusMonths(1);
        };
    }

    // ------------------------------------------------------ vistas existentes

    /**
     * Horas aprobadas de cada espacio sobre las horas del campus en el período.
     *
     * Cuenta sólo lo transcurrido hasta hoy inclusive, arriba y abajo: contar
     * los días que faltan (sin reservas todavía) bajaba la ocupación de un
     * período en curso.
     */
    public List<Map<String, Object>> ocupacionPorEspacio(LocalDate desde, LocalDate hasta, FiltroReservas filtro) {
        Periodo periodo = new Periodo(desde, hasta);
        Periodo transcurrido = periodo.hastaHoy(hoy(clock)).orElse(null);
        long dias = transcurrido == null ? 0 : transcurrido.dias();
        BigDecimal horasDisponibles = BigDecimal.valueOf(dias * HORAS_DISPONIBLES_POR_DIA);

        return consultas.ocupacion(transcurrido == null ? periodo : transcurrido, filtro).stream()
                .map(fila -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("espacioId", fila.espacioId());
                    m.put("espacioNombre", fila.espacioNombre());
                    m.put("edificioNombre", fila.edificioNombre());
                    BigDecimal horasReservadas = transcurrido == null ? BigDecimal.ZERO
                            : BigDecimal.valueOf(fila.horas()).setScale(2, RoundingMode.HALF_UP);
                    m.put("horasReservadas", horasReservadas);
                    m.put("horasDisponibles", horasDisponibles);
                    m.put("reservas", transcurrido == null ? 0L : fila.reservas());
                    BigDecimal porcentaje = horasDisponibles.signum() == 0
                            ? BigDecimal.ZERO.setScale(2)
                            : horasReservadas.multiply(BigDecimal.valueOf(100))
                                    .divide(horasDisponibles, 2, RoundingMode.HALF_UP);
                    m.put("porcentaje", porcentaje);
                    return m;
                })
                .toList();
    }

    public List<Map<String, Object>> heatmapDiaHora(LocalDate desde, LocalDate hasta, FiltroReservas filtro) {
        return consultas.heatmap(new Periodo(desde, hasta), filtro).stream()
                .map(fila -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("diaSemana", fila.diaSemana());
                    m.put("hora", fila.hora());
                    m.put("cant", fila.cantidad());
                    return m;
                })
                .toList();
    }

    public List<Map<String, Object>> resumenPorCarrera(LocalDate desde, LocalDate hasta, FiltroReservas filtro) {
        return consultas.porCarrera(new Periodo(desde, hasta), filtro).stream()
                .map(fila -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("carreraId", fila.carreraId());
                    m.put("carreraNombre", fila.nombre() == null ? "Sin carrera" : fila.nombre());
                    m.put("aprobadas", fila.aprobadas());
                    m.put("canceladas", fila.canceladas());
                    m.put("pendientes", fila.pendientes());
                    m.put("canceladasTarde", fila.canceladasTarde());
                    long total = fila.aprobadas() + fila.canceladas();
                    m.put("tasaCancelacion", total == 0
                            ? BigDecimal.ZERO
                            : BigDecimal.valueOf(fila.canceladas() * 100.0 / total).setScale(2, RoundingMode.HALF_UP));
                    return m;
                })
                .toList();
    }

    public List<Map<String, Object>> resumenPorEdificio(LocalDate desde, LocalDate hasta, FiltroReservas filtro) {
        return consultas.porEdificio(new Periodo(desde, hasta), filtro).stream()
                .map(fila -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("edificioId", fila.edificioId());
                    m.put("edificioNombre", fila.nombre() == null ? "Sin edificio" : fila.nombre());
                    m.put("cantReservas", fila.reservas());
                    return m;
                })
                .toList();
    }

    public List<Map<String, Object>> topUsuarios(LocalDate desde, LocalDate hasta, FiltroReservas filtro,
                                                 Integer limite) {
        int top = limite == null || limite <= 0 ? DEFAULT_TOP_USUARIOS : limite;
        return consultas.topUsuarios(new Periodo(desde, hasta), filtro, top).stream()
                .map(fila -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("usuarioId", fila.usuarioId());
                    m.put("nombre", fila.nombre());
                    m.put("email", fila.email());
                    m.put("rol", fila.rol());
                    m.put("cantReservas", fila.total());
                    m.put("aprobadas", fila.aprobadas());
                    m.put("canceladas", fila.canceladas());
                    return m;
                })
                .toList();
    }

    public OpcionesFiltroDto opciones() {
        return consultas.opciones();
    }

    /** Eventos externos del período: el total y los organizadores que más reservan. */
    public ExternosDto externos(LocalDate desde, LocalDate hasta, FiltroReservas filtro) {
        Periodo periodo = new Periodo(desde, hasta);
        List<ExternosDto.Organizador> organizadores =
                consultas.organizadoresExternos(periodo, filtro, TOP_ORGANIZADORES_EXTERNOS).stream()
                        .map(o -> new ExternosDto.Organizador(o.organizador(), o.eventos(), o.aprobadas(),
                                o.canceladas(), redondear(o.horas()), o.espacios()))
                        .toList();
        return new ExternosDto(consultas.contarExternos(periodo, filtro), organizadores);
    }

    // ------------------------------------------------------------- aprobación

    /** Tiempos de respuesta, carga por analista, antelación y pendientes sin resolver. */
    public AprobacionReservasDto aprobacion(LocalDate desde, LocalDate hasta, FiltroReservas filtro) {
        Periodo periodo = new Periodo(desde, hasta);
        Instant ahora = clock.instant();

        FilaRespuesta r = consultas.respuesta(periodo, filtro);
        AprobacionReservasDto.Respuesta respuesta = new AprobacionReservasDto.Respuesta(
                r.resueltas(), r.conDato(),
                r.conDato() == 0 ? null : redondear(r.mediana()),
                r.conDato() == 0 ? null : redondear(r.p90()),
                porcentaje(r.dentroDe24h(), r.conDato()));

        long[][] distribucion = TRAMOS_RESPUESTA.completar(
                consultas.distribucionRespuesta(periodo, filtro, TRAMOS_RESPUESTA.limites()), 1);
        List<AprobacionReservasDto.Tramo> tramosRespuesta = new ArrayList<>();
        for (int i = 0; i < distribucion.length; i++) {
            tramosRespuesta.add(new AprobacionReservasDto.Tramo(TRAMOS_RESPUESTA.nombres().get(i), distribucion[i][0]));
        }

        List<AprobacionReservasDto.Analista> analistas = consultas.analistas(periodo, ahora, filtro).stream()
                .map(a -> new AprobacionReservasDto.Analista(a.usuarioId(), a.nombre(), a.asignadas(),
                        a.pendientes(), a.vencidas(), a.aprobadas(), a.canceladas(), redondear(a.medianaHoras())))
                .toList();

        long[][] antelacion = TRAMOS_ANTELACION.completar(
                consultas.antelacion(periodo, filtro, TRAMOS_ANTELACION.limites()), 4);
        List<AprobacionReservasDto.Antelacion> tramosAntelacion = new ArrayList<>();
        for (int i = 0; i < antelacion.length; i++) {
            long[] v = antelacion[i];
            tramosAntelacion.add(new AprobacionReservasDto.Antelacion(
                    TRAMOS_ANTELACION.nombres().get(i), v[0], v[1], v[2], v[3]));
        }

        long[][] antiguedad = TRAMOS_ANTIGUEDAD.completar(
                consultas.pendientesPorAntiguedad(periodo, ahora, filtro, TRAMOS_ANTIGUEDAD.limites()), 2);
        List<AprobacionReservasDto.Antiguedad> tramosAntiguedad = new ArrayList<>();
        for (int i = 0; i < antiguedad.length; i++) {
            tramosAntiguedad.add(new AprobacionReservasDto.Antiguedad(
                    TRAMOS_ANTIGUEDAD.nombres().get(i), antiguedad[i][0], antiguedad[i][1]));
        }

        return new AprobacionReservasDto(respuesta, tramosRespuesta, analistas, tramosAntelacion, tramosAntiguedad);
    }

    // -------------------------------------------------------------- novedades

    /** Un valor comparable de una entidad: su nombre, la métrica y cuánto volumen la respalda. */
    record Valor(String titulo, double valor, long volumen) {
    }

    /** Lo que se compara de cada período. {@code respuesta} es null si no hay tiempos de respuesta. */
    record DatosNovedades(Map<String, Valor> ocupacionEspacios,
                          Map<String, Valor> cancelacionCarreras,
                          Map<String, Valor> reservasRol,
                          Map<String, Valor> aprobadasEdificio,
                          List<FilaHeatmap> heatmap,
                          Valor respuesta) {
    }

    private record Candidata(NovedadDto novedad, double relevancia) {
    }

    /**
     * Los cambios más llamativos entre el período y el de comparación, con los
     * mismos filtros. Devuelve a lo sumo {@value #NOVEDADES_MAXIMAS}, y no más de
     * {@value #NOVEDADES_MAXIMAS_POR_TIPO} del mismo tipo para que la lista cuente cosas distintas.
     */
    public List<NovedadDto> novedades(LocalDate desde, LocalDate hasta, FiltroReservas filtro, String comparar) {
        Periodo periodo = new Periodo(desde, hasta);
        Periodo anterior = periodo.anterior(Comparacion.de(comparar));
        return calcularNovedades(datosNovedades(anterior, filtro), datosNovedades(periodo, filtro));
    }

    private DatosNovedades datosNovedades(Periodo periodo, FiltroReservas filtro) {
        Map<String, Valor> ocupacion = new LinkedHashMap<>();
        periodo.hastaHoy(hoy(clock)).ifPresent(transcurrido -> {
            double horasDisponibles = transcurrido.dias() * (double) HORAS_DISPONIBLES_POR_DIA;
            consultas.ocupacion(transcurrido, filtro).forEach(f -> ocupacion.put(String.valueOf(f.espacioId()),
                    new Valor(f.espacioNombre(), f.horas() * 100.0 / horasDisponibles, f.reservas())));
        });

        Map<String, Valor> carreras = new LinkedHashMap<>();
        consultas.porCarrera(periodo, filtro).stream()
                .filter(f -> f.carreraId() != null)
                .forEach(f -> {
                    long resueltas = f.aprobadas() + f.canceladas();
                    double tasa = resueltas == 0 ? 0 : f.canceladas() * 100.0 / resueltas;
                    carreras.put(String.valueOf(f.carreraId()), new Valor(f.nombre(), tasa, resueltas));
                });

        Map<String, Valor> roles = new LinkedHashMap<>();
        consultas.porRol(periodo, filtro).stream()
                .filter(c -> c.nombre() != null)
                .forEach(c -> roles.put(c.nombre(), new Valor(c.nombre(), c.total(), c.total())));

        Map<String, Valor> edificios = new LinkedHashMap<>();
        consultas.porEdificio(periodo, filtro).stream()
                .filter(f -> f.edificioId() != null)
                .forEach(f -> edificios.put(String.valueOf(f.edificioId()),
                        new Valor(f.nombre(), f.reservas(), f.reservas())));

        FilaRespuesta r = consultas.respuesta(periodo, filtro);
        Valor respuesta = r.conDato() == 0 || r.mediana() == null ? null
                : new Valor("Tiempo mediano de respuesta", r.mediana(), r.conDato());

        return new DatosNovedades(ocupacion, carreras, roles, edificios, consultas.heatmap(periodo, filtro), respuesta);
    }

    /**
     * Elige las novedades. Separado de las consultas para poder probar los
     * umbrales con números armados a mano.
     */
    static List<NovedadDto> calcularNovedades(DatosNovedades antes, DatosNovedades ahora) {
        List<Candidata> candidatas = new ArrayList<>();

        // Ocupación por espacio: sólo si en algún período el espacio pesa algo.
        for (String clave : claves(antes.ocupacionEspacios(), ahora.ocupacionEspacios())) {
            Valor a = antes.ocupacionEspacios().get(clave);
            Valor b = ahora.ocupacionEspacios().get(clave);
            double va = valor(a);
            double vb = valor(b);
            if (Math.max(va, vb) < NOVEDAD_OCUPACION_MINIMA_PCT) {
                continue;
            }
            agregar(candidatas, "espacio", clave, titulo(a, b), "ocupacion", va, vb, vb - va, "pp", null,
                    volumen(a) + volumen(b));
        }

        // Tasa de cancelación por carrera: con pocas resueltas un par de cancelaciones mueve 10 puntos.
        for (String clave : claves(antes.cancelacionCarreras(), ahora.cancelacionCarreras())) {
            Valor a = antes.cancelacionCarreras().get(clave);
            Valor b = ahora.cancelacionCarreras().get(clave);
            if (volumen(a) < NOVEDAD_CARRERA_MINIMO_RESUELTAS || volumen(b) < NOVEDAD_CARRERA_MINIMO_RESUELTAS) {
                continue;
            }
            double cambio = b.valor() - a.valor();
            agregar(candidatas, "carrera", clave, titulo(a, b), "cancelacion", a.valor(), b.valor(), cambio, "pp",
                    cambio < 0, Math.min(a.volumen(), b.volumen()));
        }

        relativas(candidatas, "rol", "reservas", antes.reservasRol(), ahora.reservasRol());
        relativas(candidatas, "edificio", "aprobadas", antes.aprobadasEdificio(), ahora.aprobadasEdificio());

        horaPico(candidatas, antes.heatmap(), ahora.heatmap());

        if (antes.respuesta() != null && ahora.respuesta() != null) {
            double cambio = ahora.respuesta().valor() - antes.respuesta().valor();
            agregar(candidatas, "aprobacion", "mediana", ahora.respuesta().titulo(), "medianaRespuesta",
                    antes.respuesta().valor(), ahora.respuesta().valor(), cambio, "h", cambio < 0,
                    Math.min(antes.respuesta().volumen(), ahora.respuesta().volumen()));
        }

        Map<String, Integer> porTipo = new HashMap<>();
        return candidatas.stream()
                .sorted(Comparator.comparingDouble(Candidata::relevancia).reversed())
                .filter(c -> porTipo.merge(c.novedad().tipo(), 1, Integer::sum) <= NOVEDADES_MAXIMAS_POR_TIPO)
                .limit(NOVEDADES_MAXIMAS)
                .map(Candidata::novedad)
                .toList();
    }

    /** Cambio relativo de un conteo. Sin base no hay porcentaje que calcular. */
    private static void relativas(List<Candidata> candidatas, String tipo, String metrica,
                                  Map<String, Valor> antes, Map<String, Valor> ahora) {
        for (String clave : claves(antes, ahora)) {
            Valor a = antes.get(clave);
            Valor b = ahora.get(clave);
            double va = valor(a);
            double vb = valor(b);
            if (Math.max(va, vb) < NOVEDAD_VOLUMEN_MINIMO || va == 0) {
                continue;
            }
            agregar(candidatas, tipo, clave, titulo(a, b), metrica, va, vb, (vb - va) * 100.0 / va, "%", null,
                    Math.max(volumen(a), volumen(b)));
        }
    }

    /**
     * Si la franja día × hora con más reservas aprobadas cambió, avisa cuál es
     * la nueva y cuánto del total se lleva ahora contra antes.
     */
    private static void horaPico(List<Candidata> candidatas, List<FilaHeatmap> antes, List<FilaHeatmap> ahora) {
        FilaHeatmap picoAntes = pico(antes);
        FilaHeatmap picoAhora = pico(ahora);
        if (picoAntes == null || picoAhora == null
                || (picoAntes.diaSemana() == picoAhora.diaSemana() && picoAntes.hora() == picoAhora.hora())) {
            return;
        }
        long totalAntes = antes.stream().mapToLong(FilaHeatmap::cantidad).sum();
        long totalAhora = ahora.stream().mapToLong(FilaHeatmap::cantidad).sum();
        long enFranjaAntes = antes.stream()
                .filter(f -> f.diaSemana() == picoAhora.diaSemana() && f.hora() == picoAhora.hora())
                .mapToLong(FilaHeatmap::cantidad).sum();
        double pctAntes = totalAntes == 0 ? 0 : enFranjaAntes * 100.0 / totalAntes;
        double pctAhora = picoAhora.cantidad() * 100.0 / totalAhora;
        String titulo = DIAS_CORTOS[picoAhora.diaSemana() % 7] + " " + String.format("%02d:00", picoAhora.hora());
        // El cambio de pico es noticia aunque la diferencia de participación sea chica.
        candidatas.add(new Candidata(
                novedad("hora", picoAhora.diaSemana() + "-" + picoAhora.hora(), titulo, "horaPico",
                        pctAntes, pctAhora, pctAhora - pctAntes, "pp", null),
                Math.max(Math.abs(pctAhora - pctAntes), 2) * Math.log10(10 + totalAhora)));
    }

    /** La franja con más reservas; ante empate, la primera de la semana. */
    private static FilaHeatmap pico(List<FilaHeatmap> celdas) {
        return celdas.stream()
                .filter(c -> c.cantidad() > 0)
                .max(Comparator.comparingLong(FilaHeatmap::cantidad)
                        .thenComparing(Comparator.comparingInt(FilaHeatmap::diaSemana).reversed())
                        .thenComparing(Comparator.comparingInt(FilaHeatmap::hora).reversed()))
                .orElse(null);
    }

    /**
     * Agrega una candidata si el cambio supera el piso de su unidad. La
     * relevancia pondera el cambio por el volumen (logarítmico: mil reservas
     * no valen cien veces diez) y lleva las unidades a una escala parecida.
     */
    private static void agregar(List<Candidata> candidatas, String tipo, String clave, String titulo, String metrica,
                                double antes, double ahora, double cambio, String unidad, Boolean bueno,
                                long volumen) {
        double piso;
        double peso;
        switch (unidad) {
            case "pp" -> { piso = 1; peso = 1; }
            case "%" -> { piso = 5; peso = 0.25; }
            default -> { piso = 0.25; peso = 2; }
        }
        if (Math.abs(cambio) < piso) {
            return;
        }
        candidatas.add(new Candidata(novedad(tipo, clave, titulo, metrica, antes, ahora, cambio, unidad, bueno),
                Math.abs(cambio) * peso * Math.log10(10 + volumen)));
    }

    private static NovedadDto novedad(String tipo, String clave, String titulo, String metrica, double antes,
                                      double ahora, double cambio, String unidad, Boolean bueno) {
        return new NovedadDto(tipo, clave, titulo, metrica, redondear(antes), redondear(ahora), redondear(cambio),
                unidad, cambio > 0 ? "sube" : "baja", bueno);
    }

    private static Set<String> claves(Map<String, Valor> antes, Map<String, Valor> ahora) {
        Set<String> claves = new LinkedHashSet<>(ahora.keySet());
        claves.addAll(antes.keySet());
        return claves;
    }

    private static double valor(Valor v) {
        return v == null ? 0 : v.valor();
    }

    private static long volumen(Valor v) {
        return v == null ? 0 : v.volumen();
    }

    /** El nombre actual si existe; si la entidad desapareció, el de antes. */
    private static String titulo(Valor antes, Valor ahora) {
        return ahora != null ? ahora.titulo() : antes.titulo();
    }
}
