# 📘 MANUAL DE INSTALACIÓN Y CONFIGURACIÓN
# UTEC Space Manager
# Sistema de Gestión de Espacios y Reservas

---

**Versión del Manual:** 1.0.1  
**Versión del Sistema:** 1.0.0  
**Fecha de Publicación:** Mayo 2026  
**Para:** Personal Técnico de UTEC  
**Estándar:** ISO/IEC/IEEE 15289:2019

---

## 📋 TABLA DE CONTENIDOS

1. [Propósito y Alcance](#1-propósito-y-alcance)
2. [Referencias](#2-referencias)
3. [Requisitos Previos](#3-requisitos-previos)
4. [Paquetes de Entrega](#4-paquetes-de-entrega)
5. [Procedimiento de Instalación](#5-procedimiento-de-instalación)
6. [Configuración del Sistema](#6-configuración-del-sistema)
7. [Verificación Postinstalación](#7-verificación-postinstalación)
8. [Desinstalación y Reinstalación](#8-desinstalación-y-reinstalación)
9. [Solución de Problemas](#9-solución-de-problemas)
10. [Registro de Cambios y Versiones](#10-registro-de-cambios-y-versiones)
11. [Anexos](#11-anexos)

---

# 1. PROPÓSITO Y ALCANCE

## 1.1 Propósito

Este manual técnico tiene como propósito guiar al personal técnico de UTEC en la **instalación, configuración, verificación y mantenimiento** del sistema **UTEC Space Manager (USM)**.

El manual proporciona instrucciones detalladas paso a paso para:

- Instalar el sistema en entornos locales y de producción
- Configurar todas las dependencias y servicios
- Verificar que la instalación fue exitosa
- Solucionar problemas comunes de instalación
- Mantener y actualizar el sistema

## 1.2 Nombre del Sistema

**UTEC Space Manager (USM)**

## 1.3 Versión Actual

**Versión del Sistema:** 1.0.0  
**Versión del Manual:** 1.0.0

## 1.4 Entorno de Instalación

El sistema está diseñado para instalarse en los siguientes entornos:

### Entornos Soportados

1. **Desarrollo Local**
   - Computadoras de desarrollo
   - Instalación manual de componentes
   - Configuración para acceso local

2. **Desarrollo en Red Local**
   - Acceso desde múltiples dispositivos en la red
   - Configuración de IPs de red
   - Instalación manual o Docker

3. **Producción con Docker**
   - Entornos de producción containerizados
   - Orquestación con Docker Compose
   - Configuración de red para acceso externo

4. **Producción Manual**
   - Instalación tradicional sin contenedores
   - Servidores dedicados
   - Configuración de servicios del sistema operativo

### Sistemas Operativos Soportados

- **Linux**: Ubuntu 20.04+, Debian 11+, CentOS 8+, o distribuciones equivalentes
- **macOS**: macOS 11 (Big Sur) o superior
- **Windows**: Windows 10/11 o Windows Server 2019+

## 1.5 Objetivo del Manual

Este manual está dirigido a **personal técnico** de UTEC que necesita:

- Instalar el sistema desde cero
- Configurar el entorno de desarrollo o producción
- Entender la arquitectura técnica del sistema
- Resolver problemas de instalación y configuración
- Mantener y actualizar el sistema

## 1.6 Público Objetivo

- Administradores de sistemas
- Desarrolladores técnicos
- Personal de TI de UTEC
- Personal con conocimientos de:
  - Docker y contenedores
  - Java y Spring Boot
  - Node.js y React
  - PostgreSQL
  - Administración de sistemas Linux/Windows

## 1.7 Límites del Manual

### Lo que cubre este manual:

- ✅ Instalación completa del sistema
- ✅ Configuración de variables de entorno
- ✅ Configuración de servicios (Google OAuth, Gmail API)
- ✅ Configuración de base de datos
- ✅ Verificación de instalación
- ✅ Solución de problemas técnicos comunes
- ✅ Procedimientos de desinstalación

### Lo que NO cubre este manual:

- ❌ Uso del sistema (ver Manual de Usuario)
- ❌ Desarrollo de nuevas funcionalidades
- ❌ Arquitectura del código fuente (ver documentación técnica)
- ❌ Configuración avanzada de servicios externos (Google Cloud Platform)
- ❌ Configuración de infraestructura cloud (AWS, Azure, etc.)

---

# 2. REFERENCIAS

## 2.1 Documentos del Proyecto

| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| **README.md** | Raíz del proyecto | Documentación general y inicio rápido |
| **PROJECT_STRUCTURE.md** | `documentation/` | Estructura completa del proyecto |
| **MANUAL_DE_USUARIO.md** | `documentation/` | Manual de usuario completo |
| **ROLES_AND_PERMISSIONS.md** | `documentation/` | Documentación de roles y permisos |
| **DESIGN_SYSTEM.md** | `documentation/` | Sistema de diseño UI/UX |
| **backend/README.md** | `backend/README.md` | Documentación específica del backend |
| **frontend/README.md** | `frontend/README.md` | Documentación específica del frontend |

## 2.2 Documentación de Tecnologías

### Backend

- **Spring Boot**: [https://spring.io/projects/spring-boot](https://spring.io/projects/spring-boot)
- **Spring Security**: [https://spring.io/projects/spring-security](https://spring.io/projects/spring-security)
- **Liquibase**: [https://www.liquibase.org/documentation](https://www.liquibase.org/documentation)
- **PostgreSQL**: [https://www.postgresql.org/docs/15/](https://www.postgresql.org/docs/15/)
- **Maven**: [https://maven.apache.org/guides/](https://maven.apache.org/guides/)
- **Java JDK 21**: [https://docs.oracle.com/en/java/javase/21/](https://docs.oracle.com/en/java/javase/21/)

### Frontend

- **React**: [https://react.dev/](https://react.dev/)
- **TypeScript**: [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)
- **Vite**: [https://vite.dev/](https://vite.dev/)
- **Tailwind CSS**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Node.js**: [https://nodejs.org/docs/](https://nodejs.org/docs/)

### Docker

- **Docker**: [https://docs.docker.com/](https://docs.docker.com/)
- **Docker Compose**: [https://docs.docker.com/compose/](https://docs.docker.com/compose/)

## 2.3 Documentos de Configuración

| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| **docker-compose.yml** | Raíz | Configuración de orquestación Docker |
| **backend/Dockerfile** | `backend/Dockerfile` | Imagen Docker del backend |
| **frontend/Dockerfile** | `frontend/Dockerfile` | Imagen Docker del frontend |
| **backend/pom.xml** | `backend/pom.xml` | Dependencias Maven |
| **frontend/package.json** | `frontend/package.json` | Dependencias npm |
| **application.properties** | `backend/src/main/resources/` | Configuración Spring Boot |

## 2.4 Estándares y Normativas

- **ISO/IEC/IEEE 15289:2019**: Procesos de ingeniería de sistemas y software - Contenido de documentación de la información del sistema y del software
- **UTEC**: Políticas y estándares de la Universidad Tecnológica del Uruguay

---

# 3. REQUISITOS PREVIOS

## 3.1 Requisitos de Hardware

### Mínimos (Desarrollo Local)

| Componente | Especificación Mínima |
|------------|----------------------|
| **Procesador** | 2 núcleos, 2.0 GHz o superior |
| **Memoria RAM** | 4 GB |
| **Espacio en Disco** | 10 GB libres |
| **Conexión de Red** | Conexión a internet para descargar dependencias |

### Recomendados (Desarrollo)

| Componente | Especificación Recomendada |
|------------|---------------------------|
| **Procesador** | 4 núcleos, 2.5 GHz o superior |
| **Memoria RAM** | 8 GB o superior |
| **Espacio en Disco** | 20 GB libres (SSD preferible) |
| **Conexión de Red** | Conexión estable a internet |

### Producción (Servidor)

| Componente | Especificación Mínima Producción |
|------------|----------------------------------|
| **Procesador** | 4 núcleos, 2.5 GHz o superior |
| **Memoria RAM** | 8 GB mínimo, 16 GB recomendado |
| **Espacio en Disco** | 50 GB libres (SSD recomendado) |
| **Conexión de Red** | Conexión estable de alta velocidad |
| **Respaldo** | Sistema de respaldo configurado |

## 3.2 Requisitos de Software

### Software Base Requerido

#### 1. Java Development Kit (JDK)

- **Versión requerida**: JDK 21 o superior
- **Distribución recomendada**: Eclipse Temurin (OpenJDK) o Oracle JDK
- **Descarga**: 
  - OpenJDK: [https://adoptium.net/](https://adoptium.net/)
  - Oracle JDK: [https://www.oracle.com/java/technologies/downloads/](https://www.oracle.com/java/technologies/downloads/)

**Verificación de instalación:**
```bash
java -version
# Debe mostrar: openjdk version "21" o superior
```

**Instalación en Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install openjdk-21-jdk
```

**Instalación en macOS:**
```bash
brew install openjdk@21
```

**Instalación en Windows:**
- Descargar instalador desde [Adoptium](https://adoptium.net/)
- Ejecutar instalador y seguir instrucciones
- Configurar variable de entorno JAVA_HOME

#### 2. Node.js y npm

- **Versión requerida**: Node.js 20.x o superior
- **npm**: Incluido con Node.js
- **Descarga**: [https://nodejs.org/](https://nodejs.org/)

**Verificación de instalación:**
```bash
node --version
# Debe mostrar: v20.x.x o superior

npm --version
# Debe mostrar: 10.x.x o superior
```

**Instalación en Linux:**
```bash
# Usando NodeSource (recomendado)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**Instalación en macOS:**
```bash
brew install node@20
```

**Instalación en Windows:**
- Descargar instalador desde [nodejs.org](https://nodejs.org/)
- Ejecutar instalador y seguir instrucciones

#### 3. PostgreSQL

- **Versión requerida**: PostgreSQL 15 o superior
- **Descarga**: [https://www.postgresql.org/download/](https://www.postgresql.org/download/)

**Verificación de instalación:**
```bash
psql --version
# Debe mostrar: psql (PostgreSQL) 15.x o superior
```

**Instalación en Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql-15 postgresql-contrib-15
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Instalación en macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Instalación en Windows:**
- Descargar instalador desde [postgresql.org](https://www.postgresql.org/download/windows/)
- Ejecutar instalador y seguir instrucciones
- Nota: Recordar la contraseña del usuario postgres

#### 4. Docker y Docker Compose (Opcional pero recomendado)

- **Docker**: Versión 20.10 o superior
- **Docker Compose**: Versión 2.0 o superior (incluido en Docker Desktop)

**Descarga Docker:**
- Linux: [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)
- macOS/Windows: [Docker Desktop](https://www.docker.com/products/docker-desktop/)

**Verificación de instalación:**
```bash
docker --version
# Debe mostrar: Docker version 20.10.x o superior

docker compose version
# Debe mostrar: Docker Compose version v2.x.x o superior
```

**Instalación en Linux (Ubuntu/Debian):**
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Reiniciar sesión o ejecutar:
newgrp docker

# Docker Compose viene incluido en Docker 20.10+
```

#### 5. Maven (Incluido con Maven Wrapper)

El proyecto incluye Maven Wrapper (`mvnw`), por lo que no es necesario instalar Maven por separado. Si desea instalar Maven globalmente:

**Instalación en Linux:**
```bash
sudo apt install maven
```

**Instalación en macOS:**
```bash
brew install maven
```

## 3.3 Accesos y Permisos Requeridos

### Usuarios del Sistema Operativo

Para instalación local necesita:

- **Usuario con permisos de sudo** (Linux/macOS) o **Administrador** (Windows)
  - Para instalar paquetes del sistema
  - Para configurar servicios del sistema

- **Usuario con acceso a base de datos PostgreSQL**
  - Para crear base de datos
  - Para ejecutar migraciones

### Credenciales Necesarias

Antes de la instalación, debe tener disponibles:

1. **Credenciales de Base de Datos**
   - Usuario de PostgreSQL (puede crear uno nuevo)
   - Contraseña de PostgreSQL
   - Nombre de base de datos deseado

2. **Credenciales de Google Cloud Platform** (si usa Google OAuth/Gmail API)
   - Client ID de OAuth 2.0
   - Client Secret de OAuth 2.0
   - Refresh Token de Gmail API (si usa Gmail)

3. **Secreto JWT**
   - Generar un secreto seguro de 256 bits para JWT

### Permisos de Red

- **Puertos libres**:
  - `5173`: Frontend (desarrollo)
  - `8080`: Backend
  - `5432`: PostgreSQL

- **Conexión a Internet**:
  - Para descargar dependencias
  - Para conectar con Google OAuth (si está habilitado)

### Permisos de Archivos

- **Permisos de escritura**:
  - En el directorio del proyecto
  - Para crear archivos `.env`
  - Para logs (`backend/logs/`)

- **Permisos de ejecución** (Linux/macOS):
  - En scripts (`mvnw`, scripts de configuración)

## 3.4 Configuraciones Iniciales del Sistema Operativo

### Linux

#### Configurar límites del sistema (opcional)

Para mejorar el rendimiento, puede configurar límites de archivos abiertos:

```bash
# Editar /etc/security/limits.conf
sudo nano /etc/security/limits.conf

# Agregar:
* soft nofile 65536
* hard nofile 65536

# Reiniciar sesión para aplicar
```

#### Configurar variables de entorno del sistema

Agregar a `~/.bashrc` o `~/.zshrc`:

```bash
# Java
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

# Node.js (si se instaló manualmente)
export PATH=/usr/local/bin/node:$PATH

# PostgreSQL (si es necesario)
export PATH=/usr/lib/postgresql/15/bin:$PATH
```

### macOS

#### Configurar variables de entorno

Agregar a `~/.zshrc` o `~/.bash_profile`:

```bash
# Java
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
export PATH=$JAVA_HOME/bin:$PATH

# Node.js
export PATH=/usr/local/bin:$PATH
```

### Windows

#### Variables de entorno del sistema

1. Abrir "Variables de entorno del sistema"
2. Agregar variables:
   - `JAVA_HOME`: Ruta al JDK 21
   - `PATH`: Incluir `%JAVA_HOME%\bin`
   - `NODE_HOME`: Ruta a Node.js (si aplica)

---

# 4. PAQUETES DE ENTREGA

## 4.1 Archivos y Componentes Entregados

El sistema se entrega como código fuente completo organizado en la siguiente estructura:

### Estructura del Paquete

```
UTEC-Space-Manager/
├── backend/                    # Código fuente del backend (Spring Boot)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/          # Código fuente Java
│   │   │   └── resources/     # Configuraciones y migraciones
│   │   └── test/              # Tests unitarios e integración
│   ├── pom.xml                # Dependencias Maven
│   ├── mvnw                   # Maven Wrapper (Linux/macOS)
│   ├── mvnw.cmd               # Maven Wrapper (Windows)
│   └── Dockerfile             # Imagen Docker del backend
│
├── frontend/                  # Código fuente del frontend (React)
│   ├── src/                   # Código fuente TypeScript/React
│   ├── public/                # Archivos estáticos
│   ├── package.json           # Dependencias npm
│   ├── package-lock.json      # Lock de versiones
│   ├── vite.config.ts         # Configuración Vite
│   └── Dockerfile             # Imagen Docker del frontend
│
├── scripts/                   # Scripts de configuración
│   ├── SetIP-Linux.sh         # Configurar IPs (Linux)
│   ├── SetIP-Windows.ps1      # Configurar IPs (Windows)
│   └── RUN-SetIP-Windows.bat  # Configurar IPs (Windows)
│
├── docker-compose.yml         # Orquestación Docker
├── docker-compose.hub.yml     # Docker Compose para Docker Hub
│
├── .gitignore                 # Archivos ignorados por Git
├── .gitguardian.yaml          # Configuración GitGuardian
├── .gitleaksignore           # Configuración GitLeaks
│
├── README.md                  # Documentación general
│
└── documentation/             # Manuales y documentación técnica
    ├── PROJECT_STRUCTURE.md   # Estructura del proyecto
    ├── ROLES_AND_PERMISSIONS.md
    ├── DESIGN_SYSTEM.md
    ├── MANUAL_DE_USUARIO.md
    ├── MANUAL_DE_INSTALACION.md  # Este manual
    ├── MANUAL_RECOMENDACIONES.md
    └── SISTEMA_RECOMENDACIONES.md
```

## 4.2 Versiones y Checksums

### Versiones de Componentes Principales

| Componente | Versión | Ubicación/Referencia |
|------------|---------|----------------------|
| **Sistema** | 1.0.0 | `README.md` |
| **Backend (Spring Boot)** | 3.5.6 | `backend/pom.xml` |
| **Frontend (React)** | 19.1.1 | `frontend/package.json` |
| **Java JDK** | 21 | `backend/pom.xml`, `Dockerfile` |
| **Node.js** | 20 | `frontend/Dockerfile` |
| **PostgreSQL** | 15 | `docker-compose.yml` |
| **Docker** | 20.10+ | Requisito |
| **Maven** | 3.9.6 | `backend/Dockerfile` |

### Archivos de Configuración

- **Base de datos**: Migraciones Liquibase en `backend/src/main/resources/db/changelog/`
- **Dependencias backend**: `backend/pom.xml`
- **Dependencias frontend**: `frontend/package.json` y `frontend/package-lock.json`

## 4.3 Medio de Entrega

### Opción 1: Repositorio GitHub (Recomendado)

- **URL del repositorio**: [Proporcionar URL]
- **Rama principal**: `main` o `dev`
- **Tag de versión**: `v1.0.0`

**Clonación del repositorio:**
```bash
git clone [URL_DEL_REPOSITORIO]
cd UTEC-Space-Manager
git checkout v1.0.0  # O la rama deseada
```

### Opción 2: Archivo ZIP

- **Nombre del archivo**: `UTEC-Space-Manager-v1.0.0.zip`
- **Contenido**: Todo el código fuente y documentación
- **Descomprimir**: En el directorio deseado

```bash
unzip UTEC-Space-Manager-v1.0.0.zip
cd UTEC-Space-Manager
```

## 4.4 Verificación de Integridad

Después de obtener los archivos, verificar que:

1. **Todos los archivos estén presentes**:
   - `backend/pom.xml` existe
   - `frontend/package.json` existe
   - `docker-compose.yml` existe
   - Scripts en `scripts/` existen

2. **Permisos de ejecución** (Linux/macOS):
   ```bash
   chmod +x backend/mvnw
   chmod +x scripts/*.sh
   ```

3. **Estructura correcta**:
   ```bash
   ls -la backend/src/main/java/
   ls -la frontend/src/
   ```

---

# 5. PROCEDIMIENTO DE INSTALACIÓN

Este capítulo describe los procedimientos de instalación paso a paso para diferentes escenarios.

## 5.1 Opciones de Instalación

El sistema puede instalarse de las siguientes formas:

1. **Instalación con Docker Compose** (Recomendado para producción)
   - Todo containerizado
   - Más fácil de mantener
   - Aislamiento de servicios

2. **Instalación Manual Local** (Desarrollo)
   - Servicios corriendo nativamente
   - Más control sobre configuración
   - Mejor para desarrollo y debugging

3. **Instalación Híbrida** (Base de datos en Docker, aplicaciones nativas)
   - Base de datos en contenedor
   - Backend y Frontend nativos
   - Balance entre facilidad y control

## 5.2 Preparación del Entorno

Antes de proceder con la instalación, realice estos pasos de preparación:

### Paso 1: Verificar Requisitos

Ejecutar los siguientes comandos para verificar que todo está instalado:

```bash
# Verificar Java
java -version
# Debe mostrar: openjdk version "21" o superior

# Verificar Maven (si está instalado globalmente)
mvn -version
# Si no está instalado globalmente, el proyecto incluye mvnw

# Verificar Node.js
node --version
# Debe mostrar: v20.x.x o superior

npm --version
# Debe mostrar: 10.x.x o superior

# Verificar PostgreSQL
psql --version
# Debe mostrar: psql (PostgreSQL) 15.x o superior

# Verificar Docker (si va a usar Docker)
docker --version
docker compose version
```

### Paso 2: Obtener el Código Fuente

#### Opción A: Clonar desde Git

```bash
git clone [URL_DEL_REPOSITORIO]
cd UTEC-Space-Manager
git checkout v1.0.0  # O la rama/versión deseada
```

#### Opción B: Descomprimir ZIP

```bash
unzip UTEC-Space-Manager-v1.0.0.zip
cd UTEC-Space-Manager
```

### Paso 3: Preparar Directorio de Trabajo

```bash
# Crear directorio de trabajo (si no existe)
mkdir -p /opt/utec-space-manager
cd /opt/utec-space-manager

# Copiar o mover el código fuente aquí
cp -r /ruta/origen/UTEC-Space-Manager/* .

# Verificar estructura
ls -la
ls -la backend/
ls -la frontend/
```

## 5.3 Instalación con Docker Compose (Recomendado)

Esta es la forma más sencilla y recomendada para producción.

### Paso 1: Preparar Variables de Entorno

#### 1.1 Crear archivo `.env` en la raíz

```bash
cd /ruta/al/proyecto
cp .env.example .env  # Si existe un ejemplo
# O crear el archivo manualmente
nano .env
```

#### 1.2 Configurar variables en `.env` (raíz)

```env
# ===== BASE DE DATOS =====
POSTGRES_DB=utec_db
POSTGRES_USER=ut_user
POSTGRES_PASSWORD=TU_PASSWORD_SEGURO_AQUI

# ===== VARIABLES COMPARTIDAS =====
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

#### 1.3 Crear `backend/.env`

```bash
cd backend
nano .env
```

Configurar todas las variables del backend (ver sección [6.1](#61-archivos-de-variables-de-entorno)).

#### 1.4 Crear `frontend/.env`

```bash
cd frontend
nano .env
```

Configurar variables del frontend (ver sección [6.1](#61-archivos-de-variables-de-entorno)).

### Paso 2: Construir Imágenes Docker

```bash
# Desde la raíz del proyecto
docker compose build

# O construir servicios específicos
docker compose build backend
docker compose build frontend
```

**Tiempo estimado**: 5-15 minutos dependiendo de la conexión a internet.

### Paso 3: Levantar Servicios

```bash
# Levantar todos los servicios en background
docker compose up -d

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

### Paso 4: Verificar que los Servicios Están Corriendo

```bash
# Ver estado de contenedores
docker compose ps

# Debe mostrar:
# - ut_db (PostgreSQL): Running
# - spring_backend (Backend): Running
# - react_frontend (Frontend): Running
```

### Paso 5: Verificar Acceso

- **Frontend**: Abrir navegador en `http://localhost:5173`
- **Backend**: `http://localhost:8080/api/v1`
- **Base de datos**: `localhost:5432`

### Paso 6: Ejecutar Migraciones

Las migraciones de Liquibase se ejecutan automáticamente al iniciar el backend. Verifique en los logs:

```bash
docker compose logs backend | grep -i liquibase
```

Debe mostrar mensajes como:
```
Liquibase: Reading from db.changelog-master.xml
Liquibase: Successfully released change log lock
```

### Comandos Útiles Docker Compose

```bash
# Detener servicios
docker compose down

# Detener y eliminar volúmenes (CUIDADO: elimina datos)
docker compose down -v

# Reiniciar un servicio específico
docker compose restart backend

# Reconstruir y levantar
docker compose up -d --build

# Ver logs en tiempo real
docker compose logs -f

# Ejecutar comando en contenedor
docker compose exec backend sh
docker compose exec db psql -U ut_user -d utec_db
```

### Variante: Instalación Rápida con Imágenes Pre-construidas (`docker-compose.hub.yml`)

El proyecto incluye un compose alternativo, `docker-compose.hub.yml`, que en lugar de construir las imágenes localmente las descarga desde Docker Hub. Está pensado para entornos donde no se quiere compilar el código (por ejemplo, una demo, una validación rápida o un despliegue en un servidor que solo necesita correr la aplicación).

```bash
# Desde la raíz del proyecto
docker compose -f docker-compose.hub.yml up -d
```

Las imágenes que descarga son las publicadas oficialmente por el equipo en Docker Hub (`mathiaspena/utec-backend:latest`, `mathiaspena/utec-frontend:latest`). El resto de los servicios (PostgreSQL, Redis, MinIO) se descarga desde imágenes públicas oficiales.

> **Cuándo usarlo**: para levantar el sistema sin clonar el código fuente o sin compilarlo. **Cuándo no usarlo**: cuando se está desarrollando o se quieren probar cambios locales — para eso usar `docker-compose.yml` (build local).

## 5.4 Instalación Manual Local

Esta instalación es recomendada para desarrollo y permite mayor control.

### Paso 1: Configurar Base de Datos PostgreSQL

#### 1.1 Crear Usuario y Base de Datos

```bash
# Acceder a PostgreSQL como superusuario
sudo -u postgres psql

# O si está configurado con contraseña:
psql -U postgres -h localhost
```

En la consola de PostgreSQL:

```sql
-- Crear usuario
CREATE USER ut_user WITH PASSWORD 'TU_PASSWORD_SEGURO';

-- Crear base de datos (con OWNER ut_user, ya tiene todos los privilegios sobre la base)
CREATE DATABASE utec_db OWNER ut_user;

-- Salir
\q
```

> **Nota PostgreSQL 15+**: a partir de PG15, otorgar privilegios solo a nivel de base de datos (`GRANT ... ON DATABASE`) no es suficiente para crear tablas: hace falta también `GRANT ALL ON SCHEMA public TO ut_user`. Al crear la base con `OWNER ut_user`, este caso ya queda resuelto y no se requieren grants adicionales.

#### 1.2 Verificar Conexión

```bash
psql -U ut_user -d utec_db -h localhost
# Debe conectarse exitosamente
```

### Paso 2: Configurar Variables de Entorno

#### 2.1 Crear `backend/.env`

```bash
cd backend
nano .env
```

Agregar todas las variables (ver sección [6.1.1](#611-backendenv)).

#### 2.2 Crear `frontend/.env`

```bash
cd frontend
nano .env
```

Agregar variables del frontend (ver sección [6.1.2](#612-frontendenv)).

#### 2.3 Configurar IPs (si necesita acceso desde red)

El proyecto incluye scripts de ayuda para detectar la IP de la red local y dejarla escrita en los archivos `.env` automáticamente.

```bash
# Linux / macOS
bash scripts/SetIP-Linux.sh

# Windows (PowerShell)
powershell -File scripts/SetIP-Windows.ps1

# Windows (alternativa con batch)
scripts\RUN-SetIP-Windows.bat
```

Si prefiere hacerlo manualmente, basta con editar las URLs en los archivos `.env` (`VITE_API_URL`, `VITE_FRONTEND_URL`, `BACKEND_URL`, `CORS_ALLOWED_ORIGINS`).

### Paso 3: Instalar Backend

#### 3.1 Instalar Dependencias Maven

```bash
cd backend

# Usar Maven Wrapper (incluido)
./mvnw dependency:go-offline

# O si tiene Maven instalado globalmente:
mvn dependency:go-offline
```

#### 3.2 Compilar Backend

```bash
# Compilar sin ejecutar tests (más rápido)
./mvnw clean install -DskipTests

# O con tests (recomendado primera vez)
./mvnw clean install
```

**Tiempo estimado**: 2-5 minutos.

#### 3.3 Verificar Compilación

```bash
# Verificar que se creó el JAR
ls -lh backend/target/*.jar

# Debe mostrar: backend-0.0.1-SNAPSHOT.jar
```

### Paso 4: Instalar Frontend

#### 4.1 Instalar Dependencias npm

```bash
cd frontend

# Instalar dependencias
npm install

# Verificar instalación
npm list --depth=0
```

**Tiempo estimado**: 2-5 minutos.

#### 4.2 Verificar Instalación

```bash
# Verificar que node_modules existe
ls -la node_modules/ | head -10
```

### Paso 5: Ejecutar Base de Datos (si no está corriendo)

```bash
# En Linux (systemd)
sudo systemctl start postgresql
sudo systemctl enable postgresql

# En macOS
brew services start postgresql@15

# Verificar estado
sudo systemctl status postgresql  # Linux
# O
psql -U ut_user -d utec_db -h localhost
```

### Paso 6: Ejecutar Migraciones de Base de Datos

Las migraciones se ejecutan automáticamente al iniciar el backend. Si necesita ejecutarlas manualmente:

```bash
cd backend

# Las migraciones se ejecutan automáticamente con Spring Boot
# Pero puede verificar el estado con:
./mvnw liquibase:status
```

O esperar a que se ejecuten al iniciar el backend.

### Paso 7: Iniciar Backend

#### 7.1 Iniciar Backend en Desarrollo

```bash
cd backend

# Iniciar con Maven
./mvnw spring-boot:run

# O con perfil específico
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

#### 7.2 Verificar que Backend Está Corriendo

Abrir navegador o usar curl:

```bash
# Verificar health check
curl http://localhost:8080/actuator/health

# Debe responder:
# {"status":"UP"}
```

O abrir en navegador:
- `http://localhost:8080/actuator/health`
- `http://localhost:8080/swagger-ui.html` (si está habilitado)

#### 7.3 Ver Logs del Backend

Los logs aparecen en la consola. También se guardan en:
- `backend/logs/application.log`

### Paso 8: Iniciar Frontend

#### 8.1 Iniciar Frontend en Desarrollo (Terminal nueva)

```bash
cd frontend

# Modo localhost (solo accesible localmente)
npm run dev

# Modo red (accesible desde red local)
npm run dev:network
```

#### 8.2 Verificar que Frontend Está Corriendo

Abrir navegador en:
- `http://localhost:5173` (modo localhost)
- `http://[TU_IP]:5173` (modo red)

Debe mostrar la página de inicio de sesión del sistema.

### Paso 9: Verificar Instalación Completa

Verificar que todos los servicios están corriendo:

1. **Backend**: `http://localhost:8080/actuator/health` → `{"status":"UP"}`
2. **Frontend**: `http://localhost:5173` → Página de login
3. **Base de datos**: 
   ```bash
   psql -U ut_user -d utec_db -h localhost -c "SELECT version();"
   ```
4. **Redis** (requerido por el backend para caché): `redis-cli -h localhost ping` → `PONG` (o el contenedor `ut_redis` en Docker)
5. **MinIO** (si `MINIO_ENABLED=true` o usas el `docker compose` completo): consola `http://localhost:9001`, API `http://localhost:9000`

## 5.5 Instalación Híbrida (Base de Datos Docker, Aplicaciones Nativas)

Esta opción usa Docker solo para la base de datos y ejecuta backend/frontend nativamente.

> **Importante:** El backend usa `spring.cache.type=redis` por defecto. Debes tener **Redis accesible** en `REDIS_HOST`/`REDIS_PORT` (típicamente `localhost:6379`). MinIO es opcional (`MINIO_ENABLED=false` por defecto en `application.properties`).

### Paso 1: Levantar Solo Base de Datos con Docker

```bash
# Crear docker-compose solo para BD
cat > docker-compose.db.yml << EOF
services:
  db:
    image: postgres:15
    container_name: ut_db
    environment:
      - POSTGRES_DB=utec_db
      - POSTGRES_USER=ut_user
      - POSTGRES_PASSWORD=TU_PASSWORD
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  pgdata:
EOF

# Levantar solo la base de datos
docker compose -f docker-compose.db.yml up -d
```

### Paso 2: Configurar Aplicaciones para Conectarse a Docker

En `backend/.env`:
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/utec_db
```

### Paso 3: Seguir Pasos de Instalación Manual

Continuar con los pasos [5.4.3](#543-instalar-backend) en adelante, pero la base de datos ya está corriendo en Docker.

## 5.6 Instalación de Producción

Para producción, seguir estos pasos adicionales:

### Paso 1: Configurar Variables de Producción

Crear `backend/.env` con variables de producción (ver sección [6.1.1](#611-backendenv)).

### Paso 2: Compilar Backend para Producción

```bash
cd backend

# Compilar JAR de producción
./mvnw clean package -DskipTests

# El JAR estará en:
# backend/target/backend-0.0.1-SNAPSHOT.jar
```

### Paso 3: Build del Frontend para Producción

```bash
cd frontend

# Build de producción
npm run build

# Los archivos estáticos estarán en:
# frontend/dist/
```

### Paso 4: Configurar Servidor Web (Nginx/Apache)

Para servir el frontend en producción, configurar Nginx o Apache:

#### Ejemplo Nginx

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    root /ruta/a/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Paso 5: Ejecutar Backend como Servicio (systemd)

Crear servicio systemd en Linux:

```bash
sudo nano /etc/systemd/system/utec-backend.service
```

Contenido:
```ini
[Unit]
Description=UTEC Space Manager Backend
After=network.target postgresql.service

[Service]
Type=simple
User=utec
WorkingDirectory=/opt/utec-space-manager/backend
Environment="SPRING_PROFILES_ACTIVE=prod"
ExecStart=/usr/bin/java -jar /opt/utec-space-manager/backend/target/backend-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Habilitar y iniciar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable utec-backend
sudo systemctl start utec-backend
sudo systemctl status utec-backend
```

---

# 6. CONFIGURACIÓN DEL SISTEMA

Este capítulo describe la configuración detallada de todas las variables de entorno y servicios del sistema.

## 6.1 Archivos de Variables de Entorno

El sistema utiliza una arquitectura separada por servicio con archivos `.env` independientes:

```
Proyecto/
├── .env                  ← Docker Compose (solo BD + variables compartidas)
├── backend/.env          ← Backend (todas las variables del backend)
└── frontend/.env         ← Frontend (URLs configuradas manualmente)
```

### 6.1.1 `backend/.env` (Backend - Todas las Variables)

Ubicación: `backend/.env`

Este archivo contiene TODAS las variables de entorno necesarias para el backend.

#### Variables de Base de Datos

```env
# URL de conexión a PostgreSQL
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/utec_db

# Credenciales de base de datos
SPRING_DATASOURCE_USERNAME=ut_user
SPRING_DATASOURCE_PASSWORD=TU_PASSWORD_SEGURO_AQUI
```

**Nota para Docker**: En Docker Compose, la URL debe ser:
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/utec_db
```

#### Variables de Configuración Spring Boot

```env
# Perfil activo (dev, prod, test)
SPRING_PROFILES_ACTIVE=dev

# Puerto del servidor
SERVER_PORT=8080

# URL del backend
BACKEND_URL=http://localhost:8080
```

#### Variables JWT (Autenticación)

```env
# Secreto JWT (256 bits recomendado, generar aleatorio seguro)
JWT_SECRET=TU_SECRETO_SUPER_SEGURO_256_BITS_MINIMO_32_CARACTERES

# Expiración del access token (milisegundos)
# Por defecto: 1 hora (3600000 ms)
JWT_EXPIRATION=3600000

# Expiración del refresh token (milisegundos)
# Valor recomendado por el proyecto: 30 días (2592000000 ms)
# El default interno de la aplicación si no se define la variable es 24 horas (86400000 ms)
JWT_REFRESH_EXPIRATION=2592000000
```

**Generar secreto JWT seguro:**
```bash
# Opción 1: OpenSSL
openssl rand -base64 32

# Opción 2: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Opción 3: Online
# Usar generador de secretos online seguro
```

#### Variables de Google OAuth 2.0

```env
# Client ID de OAuth 2.0 (mismo para OAuth y Gmail API)
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com

# Client Secret de OAuth 2.0
GOOGLE_CLIENT_SECRET=tu-client-secret

# Redirect URI (no cambiar, debe coincidir con Google Cloud Console)
# BACKEND_URL/api/v1/oauth2/google/callback
```

**Nota**: El `GOOGLE_CLIENT_ID` debe ser el mismo en backend y frontend.

#### Variables de Gmail API (Email)

```env
# Client ID de Gmail API (mismo que OAuth)
GMAIL_CLIENT_ID=tu-client-id.apps.googleusercontent.com

# Client Secret de Gmail API (mismo que OAuth)
GMAIL_CLIENT_SECRET=tu-client-secret

# Refresh Token de Gmail API (obtener con script Python)
GMAIL_REFRESH_TOKEN=tu-refresh-token

# Email desde el cual se envían los correos
GMAIL_FROM_EMAIL=tu-email@gmail.com
```

#### Variables de CORS

```env
# URL del frontend (para CORS)
FRONTEND_URL=http://localhost:5173

# Para acceso desde red local:
# FRONTEND_URL=http://192.168.x.x:5173

# Para producción:
# FRONTEND_URL=https://tu-dominio.com
```

#### Variables de Reservas (Recordatorios)

```env
# Horas antes de la reserva para enviar recordatorio (por defecto: 24)
RESERVAS_REMINDER_HOURS_BEFORE=24

# Habilitar/deshabilitar recordatorios automáticos
# Para que efectivamente se envíen emails, también debe estar GMAIL_API_ENABLED=true
RESERVAS_REMINDER_ENABLED=true
```

#### Variables de Almacenamiento de Archivos (MinIO)

MinIO se usa como almacenamiento S3-compatible para archivos subidos al sistema. Es **opcional**: si no se habilita, las funcionalidades de subida de archivos quedan deshabilitadas pero el resto del sistema funciona.

```env
# Habilitar el módulo MinIO (default: false)
MINIO_ENABLED=true

# Endpoint interno donde el backend conecta con MinIO
MINIO_ENDPOINT=http://localhost:9000

# URL pública por la cual los clientes acceden a los archivos servidos desde MinIO
MINIO_PUBLIC_URL=http://localhost:9000

# Credenciales del bucket
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Bucket donde se guardan los archivos del sistema
MINIO_BUCKET_NAME=utec-files

# Región (puede dejarse en us-east-1 para entornos locales)
MINIO_REGION=us-east-1

# Tamaño máximo de archivo en bytes (ejemplo: 10 MB)
MINIO_MAX_FILE_SIZE=10485760

# Tipos MIME permitidos, separados por coma
MINIO_ALLOWED_MIME_TYPES=image/png,image/jpeg,application/pdf
```

#### Variables de Email (Gmail API)

```env
# Habilita el envío de emails desde el sistema (default: false)
# Si está en false, el sistema no envía notificaciones aunque otros flags lo pidan.
GMAIL_API_ENABLED=true
```

#### Variables de Zona Horaria

```env
# Zona horaria de la aplicación (por defecto: America/Montevideo)
APP_TIMEZONE=America/Montevideo
```

#### Variables de CORS (perfil dev)

```env
# Orígenes permitidos por CORS (separados por coma)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://192.168.1.10:5173

# Métodos HTTP permitidos (default razonable: GET,POST,PUT,DELETE,PATCH,OPTIONS)
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS
```

#### Variables de Caché (Redis)

El sistema cachea ciertas estadísticas en Redis para no recalcularlas en cada petición. Estos TTL se pueden ajustar mediante variables de entorno (todos los valores se expresan en segundos).

```env
# Estadísticas agregadas de usuarios
CACHE_USUARIO_STATS_TTL=300

# Estadísticas agregadas de inventario
CACHE_INVENTARIO_STATS_TTL=300
```

> **Nota sobre carga de variables (`dotenv`)**: el `pom.xml` está configurado con `-Ddotenv.file=../.env`, por lo que cuando se ejecuta `./mvnw spring-boot:run` desde la carpeta `backend/`, el archivo `.env` que se lee es **el de la raíz del proyecto**, no el de `backend/`. Si las variables se ponen exclusivamente en `backend/.env` puede que no las tome la aplicación cuando se levanta sin Docker. La forma más robusta es mantener los `.env` de cada componente sincronizados o consolidar las variables en el `.env` de la raíz.

#### Ejemplo Completo: `backend/.env`

```env
# ===== BASE DE DATOS =====
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/utec_db
SPRING_DATASOURCE_USERNAME=ut_user
SPRING_DATASOURCE_PASSWORD=tu_password_seguro

# ===== CONFIGURACIÓN SPRING =====
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080
BACKEND_URL=http://localhost:8080

# ===== JWT =====
JWT_SECRET=tu-secreto-super-seguro-256-bits-minimo-32-caracteres
JWT_EXPIRATION=3600000
JWT_REFRESH_EXPIRATION=2592000000

# ===== GOOGLE OAUTH 2.0 =====
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret

# ===== GMAIL API =====
GMAIL_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=tu-client-secret
GMAIL_REFRESH_TOKEN=tu-refresh-token
GMAIL_FROM_EMAIL=tu-email@gmail.com

# ===== FRONTEND (CORS) =====
FRONTEND_URL=http://localhost:5173

# ===== RESERVAS =====
RESERVAS_REMINDER_HOURS_BEFORE=24
RESERVAS_REMINDER_ENABLED=true
```

### 6.1.2 `frontend/.env` (Frontend - URLs)

Ubicación: `frontend/.env`

Este archivo contiene las URLs de conexión del frontend al backend.

```env
# URL del backend API
VITE_API_URL=http://localhost:8080/api/v1

# URL del frontend (para OAuth callback y redirecciones)
VITE_FRONTEND_URL=http://localhost:5173

# Google Client ID (para botón de login con Google)
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

**Para acceso desde red local:**
```env
# Usar IP de red en lugar de localhost
VITE_API_URL=http://192.168.x.x:8080/api/v1
VITE_FRONTEND_URL=http://192.168.x.x:5173
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

**Para producción:**
```env
VITE_API_URL=https://api.tu-dominio.com/api/v1
VITE_FRONTEND_URL=https://tu-dominio.com
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

**Configuración automática de IPs:**

El proyecto incluye scripts para detectar la IP de red local y actualizar los archivos `.env`:

```bash
# Linux / macOS
bash scripts/SetIP-Linux.sh

# Windows (PowerShell)
powershell -File scripts/SetIP-Windows.ps1

# Windows (lanzador batch)
scripts\RUN-SetIP-Windows.bat
```

### 6.1.3 `.env` (Raíz - Docker Compose)

Ubicación: `.env` (raíz del proyecto)

Este archivo solo contiene variables para Docker Compose (principalmente base de datos).

```env
# ===== BASE DE DATOS (Docker Compose) =====
POSTGRES_DB=utec_db
POSTGRES_USER=ut_user
POSTGRES_PASSWORD=TU_PASSWORD_SEGURO_AQUI

# ===== VARIABLES COMPARTIDAS =====
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

## 6.2 Configuración de Google OAuth 2.0

Google OAuth 2.0 permite a los usuarios iniciar sesión con su cuenta de Google.

### Paso 1: Crear Proyecto en Google Cloud Console

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un nuevo proyecto o seleccionar uno existente
3. Anotar el ID del proyecto

### Paso 2: Habilitar APIs Necesarias

1. Ir a **"APIs & Services" > "Library"**
2. Habilitar las siguientes APIs:
   - **Google People API** (necesaria para obtener perfil del usuario en OAuth; reemplaza a la antigua *Google+ API*, deprecada en 2019).
   - **Gmail API** (solo si se va a usar Gmail para envío de notificaciones desde el sistema).

### Paso 3: Crear Credenciales OAuth 2.0

1. Ir a **"APIs & Services" > "Credentials"**
2. Clic en **"Create Credentials" > "OAuth 2.0 Client ID"**
3. Si es primera vez, configurar OAuth consent screen:
   - Tipo: **External** (para desarrollo) o **Internal** (para G Suite)
   - Información de la aplicación:
     - Nombre: **UTEC Space Manager**
     - Email de soporte
     - Logo (opcional)

4. Crear OAuth 2.0 Client ID:
   - **Application type:** Web application
   - **Name:** UTEC Space Manager Web Client

5. Configurar **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://192.168.x.x:5173  # Si usa IP de red
   https://tu-dominio.com   # Para producción
   ```

6. Configurar **Authorized redirect URIs**:
   ```
   http://localhost:8080/api/v1/oauth2/google/callback
   http://192.168.x.x:8080/api/v1/oauth2/google/callback  # Si usa IP de red
   https://api.tu-dominio.com/api/v1/oauth2/google/callback  # Para producción
   ```

7. Guardar y copiar:
   - **Client ID**: `xxxxx.apps.googleusercontent.com`
   - **Client Secret**: `xxxxx`

### Paso 4: Configurar en el Sistema

Agregar las credenciales en los archivos `.env`:

**En `backend/.env`:**
```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
```

**En `frontend/.env`:**
```env
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

**En `.env` (raíz, para Docker Compose):**
```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

### Paso 5: Verificar Configuración

1. Iniciar el backend
2. Abrir navegador en: `http://localhost:8080/api/v1/oauth2/google/info`
3. Debe mostrar información de OAuth (si está configurado correctamente)

## 6.3 Configuración de Gmail API (Email)

Gmail API se usa para enviar emails de verificación y notificaciones.

### Paso 1: Habilitar Gmail API

1. En Google Cloud Console, ir a **"APIs & Services" > "Library"**
2. Buscar **"Gmail API"**
3. Habilitar Gmail API

### Paso 2: Crear Credenciales OAuth 2.0 para Gmail

1. Ir a **"APIs & Services" > "Credentials"**
2. Crear **"OAuth 2.0 Client ID"** de tipo **"Desktop application"**
   - **Name:** UTEC Space Manager Gmail API
3. Copiar **Client ID** y **Client Secret**

### Paso 3: Obtener Refresh Token

El refresh token se obtiene ejecutando un script de Python que realiza el flujo OAuth.

**Crear script `get-gmail-token.py`:**

```python
import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def get_credentials():
    creds = None
    
    # Token file stores the user's access and refresh tokens
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    # If there are no (valid) credentials available, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    
    return creds

if __name__ == '__main__':
    creds = get_credentials()
    service = build('gmail', 'v1', credentials=creds)
    
    # Test email send
    print("Refresh Token:", creds.refresh_token)
    print("Credentials saved to token.json")
    print("Copy the refresh_token value to GMAIL_REFRESH_TOKEN in .env")
```

**Pasos para obtener el token:**

1. Descargar credenciales desde Google Cloud Console:
   - Ir a **"Credentials"**
   - Descargar JSON de las credenciales de "Desktop application"
   - Guardar como `credentials.json`

2. Instalar dependencias Python:
   ```bash
   pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
   ```

3. Ejecutar script:
   ```bash
   python3 get-gmail-token.py
   ```

4. Se abrirá navegador para autorizar
5. Copiar el `refresh_token` que se muestra

### Paso 4: Configurar en el Sistema

Agregar en `backend/.env`:

```env
GMAIL_CLIENT_ID=xxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=xxxxx
GMAIL_REFRESH_TOKEN=tu-refresh-token-obtenido
GMAIL_FROM_EMAIL=tu-email@gmail.com
```

**Nota**: El email `GMAIL_FROM_EMAIL` debe ser el mismo que autorizaste en el flujo OAuth.

### Paso 5: Verificar Envío de Email

1. Iniciar el backend
2. Intentar registro de usuario
3. Verificar que se recibe email de verificación

## 6.4 Configuración de Base de Datos

### 6.4.1 Crear Usuario y Base de Datos

```bash
# Acceder a PostgreSQL
sudo -u postgres psql

# O con contraseña:
psql -U postgres -h localhost
```

En consola PostgreSQL:

```sql
-- Crear usuario
CREATE USER ut_user WITH PASSWORD 'tu_password_seguro';

-- Crear base de datos
CREATE DATABASE utec_db OWNER ut_user;

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON DATABASE utec_db TO ut_user;

-- Conectarse a la base de datos
\c utec_db

-- Otorgar privilegios en el esquema
GRANT ALL ON SCHEMA public TO ut_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ut_user;

-- Salir
\q
```

### 6.4.2 Verificar Conexión

```bash
psql -U ut_user -d utec_db -h localhost
```

Debe conectarse exitosamente.

### 6.4.3 Migraciones Automáticas

Liquibase ejecuta migraciones automáticamente al iniciar el backend. Verificar en logs:

```bash
# Ver logs del backend
tail -f backend/logs/application.log

# O si está en Docker:
docker compose logs backend | grep -i liquibase
```

Debe mostrar:
```
Liquibase: Reading from db.changelog-master.xml
Liquibase: Successfully applied changeset
Liquibase: Successfully released change log lock
```

## 6.5 Configuración de Red y Servicios

### 6.5.1 Configuración de Puertos

Asegurarse de que los puertos están libres:

```bash
# Verificar puertos
sudo netstat -tuln | grep -E '5173|8080|5432'

# O con ss:
sudo ss -tuln | grep -E '5173|8080|5432'
```

Si un puerto está ocupado:

1. Identificar proceso:
   ```bash
   sudo lsof -i :8080
   ```

2. Terminar proceso o cambiar puerto en configuración

### 6.5.2 Configuración de Firewall

#### Linux (UFW)

```bash
# Permitir puertos
sudo ufw allow 5173/tcp  # Frontend
sudo ufw allow 8080/tcp  # Backend
sudo ufw allow 5432/tcp  # PostgreSQL (solo si es necesario desde red)

# Verificar estado
sudo ufw status
```

#### Linux (iptables)

```bash
# Permitir puertos
sudo iptables -A INPUT -p tcp --dport 5173 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5432 -j ACCEPT

# Guardar reglas (depende de la distribución)
sudo iptables-save > /etc/iptables/rules.v4
```

#### Windows

1. Abrir **Windows Defender Firewall**
2. **Advanced settings**
3. Crear reglas entrantes para puertos 5173, 8080

### 6.5.3 Configuración de IPs para Red Local

Si necesita acceso desde otros dispositivos en la red local:

**Opción 1: Automática (recomendado)**

```bash
# Linux / macOS
bash scripts/SetIP-Linux.sh

# Windows
powershell -File scripts/SetIP-Windows.ps1
```

**Opción 2: Manual**

Editar `frontend/.env` y `backend/.env` con la IP de red:

```env
# frontend/.env
VITE_API_URL=http://192.168.x.x:8080/api/v1
VITE_FRONTEND_URL=http://192.168.x.x:5173

# backend/.env
FRONTEND_URL=http://192.168.x.x:5173
```

**Obtener IP de red:**

```bash
# Linux/macOS
ip addr show | grep inet
# O
ifconfig | grep inet

# Windows
ipconfig
```

## 6.6 Configuración de Personalización

### 6.6.1 Configuración de Roles

Los roles del sistema se configuran automáticamente en las migraciones. Para modificar:

1. Editar archivos de migración Liquibase
2. O modificar directamente en base de datos (no recomendado)

### 6.6.2 Configuración de Permisos

Los permisos se configuran en el código del backend. Para modificar:

1. Editar clases de seguridad en `backend/src/main/java/com/utec/backend/security/`
2. Recompilar backend

### 6.6.3 Configuración de Recordatorios de Reservas

En `backend/.env`:

```env
# Horas antes de enviar recordatorio
RESERVAS_REMINDER_HOURS_BEFORE=24

# Habilitar/deshabilitar
RESERVAS_REMINDER_ENABLED=true
```

---

# 7. VERIFICACIÓN POSTINSTALACIÓN

Este capítulo describe cómo verificar que la instalación fue exitosa y el sistema está funcionando correctamente.

## 7.1 Pruebas de Humo

Las pruebas de humo verifican que los componentes básicos están funcionando.

### 7.1.1 Verificar Servicios en Ejecución

#### Verificar Backend

```bash
# Verificar que el backend está corriendo
curl http://localhost:8080/actuator/health

# Debe responder:
# {"status":"UP"}
```

O abrir en navegador: `http://localhost:8080/actuator/health`

#### Verificar Frontend

Abrir navegador en: `http://localhost:5173`

Debe mostrar la página de inicio de sesión del sistema.

#### Verificar Base de Datos

```bash
# Conectar a PostgreSQL
psql -U ut_user -d utec_db -h localhost

# Verificar tablas
\dt

# Debe mostrar tablas del sistema:
# - usuario
# - espacio
# - reserva
# - inventario_item
# - etc.

# Salir
\q
```

### 7.1.2 Verificar Endpoints del Backend

```bash
# Health check
curl http://localhost:8080/actuator/health

# Info del sistema
curl http://localhost:8080/actuator/info

# Swagger UI (si está habilitado)
# Abrir navegador: http://localhost:8080/swagger-ui.html
```

### 7.1.3 Verificar Migraciones de Base de Datos

```bash
# Verificar que las migraciones se ejecutaron
psql -U ut_user -d utec_db -h localhost -c "SELECT * FROM databasechangelog ORDER BY dateexecuted DESC LIMIT 10;"

# Debe mostrar cambiosets aplicados
```

O verificar en logs del backend:

```bash
# Ver logs
tail -f backend/logs/application.log | grep -i liquibase

# O en Docker:
docker compose logs backend | grep -i liquibase
```

## 7.2 Verificación de Servicios en Ejecución

### 7.2.1 Verificar Procesos del Sistema

#### Linux/macOS

```bash
# Verificar procesos Java (backend)
ps aux | grep java

# Debe mostrar proceso con:
# backend-0.0.1-SNAPSHOT.jar

# Verificar procesos Node.js (frontend)
ps aux | grep node

# Debe mostrar proceso Vite

# Verificar PostgreSQL
ps aux | grep postgres
```

#### Windows

```powershell
# Verificar procesos
Get-Process | Where-Object {$_.ProcessName -like "*java*"}
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

### 7.2.2 Verificar Puertos

```bash
# Verificar puertos ocupados
sudo netstat -tuln | grep -E '5173|8080|5432'

# Debe mostrar:
# tcp  0.0.0.0:5173  LISTEN  (frontend)
# tcp  0.0.0.0:8080  LISTEN  (backend)
# tcp  0.0.0.0:5432  LISTEN  (PostgreSQL)
```

### 7.2.3 Verificar Contenedores Docker (si usa Docker)

```bash
# Verificar contenedores
docker compose ps

# Debe mostrar:
# ut_db          postgres:15    Up     5432/tcp
# spring_backend backend:latest Up     0.0.0.0:8080->8080/tcp
# react_frontend frontend:latest Up     0.0.0.0:5173->5173/tcp
```

## 7.3 Logs de Instalación

### 7.3.1 Ubicación de Logs

**Backend:**
- Archivo: `backend/logs/application.log`
- En Docker: `docker compose logs backend`

**Frontend:**
- Consola del navegador (F12)
- Terminal donde se ejecuta `npm run dev`

**Base de Datos:**
- PostgreSQL: `/var/log/postgresql/postgresql-15-main.log` (Ubuntu/Debian)
- En Docker: `docker compose logs db`

### 7.3.2 Verificar Logs sin Errores

```bash
# Backend - buscar errores
tail -n 100 backend/logs/application.log | grep -i error

# O en Docker:
docker compose logs backend | grep -i error

# No debe mostrar errores críticos (algunos warnings pueden ser normales)
```

### 7.3.3 Verificar Mensajes de Inicio Exitoso

```bash
# Backend - buscar mensajes de inicio
tail -n 200 backend/logs/application.log | grep -i "started\|ready\|running"

# Debe mostrar:
# Started BackendApplication in X.XXX seconds
```

## 7.4 Conectividad con Otros Sistemas

### 7.4.1 Verificar Conexión Frontend-Backend

1. Abrir navegador en `http://localhost:5173`
2. Abrir **DevTools** (F12)
3. Ir a pestaña **Network**
4. Intentar iniciar sesión
5. Verificar que hay peticiones a `http://localhost:8080/api/v1/auth/login`
6. Verificar que las peticiones tienen respuesta exitosa (200 OK)

### 7.4.2 Verificar Conexión Backend-Base de Datos

```bash
# Verificar en logs del backend
tail -f backend/logs/application.log | grep -i "database\|jdbc\|postgres"

# Debe mostrar mensajes de conexión exitosa
# No debe mostrar errores de conexión
```

### 7.4.3 Verificar Google OAuth (si está configurado)

1. Abrir navegador en `http://localhost:5173`
2. Hacer clic en "Iniciar con Google"
3. Debe redirigir a Google para autorizar
4. Después de autorizar, debe redirigir de vuelta al frontend

Verificar en logs del backend:

```bash
docker compose logs backend | grep -i oauth

# Debe mostrar información de OAuth
```

### 7.4.4 Verificar Gmail API (si está configurado)

1. Intentar registro de nuevo usuario
2. Verificar que se recibe email de verificación

O probar envío manual:

```bash
# Ver logs del backend al intentar enviar email
tail -f backend/logs/application.log | grep -i "email\|gmail\|send"
```

## 7.5 Verificación Funcional Básica

### 7.5.1 Registro de Usuario

1. Abrir `http://localhost:5173`
2. Ir a "Registrarse"
3. Completar formulario:
   - Nombre
   - Email
   - Contraseña
4. Enviar formulario
5. Verificar que se muestra mensaje de éxito
6. Verificar que se recibe email de verificación (si Gmail API está configurado)

### 7.5.2 Inicio de Sesión

1. En página de login, ingresar:
   - Email
   - Contraseña
2. Clic en "Iniciar sesión"
3. Verificar que redirige al dashboard
4. Verificar que se muestra información del usuario

### 7.5.3 Acceso a Funcionalidades

1. Navegar por el dashboard
2. Verificar que se cargan datos
3. Verificar que los menús funcionan
4. Verificar que se pueden acceder a diferentes secciones

## 7.6 Verificación de Rendimiento

### 7.6.1 Tiempo de Respuesta

```bash
# Medir tiempo de respuesta del backend
time curl http://localhost:8080/actuator/health

# Debe responder en menos de 1 segundo
```

### 7.6.2 Uso de Recursos

```bash
# Ver uso de memoria y CPU
top -p $(pgrep -f "backend-0.0.1-SNAPSHOT.jar")
# O
docker stats spring_backend
```

### 7.6.3 Carga de Página Frontend

Abrir DevTools (F12) y verificar:
- Tiempo de carga inicial < 3 segundos
- No hay errores en consola
- Recursos se cargan correctamente

---

# 8. DESINSTALACIÓN Y REINSTALACIÓN

Este capítulo describe cómo desinstalar completamente el sistema y cómo reinstalarlo.

## 8.1 Procedimiento de Desinstalación Completa

### 8.1.1 Detener Servicios

#### Si está usando Docker

```bash
# Detener y eliminar contenedores
docker compose down

# Eliminar volúmenes (CUIDADO: elimina datos de base de datos)
docker compose down -v

# Eliminar imágenes (opcional)
docker rmi spring_backend react_frontend
```

#### Si está usando Instalación Manual

```bash
# Detener backend (si está corriendo como proceso)
pkill -f "backend-0.0.1-SNAPSHOT.jar"

# Detener frontend (Ctrl+C en terminal donde corre)

# Detener PostgreSQL (solo si se desea eliminar todo)
sudo systemctl stop postgresql
```

### 8.1.2 Eliminar Archivos del Sistema

#### Archivos de Código

```bash
# Eliminar directorio del proyecto
rm -rf /ruta/al/proyecto/UTEC-Space-Manager

# O desde el directorio del proyecto:
cd ..
rm -rf UTEC-Space-Manager
```

#### Archivos Generados

```bash
# Eliminar archivos compilados
rm -rf backend/target/
rm -rf frontend/dist/
rm -rf frontend/node_modules/

# Eliminar logs
rm -rf backend/logs/*.log
```

#### Archivos de Configuración

```bash
# Eliminar archivos .env (contienen secretos)
rm -f .env
rm -f backend/.env
rm -f frontend/.env
```

### 8.1.3 Eliminar Base de Datos

**CUIDADO**: Esto elimina TODOS los datos. Asegurarse de tener respaldo si es necesario.

```bash
# Conectarse a PostgreSQL
sudo -u postgres psql

# Eliminar base de datos
DROP DATABASE IF EXISTS utec_db;

# Eliminar usuario (opcional)
DROP USER IF EXISTS ut_user;

# Salir
\q
```

### 8.1.4 Eliminar Volúmenes Docker (si aplica)

```bash
# Ver volúmenes
docker volume ls | grep utec

# Eliminar volúmenes
docker volume rm utec_space_manager_pgdata
docker volume rm utec_space_manager_maven-cache
docker volume rm utec_space_manager_npm-cache
docker volume rm utec_space_manager_node-modules
```

### 8.1.5 Eliminar Dependencias del Sistema (Opcional)

**NOTA**: Solo si NO se usan para otros proyectos.

```bash
# Java (NO eliminar si se usa para otros proyectos)
# sudo apt remove openjdk-21-jdk

# Node.js (NO eliminar si se usa para otros proyectos)
# sudo apt remove nodejs npm

# PostgreSQL (NO eliminar si se usa para otros proyectos)
# sudo apt remove postgresql-15 postgresql-contrib-15

# Docker (NO eliminar si se usa para otros proyectos)
# sudo apt remove docker docker-compose
```

## 8.2 Procedimiento de Reinstalación

Para reinstalar el sistema después de una desinstalación:

1. **Seguir pasos de preparación** (sección [5.2](#52-preparación-del-entorno))
2. **Seguir procedimiento de instalación** deseado:
   - Docker Compose: sección [5.3](#53-instalación-con-docker-compose-recomendado)
   - Manual: sección [5.4](#54-instalación-manual-local)

## 8.3 Restauración desde Respaldo

Si tiene un respaldo de la base de datos:

### 8.3.1 Restaurar Base de Datos PostgreSQL

```bash
# Crear base de datos nuevamente (si no existe)
sudo -u postgres createdb -O ut_user utec_db

# Restaurar desde dump
psql -U ut_user -d utec_db -h localhost < backup_utec_db.sql

# O con pg_restore (para dump binario)
pg_restore -U ut_user -d utec_db -h localhost backup_utec_db.dump
```

### 8.3.2 Verificar Restauración

```bash
# Conectar y verificar tablas
psql -U ut_user -d utec_db -h localhost -c "\dt"

# Verificar datos
psql -U ut_user -d utec_db -h localhost -c "SELECT COUNT(*) FROM usuario;"
```

---

# 9. SOLUCIÓN DE PROBLEMAS

Este capítulo describe problemas comunes de instalación y configuración, y sus soluciones.

## 9.1 Problemas de Instalación

### 9.1.1 Error: Java no encontrado

**Síntoma:**
```
Error: JAVA_HOME is not set
```

**Solución:**

1. Verificar que Java está instalado:
   ```bash
   java -version
   ```

2. Si no está instalado, instalar JDK 21 (ver sección [3.2.1](#321-1-java-development-kit-jdk))

3. Configurar JAVA_HOME:
   ```bash
   # Linux/macOS
   export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
   export PATH=$JAVA_HOME/bin:$PATH
   
   # Agregar a ~/.bashrc o ~/.zshrc para persistencia
   ```

4. Para Windows:
   - Abrir "Variables de entorno del sistema"
   - Agregar variable `JAVA_HOME` apuntando a la instalación de JDK

### 9.1.2 Error: Maven no encontrado

**Síntoma:**
```
./mvnw: Permission denied
```

**Solución:**

```bash
# Dar permisos de ejecución a mvnw
chmod +x backend/mvnw

# Si aún no funciona, verificar permisos
ls -l backend/mvnw
```

### 9.1.3 Error: Node.js no encontrado

**Síntoma:**
```
command not found: npm
```

**Solución:**

1. Verificar instalación de Node.js (ver sección [3.2.1](#321-2-nodejs-y-npm))

2. Si no está instalado:
   ```bash
   # Linux (NodeSource)
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

### 9.1.4 Error: PostgreSQL no encontrado

**Síntoma:**
```
psql: command not found
```

**Solución:**

1. Instalar PostgreSQL 15 (ver sección [3.2.1](#321-3-postgresql))

2. Verificar que el servicio está corriendo:
   ```bash
   sudo systemctl status postgresql
   ```

3. Iniciar si no está corriendo:
   ```bash
   sudo systemctl start postgresql
   ```

### 9.1.5 Error: Docker no encontrado

**Síntoma:**
```
docker: command not found
```

**Solución:**

1. Instalar Docker (ver sección [3.2.1](#321-4-docker-y-docker-compose-opcional-pero-recomendado))

2. Verificar que Docker está corriendo:
   ```bash
   sudo systemctl status docker
   ```

3. Iniciar si no está corriendo:
   ```bash
   sudo systemctl start docker
   ```

## 9.2 Problemas de Configuración

### 9.2.1 Error: No se puede conectar a la base de datos

**Síntoma:**
```
org.postgresql.util.PSQLException: Connection refused
```

**Soluciones:**

1. **Verificar que PostgreSQL está corriendo:**
   ```bash
   sudo systemctl status postgresql
   ```

2. **Verificar credenciales en `backend/.env`:**
   ```env
   SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/utec_db
   SPRING_DATASOURCE_USERNAME=ut_user
   SPRING_DATASOURCE_PASSWORD=tu_password
   ```

3. **Verificar que la base de datos existe:**
   ```bash
   psql -U postgres -h localhost -l | grep utec_db
   ```

4. **Si no existe, crearla** (ver sección [6.4.1](#641-crear-usuario-y-base-de-datos))

5. **Para Docker: verificar nombre del host:**
   - Debe ser `db` en lugar de `localhost`
   ```env
   SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/utec_db
   ```

### 9.2.2 Error: Puerto ya en uso

**Síntoma:**
```
Port 8080 is already in use
```

**Soluciones:**

1. **Identificar proceso usando el puerto:**
   ```bash
   sudo lsof -i :8080
   # O
   sudo netstat -tuln | grep 8080
   ```

2. **Terminar proceso:**
   ```bash
   sudo kill -9 PID_DEL_PROCESO
   ```

3. **O cambiar puerto en `backend/.env`:**
   ```env
   SERVER_PORT=8081
   ```

### 9.2.3 Error: Variables de entorno no encontradas

**Síntoma:**
```
Environment variable JWT_SECRET is not set
```

**Solución:**

1. Verificar que existe archivo `backend/.env`
2. Verificar que contiene todas las variables necesarias (ver sección [6.1.1](#611-backendenv))
3. Verificar que no hay espacios alrededor del `=`
4. Reiniciar el backend después de modificar `.env`

### 9.2.4 Error: CORS bloqueado

**Síntoma:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solución:**

1. Verificar que `FRONTEND_URL` en `backend/.env` coincide con la URL del frontend:
   ```env
   FRONTEND_URL=http://localhost:5173
   ```

2. Si usa IP de red:
   ```env
   FRONTEND_URL=http://192.168.x.x:5173
   ```

3. Verificar que el frontend tiene la URL correcta en `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:8080/api/v1
   ```

## 9.3 Problemas de Compilación

### 9.3.1 Error: Dependencias Maven no descargadas

**Síntoma:**
```
Could not resolve dependencies
```

**Soluciones:**

1. **Limpiar cache de Maven:**
   ```bash
   cd backend
   rm -rf ~/.m2/repository
   ./mvnw clean install
   ```

2. **Verificar conexión a internet:**
   ```bash
   ping repo.maven.apache.org
   ```

3. **Verificar que Maven puede acceder a repositorios:**
   ```bash
   ./mvnw dependency:resolve
   ```

### 9.3.2 Error: Dependencias npm no descargadas

**Síntoma:**
```
npm ERR! network timeout
```

**Soluciones:**

1. **Limpiar cache de npm:**
   ```bash
   npm cache clean --force
   ```

2. **Reinstalar dependencias:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Usar mirror de npm (si hay problemas de red):**
   ```bash
   npm config set registry https://registry.npmmirror.com
   npm install
   ```

### 9.3.3 Error: Compilación del backend falla

**Síntoma:**
```
[ERROR] Failed to execute goal org.springframework.boot:spring-boot-maven-plugin
```

**Soluciones:**

1. **Verificar versión de Java:**
   ```bash
   java -version
   # Debe ser 21 o superior
   ```

2. **Limpiar y recompilar:**
   ```bash
   cd backend
   ./mvnw clean install -DskipTests
   ```

3. **Verificar que `pom.xml` no está corrupto:**
   ```bash
   ./mvnw validate
   ```

## 9.4 Problemas de Ejecución

### 9.4.1 Backend no inicia

**Síntomas:**
- El proceso se detiene inmediatamente
- Error en logs

**Diagnóstico:**

1. **Ver logs del backend:**
   ```bash
   tail -f backend/logs/application.log
   ```

2. **Verificar errores comunes:**
   - Base de datos no conectada
   - Variables de entorno faltantes
   - Puerto ocupado

**Solución:**

Ver secciones correspondientes de este capítulo según el error específico.

### 9.4.2 Frontend no carga

**Síntomas:**
- Página en blanco
- Error en consola del navegador

**Diagnóstico:**

1. **Abrir DevTools (F12)**
2. **Ir a pestaña Console**
3. **Verificar errores**

**Soluciones comunes:**

1. **Error de conexión al backend:**
   - Verificar que `VITE_API_URL` en `frontend/.env` es correcta
   - Verificar que el backend está corriendo

2. **Error de compilación:**
   ```bash
   cd frontend
   rm -rf node_modules dist
   npm install
   npm run dev
   ```

3. **Puerto ocupado:**
   - Cambiar puerto en `vite.config.ts`:
     ```typescript
     server: {
       port: 5174
     }
     ```

### 9.4.3 Base de datos no responde

**Síntomas:**
- Timeouts al conectar
- Errores de conexión

**Diagnóstico:**

```bash
# Intentar conectar manualmente
psql -U ut_user -d utec_db -h localhost

# Si falla, verificar:
sudo systemctl status postgresql
```

**Soluciones:**

1. **Reiniciar PostgreSQL:**
   ```bash
   sudo systemctl restart postgresql
   ```

2. **Verificar configuración en `pg_hba.conf`:**
   ```bash
   sudo nano /etc/postgresql/15/main/pg_hba.conf
   ```
   
   Asegurarse de tener:
   ```
   local   all             all                                     peer
   host    all             all             127.0.0.1/32            md5
   ```

3. **Reiniciar PostgreSQL después de cambios:**
   ```bash
   sudo systemctl restart postgresql
   ```

## 9.5 Problemas de Docker

### 9.5.1 Contenedores no inician

**Síntomas:**
- Contenedores se detienen inmediatamente
- Estado "Exited"

**Diagnóstico:**

```bash
# Ver logs de contenedores
docker compose logs

# Ver logs de un servicio específico
docker compose logs backend
```

**Soluciones:**

1. **Verificar variables de entorno:**
   - Asegurarse de que existen archivos `.env`

2. **Verificar que las imágenes se construyeron:**
   ```bash
   docker images | grep utec
   ```

3. **Reconstruir imágenes:**
   ```bash
   docker compose build --no-cache
   docker compose up -d
   ```

### 9.5.2 Problemas de red entre contenedores

**Síntomas:**
- Backend no puede conectar a base de datos
- Frontend no puede conectar a backend

**Soluciones:**

1. **Verificar que usan la misma red Docker:**
   ```bash
   docker network ls
   docker network inspect utec_space_manager_default
   ```

2. **Para backend → base de datos:**
   - Usar nombre del servicio (`db`) en lugar de `localhost`:
     ```env
     SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/utec_db
     ```

3. **Para frontend → backend:**
   - En Docker, usar nombre del servicio (`backend`) o `host.docker.internal`:
     ```env
     VITE_API_URL=http://backend:8080/api/v1
     ```
   - O usar IP del host:
     ```env
     VITE_API_URL=http://host.docker.internal:8080/api/v1
     ```

## 9.6 Problemas de Google OAuth/Gmail API

### 9.6.1 Error: OAuth redirect URI mismatch

**Síntoma:**
```
Error 400: redirect_uri_mismatch
```

**Solución:**

1. Verificar que la URI de redirect en Google Cloud Console coincide exactamente con:
   ```
   http://localhost:8080/api/v1/oauth2/google/callback
   ```

2. Si usa IP de red, también agregar:
   ```
   http://192.168.x.x:8080/api/v1/oauth2/google/callback
   ```

3. Guardar cambios en Google Cloud Console
4. Esperar unos minutos para que los cambios se propaguen

### 9.6.2 Error: Gmail API no envía emails

**Síntomas:**
- No se reciben emails de verificación
- Errores en logs relacionados con Gmail

**Diagnóstico:**

```bash
# Ver logs del backend
tail -f backend/logs/application.log | grep -i "gmail\|email\|send"
```

**Soluciones:**

1. **Verificar credenciales de Gmail API en `backend/.env`:**
   ```env
   GMAIL_CLIENT_ID=xxxxx
   GMAIL_CLIENT_SECRET=xxxxx
   GMAIL_REFRESH_TOKEN=xxxxx
   GMAIL_FROM_EMAIL=tu-email@gmail.com
   ```

2. **Verificar que el refresh token es válido:**
   - El refresh token puede expirar si se revocan permisos
   - Generar nuevo refresh token (ver sección [6.3.3](#633-obtener-refresh-token))

3. **Verificar que Gmail API está habilitada en Google Cloud Console**

4. **Verificar que el email `GMAIL_FROM_EMAIL` es el mismo que autorizaste**

## 9.7 Contacto con Soporte

Si los problemas persisten después de seguir las soluciones de este capítulo:

1. **Recopilar información:**
   - Logs del backend (`backend/logs/application.log`)
   - Logs del frontend (consola del navegador)
   - Logs de Docker (si aplica): `docker compose logs`
   - Versión de Java: `java -version`
   - Versión de Node.js: `node --version`
   - Versión de PostgreSQL: `psql --version`

2. **Documentar el problema:**
   - Pasos para reproducir
   - Mensajes de error exactos
   - Configuración relevante (sin secretos)

3. **Contactar al equipo técnico** con toda la información recopilada

---

# 10. REGISTRO DE CAMBIOS Y VERSIONES

## 10.1 Historial de Versiones del Software

| Versión | Fecha | Descripción |
|---------|-------|-------------|
| **1.0.0** | Noviembre 2025 | Versión inicial del sistema |
| **1.0.1** | Mayo 2026 | Documentación alineada al stack (Docker Compose con Redis/MinIO, React 19 en frontend) |

## 10.2 Historial de Versiones del Manual

| Versión del Manual | Fecha | Descripción | Autor |
|-------------------|-------|-------------|-------|
| **1.0.0** | Noviembre 2025 | Versión inicial del manual de instalación | Equipo Técnico UTEC |
| **1.0.1** | Mayo 2026 | Alineación con `docker-compose`, Redis, MinIO y requisitos de caché | Equipo Técnico UTEC |

## 10.3 Descripción de Modificaciones

### Versión 1.0.1 (Mayo 2026)

**Cambios principales:**
- Alineación con `docker-compose.yml` actual (PostgreSQL, Redis, MinIO, backend, frontend)
- Requisito de Redis para caché; MinIO documentado como opcional
- Eliminación de referencias a `HELP.md` (archivo no versionado)
- Tabla de puertos y verificación post-instalación actualizadas

### Versión 1.0.0 (Noviembre 2025)

**Cambios principales:**
- Creación del manual de instalación inicial
- Documentación completa de instalación local y Docker
- Documentación de configuración de servicios
- Guía de solución de problemas

---

# 11. ANEXOS

## 11.1 Comandos Útiles de Referencia Rápida

### Docker

```bash
# Levantar servicios
docker compose up -d

# Ver logs
docker compose logs -f

# Detener servicios
docker compose down

# Reconstruir imágenes
docker compose build

# Reiniciar servicio específico
docker compose restart backend
```

### Backend (Maven)

```bash
# Compilar
cd backend && ./mvnw clean install

# Ejecutar
./mvnw spring-boot:run

# Tests
./mvnw test

# Tests + reporte de cobertura JaCoCo (HTML en backend/target/site/jacoco/)
./mvnw test jacoco:report

# Análisis estático con SonarQube (requiere instancia configurada)
./mvnw sonar:sonar
```

### Frontend (npm)

```bash
# Instalar dependencias
cd frontend && npm install

# Desarrollo
npm run dev

# Build
npm run build
```

### Base de Datos

```bash
# Conectar
psql -U ut_user -d utec_db -h localhost

# Ver tablas
\dt

# Ver estructura de tabla
\d nombre_tabla
```

## 11.2 Tabla de Puertos

| Puerto | Servicio | Descripción |
|--------|----------|-------------|
| **5173** | Frontend | Interfaz web (desarrollo) |
| **8080** | Backend | API REST |
| **5432** | PostgreSQL | Base de datos |
| **6379** | Redis | Caché de aplicación |
| **9000** | MinIO | API compatible S3 |
| **9001** | MinIO | Consola web MinIO |

## 11.3 Estructura de Directorios de Configuración

```
Proyecto/
├── .env                      # Docker Compose
├── backend/
│   ├── .env                  # Variables backend
│   └── logs/
│       └── application.log   # Logs backend
├── frontend/
│   └── .env                  # Variables frontend
└── scripts/                  # Scripts de configuración
```

## 11.4 Referencia de Variables de Entorno Críticas

### Backend (.env)

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/utec_db
SPRING_DATASOURCE_USERNAME=ut_user
SPRING_DATASOURCE_PASSWORD=***
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=***
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***
GMAIL_REFRESH_TOKEN=***
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_FRONTEND_URL=http://localhost:5173
VITE_GOOGLE_CLIENT_ID=***
```

## 11.5 Checklist de Instalación

Use este checklist para verificar que todos los pasos de instalación se completaron:

### Preparación
- [ ] Java 21 instalado y configurado
- [ ] Node.js 20+ instalado
- [ ] PostgreSQL 15 instalado y corriendo
- [ ] Redis 7+ disponible (local o vía Docker) — requerido por el backend
- [ ] Docker instalado (si usa Docker)
- [ ] Código fuente obtenido

### Configuración
- [ ] Archivo `.env` creado en raíz (si usa Docker)
- [ ] Archivo `backend/.env` creado con todas las variables
- [ ] Archivo `frontend/.env` creado con URLs
- [ ] Base de datos creada
- [ ] Usuario de base de datos creado
- [ ] Google OAuth configurado (si aplica)
- [ ] Gmail API configurado (si aplica)

### Instalación
- [ ] Backend compilado exitosamente
- [ ] Frontend dependencias instaladas
- [ ] Migraciones de base de datos ejecutadas
- [ ] Servicios iniciados correctamente

### Verificación
- [ ] Backend responde en `/actuator/health`
- [ ] Frontend carga en navegador
- [ ] Base de datos conecta correctamente
- [ ] Redis responde (`PONG`) si el backend usa caché Redis
- [ ] MinIO accesible solo si habilitaste almacenamiento (`MINIO_ENABLED=true`)
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] No hay errores en logs

---

**FIN DEL MANUAL DE INSTALACIÓN**

---

**Documento generado:** Mayo 2026  
**Última actualización:** Mayo 2026  
**Versión:** 1.0.1

---


