# 🏢 UTEC Space Manager

Sistema de gestión de reservas de espacios para la Universidad Tecnológica del Uruguay (UTEC).

> **Proyecto Final** - Desarrollo de Aplicaciones Empresariales  
> **Versión**: 1.0.0  
> **Fecha**: Octubre 2025

---

## 📋 Descripción

**UTEC Space Manager** es una aplicación web completa para la gestión de espacios y reservas en la Universidad Tecnológica del Uruguay. El sistema permite:

- ✅ Autenticación segura con JWT y verificación de email (Gmail API)
- ✅ **Login con Google OAuth** (autenticación social)
- ✅ Gestión de usuarios con roles (Admin, Docente, Analista, Estudiante, Externo)
- ✅ Arquitectura separada por servicios (backend/frontend independientes)
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

# Configurar variables de entorno
cp .env.example .env
# Edita el archivo .env con tus credenciales

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

# Configurar variables de entorno
cp .env.example .env
# Edita backend/.env con tus credenciales

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

# Configurar IPs automáticamente (OBLIGATORIO si quieres acceso desde red)
npm run auto-set-ip

# Ejecutar en desarrollo local
npm run dev              # Solo localhost:5173

# Ejecutar accesible desde la red local  
npm run dev:network      # IP detectada automáticamente (ej: http://192.168.1.14:5173)

# Build de producción
npm run build
```

**El frontend estará disponible en:** 
- Local: `http://localhost:5173`
- Red: `http://[IP-DETECTADA]:5173` (ej: `http://192.168.1.14:5173`)

## 🔧 Configuración de IPs

**¿Cuándo configurar IPs?**
- ✅ **Primera vez** en el proyecto
- ✅ **Acceso desde red** (otros dispositivos)
- ✅ **Cambio de red WiFi** 
- ✅ **Desconexión/reconexión** de WiFi
- ✅ **Después de reiniciar** router/módemic

### **Opción 1: Detección automática (recomendado)**
```bash
# Detecta y configura automáticamente la mejor IP disponible
npm run auto-set-ip

# Interfaz específica (si tienes problemas de detección)
npm run set-wifi-ip          # Solo interfaz WiFi
npm run set-ethernet-ip      # Solo interfaz Ethernet
```

**Lo que hace automáticamente:**
- 🔍 Detecta tu IP real usando `os.networkInterfaces()`
- 🚫 Ignora adaptadores virtuales (VMware, WSL, VirtualBox)
- 📝 Actualiza `frontend/.env` y `backend/.env` simultáneamente
- 💾 Agrega comentarios con fecha/hora de configuración
- 🎯 Prioriza interfaces por confiabilidad (Ethernet > WiFi > otras)
- 🌐 Funciona en laptops, escritorios y servidores

### **Opción 2: Manual**
Editar directamente los archivos:
- `frontend/.env` → `VITE_API_URL` y `VITE_FRONTEND_URL`
- `backend/.env` → `FRONTEND_URL` (para CORS)

**Para configuración manual:** Borra los comentarios automáticos y edita las IPs directamente.

---

## 🚀 Flujos de Levantamiento

### 1. **Local Local** (Solo localhost)
```bash
# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Backend (Terminal 1)
cd backend
./mvnw spring-boot:run

# Frontend (Terminal 2)  
cd frontend
npm run dev
```

**Características:**
- ✅ Solo accesible desde `localhost`
- ✅ Frontend: `http://localhost:5173`
- ✅ Backend: `http://localhost:8080`
- ✅ Base de datos: PostgreSQL local o Docker solo para BD

### 2. **Local Red** (Accesible desde red local)
```bash
# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Configurar IPs automáticamente para acceso desde red  
npm run auto-set-ip

# Backend (Terminal 1)
cd backend
./mvnw spring-boot:run

# Frontend (Terminal 2) - Usa IP detectada automáticamente
cd frontend
npm run dev:network
```

**Características:**
- ✅ Accesible desde otros dispositivos en la red local
- ✅ Frontend: `http://192.168.x.x:5173` (IP detectada automáticamente)
- ✅ Backend: `http://192.168.x.x:8080`
- ✅ Configuración automática con `npm run auto-set-ip`
- ✅ Detección inteligente que ignora adaptadores virtuales

### 3. **Docker Local** (Todo en Docker, solo localhost)
```bash
# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
# IMPORTANTE: Cambiar DEV_MODE=dev en .env

# Levantar todos los servicios
docker-compose up -d
```

**Características:**
- ✅ Todo containerizado (PostgreSQL + Backend + Frontend)
- ✅ Solo accesible desde `localhost`
- ✅ Frontend: `http://localhost:5173`
- ✅ Backend: `http://localhost:8080`
- ✅ Base de datos: `localhost:5432`

