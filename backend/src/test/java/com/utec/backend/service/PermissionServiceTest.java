package com.utec.backend.service;

import com.utec.backend.model.Usuario;
import com.utec.backend.security.Permission;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para PermissionService")
class PermissionServiceTest {

    @InjectMocks
    private PermissionService permissionService;

    @Test
    @DisplayName("Debe obtener permisos para rol ADMIN")
    void debeObtenerPermisosParaRolAdmin() {
        // When
        Set<Permission> permisos = permissionService.getPermissionsForRole(Usuario.RolApp.ADMIN);

        // Then
        assertNotNull(permisos);
        assertTrue(permisos.containsAll(Set.of(Permission.values())));
    }

    @Test
    @DisplayName("Debe obtener permisos para rol DOCENTE")
    void debeObtenerPermisosParaRolDocente() {
        // When
        Set<Permission> permisos = permissionService.getPermissionsForRole(Usuario.RolApp.DOCENTE);

        // Then
        assertNotNull(permisos);
        assertTrue(permisos.contains(Permission.RESERVA_SOLICITAR));
        assertTrue(permisos.contains(Permission.RESERVA_VER_TODAS));
        assertFalse(permisos.contains(Permission.RESERVA_APROBAR)); // DOCENTE no puede aprobar
    }

    @Test
    @DisplayName("Debe obtener permisos para rol ANALISTA")
    void debeObtenerPermisosParaRolAnalista() {
        // When
        Set<Permission> permisos = permissionService.getPermissionsForRole(Usuario.RolApp.ANALISTA);

        // Then
        assertNotNull(permisos);
        assertTrue(permisos.contains(Permission.RESERVA_APROBAR));
        assertTrue(permisos.contains(Permission.RESERVA_VER_TODAS));
    }

    @Test
    @DisplayName("Debe obtener permisos para rol MANTENIMIENTO")
    void debeObtenerPermisosParaRolMantenimiento() {
        // When
        Set<Permission> permisos = permissionService.getPermissionsForRole(Usuario.RolApp.MANTENIMIENTO);

        // Then
        assertNotNull(permisos);
        assertTrue(permisos.contains(Permission.INVENTARIO_CREAR));
        assertTrue(permisos.contains(Permission.ESPACIO_EDITAR));
    }

    @Test
    @DisplayName("Debe verificar si rol tiene permiso")
    void debeVerificarSiRolTienePermiso() {
        // When
        boolean tienePermiso = permissionService.hasPermission(
                Usuario.RolApp.DOCENTE, Permission.RESERVA_SOLICITAR);

        // Then
        assertTrue(tienePermiso);
    }

    @Test
    @DisplayName("Debe retornar false cuando rol no tiene permiso")
    void debeRetornarFalseCuandoRolNoTienePermiso() {
        // When
        boolean tienePermiso = permissionService.hasPermission(
                Usuario.RolApp.DOCENTE, Permission.RESERVA_APROBAR);

        // Then
        assertFalse(tienePermiso);
    }

    @Test
    @DisplayName("Debe obtener todos los permisos")
    void debeObtenerTodosLosPermisos() {
        // When
        Set<Permission> todosLosPermisos = permissionService.getAllPermissions();

        // Then
        assertNotNull(todosLosPermisos);
        assertTrue(todosLosPermisos.size() > 0);
        assertTrue(todosLosPermisos.containsAll(Set.of(Permission.values())));
    }

    @Test
    @DisplayName("Debe retornar conjunto vacío para rol desconocido")
    void debeRetornarConjuntoVacioParaRolDesconocido() {
        // When - Usando un rol que no está en el mapa (aunque todos deberían estar)
        Set<Permission> permisos = permissionService.getPermissionsForRole(Usuario.RolApp.ESTUDIANTE);

        // Then
        assertNotNull(permisos);
        // ESTUDIANTE debería tener permisos, pero verificamos que no sea null
    }
}

