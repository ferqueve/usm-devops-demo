# UTEC Space Manager - Backend

## 📋 Descripción General

El backend del **UTEC Space Manager** es una API REST construida con **Spring Boot** que gestiona el sistema de espacios y reservas para la Universidad Tecnológica del Uruguay (UTEC). 

**Estado Actual:** Sistema de autenticación y gestión de usuarios implementado. Funcionalidades de reservas y espacios en desarrollo.

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Framework**: Spring Boot 3.5.6
- **Base de Datos**: PostgreSQL 15
- **ORM**: Hibernate/JPA
- **Migraciones**: Liquibase
- **Seguridad**: Spring Security + JWT
- **Autenticación**: JWT con tokens de acceso y refresh
- **Email**: Gmail API (HTTP)
- **Build Tool**: Maven
- **Java**: JDK 21
- **Tests**: JUnit 5 + Mockito + Spring Boot Testcontainers

### Arquitectura en Capas
El sistema sigue una arquitectura **N-tier** o multicapa:

```
┌─────────────────┐
│   Controller    │ ← Recibe solicitudes HTTP
├─────────────────┤
│     Service     │ ← Lógica de negocio
├─────────────────┤
│   Repository    │ ← Acceso a datos
├─────────────────┤
│   Model/Entity  │ ← Entidades JPA
└─────────────────┘
```

**Capas Transversales:**
- **Security**: Configuración de autenticación y autorización
- **DTO**: Objetos de transferencia de datos
- **Mapper**: Conversión entre entidades y DTOs
- **Exception**: Manejo global de errores
- **Config**: Configuración del sistema
- **Audit**: Registro de auditoría (opcional)
- **Statistics**: Generación de estadísticas (opcional)

## 📁 Estructura del Proyecto

```
src/main/java/com/utec/reservas/
├── controller/          # Controladores REST
├── service/            # Lógica de negocio
├── repository/         # Interfaces de acceso a datos
├── model/              # Entidades JPA
├── dto/                # Objetos de transferencia
├── mapper/             # Conversores de datos
├── security/           # Configuración de seguridad
├── exception/          # Manejo de excepciones
├── config/             # Configuración del sistema
├── audit/              # Auditoría (opcional)
└── statistics/         # Estadísticas (opcional)
```

## 🎯 Funcionalidades Implementadas

### ✅ Autenticación y Autorización
- **Registro de usuarios**: Con validación de email
- **Login tradicional**: Email + contraseña con JWT
- **Login con Google OAuth**: Autenticación social
- **Refresh tokens**: Renovación automática de sesiones
- **Token blacklist**: Invalidación de tokens en logout
- **Verificación de email**: Sistema de códigos de verificación
- **Roles**: Admin, Analista, Docente, Estudiante, Externo (asignados por la app)

### ✅ Gestión de Usuarios
- Obtener perfil propio
- Actualizar perfil (nombre y contraseña)
- Listar todos los usuarios con filtros avanzados (Admin)
- Obtener usuario por ID
- Cambiar roles de usuario (Admin)
- Activar/desactivar usuarios (Admin)
- Obtener estadísticas de usuarios (Admin)
- Exportar usuarios a CSV (Admin)
- Editar información de usuarios por admin
- Reenviar verificación de email por admin
- Restablecer contraseña por admin
- Filtros por fecha de registro

### 🚧 Próximas Funcionalidades

### Gestión de Espacios (Implementado)
- CRUD completo de espacios
- Control de capacidad y recursos
- Gestión de inventario por espacio
- Imágenes y planos de espacios
- Búsqueda y filtrado de espacios
- Estadísticas de ocupación

### Sistema de Reservas (Próximamente)
- Creación y gestión de reservas
- Control automático de solapamientos
- Estados: Pendiente, Aprobado, Cancelado
- Eventos externos para reservas públicas

### Análisis y Recomendaciones (Próximamente)
- Sistema de recomendaciones inteligentes
- Estadísticas de uso de salones
- Métricas de reservas por período
- Auditoría de cambios en el sistema

