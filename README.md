# 🏢 UTEC Space Manager

Sistema de gestión de reservas de espacios para la Universidad Tecnológica del Uruguay (UTEC).

> **Proyecto Final** - Desarrollo de Aplicaciones Empresariales  
> **Versión**: 1.0.0  
> **Fecha**: Octubre 2025

---

## 📋 Descripción

**UTEC Space Manager** es una aplicación web completa para la gestión de espacios y reservas en la Universidad Tecnológica del Uruguay. El sistema permite:

- ✅ Autenticación segura con JWT y verificación de email
- ✅ Gestión de usuarios con roles (Admin, Docente, Analista, Estudiante, Externo)
- 🚧 Gestión de salones y recursos (próximamente)
- 🚧 Sistema de reservas con control de solapamientos (próximamente)
- 🚧 Calendario interactivo (próximamente)
- 🚧 Estadísticas y reportes (próximamente)

---

## 🏗️ Arquitectura

### Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| **Backend** | Spring Boot | 3.5.6 |
| **Frontend** | React + TypeScript | 18 |
| **Base de Datos** | PostgreSQL | 15 |
| **Build Tool (Backend)** | Maven | - |
| **Build Tool (Frontend)** | Vite | - |
| **Estilos** | Tailwind CSS | - |
| **Componentes UI** | shadcn/ui | - |
| **Contenedores** | Docker + Docker Compose | - |

### Arquitectura del Sistema

```
┌─────────────────────────────────────────┐
│          Frontend (React)               │
│     - React Router                      │
│     - Tailwind CSS                      │
│     - shadcn/ui                         │
└──────────────┬──────────────────────────┘
               │ HTTP/REST
┌──────────────▼──────────────────────────┐
│       Backend (Spring Boot)             │
│     - Spring Security + JWT             │
│     - JPA/Hibernate                     │
│     - Liquibase Migrations              │
└──────────────┬──────────────────────────┘
               │ JDBC
┌──────────────▼──────────────────────────┐
│      PostgreSQL Database                │
└─────────────────────────────────────────┘
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Java** 21 o superior
- **Node.js** 20 o superior
- **PostgreSQL** 15 o superior
- **Docker** (opcional, para contenedores)

### Instalación con Docker Compose (Recomendado)

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/UTEC---PF---USM-UTEC-Space-Manager-.git
cd UTEC---PF---USM-UTEC-Space-Manager-

# Crear archivo .env con variables de entorno (ver ejemplo abajo)

# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

**Acceso:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api/v1
- PostgreSQL: localhost:5432

### Instalación Manual

#### Backend

```bash
cd backend

# Compilar e instalar dependencias
./mvnw clean install

# Ejecutar aplicación
./mvnw spring-boot:run

# O con perfil específico
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

**El backend estará disponible en:** http://localhost:8080

#### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo (solo localhost)
npm run dev

# Ejecutar accesible desde la red local
npm run dev:network

# Build de producción
npm run build
```

**El frontend estará disponible en:** http://localhost:5173

---

## 🔧 Configuración

### Variables de Entorno

#### Backend (.env o variables de sistema)

```env
# Base de datos
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/utec_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=tu_password

# JWT
JWT_SECRET=tu-secreto-super-seguro-256-bits
JWT_EXPIRATION=3600000
JWT_REFRESH_EXPIRATION=86400000

# Email
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=tu-email@gmail.com
SPRING_MAIL_PASSWORD=tu-app-password

# Perfil activo
SPRING_PROFILES_ACTIVE=dev
```

#### Frontend (frontend/.env)

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_APP_NAME=UTEC Space Manager
```

---

## 📁 Estructura del Proyecto

```
UTEC-Space-Manager/
├── backend/                    # API REST con Spring Boot
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/          # Código fuente
│   │   │   └── resources/     # Configuración y migraciones
│   │   └── test/              # Tests unitarios e integración
│   ├── pom.xml                # Dependencias Maven
│   └── Dockerfile             # Imagen Docker del backend
├── frontend/                  # Aplicación React
│   ├── src/
│   │   ├── app/              # Páginas (routing)
│   │   ├── components/       # Componentes reutilizables
│   │   ├── contexts/         # React Contexts
│   │   ├── hooks/            # Custom hooks
│   │   └── lib/              # Utilidades y API
│   ├── package.json          # Dependencias npm
│   └── Dockerfile            # Imagen Docker del frontend
├── docker-compose.yml        # Orquestación de servicios
├── .gitguardian.yaml         # Configuración de seguridad
├── .gitleaksignore          # Excepciones de secretos
├── PROJECT_STRUCTURE.md     # Documentación de estructura
└── README.md                # Este archivo
```

