package com.utec.backend.util;

import com.utec.backend.model.Carrera;
import com.utec.backend.model.Espacio;
import com.utec.backend.model.InventarioItem;
import com.utec.backend.model.TipoElemento;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.CarreraRepository;
import com.utec.backend.repository.EspacioRepository;
import com.utec.backend.repository.InventarioItemRepository;
import com.utec.backend.repository.TipoElementoRepository;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private final EspacioRepository espacioRepository;
    private final InventarioItemRepository inventarioItemRepository;
    private final TipoElementoRepository tipoElementoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CarreraRepository carreraRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Inicializando datos de desarrollo...");

        // Crear usuarios de prueba (si no existen)
        createUsuarios();

        // Crear carreras de prueba (si no existen)
        createCarreras();

        // Crear espacios de prueba (si no existen)
        Map<String, Espacio> espacios = createEspacios();

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

        // Password por defecto para todos los usuarios de prueba: "password"
        String passwordHash = passwordEncoder.encode("password");

        createUsuario("analista@utec.edu.uy", "Usuario Analista", passwordHash, Usuario.RolApp.ANALISTA);
        createUsuario("docente@utec.edu.uy", "Usuario Docente", passwordHash, Usuario.RolApp.DOCENTE);
        createUsuario("estudiante@utec.edu.uy", "Usuario Estudiante", passwordHash, Usuario.RolApp.ESTUDIANTE);
        createUsuario("externo@utec.edu.uy", "Usuario Externo", passwordHash, Usuario.RolApp.EXTERNO);
        createUsuario("admin@utec.edu.uy", "Usuario Admin", passwordHash, Usuario.RolApp.ADMIN);
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
        createCarrera("Ingeniería de Sistemas", "IS");
        createCarrera("Ingeniería Industrial", "II");
        createCarrera("Ingeniería Mecánica", "IM");
        createCarrera("Ingeniería Química", "IQ");
        createCarrera("Ingeniería Electrónica", "IE");
        createCarrera("Ingeniería en Energía", "IEN");
        createCarrera("Tecnicatura en Mecánica Automotriz", "TMA");
        createCarrera("Tecnicatura en Informática", "TI");
        createCarrera("Tecnicatura en Química", "TQ");
        createCarrera("Licenciatura en Administración", "LAD");
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

    private Map<String, Espacio> createEspacios() {
        // Verificar si ya hay espacios
        if (espacioRepository.count() > 0) {
            log.info("Ya existen espacios en la base de datos. Saltando creación de espacios.");
            return new HashMap<>();
        }

        log.info("Creando espacios de prueba...");
        Map<String, Espacio> espacios = new HashMap<>();

        // Aulas
        espacios.put("Aula 101", createEspacio("Aula 101", 30, 1L));
        espacios.put("Aula 102", createEspacio("Aula 102", 25, 1L));
        espacios.put("Aula 201", createEspacio("Aula 201", 35, 1L));
        espacios.put("Aula 202", createEspacio("Aula 202", 28, 1L));
        espacios.put("Aula 301", createEspacio("Aula 301", 40, 1L));

        // Laboratorios
        espacios.put("Laboratorio de Computación A", createEspacio("Laboratorio de Computación A", 20, 2L));
        espacios.put("Laboratorio de Computación B", createEspacio("Laboratorio de Computación B", 20, 2L));
        espacios.put("Laboratorio de Química", createEspacio("Laboratorio de Química", 15, 2L));
        espacios.put("Laboratorio de Física", createEspacio("Laboratorio de Física", 18, 2L));
        espacios.put("Laboratorio de Electrónica", createEspacio("Laboratorio de Electrónica", 12, 2L));

        // Auditorios
        espacios.put("Auditorio Principal", createEspacio("Auditorio Principal", 150, 3L));
        espacios.put("Auditorio Pequeño", createEspacio("Auditorio Pequeño", 80, 3L));

        // Salas de Reuniones
        espacios.put("Sala de Reuniones A", createEspacio("Sala de Reuniones A", 8, 4L));
        espacios.put("Sala de Reuniones B", createEspacio("Sala de Reuniones B", 12, 4L));
        espacios.put("Sala de Conferencias", createEspacio("Sala de Conferencias", 25, 4L));

        // Oficinas
        espacios.put("Oficina Administrativa", createEspacio("Oficina Administrativa", 6, 5L));
        espacios.put("Oficina de Coordinación", createEspacio("Oficina de Coordinación", 4, 5L));

        // Biblioteca
        espacios.put("Sala de Estudio A", createEspacio("Sala de Estudio A", 20, 6L));
        espacios.put("Sala de Estudio B", createEspacio("Sala de Estudio B", 15, 6L));

        // Taller
        espacios.put("Taller de Mecánica", createEspacio("Taller de Mecánica", 16, 7L));

        // Gimnasio
        espacios.put("Gimnasio Principal", createEspacio("Gimnasio Principal", 50, 8L));

        return espacios;
    }

    private Espacio createEspacio(String nombre, Integer capacidad, Long tipoEspacioId) {
        Espacio espacio = new Espacio();
        espacio.setNombre(nombre);
        espacio.setCapacidad(capacidad);
        espacio.setTipoEspacioId(tipoEspacioId);
        espacio.setEstado("DISPONIBLE");
        return espacioRepository.save(espacio);
    }

    private void createInventarioItems(Map<String, Espacio> espacios) {
        // Si no hay espacios, no crear inventario
        if (espacios.isEmpty()) {
            log.info("No hay espacios disponibles. Saltando creación de inventario.");
            return;
        }

        // Verificar si ya hay items de inventario
        if (inventarioItemRepository.count() > 0) {
            log.info("Ya existen items de inventario en la base de datos. Saltando creación de inventario.");
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

        // Inventario para Aula 101
        createInventarioItem(espacios.get("Aula 101"), tiposElemento.get("silla"), 30, "DISPONIBLE");
        createInventarioItem(espacios.get("Aula 101"), tiposElemento.get("mesa"), 15, "DISPONIBLE");
        createInventarioItem(espacios.get("Aula 101"), tiposElemento.get("pizarra"), 2, "DISPONIBLE");
        createInventarioItem(espacios.get("Aula 101"), tiposElemento.get("proyector"), 1, "DISPONIBLE");

        // Inventario para Aula 102
        createInventarioItem(espacios.get("Aula 102"), tiposElemento.get("silla"), 25, "DISPONIBLE");
        createInventarioItem(espacios.get("Aula 102"), tiposElemento.get("mesa"), 12, "DISPONIBLE");
        createInventarioItem(espacios.get("Aula 102"), tiposElemento.get("pizarra"), 1, "DISPONIBLE");

        // Inventario para Aula 201
        createInventarioItem(espacios.get("Aula 201"), tiposElemento.get("silla"), 35, "DISPONIBLE");
        createInventarioItem(espacios.get("Aula 201"), tiposElemento.get("mesa"), 18, "DISPONIBLE");
        createInventarioItem(espacios.get("Aula 201"), tiposElemento.get("proyector"), 1, "DISPONIBLE");

        // Inventario para Aula 202
        createInventarioItem(espacios.get("Aula 202"), tiposElemento.get("silla"), 28, "DISPONIBLE");
        createInventarioItem(espacios.get("Aula 202"), tiposElemento.get("mesa"), 14, "DISPONIBLE");
        createInventarioItem(espacios.get("Aula 202"), tiposElemento.get("televisor"), 1, "DISPONIBLE");

        // Inventario para Aula 301
        createInventarioItem(espacios.get("Aula 301"), tiposElemento.get("silla"), 40, "DISPONIBLE");
        createInventarioItem(espacios.get("Aula 301"), tiposElemento.get("mesa"), 20, "DISPONIBLE");
        createInventarioItem(espacios.get("Aula 301"), tiposElemento.get("pizarra"), 2, "DISPONIBLE");
        createInventarioItem(espacios.get("Aula 301"), tiposElemento.get("proyector"), 1, "DISPONIBLE");

        // Inventario para Laboratorio de Computación A
        createInventarioItem(espacios.get("Laboratorio de Computación A"), tiposElemento.get("computadora"), 20, "DISPONIBLE");
        createInventarioItem(espacios.get("Laboratorio de Computación A"), tiposElemento.get("silla"), 20, "DISPONIBLE");
        createInventarioItem(espacios.get("Laboratorio de Computación A"), tiposElemento.get("mesa"), 10, "DISPONIBLE");

        // Inventario para Laboratorio de Computación B
        createInventarioItem(espacios.get("Laboratorio de Computación B"), tiposElemento.get("computadora"), 20, "DISPONIBLE");
        createInventarioItem(espacios.get("Laboratorio de Computación B"), tiposElemento.get("silla"), 20, "DISPONIBLE");
        createInventarioItem(espacios.get("Laboratorio de Computación B"), tiposElemento.get("mesa"), 10, "DISPONIBLE");

        // Inventario para Laboratorio de Química
        createInventarioItem(espacios.get("Laboratorio de Química"), tiposElemento.get("silla"), 15, "DISPONIBLE");
        createInventarioItem(espacios.get("Laboratorio de Química"), tiposElemento.get("mesa"), 8, "DISPONIBLE");
        createInventarioItem(espacios.get("Laboratorio de Química"), tiposElemento.get("pizarra"), 1, "DISPONIBLE");

        // Inventario para Laboratorio de Física
        createInventarioItem(espacios.get("Laboratorio de Física"), tiposElemento.get("silla"), 18, "DISPONIBLE");
        createInventarioItem(espacios.get("Laboratorio de Física"), tiposElemento.get("mesa"), 9, "DISPONIBLE");
        createInventarioItem(espacios.get("Laboratorio de Física"), tiposElemento.get("proyector"), 1, "DISPONIBLE");

        // Inventario para Laboratorio de Electrónica
        createInventarioItem(espacios.get("Laboratorio de Electrónica"), tiposElemento.get("silla"), 12, "DISPONIBLE");
        createInventarioItem(espacios.get("Laboratorio de Electrónica"), tiposElemento.get("mesa"), 6, "DISPONIBLE");
        createInventarioItem(espacios.get("Laboratorio de Electrónica"), tiposElemento.get("computadora"), 6, "DISPONIBLE");

        // Inventario para Auditorio Principal
        createInventarioItem(espacios.get("Auditorio Principal"), tiposElemento.get("silla"), 150, "DISPONIBLE");
        createInventarioItem(espacios.get("Auditorio Principal"), tiposElemento.get("sistema de audio"), 1, "DISPONIBLE");
        createInventarioItem(espacios.get("Auditorio Principal"), tiposElemento.get("pantalla"), 1, "DISPONIBLE");

        // Inventario para Auditorio Pequeño
        createInventarioItem(espacios.get("Auditorio Pequeño"), tiposElemento.get("silla"), 80, "DISPONIBLE");
        createInventarioItem(espacios.get("Auditorio Pequeño"), tiposElemento.get("sistema de audio"), 1, "DISPONIBLE");
        createInventarioItem(espacios.get("Auditorio Pequeño"), tiposElemento.get("pantalla"), 1, "DISPONIBLE");

        // Inventario para Sala de Reuniones A
        createInventarioItem(espacios.get("Sala de Reuniones A"), tiposElemento.get("silla"), 8, "DISPONIBLE");
        createInventarioItem(espacios.get("Sala de Reuniones A"), tiposElemento.get("mesa"), 1, "DISPONIBLE");
        createInventarioItem(espacios.get("Sala de Reuniones A"), tiposElemento.get("televisor"), 1, "DISPONIBLE");

        // Inventario para Sala de Reuniones B
        createInventarioItem(espacios.get("Sala de Reuniones B"), tiposElemento.get("silla"), 12, "DISPONIBLE");
        createInventarioItem(espacios.get("Sala de Reuniones B"), tiposElemento.get("mesa"), 1, "DISPONIBLE");
        createInventarioItem(espacios.get("Sala de Reuniones B"), tiposElemento.get("televisor"), 1, "DISPONIBLE");

        // Inventario para Sala de Conferencias
        createInventarioItem(espacios.get("Sala de Conferencias"), tiposElemento.get("silla"), 25, "DISPONIBLE");
        createInventarioItem(espacios.get("Sala de Conferencias"), tiposElemento.get("mesa"), 2, "DISPONIBLE");
        createInventarioItem(espacios.get("Sala de Conferencias"), tiposElemento.get("televisor"), 1, "DISPONIBLE");
        createInventarioItem(espacios.get("Sala de Conferencias"), tiposElemento.get("sistema de audio"), 1, "DISPONIBLE");

        // Inventario para Oficina Administrativa
        createInventarioItem(espacios.get("Oficina Administrativa"), tiposElemento.get("silla"), 6, "DISPONIBLE");
        createInventarioItem(espacios.get("Oficina Administrativa"), tiposElemento.get("mesa"), 3, "DISPONIBLE");
        createInventarioItem(espacios.get("Oficina Administrativa"), tiposElemento.get("computadora"), 3, "DISPONIBLE");

        // Inventario para Oficina de Coordinación
        createInventarioItem(espacios.get("Oficina de Coordinación"), tiposElemento.get("silla"), 4, "DISPONIBLE");
        createInventarioItem(espacios.get("Oficina de Coordinación"), tiposElemento.get("mesa"), 2, "DISPONIBLE");
        createInventarioItem(espacios.get("Oficina de Coordinación"), tiposElemento.get("computadora"), 2, "DISPONIBLE");

        // Inventario para Sala de Estudio A
        createInventarioItem(espacios.get("Sala de Estudio A"), tiposElemento.get("silla"), 20, "DISPONIBLE");
        createInventarioItem(espacios.get("Sala de Estudio A"), tiposElemento.get("mesa"), 10, "DISPONIBLE");
        if (tiposElemento.containsKey("aire acondicionado")) {
            createInventarioItem(espacios.get("Sala de Estudio A"), tiposElemento.get("aire acondicionado"), 2, "DISPONIBLE");
        }

        // Inventario para Sala de Estudio B
        createInventarioItem(espacios.get("Sala de Estudio B"), tiposElemento.get("silla"), 15, "DISPONIBLE");
        createInventarioItem(espacios.get("Sala de Estudio B"), tiposElemento.get("mesa"), 8, "DISPONIBLE");
        if (tiposElemento.containsKey("aire acondicionado")) {
            createInventarioItem(espacios.get("Sala de Estudio B"), tiposElemento.get("aire acondicionado"), 1, "DISPONIBLE");
        }

        // Inventario para Taller de Mecánica
        createInventarioItem(espacios.get("Taller de Mecánica"), tiposElemento.get("silla"), 16, "DISPONIBLE");
        createInventarioItem(espacios.get("Taller de Mecánica"), tiposElemento.get("mesa"), 8, "DISPONIBLE");
        if (tiposElemento.containsKey("aire acondicionado")) {
            createInventarioItem(espacios.get("Taller de Mecánica"), tiposElemento.get("aire acondicionado"), 2, "DISPONIBLE");
        }

        // Inventario para Gimnasio Principal
        if (tiposElemento.containsKey("aire acondicionado")) {
            createInventarioItem(espacios.get("Gimnasio Principal"), tiposElemento.get("aire acondicionado"), 4, "DISPONIBLE");
        }
        createInventarioItem(espacios.get("Gimnasio Principal"), tiposElemento.get("sistema de audio"), 1, "DISPONIBLE");
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