## 🚀 API Endpoints

### Base URL
```
/api/v1
```

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/auth/register` | Registro de nuevo usuario |
| `POST` | `/auth/login` | Login con email y contraseña |
| `GET` | `/oauth2/google/authorize` | **Iniciar login con Google OAuth** |
| `GET` | `/oauth2/google/callback` | **Callback de Google OAuth** |
| `GET` | `/oauth2/google/info` | **Info de OAuth (debugging)** |
| `POST` | `/auth/logout` | Cerrar sesión (invalida token) |
| `POST` | `/auth/refresh` | Refrescar access token |
| `GET` | `/auth/verify` | Verificar si token es válido |
| `POST` | `/auth/verify-email` | Verificar email con código |
| `POST` | `/auth/resend-verification` | Reenviar código de verificación |

### Usuarios
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/usuarios/me` | Perfil propio | ✅ |
| `PUT` | `/usuarios/me` | Actualizar perfil | ✅ |
| `GET` | `/usuarios` | Listar usuarios (Admin) | ✅ |
| `GET` | `/usuarios/{id}` | Ver usuario específico | ✅ |
| `PUT` | `/usuarios/{id}/rol` | Cambiar rol (Admin) | ✅ |
| `PUT` | `/usuarios/{id}/toggle-activo` | Activar/desactivar usuario (Admin) | ✅ |
| `GET` | `/usuarios/stats` | Estadísticas de usuarios (Admin) | ✅ |
| `GET` | `/usuarios/export` | Exportar usuarios a CSV (Admin) | ✅ |
| `PUT` | `/usuarios/{id}` | Actualizar usuario por admin (Admin) | ✅ |
| `POST` | `/usuarios/{id}/resend-verification` | Reenviar verificación por admin (Admin) | ✅ |
| `POST` | `/usuarios/{id}/reset-password` | Restablecer contraseña por admin (Admin) | ✅ |

### Espacios
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/espacios` | Crear nuevo espacio (Admin/Mantenimiento) | ✅ |
| `GET` | `/espacios` | Listar todos los espacios (Todos autenticados) | ✅ |
| `GET` | `/espacios/paged` | Listar espacios paginados (Todos autenticados) | ✅ |
| `GET` | `/espacios/{id}` | Obtener espacio por ID (Todos autenticados) | ✅ |
| `PUT` | `/espacios/{id}` | Actualizar espacio (Admin/Mantenimiento) | ✅ |
| `DELETE` | `/espacios/{id}` | Eliminar espacio (Admin) | ✅ |
| `GET` | `/espacios/search` | Buscar espacios por nombre (Todos autenticados) | ✅ |
| `GET` | `/espacios/filter` | Filtrar espacios con múltiples criterios (Todos autenticados) | ✅ |
| `GET` | `/espacios/capacidad/{capacidadMinima}` | Filtrar por capacidad mínima (Todos autenticados) | ✅ |
| `GET` | `/espacios/disponibles` | Obtener espacios disponibles en rango de tiempo (Todos autenticados) | ✅ |
| `GET` | `/espacios/stats` | Obtener estadísticas de espacios (Todos autenticados) | ✅ |

### Reservas
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/reservas` | Crear nueva reserva (Admin/Analista/Docente) | ✅ |
| `GET` | `/reservas/mis-reservas` | Obtener mis reservas (Admin/Analista/Docente) | ✅ |
| `GET` | `/reservas/mis-reservas/paged` | Obtener mis reservas paginadas (Admin/Analista/Docente) | ✅ |
| `GET` | `/reservas/{id}` | Obtener reserva por ID (Admin/Analista/Docente) | ✅ |
| `PUT` | `/reservas/{id}` | Actualizar reserva (Admin/Analista) | ✅ |
| `DELETE` | `/reservas/{id}` | Cancelar reserva (Admin/Analista/Docente) | ✅ |
| `GET` | `/reservas/espacio/{espacioId}` | Obtener reservas de un espacio (Todos autenticados) | ✅ |
| `GET` | `/reservas/todas` | Obtener todas las reservas del sistema (Todos autenticados) | ✅ |
| `GET` | `/reservas/paged` | Obtener todas las reservas paginadas (Admin/Analista) | ✅ |
| `GET` | `/reservas/mis-reservas/stats` | Estadísticas personales de reservas (Admin/Analista/Docente) | ✅ |
| `PATCH` | `/reservas/{id}/estado` | Cambiar estado de reserva (Admin/Analista) | ✅ |

