# Tests - UTEC Space Manager Backend

Este directorio contiene los tests unitarios y de integración para el backend del proyecto UTEC Space Manager.

## Estructura de Tests

```
test/
├── java/
│   └── com/utec/backend/
│       ├── controller/              # Tests de integración de controladores
│       │   └── UsuarioControllerTest.java
│       ├── security/
│       │   ├── auth/
│       │   │   ├── AuthenticationControllerTest.java
│       │   │   └── AuthenticationServiceTest.java
│       │   └── jwt/
│       │       └── JwtServiceTest.java
│       └── service/                 # Tests unitarios de servicios
│           └── UsuarioServiceTest.java
└── resources/
    └── application-test.properties  # Configuración para tests
```

## Tipos de Tests

### Tests Unitarios
- **JwtServiceTest**: Tests para generación y validación de tokens JWT
- **UsuarioServiceTest**: Tests para la lógica de negocio de usuarios
- **AuthenticationServiceTest**: Tests para autenticación, registro y verificación de email

### Tests de Integración
- **UsuarioControllerTest**: Tests de endpoints de gestión de usuarios
- **AuthenticationControllerTest**: Tests de endpoints de autenticación

## Tecnologías Utilizadas

- **JUnit 5**: Framework de testing
- **Mockito**: Mocking y stubbing
- **@MockitoBean**: Bean override moderna (Spring Boot 3.4+, reemplaza @MockBean deprecated)
- **MockMvc**: Testing de controladores Spring MVC
- **Spring Security Test**: Testing de seguridad
- **H2 Database**: Base de datos en memoria para tests
- **Spring Boot Testcontainers**: Soporte para testing moderno

## Ejecutar Tests

### Ejecutar todos los tests
```bash
cd backend
./mvnw test
```

### Ejecutar tests de una clase específica
```bash
./mvnw test -Dtest=JwtServiceTest
```

### Ejecutar con perfil de test
```bash
./mvnw test -Dspring.profiles.active=test
```

### Ejecutar tests con cobertura
```bash
./mvnw test jacoco:report
```

## Configuración de Test

Los tests utilizan el perfil `test` que está configurado en `application-test.properties`:

- Base de datos H2 en memoria
- JWT con clave de test
- Liquibase deshabilitado
- Email deshabilitado (no se envían emails reales)

## Cobertura de Tests

### Listado Completo de Tests (57 total)

#### 1️⃣ **JwtServiceTest.java** - 14 tests unitarios

```java
✅ debeGenerarTokenValido
   - Genera un token JWT válido con formato correcto

✅ debeExtraerUsernameDelToken
   - Extrae el username del token correctamente

✅ debeValidarTokenValido
   - Valida correctamente un token válido

✅ debeRechazarTokenInvalido
   - Rechaza tokens con formato inválido

✅ debeGenerarRefreshToken
   - Genera refresh tokens con mayor tiempo de expiración

✅ debeGenerarTokenVerificacion
   - Genera tokens de verificación de email

✅ debeExtraerEmailDelTokenVerificacion
   - Extrae email del token de verificación

✅ debeValidarTokenVerificacionValido
   - Valida tokens de verificación válidos

✅ debeRechazarTokenVerificacionInvalido
   - Rechaza tokens de verificación inválidos

✅ debeRetornarTiempoExpiracion
   - Retorna el tiempo de expiración (3600000ms = 1 hora)

✅ debeRetornarTiempoExpiracionRefreshToken
   - Retorna tiempo de expiración de refresh (86400000ms = 24 horas)

✅ debeGenerarTokensDiferentes
   - Genera tokens diferentes para el mismo usuario (por timestamp)

✅ debeIncluirClaimsAdicionales
   - Incluye claims adicionales en el token
```

#### 2️⃣ **UsuarioServiceTest.java** - 11 tests unitarios

