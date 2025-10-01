# 📁 Estructura del Proyecto - UTEC Space Manager

Guía completa de la estructura, archivos de configuración y propósito de cada componente del proyecto.

---

## 📋 Tabla de Contenidos

- [Archivos de Configuración Raíz](#archivos-de-configuración-raíz)
- [Configuración de Git](#configuración-de-git)
- [Configuración de Docker](#configuración-de-docker)
- [Backend - Spring Boot](#backend---spring-boot)
- [Frontend - React + Vite](#frontend---react--vite)
- [Archivos de Documentación](#archivos-de-documentación)

---

## 🔧 Archivos de Configuración Raíz

### `.gitignore`
**Ubicación:** Raíz del proyecto  
**Propósito:** Define qué archivos y directorios Git debe ignorar
- Archivos sensibles (`.env`, secretos)
- Directorios de build (`target/`, `build/`, `node_modules/`)
- Archivos del IDE
- Logs y archivos temporales

### `.gitguardian.yaml`
**Ubicación:** Raíz del proyecto  
**Propósito:** Configuración de GitGuardian para detectar secretos
- Excluye archivos de test del escaneo
- Define patrones de secretos a ignorar
- Protege contra exposición accidental de credenciales
```yaml
paths-ignore:
  - "**/src/test/**"
  - "**/*test*.properties"
```

### `.gitleaksignore`
**Ubicación:** Raíz del proyecto  
**Propósito:** Configuración de GitLeaks (alternativa a GitGuardian)
- Ignora secretos conocidos de testing
- Lista de archivos con secretos de desarrollo
```
backend/src/test/resources/application-test.properties:jwt.secret
backend/src/test/**
```

### `.gitattributes`
**Ubicación:** Raíz del proyecto  
**Propósito:** Configuración de atributos de Git
- Normalización de line endings
- Configuración de archivos binarios
- Marcado de archivos generados

### `docker-compose.yml`
**Ubicación:** Raíz del proyecto  
**Propósito:** Orquestación de contenedores Docker
- Define servicios: backend, frontend, base de datos
- Configuración de redes y volúmenes
- Variables de entorno
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
  postgres:
    image: postgres:15
```

### `README.md`
**Ubicación:** Raíz del proyecto  
**Propósito:** Documentación principal del proyecto
- Descripción general
- Instrucciones de instalación
- Comandos básicos
- Tecnologías utilizadas

### `PROJECT_STRUCTURE.md`
**Ubicación:** Raíz del proyecto  
**Propósito:** Este archivo - Documentación de la estructura

---

## 🔐 Configuración de Git

### Archivos de Seguridad

| Archivo | Ubicación | Propósito |
|---------|-----------|-----------|
| `.gitignore` | Raíz | Excluir archivos del control de versiones |
| `.gitguardian.yaml` | Raíz | Configurar escaneo de secretos |
| `.gitleaksignore` | Raíz | Ignorar falsos positivos de secretos |
| `.gitattributes` | Raíz | Normalización de archivos |

### Archivos NO versionados (en `.gitignore`)

```
❌ .env                          # Variables de entorno locales
❌ .env.local                    # Configuración local de desarrollo
❌ .env.production.local         # Secretos de producción
❌ backend/target/               # Archivos compilados de Java
❌ frontend/node_modules/        # Dependencias de Node.js
❌ frontend/dist/                # Build de producción del frontend
❌ *.log                         # Archivos de log
```

---

## 🐳 Configuración de Docker

### `docker-compose.yml`
**Ubicación:** Raíz del proyecto  
**Servicios definidos:**

1. **Backend (Spring Boot)**
   - Puerto: 8080
   - Base de imagen: `eclipse-temurin:21-jdk`
   - Dockerfile: `backend/Dockerfile`

2. **Frontend (React + Vite)**
   - Puerto: 5173
   - Base de imagen: `node:20-alpine`
   - Dockerfile: `frontend/Dockerfile`

3. **PostgreSQL**
   - Puerto: 5432
   - Imagen: `postgres:15`
   - Volumen persistente para datos

### `backend/Dockerfile`
**Ubicación:** `backend/Dockerfile`  
**Propósito:** Construcción de imagen Docker del backend
```dockerfile
FROM eclipse-temurin:21-jdk
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### `frontend/Dockerfile`
**Ubicación:** `frontend/Dockerfile`  
**Propósito:** Construcción de imagen Docker del frontend
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
```

---

## ☕ Backend - Spring Boot

### Estructura de Directorios

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/utec/backend/
│   │   │   ├── controller/         # Controladores REST
│   │   │   ├── service/            # Lógica de negocio
│   │   │   ├── repository/         # Acceso a datos
│   │   │   ├── model/entity/       # Entidades JPA
│   │   │   ├── dto/                # Data Transfer Objects
│   │   │   ├── security/           # Configuración de seguridad
│   │   │   │   ├── auth/           # Autenticación
│   │   │   │   ├── jwt/            # JWT tokens
│   │   │   │   └── config/         # Configuración de Spring Security
│   │   │   └── common/             # Utilidades y excepciones
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application-dev.properties
│   │       ├── application-prod.properties
│   │       └── db/changelog/       # Liquibase migrations
│   └── test/
│       ├── java/com/utec/backend/
│       │   ├── controller/         # Tests de integración
│       │   ├── service/            # Tests unitarios
│       │   ├── security/           # Tests de seguridad
│       │   └── config/             # Configuración de tests
│       └── resources/
│           └── application-test.properties
├── target/                         # Archivos compilados (ignorado)
├── pom.xml                         # Configuración de Maven
└── Dockerfile                      # Imagen Docker
```

### Archivos de Configuración

#### `pom.xml`
**Ubicación:** `backend/pom.xml`  
**Propósito:** Gestión de dependencias Maven
- Spring Boot 3.5.6
- Java 21
- PostgreSQL, H2 (tests)
- JWT (jjwt)
- Liquibase
- Lombok

#### `application.properties`
**Ubicación:** `backend/src/main/resources/application.properties`  
**Propósito:** Configuración principal de Spring Boot
```properties
spring.application.name=backend
spring.profiles.active=${SPRING_PROFILES_ACTIVE:dev}
```

#### `application-dev.properties`
**Ubicación:** `backend/src/main/resources/application-dev.properties`  
**Propósito:** Configuración de desarrollo
- Base de datos local
- Logging detallado
- CORS permisivo

#### `application-prod.properties`
**Ubicación:** `backend/src/main/resources/application-prod.properties`  
**Propósito:** Configuración de producción
- Variables de entorno
- Seguridad reforzada
- Logging optimizado

#### `application-test.properties`
**Ubicación:** `backend/src/test/resources/application-test.properties`  
**Propósito:** Configuración para tests
- Base de datos H2 en memoria
- Secretos de prueba (NO para producción)
- Email deshabilitado
```properties
# ⚠️ SOLO PARA TESTING
jwt.secret=dGVzdC1zZWNyZXQ...  # Secreto de prueba
```

### Migraciones de Base de Datos

**Ubicación:** `backend/src/main/resources/db/changelog/`  
**Herramienta:** Liquibase

```
db/changelog/
├── db.changelog-master.xml      # Archivo maestro
├── cambiosdb/
│   ├── 001-create-usuario.xml
│   ├── 002-create-salon.xml
│   └── 003-create-reserva.xml
└── insertsdb/
    └── 001-insert-initial-data.xml
```

---

## ⚛️ Frontend - React + Vite

### Estructura de Directorios

```
frontend/
├── public/                      # Archivos estáticos
├── src/
│   ├── app/                     # Páginas (routing)
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── calendar/
│   │   ├── reservations/
│   │   ├── rooms/
│   │   ├── statistics/
│   │   └── settings/
│   ├── components/              # Componentes reutilizables
│   │   ├── ui/                  # Componentes UI base
│   │   ├── layouts/             # Layouts de página
│   │   ├── auth/                # Componentes de autenticación
│   │   └── [feature]/           # Componentes por feature
│   ├── contexts/                # React Contexts
│   │   └── AuthContext.tsx
│   ├── hooks/                   # Custom hooks
│   ├── lib/                     # Librerías y utilidades
│   │   ├── api.ts               # Cliente API
│   │   ├── utils.ts             # Utilidades
│   │   ├── config/              # Configuración
│   │   └── types/               # TypeScript types
│   ├── assets/                  # Imágenes, fuentes
│   ├── data/                    # Datos mock
│   ├── App.tsx                  # Componente raíz
│   ├── main.tsx                 # Entry point
│   └── index.css                # Estilos globales
├── node_modules/                # Dependencias (ignorado)
├── dist/                        # Build de producción (ignorado)
├── package.json                 # Dependencias npm
├── package-lock.json            # Lock de versiones
├── vite.config.ts               # Configuración de Vite
├── tsconfig.json                # Configuración de TypeScript
├── tailwind.config.js           # Configuración de Tailwind CSS
├── components.json              # Configuración de shadcn/ui
└── Dockerfile                   # Imagen Docker
```

### Archivos de Configuración

#### `package.json`
**Ubicación:** `frontend/package.json`  
**Propósito:** Gestión de dependencias npm
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router

```json
{
  "name": "frontend",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

#### `vite.config.ts`
**Ubicación:** `frontend/vite.config.ts`  
**Propósito:** Configuración de Vite (build tool)
- Aliases de importación
- Plugins de React
- Configuración de proxy
- Optimización de build

#### `tsconfig.json`
**Ubicación:** `frontend/tsconfig.json`  
**Propósito:** Configuración de TypeScript
- Opciones del compilador
- Path aliases
- Tipos incluidos

#### `tailwind.config.js`
**Ubicación:** `frontend/tailwind.config.js`  
**Propósito:** Configuración de Tailwind CSS
- Tema personalizado
- Colores
- Plugins

#### `components.json`
**Ubicación:** `frontend/components.json`  
**Propósito:** Configuración de shadcn/ui
- Estilo de componentes
- Aliases de importación
- Utilidades CSS

---

## 📚 Archivos de Documentación

### Raíz del Proyecto

| Archivo | Propósito |
|---------|-----------|
| `README.md` | Documentación principal |
| `PROJECT_STRUCTURE.md` | Este archivo - Estructura del proyecto |

### Backend

| Archivo | Propósito |
|---------|-----------|
| `backend/README.md` | Documentación específica del backend |
| `backend/src/test/README.md` | Guía completa de testing |
| `backend/HELP.md` | Ayuda de Spring Boot |

### Frontend

| Archivo | Propósito |
|---------|-----------|
| `frontend/README.md` | Documentación específica del frontend |

---

## 🚀 Comandos Principales

### Docker

```bash
# Levantar todos los servicios
docker-compose up

# Levantar en background
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Reconstruir imágenes
docker-compose build
```

### Backend (Maven)

```bash
cd backend

# Compilar proyecto
./mvnw clean install

# Ejecutar aplicación
./mvnw spring-boot:run

# Ejecutar tests
./mvnw test

# Ejecutar test específico
./mvnw test -Dtest=NombreDelTest

# Ejecutar con perfil específico
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Limpiar y compilar sin tests
./mvnw clean install -DskipTests
```

### Frontend (npm)

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build de producción
npm run build

# Preview de producción
npm run preview

# Linter
npm run lint
```

---

## 🔍 Variables de Entorno

### Backend

Crear archivo `.env` en la raíz o definir variables de entorno:

```env
# Base de datos
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/utec_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=tu_password

# JWT
JWT_SECRET=tu-secreto-super-seguro-de-256-bits
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

### Frontend

Crear archivo `.env` en `frontend/`:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_APP_NAME=UTEC Space Manager
```

---

## ⚠️ Archivos Sensibles

**NUNCA commitear:**

- ❌ `.env` - Variables de entorno locales
- ❌ `.env.local` - Configuración local
- ❌ `.env.production.local` - Secretos de producción
- ❌ Cualquier archivo con credenciales reales

**Sí se pueden commitear (son de prueba):**

- ✅ `application-test.properties` - Secretos de prueba marcados
- ✅ `.gitguardian.yaml` - Configuración de seguridad
- ✅ `.gitleaksignore` - Configuración de GitLeaks

---

## 📊 Resumen de Tecnologías

### Backend
- **Framework:** Spring Boot 3.5.6
- **Lenguaje:** Java 21
- **Base de datos:** PostgreSQL 15
- **ORM:** JPA/Hibernate
- **Migraciones:** Liquibase
- **Seguridad:** Spring Security + JWT
- **Build:** Maven
- **Tests:** JUnit 5 + Mockito + Spring Boot Testcontainers
- **Test Mocking:** @MockitoBean (Spring Boot 3.4+)

### Frontend
- **Framework:** React 18
- **Lenguaje:** TypeScript
- **Build tool:** Vite
- **Routing:** React Router
- **Estilos:** Tailwind CSS
- **Componentes UI:** shadcn/ui
- **Gestión de estado:** Context API
- **Package manager:** npm

### DevOps
- **Contenedores:** Docker + Docker Compose
- **CI/CD:** GitHub Actions (futuro)
- **Seguridad:** GitGuardian + GitLeaks

---

**Última actualización:** Octubre 2025  
**Mantenido por:** Equipo de Desarrollo UTEC Space Manager