### Items Solicitados (Inventario para Reservas)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/reservas/items-solicitados` | Listar solicitudes de inventario con filtros y paginación (Admin/Analista/Mantenimiento) | ✅ |
| `PATCH` | `/reservas/items-solicitados/{id}` | Actualizar estado, observaciones o asignación de items solicitados (Admin/Mantenimiento) | ✅ |

### Tipos de Espacio
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/tipos-espacio` | Crear tipo de espacio (Admin/Mantenimiento) | ✅ |
| `GET` | `/tipos-espacio` | Listar tipos de espacio (Todos autenticados) | ✅ |
| `GET` | `/tipos-espacio/paged` | Listar tipos de espacio paginados (Todos autenticados) | ✅ |
| `GET` | `/tipos-espacio/{id}` | Obtener tipo de espacio por ID (Todos autenticados) | ✅ |
| `PUT` | `/tipos-espacio/{id}` | Actualizar tipo de espacio (Admin/Mantenimiento) | ✅ |
| `DELETE` | `/tipos-espacio/{id}` | Eliminar tipo de espacio (Admin) | ✅ |
| `GET` | `/tipos-espacio/search` | Buscar tipos de espacio por nombre (Todos autenticados) | ✅ |
| `GET` | `/tipos-espacio/stats` | Estadísticas de tipos de espacio (Todos autenticados) | ✅ |

### Tipos de Elemento
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/tipos-elemento` | Crear tipo de elemento (Admin/Mantenimiento) | ✅ |
| `GET` | `/tipos-elemento` | Listar tipos de elemento (Todos autenticados) | ✅ |
| `GET` | `/tipos-elemento/paged` | Listar tipos de elemento paginados (Todos autenticados) | ✅ |
| `GET` | `/tipos-elemento/{id}` | Obtener tipo de elemento por ID (Todos autenticados) | ✅ |
| `PUT` | `/tipos-elemento/{id}` | Actualizar tipo de elemento (Admin/Mantenimiento) | ✅ |
| `DELETE` | `/tipos-elemento/{id}` | Eliminar tipo de elemento (Admin) | ✅ |
| `GET` | `/tipos-elemento/search` | Buscar tipos de elemento por nombre (Todos autenticados) | ✅ |
| `GET` | `/tipos-elemento/stats` | Estadísticas de tipos de elemento (Todos autenticados) | ✅ |

### Carreras
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/carreras` | Crear carrera (Admin/Analista) | ✅ |
| `GET` | `/carreras` | Listar carreras (Todos autenticados) | ✅ |
| `GET` | `/carreras/paged` | Listar carreras paginadas (Todos autenticados) | ✅ |
| `GET` | `/carreras/{id}` | Obtener carrera por ID (Todos autenticados) | ✅ |
| `PUT` | `/carreras/{id}` | Actualizar carrera (Admin/Analista) | ✅ |
| `DELETE` | `/carreras/{id}` | Eliminar carrera (Admin/Analista) | ✅ |
| `GET` | `/carreras/search` | Buscar carreras por nombre (Todos autenticados) | ✅ |
| `GET` | `/carreras/stats` | Estadísticas de carreras (Todos autenticados) | ✅ |

### Inventario
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/inventario` | Crear item de inventario (Admin/Mantenimiento) | ✅ |
| `GET` | `/inventario` | Listar items de inventario (Admin/Analista/Mantenimiento) | ✅ |
| `GET` | `/inventario/paged` | Listar items de inventario paginados (Admin/Analista/Mantenimiento) | ✅ |
| `GET` | `/inventario/{id}` | Obtener item de inventario por ID (Admin/Analista/Mantenimiento) | ✅ |
| `PUT` | `/inventario/{id}` | Actualizar item de inventario (Admin/Mantenimiento) | ✅ |
| `DELETE` | `/inventario/{id}` | Eliminar item de inventario (Admin) | ✅ |
| `GET` | `/inventario/espacio/{espacioId}` | Obtener inventario de un espacio (Todos autenticados) | ✅ |
| `GET` | `/inventario/tipo-elemento/{tipoElementoId}` | Obtener inventario por tipo de elemento (Admin/Analista/Mantenimiento) | ✅ |
| `GET` | `/inventario/estado/{estado}` | Obtener inventario por estado (Admin/Analista/Mantenimiento) | ✅ |
| `GET` | `/inventario/filter` | Filtrar inventario con múltiples criterios (Admin/Analista/Mantenimiento) | ✅ |
| `GET` | `/inventario/stats` | Estadísticas de inventario (Admin/Analista/Mantenimiento) | ✅ |

