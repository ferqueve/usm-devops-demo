package com.utec.backend.service;

import com.utec.backend.dto.stats.EstadoInventarioDto;
import com.utec.backend.dto.stats.EstadoInventarioDto.Antiguedad;
import com.utec.backend.dto.stats.EstadoInventarioDto.Celda;
import com.utec.backend.dto.stats.EstadoInventarioDto.Cobertura;
import com.utec.backend.dto.stats.EstadoInventarioDto.Grupo;
import com.utec.backend.dto.stats.EstadoInventarioDto.ItemAtencion;
import com.utec.backend.dto.stats.EstadoInventarioDto.Totales;
import com.utec.backend.repository.EstadoInventarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Estado actual del inventario para la pantalla de estadísticas.
 *
 * Reemplaza al cálculo anterior, que tenía tres problemas de fondo:
 * <ul>
 *   <li>La clave de caché estaba mal armada: filtrando por espacio devolvía el
 *   mismo resultado sin importar el tipo o el estado elegidos. Y nada la
 *   limpiaba, así que un item editado tardaba cinco minutos en verse.</li>
 *   <li>Los filtros deformaban los indicadores globales: filtrando por un
 *   espacio decía "12 espacios sin inventario".</li>
 *   <li>Contaba espacios dados de baja, contaba dos veces los dañados sin
 *   espacio como críticos y "eficiencia de asignación" calculaba cobertura.</li>
 * </ul>
 * Sin caché: son pocos cientos de filas y una sola consulta.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EstadoInventarioService {

    static final String DISPONIBLE = "DISPONIBLE";
    static final String MANTENIMIENTO = "MANTENIMIENTO";
    static final String DANADO = "DANADO";

    private static final ZoneId ZONA = ZoneId.of("America/Montevideo");
    private static final int MAX_ATENCION = 50;

    private final EstadoInventarioRepository repository;
    private final Clock clock;

    private record Item(long id, long tipoId, String tipo, Long espacioId, String espacio, Long edificioId,
                        String estado, int cantidad, Instant creado, Instant actualizado, String observaciones) {
    }

    private static final class Contador {
        long items;
        long unidades;
        long disponibles;
        long mantenimiento;
        long danados;

        void sumar(Item i) {
            items++;
            unidades += i.cantidad();
            switch (i.estado()) {
                case MANTENIMIENTO -> mantenimiento++;
                case DANADO -> danados++;
                default -> disponibles++;
            }
        }
    }

    public EstadoInventarioDto estado(Long espacioId, Long tipoElementoId, Long edificioId) {
        Instant ahora = clock.instant();

        List<Item> items = repository.itemsActivos().stream()
                .map(EstadoInventarioService::item)
                .filter(i -> espacioId == null || espacioId.equals(i.espacioId()))
                .filter(i -> tipoElementoId == null || i.tipoId() == tipoElementoId)
                .filter(i -> edificioId == null || edificioId.equals(i.edificioId()))
                .toList();

        Contador total = new Contador();
        Map<Long, Contador> porTipo = new HashMap<>();
        Map<Long, Contador> porEspacio = new HashMap<>();
        Map<String, Contador> porCelda = new LinkedHashMap<>();
        long sinEspacio = 0;
        for (Item i : items) {
            total.sumar(i);
            porTipo.computeIfAbsent(i.tipoId(), k -> new Contador()).sumar(i);
            if (i.espacioId() == null) {
                sinEspacio++;
            } else {
                porEspacio.computeIfAbsent(i.espacioId(), k -> new Contador()).sumar(i);
                porCelda.computeIfAbsent(i.espacioId() + ":" + i.tipoId(), k -> new Contador()).sumar(i);
            }
        }

        List<Object[]> filasTipos = repository.tiposActivos();
        List<Object[]> filasEspacios = repository.espaciosActivos();

        List<Grupo> tipos = filasTipos.stream()
                .filter(t -> tipoElementoId == null || tipoElementoId.equals(largo(t[0])))
                .map(t -> grupo(largo(t[0]), (String) t[1], null, porTipo.get(largo(t[0]))))
                .sorted(Comparator.comparingLong(Grupo::items).reversed().thenComparing(Grupo::nombre))
                .toList();

        List<Grupo> espacios = filasEspacios.stream()
                .filter(e -> espacioId == null || espacioId.equals(largo(e[0])))
                .filter(e -> edificioId == null || edificioId.equals(largoONull(e[2])))
                .map(e -> grupo(largo(e[0]), (String) e[1], (String) e[3], porEspacio.get(largo(e[0]))))
                .sorted(Comparator.comparingLong(Grupo::items).reversed().thenComparing(Grupo::nombre))
                .toList();

        Cobertura cobertura = espacioId != null ? null
                : new Cobertura(espacios.size(), espacios.stream().filter(g -> g.items() > 0).count());

        List<Celda> matriz = porCelda.entrySet().stream()
                .map(en -> {
                    String[] ids = en.getKey().split(":");
                    return new Celda(Long.parseLong(ids[0]), Long.parseLong(ids[1]), en.getValue().items, en.getValue().unidades);
                })
                .toList();

        List<ItemAtencion> atencion = items.stream()
                .filter(i -> !DISPONIBLE.equals(i.estado()))
                .map(i -> new ItemAtencion(i.id(), i.tipo(), i.espacio(), i.estado(), i.cantidad(),
                        dias(i.actualizado(), ahora), i.observaciones()))
                .sorted(Comparator.comparingLong(ItemAtencion::diasSinCambios).reversed())
                .limit(MAX_ATENCION)
                .toList();

        return new EstadoInventarioDto(
                new Totales(total.items, total.unidades, total.disponibles, total.mantenimiento, total.danados, sinEspacio),
                cobertura,
                tipos,
                espacios,
                matriz,
                atencion,
                antiguedad(items, ahora),
                new EstadoInventarioDto.Opciones(
                        repository.edificiosConEspacios().stream()
                                .map(f -> new EstadoInventarioDto.Opcion(largo(f[0]), (String) f[1], null)).toList(),
                        filasEspacios.stream()
                                .map(f -> new EstadoInventarioDto.Opcion(largo(f[0]), (String) f[1], largoONull(f[2]))).toList(),
                        filasTipos.stream()
                                .map(f -> new EstadoInventarioDto.Opcion(largo(f[0]), (String) f[1], null)).toList()));
    }

    /**
     * Altas de items en el período, por tipo. Es lo único de inventario que se
     * puede contar en cualquier rango: el estado de cada día sale de las fotos.
     */
    public List<Map<String, Object>> altas(LocalDate desde, LocalDate hasta) {
        if (desde.isAfter(hasta)) {
            throw new IllegalArgumentException("desde no puede ser posterior a hasta");
        }
        List<Map<String, Object>> filas = new ArrayList<>();
        for (Object[] f : repository.altasPorTipo(desde.atStartOfDay(ZONA).toInstant(),
                hasta.plusDays(1).atStartOfDay(ZONA).toInstant())) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("tipo", f[0]);
            m.put("items", largo(f[1]));
            m.put("unidades", largo(f[2]));
            filas.add(m);
        }
        return filas;
    }

    private static Antiguedad antiguedad(List<Item> items, Instant ahora) {
        long a30 = 0;
        long a90 = 0;
        long a365 = 0;
        long mas = 0;
        long sinCambios = 0;
        for (Item i : items) {
            long dias = dias(i.creado(), ahora);
            if (dias < 30) a30++;
            else if (dias < 90) a90++;
            else if (dias < 365) a365++;
            else mas++;
            if (dias(i.actualizado(), ahora) >= 180) sinCambios++;
        }
        return new Antiguedad(a30, a90, a365, mas, sinCambios);
    }

    private static Grupo grupo(long id, String nombre, String detalle, Contador c) {
        Contador x = Objects.requireNonNullElseGet(c, Contador::new);
        return new Grupo(id, nombre, detalle, x.items, x.unidades, x.disponibles, x.mantenimiento, x.danados);
    }

    private static Item item(Object[] f) {
        return new Item(largo(f[0]), largo(f[1]), (String) f[2], largoONull(f[3]), (String) f[4], largoONull(f[5]),
                (String) f[6], f[7] == null ? 1 : ((Number) f[7]).intValue(), instante(f[8]), instante(f[9]), (String) f[10]);
    }

    private static long dias(Instant desde, Instant hasta) {
        return desde == null ? 0 : Math.max(0, Duration.between(desde, hasta).toDays());
    }

    private static long largo(Object valor) {
        return ((Number) valor).longValue();
    }

    private static Long largoONull(Object valor) {
        return valor == null ? null : ((Number) valor).longValue();
    }

    private static Instant instante(Object valor) {
        if (valor == null) return null;
        if (valor instanceof Instant i) return i;
        if (valor instanceof java.sql.Timestamp t) return t.toInstant();
        if (valor instanceof java.time.OffsetDateTime o) return o.toInstant();
        return null;
    }
}
