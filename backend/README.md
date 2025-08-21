# USM Space Manager - Backend

## 📋 Descripción General

El backend del **USM Space Manager** es una aplicación robusta y segura construida con **Spring Boot** que gestiona el sistema de reservas de salones para la Universidad Tecnológica del Uruguay (UTEC). El sistema permite la autenticación delegada en la cuenta institucional UTEC, gestión completa de salones, inventario, reservas con control de solapamientos, y flujos de aprobación de solicitudes.

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Framework**: Spring Boot 3.x
- **Base de Datos**: PostgreSQL
- **ORM**: Hibernate/JPA
- **Seguridad**: Spring Security + JWT
- **Autenticación**: SSO/IdP (LDAP/OAuth2)
- **Build Tool**: Maven
- **Java**: JDK 17+

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

## 🎯 Funcionalidades Principales

### 🔐 Autenticación y Autorización
- **SSO UTEC**: Integración con el sistema de identidad institucional
- **Usuarios Externos**: Registro y autenticación local
- **JWT**: Tokens de sesión seguros
- **Roles**: Admin, Analista, Docente, Estudiante, Externo

### 🏢 Gestión de Salones
- CRUD completo de salones
- Control de capacidad y recursos
- Gestión de inventario por salón
- Imágenes y planos de salones

### 📅 Sistema de Reservas
- Creación y gestión de reservas
- Control automático de solapamientos
- Estados: Pendiente, Aprobado, Cancelado
- Eventos externos para reservas públicas

### 📊 Análisis y Recomendaciones
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
| `POST` | `/auth/signup` | Registro de usuario externo |
| `POST` | `/auth/login` | Login tradicional (externos) |
| `POST` | `/auth/utec/login` | Login UTEC vía LDAP |

### Usuarios
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/usuarios/me` | Perfil propio | ✅ |
| `PUT` | `/usuarios/me` | Actualizar perfil | ✅ |
| `GET` | `/usuarios` | Listar usuarios (Admin) | ✅ |
| `GET` | `/usuarios/{id}` | Ver usuario específico | ✅ |
| `PUT` | `/usuarios/{id}/rol` | Cambiar rol (Admin) | ✅ |

### Salones
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/salones` | Listar salones | ✅ |
| `POST` | `/salones` | Crear salón (Admin) | ✅ |
| `GET` | `/salones/{id}` | Ver salón | ✅ |
| `PUT` | `/salones/{id}` | Editar salón (Admin) | ✅ |
| `DELETE` | `/salones/{id}` | Borrar salón (Admin) | ✅ |

### Inventario
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/salones/{salonId}/inventario` | Listar inventario | ✅ |
| `POST` | `/salones/{salonId}/inventario` | Crear ítem | ✅ |
| `PUT` | `/salones/{salonId}/inventario/{itemId}` | Modificar ítem | ✅ |
| `DELETE` | `/salones/{salonId}/inventario/{itemId}` | Eliminar ítem | ✅ |

### Reservas
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/reservas` | Listar reservas (con filtros) | ✅ |
| `POST` | `/reservas` | Crear reserva | ✅ |
| `GET` | `/reservas/{id}` | Ver reserva | ✅ |
| `PUT` | `/reservas/{id}` | Actualizar reserva | ✅ |
| `DELETE` | `/reservas/{id}` | Cancelar reserva | ✅ |

### Eventos Externos
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/reservas/{id}/evento` | Crear evento | ✅ |
| `GET` | `/reservas/{id}/evento` | Ver evento | ✅ |
| `PUT` | `/reservas/{id}/evento` | Modificar evento | ✅ |
| `DELETE` | `/reservas/{id}/evento` | Eliminar evento | ✅ |

### Recomendaciones y Estadísticas
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/recomendaciones/{userId}` | Obtener sugerencias | ✅ |
| `GET` | `/estadisticas/reservas` | Estadísticas de reservas | ✅ |
| `GET` | `/estadisticas/salones/uso` | Uso de salones | ✅ |

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
- **Java**: JDK 17 o superior
- **Maven**: 3.6+
- **PostgreSQL**: 12+
- **Memoria**: Mínimo 2GB RAM


## 🤝 Contribución

### Convenciones de Código
- **Clases**: PascalCase (`ReservaService`)
- **Métodos**: camelCase (`crearReserva`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_CAPACIDAD`)
- **Paquetes**: minúsculas (`com.utec.reservas.service`)


## 📞 Contacto y Soporte

- **Desarrollador Backend**: Mathias Pena
- **Proyecto**: USM Space Manager
- **Institución**: Universidad Tecnológica del Uruguay (UTEC)
- **Versión**: 1.0 (Julio/Agosto 2025)



**Nota**: Este es un README inicial que puede ser actualizado conforme evolucione el proyecto. Para más detalles técnicos, consultar la documentación completa del backend.