```java
✅ debeRegistrarUsuarioExitosamente
   - Registra un nuevo usuario con password encriptado

✅ debeLanzarExcepcionEmailDuplicado
   - Valida que el email sea único al registrar

✅ debeObtenerPerfilPropio
   - Obtiene el perfil del usuario por email

✅ debeLanzarExcepcionUsuarioNoExisteAlObtenerPerfil
   - Maneja usuario no encontrado al obtener perfil

✅ debeActualizarPerfilCorrectamente
   - Actualiza nombre y contraseña del usuario

✅ debeActualizarSoloNombre
   - Actualiza solo nombre sin modificar contraseña

✅ debeListarTodosLosUsuarios
   - Lista todos los usuarios registrados

✅ debeObtenerUsuarioPorId
   - Obtiene un usuario específico por su ID

✅ debeLanzarExcepcionUsuarioNoExistePorId
   - Valida que el ID exista al buscar usuario

✅ debeCambiarRolUsuario
   - Cambia el rol de un usuario (ADMIN, DOCENTE, etc)

✅ debeLanzarExcepcionAlCambiarRolUsuarioInexistente
   - Valida que el usuario exista al cambiar rol
```

#### 3️⃣ **AuthenticationServiceTest.java** - 13 tests unitarios

```java
✅ debeAutenticarUsuarioExitosamente
   - Login exitoso con credenciales válidas, genera tokens

✅ debeLanzarExcepcionUsuarioNoVerificado
   - Bloquea login si el email no ha sido verificado

✅ debeLanzarExcepcionCredencialesInvalidas
   - Rechaza credenciales incorrectas

✅ debeRegistrarUsuarioExitosamente
   - Registra nuevo usuario y envía email de verificación

✅ debeLanzarExcepcionContraseniasNoCoinciden
   - Valida que password y confirmPassword coincidan

✅ debeLanzarExcepcionEmailYaExiste
   - Previene registro con email duplicado

✅ debeHacerLogoutCorrectamente
   - Agrega token a blacklist al hacer logout

✅ debeVerificarTokenValido
   - Verifica que un token sea válido y no esté en blacklist

✅ debeRechazarTokenEnBlacklist
   - Rechaza tokens que están en blacklist

✅ debeRefrescarTokenExitosamente
   - Refresca access token y refresh token

✅ debeVerificarEmailExitosamente
   - Verifica email con token válido, actualiza usuario

✅ debeReenviarEmailVerificacionExitosamente
   - Reenvía código de verificación a usuario no verificado

✅ noDebeReenviarEmailSiYaVerificado
   - Previene reenvío de verificación si ya está verificado
```

#### 4️⃣ **UsuarioControllerTest.java** - 7 tests de integración

```java
✅ debeObtenerPerfilPropio
   - GET /api/v1/usuarios/me - Obtiene perfil del usuario autenticado

✅ debeActualizarPerfilPropio
   - PUT /api/v1/usuarios/me - Actualiza perfil del usuario

✅ debeListarTodosLosUsuarios
   - GET /api/v1/usuarios - Lista todos los usuarios (requiere ADMIN)

✅ debeObtenerUsuarioPorId
   - GET /api/v1/usuarios/{id} - Obtiene usuario específico por ID

✅ debeCambiarRolUsuario
   - PUT /api/v1/usuarios/{id}/rol - Cambia rol de usuario (requiere ADMIN)

✅ debeObtenerDatosConPrincipalMock
   - Valida uso correcto de Principal en tests

✅ debeValidarDatosEntrada
   - Valida Bean Validation (nombre mínimo 2 caracteres)
```

#### 5️⃣ **AuthenticationControllerTest.java** - 12 tests de integración

```java
✅ debeHacerLoginExitosamente
   - POST /api/v1/auth/login - Login exitoso retorna tokens

✅ debeRetornarErrorCredencialesInvalidas
   - POST /api/v1/auth/login - Retorna 401 con credenciales inválidas

✅ debeRegistrarUsuarioExitosamente
   - POST /api/v1/auth/register - Registro exitoso de nuevo usuario

✅ debeHacerLogoutExitosamente
   - POST /api/v1/auth/logout - Logout agrega token a blacklist

✅ debeRefrescarTokenExitosamente
   - POST /api/v1/auth/refresh - Refresca tokens con refresh token

✅ debeVerificarTokenValido
   - GET /api/v1/auth/verify - Verifica validez del token

✅ debeVerificarEmailExitosamente
   - POST /api/v1/auth/verify-email - Verifica email con código

✅ debeRetornarErrorTokenVerificacionInvalido
   - POST /api/v1/auth/verify-email - Error con token inválido/expirado

✅ debeRetornarErrorSinToken
   - POST /api/v1/auth/verify-email - Error cuando no se envía token

✅ debeReenviarEmailVerificacion
   - POST /api/v1/auth/resend-verification - Reenvía código exitosamente

✅ debeRetornarErrorAlFallarReenvio
   - POST /api/v1/auth/resend-verification - Error al fallar reenvío

✅ debeValidarDatosRegistro
   - Valida datos de entrada con Bean Validation
```