### 🚧 Endpoints en Desarrollo

Los siguientes endpoints están planificados pero aún no implementados:

- Inventario (flujos masivos y auditoría)
- Reservas (autorizaciones automáticas y notificaciones)
- Eventos Externos
- Recomendaciones y Estadísticas

## 🗄️ Base de Datos

### Esquema Principal
- **usuario**: Gestión de usuarios y roles
- **espacio**: Definición de espacios disponibles (salones, laboratorios, auditorios, etc.)
- **inventario_item**: Recursos por espacio
- **reserva**: Reservas con control de solapamientos
- **evento_externo**: Detalles de eventos públicos
- **recomendacion**: Sugerencias inteligentes
- **audit_log**: Registro de auditoría

### Características Técnicas
- **PostgreSQL** como motor principal
- **Restricciones de solapamiento** a nivel de BD
- **Claves foráneas** para integridad referencial
- **Timestamps** automáticos para auditoría
- **Soft delete** para entidades críticas

## 🔒 Seguridad y Permisos

### Headers de Autenticación
```
Authorization: Bearer <jwt_token>
```

### Matriz de Permisos por Rol

| Función | Admin | Analista | Mantenimiento | Docente | Estudiante | Externo |
|---------|-------|----------|---------------|---------|------------|---------|
| **Gestión de Usuarios** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Gestión de Espacios** | ✅ | ❌* | ✅ | ❌ | ❌ | ❌ |
| **Inventario** | ✅ | ❌* | ✅ | ❌ | ❌ | ❌ |
| **Reservas** | ✅ | ✅ | ❌** | ✅ | ❌ | ❌ |
| **Ver Espacios/Inventario** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Ver Reservas** | ✅ | ✅ | ✅** | ✅ | ✅ | ✅ |
| **Estadísticas** | ✅ | ✅*** | ✅**** | ❌ | ❌ | ❌ |

\* ANALISTA puede ver espacios e inventario pero no gestionarlos  
\** MANTENIMIENTO puede ver reservas para conocer ocupación pero no gestionarlas  
\*** ANALISTA solo estadísticas de reservas  
\**** MANTENIMIENTO solo estadísticas de inventario y espacios

## 🔐 Configuración de Google OAuth

### Obtener Credenciales

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea o selecciona un proyecto
3. Ve a **"APIs & Services" > "Credentials"**
4. Clic en **"Create Credentials" > "OAuth 2.0 Client ID"**
5. Configura:
   - **Application type:** Web application
   - **Authorized JavaScript origins:** `http://localhost:5173`
   - **Authorized redirect URIs:** 
     - `http://localhost:8080/api/v1/oauth2/google/callback` (Backend callback)
     - `http://localhost:5173/auth/callback/success` (Frontend success)
6. Copia el **Client ID** y **Client Secret**
7. Agrégalos a tu archivo `backend/.env`:
   ```env
   GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=tu-client-secret
   ```

### Flujo de Autenticación OAuth (Backend-First)

