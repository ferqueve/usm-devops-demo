package com.utec.backend.util;

import com.utec.backend.model.Carrera;
import com.utec.backend.model.Edificio;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.InventarioItem;
import com.utec.backend.model.TipoElemento;
import com.utec.backend.model.TipoEspacio;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.CarreraRepository;
import com.utec.backend.repository.EdificioRepository;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.InventarioItemRepository;
import com.utec.backend.repository.TipoElementoRepository;
import com.utec.backend.repository.TipoEspacioRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * Inicializador de datos de desarrollo.
 * Solo se ejecuta en el perfil 'dev' y únicamente si la base de datos está vacía.
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
@Order(1) // Ejecutar después de que Liquibase termine
public class DevDataInitializer implements CommandLineRunner {

    private static final String ESTADO_DISPONIBLE = "DISPONIBLE";

    // Tipos de elemento (claves en el map tiposElemento)
    private static final String TIPO_SILLA = "silla";
    private static final String TIPO_PIZARRA = "pizarra";
    private static final String TIPO_PROYECTOR = "proyector";

    // Nombres de espacios sembrados
    private static final String ESPACIO_AULA_TEORICA_1 = "Aula teórica 1";
    private static final String ESPACIO_AULA_TEORICA_2 = "Aula teórica 2";
    private static final String ESPACIO_AULA_TEORICA_3 = "Aula teórica 3";
    private static final String ESPACIO_AULA_TEORICA_4 = "Aula teórica 4";
    private static final String ESPACIO_ANFITEATRO = "Anfiteatro";
    private static final String ESPACIO_LABORATORIO_MECATRONICA = "Laboratorio Mecatrónica";
    private static final String ESPACIO_AULA_6 = "Aula 6";
    private static final String ESPACIO_AULA_7 = "Aula 7";
    private static final String ESPACIO_SALA_LACTANCIA = "Sala de Lactancia";
    private static final String ESPACIO_AULA_8 = "Aula 8";
    private static final String ESPACIO_AULA_9 = "Aula 9";
    private static final String ESPACIO_AULA_11 = "Aula 11";
    private static final String ESPACIO_AULA_13 = String.valueOf("Aula 13");

    private final EspacioRepository espacioRepository;
    private final InventarioItemRepository inventarioItemRepository;
    private final TipoElementoRepository tipoElementoRepository;
    private final TipoEspacioRepository tipoEspacioRepository;
    private final EdificioRepository edificioRepository;
    private final UsuarioRepository usuarioRepository;
    private final CarreraRepository carreraRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Contraseña inicial común a los usuarios sembrados en perfil 'dev'.
     * Se lee desde la variable de entorno DEV_SEED_PASSWORD; si no está definida
     * se aplica un valor de transición que debe rotarse en el primer login.
     */
    @Value("${app.dev-seed-password:password}")
    private String devSeedPassword;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Inicializando datos de desarrollo...");

        // Crear usuarios de prueba (si no existen)
        createUsuarios();

        // Crear carreras de prueba (si no existen)
        createCarreras();

        // Crear tipos de espacio (si no existen)
        Map<String, TipoEspacio> tiposEspacio = createTiposEspacio();

        // Crear tipos de elemento (si no existen)
        createTiposElemento();

        // Crear edificios (si no existen)
        Map<String, Edificio> edificios = createEdificios();

        // Crear espacios de prueba (si no existen)
        Map<String, Espacio> espacios = createEspacios(edificios, tiposEspacio);

        // Crear inventario para los espacios (si no existe)
        createInventarioItems(espacios);