---

### 📊 Resumen por Categoría

| Categoría | Cantidad | Archivos |
|-----------|----------|----------|
| **Tests Unitarios** | 38 | JwtServiceTest (14) + UsuarioServiceTest (11) + AuthenticationServiceTest (13) |
| **Tests de Integración** | 19 | UsuarioControllerTest (7) + AuthenticationControllerTest (12) |
| **TOTAL** | **57** | 5 archivos de test |

### 🎯 Cobertura Funcional

✅ **Autenticación Completa**
- Login, Logout, Registro
- Verificación de email
- Refresh tokens
- Blacklist de tokens
- Validación de credenciales

✅ **Gestión de Usuarios**
- CRUD completo de usuarios
- Cambio de roles (ADMIN, DOCENTE, ANALISTA, ESTUDIANTE, EXTERNO)
- Actualización de perfil
- Listado y búsqueda

✅ **Seguridad JWT**
- Generación de access tokens
- Generación de refresh tokens
- Tokens de verificación de email
- Validación y extracción de claims
- Manejo de expiración

✅ **Validaciones y Excepciones**
- Bean Validation (JSR-303)
- Excepciones de negocio personalizadas
- Casos de error y edge cases
- Validación de datos de entrada

## Buenas Prácticas Aplicadas

1. **Aislamiento**: Cada test es independiente y no afecta a otros
2. **Mocking**: Se mockean las dependencias para tests unitarios
3. **Datos de Test**: Se usan datos consistentes y realistas
4. **Nombres Descriptivos**: Los nombres de tests describen claramente qué se está probando
5. **Arrange-Act-Assert**: Estructura clara en cada test
6. **Validaciones**: Se validan tanto casos exitosos como casos de error

## Agregar Nuevos Tests

Para agregar nuevos tests:

1. Crear la clase de test en el paquete correspondiente
2. Anotar con `@SpringBootTest` y `@ActiveProfiles("test")` para tests de integración
3. Usar `@ExtendWith(MockitoExtension.class)` para tests unitarios
4. Seguir la convención de nombres: `[Clase]Test.java`
5. Usar `@DisplayName` para describir cada test en español

### Ejemplo de Test Unitario

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para MiServicio")
class MiServicioTest {
    
    @Mock
    private MiRepositorio miRepositorio;
    
    @InjectMocks
    private MiServicio miServicio;
    
    @Test
    @DisplayName("Debe hacer algo correctamente")
    void debeHacerAlgoCorrectamente() {
        // Given
        when(miRepositorio.findById(1L)).thenReturn(Optional.of(dato));
        
        // When
        var resultado = miServicio.hacerAlgo(1L);
        
        // Then
        assertNotNull(resultado);
        verify(miRepositorio).findById(1L);
    }
}
```

### Ejemplo de Test de Integración

```java
@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)  // Deshabilita filtros de seguridad para tests
@ActiveProfiles("test")
@DisplayName("Tests de integración para MiController")
class MiControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockitoBean  // Usa @MockitoBean en lugar de @MockBean (deprecated en 3.4+)
    private MiServicio miServicio;
    
    @Test
    @DisplayName("GET /api/endpoint - Debe retornar datos")
    void debeRetornarDatos() throws Exception {
        // Mock del servicio
        when(miServicio.obtenerDatos()).thenReturn(datos);
        
        mockMvc.perform(get("/api/endpoint")
                .principal(() -> "user@test.com"))  // Mock de usuario autenticado
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").exists());
    }
}
```

## Troubleshooting

### Error: "Table not found"
- Asegúrate de que `spring.jpa.hibernate.ddl-auto=create-drop` esté en `application-test.properties`
- Verifica que Liquibase esté deshabilitado para tests

### Error: "No bean found"
- Verifica que estés usando `@SpringBootTest` para tests de integración
- Asegúrate de que los beans estén correctamente mockeados con `@MockBean`

### Tests lentos
- Los tests de integración son más lentos porque levantan el contexto de Spring
- Considera usar tests unitarios cuando sea posible
- Agrupa tests relacionados en la misma clase para compartir el contexto

## Recursos Adicionales

- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
- [Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)
- [Spring Boot Testing](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing)

