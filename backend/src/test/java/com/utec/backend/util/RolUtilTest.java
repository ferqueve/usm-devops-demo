package com.utec.backend.util;

import com.utec.backend.model.entity.Usuario;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para la utilidad RolUtil
 */
class RolUtilTest {

    @Test
    void testDeterminarRolPorEmail_EstudianteUtec() {
        // Emails de estudiantes UTEC
        assertEquals(Usuario.RolApp.ESTUDIANTE, RolUtil.determinarRolPorEmail("juan.perez@estudiantes.utec.edu.uy"));
        assertEquals(Usuario.RolApp.ESTUDIANTE, RolUtil.determinarRolPorEmail("maria.garcia@utec.edu.uy"));
        assertEquals(Usuario.RolApp.ESTUDIANTE, RolUtil.determinarRolPorEmail("test@estudiantes.utec.edu.uy"));
        assertEquals(Usuario.RolApp.ESTUDIANTE, RolUtil.determinarRolPorEmail("admin@utec.edu.uy"));
    }

    @Test
    void testDeterminarRolPorEmail_Externo() {
        // Emails externos
        assertEquals(Usuario.RolApp.EXTERNO, RolUtil.determinarRolPorEmail("usuario@gmail.com"));
        assertEquals(Usuario.RolApp.EXTERNO, RolUtil.determinarRolPorEmail("test@yahoo.com"));
        assertEquals(Usuario.RolApp.EXTERNO, RolUtil.determinarRolPorEmail("ejemplo@hotmail.com"));
        assertEquals(Usuario.RolApp.EXTERNO, RolUtil.determinarRolPorEmail("usuario@empresa.com"));
        assertEquals(Usuario.RolApp.EXTERNO, RolUtil.determinarRolPorEmail("test@otra-universidad.edu"));
    }

    @Test
    void testDeterminarRolPorEmail_CaseInsensitive() {
        // Verificar que funciona sin importar mayúsculas/minúsculas
        assertEquals(Usuario.RolApp.ESTUDIANTE, RolUtil.determinarRolPorEmail("USUARIO@ESTUDIANTES.UTEC.EDU.UY"));
        assertEquals(Usuario.RolApp.ESTUDIANTE, RolUtil.determinarRolPorEmail("Usuario@Estudiantes.Utec.Edu.Uy"));
        assertEquals(Usuario.RolApp.ESTUDIANTE, RolUtil.determinarRolPorEmail("TEST@UTEC.EDU.UY"));
    }

    @Test
    void testDeterminarRolPorEmail_ConEspacios() {
        // Verificar que maneja espacios correctamente
        assertEquals(Usuario.RolApp.ESTUDIANTE, RolUtil.determinarRolPorEmail(" usuario@estudiantes.utec.edu.uy "));
        assertEquals(Usuario.RolApp.EXTERNO, RolUtil.determinarRolPorEmail(" usuario@gmail.com "));
    }

    @Test
    void testDeterminarRolPorEmail_NullYVacio() {
        // Casos edge
        assertEquals(Usuario.RolApp.EXTERNO, RolUtil.determinarRolPorEmail(null));
        assertEquals(Usuario.RolApp.EXTERNO, RolUtil.determinarRolPorEmail(""));
        assertEquals(Usuario.RolApp.EXTERNO, RolUtil.determinarRolPorEmail("   "));
    }

    @Test
    void testEsEstudianteUtec() {
        // Casos positivos
        assertTrue(RolUtil.esEstudianteUtec("juan@estudiantes.utec.edu.uy"));
        assertTrue(RolUtil.esEstudianteUtec("maria@utec.edu.uy"));
        assertTrue(RolUtil.esEstudianteUtec("USUARIO@ESTUDIANTES.UTEC.EDU.UY"));
        
        // Casos negativos
        assertFalse(RolUtil.esEstudianteUtec("usuario@gmail.com"));
        assertFalse(RolUtil.esEstudianteUtec("test@yahoo.com"));
        assertFalse(RolUtil.esEstudianteUtec(null));
        assertFalse(RolUtil.esEstudianteUtec(""));
    }

    @Test
    void testEsUsuarioExterno() {
        // Casos positivos
        assertTrue(RolUtil.esUsuarioExterno("usuario@gmail.com"));
        assertTrue(RolUtil.esUsuarioExterno("test@yahoo.com"));
        assertTrue(RolUtil.esUsuarioExterno(null));
        assertTrue(RolUtil.esUsuarioExterno(""));
        
        // Casos negativos
        assertFalse(RolUtil.esUsuarioExterno("juan@estudiantes.utec.edu.uy"));
        assertFalse(RolUtil.esUsuarioExterno("maria@utec.edu.uy"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "usuario@estudiantes.utec.edu.uy",
        "test@utec.edu.uy",
        "ESTUDIANTE@ESTUDIANTES.UTEC.EDU.UY",
        "docente@utec.edu.uy"
    })
    void testEmailsUtec_DevuelvenEstudiante(String email) {
        assertEquals(Usuario.RolApp.ESTUDIANTE, RolUtil.determinarRolPorEmail(email));
        assertTrue(RolUtil.esEstudianteUtec(email));
        assertFalse(RolUtil.esUsuarioExterno(email));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "usuario@gmail.com",
        "test@yahoo.com",
        "ejemplo@hotmail.com",
        "admin@empresa.com",
        "usuario@otra-universidad.edu"
    })
    void testEmailsExternos_DevuelvenExterno(String email) {
        assertEquals(Usuario.RolApp.EXTERNO, RolUtil.determinarRolPorEmail(email));
        assertFalse(RolUtil.esEstudianteUtec(email));
        assertTrue(RolUtil.esUsuarioExterno(email));
    }
}