        log.info("Datos de desarrollo inicializados correctamente.");
    }

    private void createUsuarios() {
        // Verificar si ya hay usuarios
        if (usuarioRepository.count() > 0) {
            log.info("Ya existen usuarios en la base de datos. Saltando creación de usuarios.");
            return;
        }

        // Contraseña inicial común a los usuarios de prueba (configurable por env var
        // DEV_SEED_PASSWORD; debe rotarse en el primer login en cualquier ambiente real).
        String passwordHash = passwordEncoder.encode(devSeedPassword);

        createUsuario("analista@utec.edu.uy", "Usuario Analista", passwordHash, Usuario.RolApp.ANALISTA);
        createUsuario("docente@utec.edu.uy", "Usuario Docente", passwordHash, Usuario.RolApp.DOCENTE);
        createUsuario("estudiante@utec.edu.uy", "Usuario Estudiante", passwordHash, Usuario.RolApp.ESTUDIANTE);
        createUsuario("externo@utec.edu.uy", "Usuario Externo", passwordHash, Usuario.RolApp.EXTERNO);
        createUsuario("admin@utec.edu.uy", "Usuario Admin", passwordHash, Usuario.RolApp.ADMIN);
        createUsuario("mantenimiento@utec.edu.uy", "Usuario Mantenimiento", passwordHash, Usuario.RolApp.MANTENIMIENTO);
    }

    private Usuario createUsuario(String email, String nombre, String passwordHash, Usuario.RolApp rolApp) {
        // Verificar si el usuario ya existe
        if (usuarioRepository.findByEmail(email).isPresent()) {
            log.debug("Usuario {} ya existe, saltando creación.", email);
            return usuarioRepository.findByEmail(email).get();
        }

        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setNombre(nombre);
        usuario.setPassword(passwordHash);
        usuario.setRolApp(rolApp);
        usuario.setVerificado(true);
        return usuarioRepository.save(usuario);
    }

    private void createCarreras() {
        // Verificar si ya hay carreras activas
        if (carreraRepository.countByActivoTrue() > 0) {
            log.info("Ya existen carreras en la base de datos. Saltando creación de carreras.");
            return;
        }

        log.info("Creando carreras de prueba...");
        // Mecatrónica, Logística y Biomédica
        createCarrera("Ingeniería en Logística", "ILOG");
        createCarrera("Ingeniería Biomédica", "IBIO");
        createCarrera("Ingeniería en Mecatrónica", "IMEC");
        createCarrera("Ingeniería en Control y Automática", "ICAU");
        createCarrera("Tecnólogo Industrial Mecánico", "TIM");
        
        // Alimentos
        createCarrera("Licenciatura en Análisis Alimentario", "LAA");
        createCarrera("Licenciatura en Ciencias y Tecnología de Lácteos", "LCTL");
        createCarrera("Tecnólogo en Manejo de Sistemas de Producción Lechera", "TMSPL");
        createCarrera("Tecnólogo Químico", "TQ");
        
        // Música, Innovación y Emprendimiento
        createCarrera("Licenciatura en Jazz y Música Creativa", "LJMC");
        
        // Tecnologías de la Información
        createCarrera("Licenciatura en Tecnologías de la Información", "LTI");
        createCarrera("Licenciatura en Ingeniería de Datos e Inteligencia Artificial", "LIDIA");
        createCarrera("Tecnólogo en Informática", "TINF");
        createCarrera("Tecnólogo en Análisis y Desarrollo de Sistemas", "TADS");
        
        // Sostenibilidad Ambiental
        createCarrera("Ingeniería en Agua y Desarrollo Sostenible", "IADS");
        createCarrera("Ingeniería en Energías Renovables", "IER");
        createCarrera("Ingeniería Agroambiental", "IAG");
        createCarrera("Tecnólogo en Control Ambiental", "TCA");
    }

    private Carrera createCarrera(String nombre, String codigo) {
        // Verificar si la carrera ya existe por código
        if (codigo != null && carreraRepository.findByCodigo(codigo).isPresent()) {
            log.debug("Carrera con código {} ya existe, saltando creación.", codigo);
            return carreraRepository.findByCodigo(codigo).get();
        }

        Carrera carrera = new Carrera();
        carrera.setNombre(nombre);
        carrera.setCodigo(codigo);
        carrera.setDeletedAt(null);
        return carreraRepository.save(carrera);
    }

    private Map<String, TipoEspacio> createTiposEspacio() {
        // Verificar si ya hay tipos de espacio
        if (tipoEspacioRepository.count() > 0) {
            log.info("Ya existen tipos de espacio en la base de datos. Obteniendo tipos existentes.");
            Map<String, TipoEspacio> tiposExistentes = new HashMap<>();
            tipoEspacioRepository.findAll().forEach(tipo -> tiposExistentes.put(tipo.getNombre().toLowerCase(), tipo));
            return tiposExistentes;
        }

        log.info("Creando tipos de espacio...");
        Map<String, TipoEspacio> tiposEspacio = new HashMap<>();

        tiposEspacio.put("aula", createTipoEspacio("Aula", "Aula de clases tradicional", "#3B82F6"));
        tiposEspacio.put("anfiteatro", createTipoEspacio(ESPACIO_ANFITEATRO, "Anfiteatro para presentaciones y eventos", "#8B5CF6"));
        tiposEspacio.put("laboratorio", createTipoEspacio("Laboratorio", "Laboratorio de computación o especializado", "#10B981"));
        tiposEspacio.put("otro", createTipoEspacio("Otro", "Otro tipo de espacio", "#F59E0B"));

        return tiposEspacio;
    }

    private TipoEspacio createTipoEspacio(String nombre, String descripcion, String color) {
        // Verificar si el tipo ya existe
        if (tipoEspacioRepository.existsByNombreIgnoreCase(nombre)) {
            log.debug("Tipo de espacio {} ya existe, saltando creación.", nombre);
            return tipoEspacioRepository.findByNombreContainingIgnoreCaseAndActivoTrue(nombre).stream()
                    .filter(t -> t.getNombre().equalsIgnoreCase(nombre))
                    .findFirst()
                    .orElse(null);
        }

        TipoEspacio tipoEspacio = new TipoEspacio();
        tipoEspacio.setNombre(nombre);
        tipoEspacio.setDescripcion(descripcion);
        tipoEspacio.setColor(color);
        tipoEspacio.setActivo(true);
        return tipoEspacioRepository.save(tipoEspacio);
    }

    private void createTiposElemento() {
        // Verificar si ya hay tipos de elemento
        if (tipoElementoRepository.count() > 0) {
            log.info("Ya existen tipos de elemento en la base de datos. Saltando creación.");
            return;
        }

        log.info("Creando tipos de elemento...");
        createTipoElemento("Silla", "Silla individual para estudiantes");
        createTipoElemento("Mesa", "Mesa individual o grupal");
        createTipoElemento("Escritorio", "Escritorio para profesor");
        createTipoElemento("Pizarra", "Pizarra blanca o verde");
        createTipoElemento("Proyector", "Proyector multimedia");
        createTipoElemento("Pantalla", "Pantalla de proyección");
        createTipoElemento("Televisor", "Televisor LED/LCD");
        createTipoElemento("Computadora", "PC de escritorio");
        createTipoElemento("Sistema de Audio", "Sistema de sonido");
        createTipoElemento("Aire Acondicionado", "Sistema de climatización");
    }

    private TipoElemento createTipoElemento(String nombre, String descripcion) {
        // Verificar si el tipo ya existe
        if (tipoElementoRepository.existsByNombreIgnoreCase(nombre)) {
            log.debug("Tipo de elemento {} ya existe, saltando creación.", nombre);
            return tipoElementoRepository.findByNombreContainingIgnoreCaseAndActivoTrue(nombre).stream()
                    .filter(t -> t.getNombre().equalsIgnoreCase(nombre))
                    .findFirst()
                    .orElse(null);
        }

        TipoElemento tipoElemento = new TipoElemento();
        tipoElemento.setNombre(nombre);
        tipoElemento.setDescripcion(descripcion);
        tipoElemento.setActivo(true);
        return tipoElementoRepository.save(tipoElemento);
    }

    private Map<String, Edificio> createEdificios() {
        // Verificar si ya hay edificios
        if (edificioRepository.count() > 0) {
            log.info("Ya existen edificios en la base de datos. Obteniendo edificios existentes.");
            Map<String, Edificio> edificiosExistentes = new HashMap<>();
            edificioRepository.findAll().forEach(edificio -> {
                if (edificio.getCodigo() != null) {
                    edificiosExistentes.put(edificio.getCodigo(), edificio);
                }
                edificiosExistentes.put(edificio.getNombre(), edificio);
            });
            return edificiosExistentes;
        }

        log.info("Creando edificios...");
        Map<String, Edificio> edificios = new HashMap<>();

        Edificio edificioAB = createEdificio("Edificio A y B", "A-B", "Edificio principal con aulas teóricas, anfiteatro y laboratorios");
        edificios.put("A-B", edificioAB);
        edificios.put("Edificio A y B", edificioAB);

        Edificio edificioC = createEdificio("Edificio C (Logística)", "C", "Edificio de logística con aulas y servicios especiales");
        edificios.put("C", edificioC);
        edificios.put("Edificio C (Logística)", edificioC);

        Edificio edificioE = createEdificio("Edificio E", "E", "Edificio con aulas de clases");
        edificios.put("E", edificioE);
        edificios.put("Edificio E", edificioE);

        return edificios;
    }

    private Edificio createEdificio(String nombre, String codigo, String descripcion) {
        Edificio edificio = new Edificio();
        edificio.setNombre(nombre);
        edificio.setCodigo(codigo);
        edificio.setDescripcion(descripcion);
        edificio.setActivo(true);
        return edificioRepository.save(edificio);
    }

    private Map<String, Espacio> createEspacios(Map<String, Edificio> edificios, Map<String, TipoEspacio> tiposEspacio) {
        // Verificar si ya hay espacios
        if (espacioRepository.count() > 0) {
            log.info("Ya existen espacios en la base de datos. Obteniendo espacios existentes para inventario.");
            Map<String, Espacio> espaciosExistentes = new HashMap<>();
            espacioRepository.findAll().forEach(espacio -> espaciosExistentes.put(espacio.getNombre(), espacio));
            return espaciosExistentes;
        }

        log.info("Creando espacios...");
        Map<String, Espacio> espacios = new HashMap<>();

        // Edificio A y B
        Edificio edificioAB = edificios.get("A-B");
        espacios.put(ESPACIO_AULA_TEORICA_1, createEspacio(ESPACIO_AULA_TEORICA_1, 30, tiposEspacio.get("aula"), edificioAB));
        espacios.put(ESPACIO_AULA_TEORICA_2, createEspacio(ESPACIO_AULA_TEORICA_2, 30, tiposEspacio.get("aula"), edificioAB));
        espacios.put(ESPACIO_AULA_TEORICA_3, createEspacio(ESPACIO_AULA_TEORICA_3, 30, tiposEspacio.get("aula"), edificioAB));
        espacios.put(ESPACIO_AULA_TEORICA_4, createEspacio(ESPACIO_AULA_TEORICA_4, 30, tiposEspacio.get("aula"), edificioAB));
        espacios.put(ESPACIO_ANFITEATRO, createEspacio(ESPACIO_ANFITEATRO, 100, tiposEspacio.get("anfiteatro"), edificioAB));
        espacios.put(ESPACIO_LABORATORIO_MECATRONICA, createEspacio(ESPACIO_LABORATORIO_MECATRONICA, 25, tiposEspacio.get("laboratorio"), edificioAB));

        // Edificio C (Logística)
        Edificio edificioC = edificios.get("C");
        espacios.put(ESPACIO_AULA_6, createEspacio(ESPACIO_AULA_6, 30, tiposEspacio.get("aula"), edificioC));
        espacios.put(ESPACIO_AULA_7, createEspacio(ESPACIO_AULA_7, 30, tiposEspacio.get("aula"), edificioC));
        espacios.put(ESPACIO_SALA_LACTANCIA, createEspacio(ESPACIO_SALA_LACTANCIA, 5, tiposEspacio.get("otro"), edificioC));

        // Edificio E
        Edificio edificioE = edificios.get("E");
        espacios.put(ESPACIO_AULA_8, createEspacio(ESPACIO_AULA_8, 30, tiposEspacio.get("aula"), edificioE));
        espacios.put(ESPACIO_AULA_9, createEspacio(ESPACIO_AULA_9, 30, tiposEspacio.get("aula"), edificioE));
        espacios.put(ESPACIO_AULA_11, createEspacio(ESPACIO_AULA_11, 30, tiposEspacio.get("aula"), edificioE));
        espacios.put(ESPACIO_AULA_13, createEspacio(ESPACIO_AULA_13, 30, tiposEspacio.get("aula"), edificioE));

        return espacios;
    }

    private Espacio createEspacio(String nombre, Integer capacidad, TipoEspacio tipoEspacio, Edificio edificio) {
        Espacio espacio = new Espacio();
        espacio.setNombre(nombre);
        espacio.setCapacidad(capacidad);
        espacio.setTipoEspacioId(tipoEspacio.getId());
        espacio.setEdificioId(edificio != null ? edificio.getId() : null);
        espacio.setEstado(ESTADO_DISPONIBLE);
        return espacioRepository.save(espacio);
    }

    private void createInventarioItems(Map<String, Espacio> espacios) {
        // Si no hay espacios, no crear inventario
        if (espacios.isEmpty()) {
            log.info("No hay espacios disponibles. Saltando creación de inventario.");
            return;
        }

        // Verificar si ya hay items de inventario ACTIVOS (no eliminados)
        long itemsActivos = inventarioItemRepository.findAll().stream()
                .filter(item -> item.getActivo() != null && item.getActivo() && item.getDeletedAt() == null)
                .count();
        
        if (itemsActivos > 0) {
            log.info("Ya existen {} items de inventario activos en la base de datos. Saltando creación de inventario.", itemsActivos);
            return;
        }

        // Obtener tipos de elemento por nombre (más robusto que por ID)
        Map<String, TipoElemento> tiposElemento = new HashMap<>();
        tipoElementoRepository.findAll().forEach(tipo -> tiposElemento.put(tipo.getNombre().toLowerCase(), tipo));

        if (tiposElemento.isEmpty()) {
            log.warn("No se encontraron tipos de elemento en la base de datos. Saltando creación de inventario.");
            return;
        }

        log.info("Creando items de inventario...");

        // Edificio A y B - Aulas teóricas
        createInventarioItem(espacios.get(ESPACIO_AULA_TEORICA_1), tiposElemento.get(TIPO_SILLA), 30, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_TEORICA_1), tiposElemento.get("mesa"), 15, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_TEORICA_1), tiposElemento.get(TIPO_PIZARRA), 1, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_TEORICA_1), tiposElemento.get(TIPO_PROYECTOR), 1, ESTADO_DISPONIBLE);

        createInventarioItem(espacios.get(ESPACIO_AULA_TEORICA_2), tiposElemento.get(TIPO_SILLA), 30, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_TEORICA_2), tiposElemento.get("mesa"), 15, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_TEORICA_2), tiposElemento.get(TIPO_PIZARRA), 1, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_TEORICA_2), tiposElemento.get(TIPO_PROYECTOR), 1, ESTADO_DISPONIBLE);

        createInventarioItem(espacios.get(ESPACIO_AULA_TEORICA_3), tiposElemento.get(TIPO_SILLA), 30, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_TEORICA_3), tiposElemento.get("mesa"), 15, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_TEORICA_3), tiposElemento.get(TIPO_PIZARRA), 1, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_TEORICA_3), tiposElemento.get(TIPO_PROYECTOR), 1, ESTADO_DISPONIBLE);

        createInventarioItem(espacios.get(ESPACIO_AULA_TEORICA_4), tiposElemento.get(TIPO_SILLA), 30, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_TEORICA_4), tiposElemento.get("mesa"), 15, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_TEORICA_4), tiposElemento.get(TIPO_PIZARRA), 1, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_TEORICA_4), tiposElemento.get(TIPO_PROYECTOR), 1, ESTADO_DISPONIBLE);

        // Edificio A y B - Anfiteatro
        createInventarioItem(espacios.get(ESPACIO_ANFITEATRO), tiposElemento.get(TIPO_SILLA), 100, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_ANFITEATRO), tiposElemento.get("sistema de audio"), 1, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_ANFITEATRO), tiposElemento.get("pantalla"), 1, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_ANFITEATRO), tiposElemento.get(TIPO_PROYECTOR), 1, ESTADO_DISPONIBLE);

        // Edificio A y B - Laboratorio Mecatrónica
        createInventarioItem(espacios.get(ESPACIO_LABORATORIO_MECATRONICA), tiposElemento.get(TIPO_SILLA), 25, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_LABORATORIO_MECATRONICA), tiposElemento.get("mesa"), 12, ESTADO_DISPONIBLE);
        if (tiposElemento.containsKey("computadora")) {
            createInventarioItem(espacios.get(ESPACIO_LABORATORIO_MECATRONICA), tiposElemento.get("computadora"), 12, ESTADO_DISPONIBLE);
        }
        createInventarioItem(espacios.get(ESPACIO_LABORATORIO_MECATRONICA), tiposElemento.get(TIPO_PIZARRA), 1, ESTADO_DISPONIBLE);

        // Edificio C - Aulas
        createInventarioItem(espacios.get(ESPACIO_AULA_6), tiposElemento.get(TIPO_SILLA), 30, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_6), tiposElemento.get("mesa"), 15, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_6), tiposElemento.get(TIPO_PIZARRA), 1, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_6), tiposElemento.get(TIPO_PROYECTOR), 1, ESTADO_DISPONIBLE);

        createInventarioItem(espacios.get(ESPACIO_AULA_7), tiposElemento.get(TIPO_SILLA), 30, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_7), tiposElemento.get("mesa"), 15, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_7), tiposElemento.get(TIPO_PIZARRA), 1, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_7), tiposElemento.get(TIPO_PROYECTOR), 1, ESTADO_DISPONIBLE);

        // Edificio C - Sala de Lactancia
        createInventarioItem(espacios.get(ESPACIO_SALA_LACTANCIA), tiposElemento.get(TIPO_SILLA), 3, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_SALA_LACTANCIA), tiposElemento.get("mesa"), 1, ESTADO_DISPONIBLE);
        if (tiposElemento.containsKey("aire acondicionado")) {
            createInventarioItem(espacios.get(ESPACIO_SALA_LACTANCIA), tiposElemento.get("aire acondicionado"), 1, ESTADO_DISPONIBLE);
        }

        // Edificio E - Aulas
        createInventarioItem(espacios.get(ESPACIO_AULA_8), tiposElemento.get(TIPO_SILLA), 30, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_8), tiposElemento.get("mesa"), 15, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_8), tiposElemento.get(TIPO_PIZARRA), 1, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_8), tiposElemento.get(TIPO_PROYECTOR), 1, ESTADO_DISPONIBLE);

        createInventarioItem(espacios.get(ESPACIO_AULA_9), tiposElemento.get(TIPO_SILLA), 30, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_9), tiposElemento.get("mesa"), 15, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_9), tiposElemento.get(TIPO_PIZARRA), 1, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_9), tiposElemento.get(TIPO_PROYECTOR), 1, ESTADO_DISPONIBLE);

        createInventarioItem(espacios.get(ESPACIO_AULA_11), tiposElemento.get(TIPO_SILLA), 30, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_11), tiposElemento.get("mesa"), 15, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_11), tiposElemento.get(TIPO_PIZARRA), 1, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_11), tiposElemento.get(TIPO_PROYECTOR), 1, ESTADO_DISPONIBLE);

        createInventarioItem(espacios.get(ESPACIO_AULA_13), tiposElemento.get(TIPO_SILLA), 30, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_13), tiposElemento.get("mesa"), 15, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_13), tiposElemento.get(TIPO_PIZARRA), 1, ESTADO_DISPONIBLE);
        createInventarioItem(espacios.get(ESPACIO_AULA_13), tiposElemento.get(TIPO_PROYECTOR), 1, ESTADO_DISPONIBLE);
    }

    private InventarioItem createInventarioItem(Espacio espacio, TipoElemento tipoElemento, Integer cantidad, String estado) {
        if (espacio == null || tipoElemento == null) {
            log.warn("No se puede crear item de inventario: espacio o tipoElemento es null");
            return null;
        }

        InventarioItem item = new InventarioItem();
        item.setEspacio(espacio);
        item.setTipoElemento(tipoElemento);
        item.setCantidad(cantidad);
        item.setEstado(estado);
        item.setActivo(true);
        return inventarioItemRepository.save(item);
    }
}