### 4. **Docker Red** (Todo en Docker, accesible desde red)
```bash
# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
# IMPORTANTE: Cambiar DEV_MODE=dev:network en .env

# Levantar todos los servicios
docker-compose up -d
```

**Características:**
- ✅ Todo containerizado
- ✅ Accesible desde otros dispositivos en la red
- ✅ Frontend: `http://192.168.x.x:5173`
- ✅ Backend: `http://192.168.x.x:8080`
- ✅ Usa `DEV_MODE=dev:network` para habilitar acceso desde red

---

## 🔧 Configuración

### Arquitectura de Variables de Entorno

El proyecto utiliza una arquitectura **separada por servicio** con archivos `.env` optimizados:

```
Proyecto/
├── .env                  ← Docker Compose (solo BD + variables compartidas)
├── backend/.env          ← Backend (todas las variables del backend)
└── frontend/.env         ← Frontend (URLs configuradas manualmente)
```

**Configuración:**
- **Desarrollo local**: URLs configuradas manualmente en `frontend/.env` y `backend/.env`
- **Docker**: Docker Compose lee variables de cada archivo `.env` correspondiente

### Variables de Entorno por Servicio

#### 📄 `.env` (Raíz - Docker Compose)

```env
# Base de datos
POSTGRES_DB=utec_db
POSTGRES_USER=ut_user
POSTGRES_PASSWORD=tu_password_seguro

# Variables compartidas
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

#### 📄 `backend/.env` (Backend - Todas las Variables)

```env
# Base de datos
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/utec_db
SPRING_DATASOURCE_USERNAME=ut_user
SPRING_DATASOURCE_PASSWORD=tu_password

# Configuración Spring
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080

# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret

# JWT
JWT_SECRET=tu-secreto-super-seguro-256-bits
JWT_EXPIRATION=3600000
JWT_REFRESH_EXPIRATION=2592000000

# Gmail API
GMAIL_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=tu-client-secret
GMAIL_REFRESH_TOKEN=tu-refresh-token
GMAIL_FROM_EMAIL=tu-email@gmail.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

#### 📄 `frontend/.env` (Frontend - Configurado Manualmente)

Este archivo contiene las URLs de conexión configuradas manualmente:

```env
# URLs para desarrollo local - configurar manualmente con tu IP
VITE_API_URL=http://192.168.1.14:8080/api/v1
VITE_FRONTEND_URL=http://192.168.1.14:5173
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

**Scripts disponibles:**
- `npm run dev` - Modo localhost
- `npm run dev:network` - Modo red (accesible desde otros dispositivos)

**Nota:** Cambia manualmente las IPs en el archivo `.env` según tu red local para acceder desde otros dispositivos.

### 🔐 Configuración de Google OAuth

Para habilitar el login con Google, necesitas configurar OAuth 2.0:

1. **Ve a [Google Cloud Console](https://console.cloud.google.com/)**
2. Crea o selecciona un proyecto
3. **Habilita la API de Google+** (opcional pero recomendado)
4. Ve a **"APIs & Services" > "Credentials"**
5. Clic en **"Create Credentials" > "OAuth 2.0 Client ID"**
6. Configura:
   - **Application type:** Web application
   - **Authorized JavaScript origins:** `http://localhost:5173`
   - **Authorized redirect URIs:** `http://localhost:5173/auth/callback/google`
7. Copia el **Client ID** y **Client Secret**
8. Pégalos en tus archivos `.env` correspondientes

**Importante:** El `GOOGLE_CLIENT_ID` debe ser el mismo en todos los archivos `.env`.

### 📧 Configuración de Gmail API

Para el envío de emails de verificación, el sistema usa Gmail API en lugar de SMTP:

1. **Habilita Gmail API** en Google Cloud Console
2. **Crea credenciales OAuth 2.0** (Desktop application)
3. **Obtén el refresh token** usando el script de Python
4. **Configura las variables** en `backend/.env`:

```env
GMAIL_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=tu-client-secret
GMAIL_REFRESH_TOKEN=tu-refresh-token
GMAIL_FROM_EMAIL=tu-email@gmail.com
```

**📖 Documentación completa:** Ver sección de configuración en [backend/README.md](backend/README.md)

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

# Configurar IPs para desarrollo en red
npm run auto-set-ip

# Desarrollo
npm run dev              # Local (localhost)
npm run dev:network      # Red local (accesible desde otros dispositivos)

# Build
npm run build

# Preview
npm run preview

# Linter
npm run lint
```

### Scripts de configuración de IP (Desde raíz)

```bash
# Configurar IPs automáticamente
npm run auto-set-ip

# Configurar interfaz específica  
npm run set-wifi-ip          # Solo WiFi
npm run set-ethernet-ip      # Solo Ethernet
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
