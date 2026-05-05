# 🏢 UTEC Space Manager

Sistema web completo para la gestión de reservas de espacios en la Universidad Tecnológica del Uruguay (UTEC).

## 📋 Descripción

**UTEC Space Manager** es una aplicación web diseñada para facilitar la gestión y reserva de espacios (salones, laboratorios, auditorios) dentro de la universidad. Permite a docentes, estudiantes y personal administrativo reservar espacios de manera eficiente y organizada.

## ✨ Características

- 🔐 **Autenticación segura** - JWT con verificación de email y login con Google OAuth
- 👥 **Gestión de usuarios** - Sistema de roles (Admin, Analista, Docente, Estudiante, Externo)
- 🏛️ **Gestión de espacios** - CRUD completo de espacios con inventario asociado
- 📅 **Sistema de reservas** - Creación, aprobación y gestión de reservas con control de solapamientos
- 📊 **Calendario interactivo** - Vista de calendario para visualizar reservas
- 📦 **Gestión de inventario** - Control de elementos e inventario por espacio
- 📈 **Estadísticas y reportes** - Dashboard con métricas y reportes exportables
- 🎨 **Interfaz moderna** - UI/UX diseñada con Tailwind CSS y shadcn/ui
- 🐳 **Containerización** - Despliegue fácil con Docker Compose

## 🛠️ Stack Tecnológico

### Backend
- **Spring Boot** 3.5.6
- **PostgreSQL** 15
- **JPA/Hibernate**
- **Liquibase** (migraciones)
- **Spring Security** + JWT
- **Maven**

### Frontend
- **React** 19 + **TypeScript**
- **Vite**
- **Tailwind CSS**
- **shadcn/ui**
- **React Router**

### Infraestructura (Docker Compose)
- **PostgreSQL** 15
- **Redis** 7 (caché de aplicación)
- **MinIO** (almacenamiento de objetos / imágenes de espacios; configurable con `MINIO_ENABLED`)

### DevOps
- **Docker** + **Docker Compose**

## 📦 Requisitos Previos

- **Java** 21 o superior
- **Node.js** 20 o superior
- **PostgreSQL** 15 o superior (opcional si usas Docker)
- **Redis** 7 o superior (requerido por el backend para caché; incluido en `docker compose`)
- **Docker** y **Docker Compose** (opcional, recomendado para levantar DB + Redis + MinIO + apps)

## 🚀 Instalación Rápida

### Con Docker (Recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/MathiasPena/USM_UTEC
cd USM_UTEC

# 2. Crear archivos .env con tus credenciales
# Ver sección de configuración más abajo

# 3. Levantar todos los servicios
docker compose up -d

# 4. Ver logs
docker compose logs -f
```

**¡Listo!** Accede a:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api/v1
- MinIO consola (si usas el stack completo): http://localhost:9001

### Sin Docker (Instalación Manual)

```bash
# 1. Clonar el repositorio
git clone https://github.com/MathiasPena/USM_UTEC
cd USM_UTEC

# 2. Configurar base de datos PostgreSQL
sudo -u postgres psql
CREATE USER ut_user WITH PASSWORD 'tu_password';
CREATE DATABASE utec_db OWNER ut_user;
GRANT ALL PRIVILEGES ON DATABASE utec_db TO ut_user;
\q

# 3. Configurar variables de entorno
# Crear backend/.env y frontend/.env (ver configuración)
# Tener Redis en localhost:6379 (o ajustar REDIS_HOST/REDIS_PORT en backend)

# 4. Instalar dependencias del backend
cd backend
./mvnw clean install

# 5. Instalar dependencias del frontend
cd ../frontend
npm install

# 6. Ejecutar backend (Terminal 1)
cd ../backend
./mvnw spring-boot:run

# 7. Ejecutar frontend (Terminal 2)
cd frontend
npm run dev
```

## ⚙️ Configuración

### Variables de Entorno

#### `backend/.env` (Backend)

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/utec_db
SPRING_DATASOURCE_USERNAME=ut_user
SPRING_DATASOURCE_PASSWORD=tu_password
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080
JWT_SECRET=tu-secreto-super-seguro-256-bits-minimo-32-caracteres
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GMAIL_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=tu-client-secret
GMAIL_REFRESH_TOKEN=tu-refresh-token
GMAIL_FROM_EMAIL=tu-email@gmail.com
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8080
```

#### `frontend/.env` (Frontend)

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_FRONTEND_URL=http://localhost:5173
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

#### `.env` (Raíz - Docker Compose)

```env
POSTGRES_DB=utec_db
POSTGRES_USER=ut_user
POSTGRES_PASSWORD=tu_password
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

> **Nota:** Para configuración avanzada (Google OAuth, Gmail API, etc.) consulta el [Manual de Instalación](documentation/MANUAL_DE_INSTALACION.md).

## 📚 Uso

1. **Acceder al sistema**: Abre http://localhost:5173 en tu navegador
2. **Registrarse**: Crea una nueva cuenta o inicia sesión con Google
3. **Verificar email**: Verifica tu cuenta con el código enviado por email
4. **Explorar**: Navega por espacios, crea reservas, gestiona inventario

Para más detalles, consulta el [Manual de Usuario](documentation/MANUAL_DE_USUARIO.md).

## 🏗️ Estructura del Proyecto

```
USM_UTEC/
├── backend/              # API REST (Spring Boot)
│   ├── src/
│   └── pom.xml
├── frontend/             # Aplicación React
│   ├── src/
│   └── package.json
├── documentation/        # Manuales y documentación técnica
├── docker-compose.yml    # Orquestación Docker
└── README.md
```

## 🧪 Testing

### Backend
```bash
cd backend
./mvnw test
```

### Frontend
```bash
cd frontend
npm run lint
```

## 📖 Documentación

- **[Manual de Usuario](documentation/MANUAL_DE_USUARIO.md)** - Guía completa para usuarios finales
- **[Manual de Instalación](documentation/MANUAL_DE_INSTALACION.md)** - Guía técnica detallada
- **[Estructura del Proyecto](documentation/PROJECT_STRUCTURE.md)** - Documentación de la arquitectura

## 🔧 Comandos Útiles

### Docker
```bash
docker compose up -d          # Levantar servicios
docker compose down           # Detener servicios
docker compose logs -f        # Ver logs
docker compose build          # Reconstruir imágenes
```

### Backend
```bash
cd backend
./mvnw clean install          # Compilar
./mvnw spring-boot:run        # Ejecutar
./mvnw test                   # Ejecutar tests
```

### Frontend
```bash
cd frontend
npm install                   # Instalar dependencias
npm run dev                   # Modo desarrollo
npm run build                 # Build producción
```

## 👥 Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| **ADMIN** | Administrador completo del sistema |
| **ANALISTA** | Gestión de reservas y análisis |
| **MANTENIMIENTO** | Gestión de espacios e inventario |
| **DOCENTE** | Crear y gestionar reservas |
| **ESTUDIANTE** | Ver y solicitar reservas |
| **EXTERNO** | Acceso limitado para eventos |

## 🔐 Seguridad

- Autenticación basada en JWT
- Verificación de email requerida
- Roles y permisos granulares
- Protección CORS configurada
- Validación de datos en frontend y backend

## 📄 Licencia

Este proyecto es parte de un trabajo académico para la Universidad Tecnológica del Uruguay (UTEC).

## 👨‍💻 Autor de README

**Mathias Pena**  
Universidad Tecnológica del Uruguay (UTEC)  
Proyecto Final

## 🔗 Enlaces Útiles

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Docker Documentation](https://docs.docker.com/)

---

**Última actualización:** Mayo 2026