1. Usuario hace clic en "Iniciar con Google" en el frontend
2. Frontend redirige a `GET /api/v1/oauth2/google/authorize`
3. Backend redirige a Google OAuth con parámetros
4. Usuario autoriza en Google
5. Google redirige a `GET /api/v1/oauth2/google/callback`
6. Backend intercambia código por tokens con Google
7. Backend busca o crea el usuario:
   - Si es nuevo: crea con rol `EXTERNO` y `verificado=true`
   - Si existe: vincula cuenta OAuth
8. Backend genera JWT tokens y redirige a frontend
9. Frontend procesa callback y autentica usuario

**Nota:** Los roles se asignan desde la aplicación, Google solo provee la identidad.

## 🚀 Despliegue y Configuración

### Requisitos del Sistema
- **Java**: JDK 21 o superior
- **Maven**: 3.6+
- **PostgreSQL**: 15+
- **Memoria**: Mínimo 2GB RAM

### Configurar Variables de Entorno

```bash
cd backend

# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus credenciales
nano .env  # o usa tu editor preferido
```

Ver sección [Configuración](#configuración-de-google-oauth) para obtener credenciales de Google.

### Ejecutar Aplicación

```bash
cd backend

# Compilar proyecto
./mvnw clean install

# Ejecutar aplicación (perfil dev por defecto)
./mvnw spring-boot:run

# Con perfil específico
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod

# Ejecutar tests
./mvnw test

# Test específico
./mvnw test -Dtest=JwtServiceTest
```

### Configuración del Frontend

Para desarrollo local, el frontend necesita configurar las URLs del backend. Edita manualmente el archivo `frontend/.env` con la IP deseada:

```env
# Configurar estas URLs en frontend/.env según tu entorno
VITE_API_URL=http://192.168.1.14:8080/api/v1
VITE_FRONTEND_URL=http://192.168.1.14:5173
```

### Tests Implementados

**Total: 57 tests** (38 unitarios + 19 integración)

- ✅ **JwtServiceTest** (14 tests) - Servicio de tokens JWT
- ✅ **UsuarioServiceTest** (11 tests) - Lógica de usuarios
- ✅ **AuthenticationServiceTest** (13 tests) - Autenticación
- ✅ **UsuarioControllerTest** (7 tests) - Endpoints de usuarios
- ✅ **AuthenticationControllerTest** (12 tests) - Endpoints de auth

**Nota:** Los tests de OAuth requieren configuración adicional de mocks para Google API.

## 📧 Configuración de Gmail API

El sistema usa Gmail API para el envío de emails de verificación. Para configurarlo:

### 1. Obtener Credenciales
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Habilita la Gmail API
3. Crea credenciales OAuth 2.0 (Desktop application)
4. Obtén el refresh token

### 2. Configurar Variables
```env
GMAIL_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=tu-client-secret
GMAIL_REFRESH_TOKEN=tu-refresh-token
GMAIL_FROM_EMAIL=tu-email@gmail.com
```

### 3. Ventajas vs SMTP
- ✅ Mejor confiabilidad
- ✅ Límites más altos
- ✅ Autenticación OAuth 2.0 más segura
- ✅ Sin contraseñas de aplicación

Ver documentación completa en: [src/test/README.md](src/test/README.md)


## 🤝 Contribución

### Convenciones de Código
- **Clases**: PascalCase (`ReservaService`)
- **Métodos**: camelCase (`crearReserva`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_CAPACIDAD`)
- **Paquetes**: minúsculas (`com.utec.reservas.service`)


## 📚 Documentación Adicional

- **Tests**: [src/test/README.md](src/test/README.md)
- **Estructura del Proyecto**: [../PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)
- **Configuración de Seguridad**: Ver `.gitguardian.yaml` y `.gitleaksignore`

## 📞 Contacto

- **Desarrollador Backend**: Mathias Pena
- **Proyecto**: UTEC Space Manager
- **Institución**: Universidad Tecnológica del Uruguay (UTEC)
- **Versión**: 1.0.0
- **Fecha**: Octubre 2025

---

**Última actualización:** Octubre 2025
