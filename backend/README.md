# UTEC Space Manager - Backend

## 📋 Descripción General

El backend del **UTEC Space Manager** es una API REST construida con **Spring Boot** que gestiona el sistema de espacios y reservas para la Universidad Tecnológica del Uruguay (UTEC). 

**Estado Actual:** Sistema de autenticación y gestión de usuarios implementado. Funcionalidades de reservas y salones en desarrollo.

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Framework**: Spring Boot 3.5.6
- **Base de Datos**: PostgreSQL 15
- **ORM**: Hibernate/JPA
- **Migraciones**: Liquibase
- **Seguridad**: Spring Security + JWT
- **Autenticación**: JWT con tokens de acceso y refresh
- **Email**: Spring Mail (Gmail SMTP)
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
- **Login/Logout**: JWT con access y refresh tokens
- **Verificación de email**: Sistema de códigos de verificación
- **Refresh tokens**: Renovación automática de sesiones
- **Token blacklist**: Invalidación de tokens en logout
- **Roles**: Admin, Analista, Docente, Estudiante, Externo

### ✅ Gestión de Usuarios
- Obtener perfil propio
- Actualizar perfil (nombre y contraseña)
- Listar todos los usuarios (Admin)
- Obtener usuario por ID
- Cambiar roles de usuario (Admin)

### 🚧 Próximas Funcionalidades

### Gestión de Salones (Próximamente)
- CRUD completo de salones
- Control de capacidad y recursos
- Gestión de inventario por salón
- Imágenes y planos de salones

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

### 🚧 Endpoints en Desarrollo

Los siguientes endpoints están planificados pero aún no implementados:

- Salones (CRUD)
- Inventario
- Reservas
- Eventos Externos
- Recomendaciones y Estadísticas

## 🗄️ Base de Datos

### Esquema Principal
- **usuario**: Gestión de usuarios y roles
- **salon**: Definición de salones disponibles
- **inventario_item**: Recursos por salón
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

| Función | Admin | Analista | Docente | Estudiante | Externo |
|---------|-------|----------|---------|------------|---------|
| **Gestión de Usuarios** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Gestión de Salones** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Inventario** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Reservas** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Eventos Externos** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Estadísticas** | ✅ | ✅ | ❌ | ❌ | ❌ |

## 🚀 Despliegue y Configuración

### Requisitos del Sistema
- **Java**: JDK 21 o superior
- **Maven**: 3.6+
- **PostgreSQL**: 15+
- **Memoria**: Mínimo 2GB RAM

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

### Tests Implementados

**Total: 57 tests** (38 unitarios + 19 integración)

- ✅ **JwtServiceTest** (14 tests) - Servicio de tokens JWT
- ✅ **UsuarioServiceTest** (11 tests) - Lógica de usuarios
- ✅ **AuthenticationServiceTest** (13 tests) - Autenticación
- ✅ **UsuarioControllerTest** (7 tests) - Endpoints de usuarios
- ✅ **AuthenticationControllerTest** (12 tests) - Endpoints de auth

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