**📖 Documentación Completa:** Ver [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

---

## 🧪 Testing

### Backend

```bash
cd backend

# Ejecutar todos los tests
./mvnw test

# Test específico
./mvnw test -Dtest=JwtServiceTest

# Con cobertura
./mvnw test jacoco:report
```

**Tests implementados:** 57 tests (38 unitarios + 19 integración)
- ✅ JwtService (14 tests)
- ✅ UsuarioService (11 tests)
- ✅ AuthenticationService (13 tests)
- ✅ UsuarioController (7 tests)
- ✅ AuthenticationController (12 tests)

**📖 Documentación de Tests:** Ver [backend/src/test/README.md](backend/src/test/README.md)

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [README.md](README.md) | Este archivo - Inicio rápido |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Estructura completa del proyecto |
| [backend/README.md](backend/README.md) | Documentación del backend |
| [backend/src/test/README.md](backend/src/test/README.md) | Guía de testing |
| [frontend/README.md](frontend/README.md) | Documentación del frontend |

---

## 🔐 Seguridad

### Autenticación

El sistema utiliza **JWT (JSON Web Tokens)** para autenticación:

1. Login → Recibe `accessToken` y `refreshToken`
2. Usar `accessToken` en header: `Authorization: Bearer <token>`
3. Cuando expire, refrescar con `refreshToken`

### Roles y Permisos

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **ADMIN** | Administrador del sistema | Gestión completa de usuarios y configuración |
| **ANALISTA** | Personal administrativo | Estadísticas y reportes |
| **DOCENTE** | Profesores | Crear y gestionar reservas |
| **ESTUDIANTE** | Estudiantes | Ver disponibilidad (próximamente) |
| **EXTERNO** | Usuarios externos | Eventos públicos (próximamente) |

### Secretos de Test

⚠️ Los archivos en `backend/src/test/resources/` contienen **secretos de prueba** que NO se usan en producción. Están configurados para ser ignorados por GitGuardian.

---

## 📊 Estado del Proyecto

### ✅ Implementado

- [x] Backend API REST completo
- [x] Autenticación con JWT
- [x] Registro y login
- [x] Verificación de email
- [x] Gestión de usuarios
- [x] Tests unitarios e integración (57 tests)
- [x] Migraciones de base de datos
- [x] Docker y Docker Compose
- [x] Frontend con React + TypeScript
- [x] UI con Tailwind + shadcn/ui
- [x] Routing y navegación

### 🚧 En Desarrollo

- [ ] CRUD de Salones
- [ ] Sistema de Reservas
- [ ] Calendario interactivo
- [ ] Gestión de inventario
- [ ] Estadísticas y reportes
- [ ] Panel de administración
- [ ] Notificaciones

---

## 🛠️ Comandos Útiles

### Docker

```bash
# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Detener servicios
docker-compose down

# Reconstruir imágenes
docker-compose build
```

### Backend (Maven)

```bash
cd backend

# Compilar
./mvnw clean install

# Ejecutar
./mvnw spring-boot:run

# Tests
./mvnw test

# Sin tests
./mvnw clean install -DskipTests
```

### Frontend (npm)

```bash
cd frontend

# Instalar
npm install

# Desarrollo
npm run dev

# Build
npm run build

# Preview
npm run preview
```

---

## 👥 Equipo

- **Desarrollador Backend**: Mathias Pena
- **Institución**: Universidad Tecnológica del Uruguay (UTEC)
- **Proyecto**: Trabajo Final - Desarrollo de Aplicaciones Empresariales

---

## 📄 Licencia

Este proyecto es parte de un trabajo académico para la Universidad Tecnológica del Uruguay (UTEC).

---

## 🔗 Enlaces Útiles

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Docker Documentation](https://docs.docker.com/)

---

**Última actualización:** Octubre 2025
