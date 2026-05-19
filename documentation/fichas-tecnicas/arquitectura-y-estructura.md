# Ficha técnica · Arquitectura y Estructura del Proyecto

## 1. Resumen ejecutivo

UTEC Space Manager es una aplicación web cliente-servidor compuesta por un backend Spring Boot que expone una API REST y un frontend en React + Vite. El sistema utiliza PostgreSQL como base de datos principal, Redis para caché de cómputos costosos, y MinIO (opcional) como almacenamiento S3-compatible para archivos. Toda la pila está dockerizable mediante Docker Compose y soporta tanto despliegue manual como con imágenes pre-construidas.

La estructura del repositorio separa claramente los dos componentes (`backend/` y `frontend/`), mantiene las migraciones de base de datos versionadas con Liquibase y centraliza la documentación en `documentation/`. Los archivos sensibles se manejan vía variables de entorno y los `.env.example` documentan qué variables son necesarias para cada servicio.

---

## 2. Cómo se usa

Esta ficha es una referencia para desarrolladores que necesitan ubicarse en el proyecto. No describe cómo instalar el sistema (eso vive en `documentation/manuales/manual-de-instalacion.md`) ni cómo usarlo (eso vive en el manual de usuario).

Casos de uso típicos:

- "Necesito agregar un endpoint nuevo": ver §3.2 (módulos backend).
- "Necesito agregar una pantalla nueva": ver §3.3 (módulos frontend).
- "Necesito agregar una migración": ver §3.4 (Liquibase).
- "Necesito entender qué variables de entorno se cargan": ver §3.6.

---

## 3. Detalle técnico

### 3.1 Estructura de alto nivel del repositorio

```
USM_UTEC/
├── backend/                           Backend Spring Boot
├── frontend/                          Frontend React + Vite
├── documentation/                     Documentación markdown (manuales + fichas técnicas)
├── scripts/                           Scripts utilitarios para entornos locales
│   └── e2e.sh                         Orquestador de pruebas extremo a extremo
├── .github/workflows/                 CI: build.yml, docker-push.yml
├── docker-compose.yml                 Compose con build local
├── docker-compose.hub.yml             Compose con imágenes pre-construidas (Docker Hub)
├── package.json                       Scripts npm a nivel raíz
├── README.md
├── PLAN_DE_DOCUMENTACION.md           Plan global de documentación
├── .env.example                       Template de variables para Docker Compose
├── .gitignore, .gitguardian.yaml, .gitleaksignore   Seguridad de git
└── UTEC - PF - USM.code-workspace
```

### 3.2 Backend — `backend/`

**Stack**: Spring Boot 3.5.6 sobre Java 21. Maven como build tool (con wrapper `mvnw`/`mvnw.cmd`).

**Dependencias principales** (declaradas en `backend/pom.xml`):

- Web y seguridad: Spring Boot Web, Spring Security, OAuth2 Client.
- Persistencia: Spring Data JPA, PostgreSQL JDBC, H2 (tests), Liquibase para migraciones.
- Caché y mensajería: Spring Data Redis, Spring Cache.
- Procesos: Spring Batch (jobs), Spring AOP (auditoría).
- Operación: Spring Boot Actuator, SpringDoc OpenAPI (Swagger UI).
- Servicios externos: Google API client (Gmail), MinIO Java SDK.
- Autenticación: jjwt (firma y validación de JWT).
- Productividad: Lombok, spring-dotenv (carga `.env` en desarrollo).

**Estructura de paquetes** (`backend/src/main/java/com/utec/backend/`):

```
backend/src/main/java/com/utec/backend/
├── BackendApplication.java          Entry point Spring Boot
├── audit/                           Auditoría AOP
│   ├── AuditAspect.java
│   ├── AuditContext.java
│   ├── AuditEntityListener.java
│   └── AuditRequestFilter.java
├── common/                          ApiResponse y wrappers genéricos
├── config/                          Configuración de beans Spring
│   ├── ActuatorConfig.java
│   ├── JacksonConfig.java
│   ├── MethodSecurityConfig.java
│   ├── MinioConfig.java
│   ├── RedisConfig.java
│   ├── SecurityConfig.java
│   └── WebMvcConfig.java
├── controller/                      Controladores REST (capa HTTP)
├── dto/                             Data Transfer Objects de entrada/salida
├── exception/                       Excepciones custom (UsuarioNotFoundException,
│                                      AccesoDenegadoException, AuthenticationException,
│                                      FileStorageException, EmailDeliveryException)
│                                      + GlobalExceptionHandler
├── model/                           Entidades JPA (sin subcarpeta entity/)
├── repository/                      Interfaces Spring Data
├── security/                        Permisos, JWT, interceptors
│   ├── jwt/                         Generación y validación de tokens
│   ├── interceptor/                 Filtros e interceptores HTTP
│   ├── Constants.java               Nombres de roles
│   ├── CustomPermissionEvaluator.java
│   ├── Permission.java              Enum legacy (ver deuda técnica)
│   └── RolePermissions.java         Fuente de verdad rol→permisos
├── service/                         Lógica de negocio
└── util/                            Utilidades (CSV, init datos dev, helpers de rol)
```

Recursos:

- `backend/src/main/resources/application.properties` — configuración base.
- `backend/src/main/resources/application-dev.properties` — perfil de desarrollo (CORS, logging detallado).
- `backend/src/main/resources/application-prod.properties` — perfil de producción.
- `backend/src/main/resources/db/changelog/` — migraciones Liquibase (ver §3.4).
- `backend/src/test/` — tests JUnit 5 + Mockito + Spring Boot Test.

Dockerfile multi-stage: `maven:3.9.6-eclipse-temurin-21` para build, `eclipse-temurin:21-jdk` para runtime. Artefacto generado: `target/backend-0.0.1-SNAPSHOT.jar`.

### 3.3 Frontend — `frontend/`

**Stack**: React 19 + TypeScript 5 + Vite 7. Tailwind CSS v4 sin archivo de configuración (el tema vive en `frontend/src/index.css` mediante la directiva `@theme`). shadcn/ui en estilo "new-york" para componentes base.

**Estructura de carpetas** (`frontend/src/`):

```
frontend/src/
├── App.tsx                            Componente raíz + router
├── main.tsx                           Entry point
├── index.css                          Estilos globales + tema Tailwind v4 + utilidades UTEC
├── vite-env.d.ts
├── app/                               Páginas (una carpeta por área de la app)
│   ├── audit/, auth/, calendar/, dashboard/, inventory/,
│   ├── reservations/, rooms/, statistics/, system/, users/
├── components/                        Componentes por feature
│   ├── ui/                            Componentes base (shadcn + propios)
│   ├── layouts/                       DashboardLayout, sidebar, header
│   ├── auth/, audit/, calendar/, common/, dashboard/, inventory/,
│   ├── preferences/, public/, recomendaciones/, reservations/,
│   ├── rooms/, spaces/, statistics/, system/, users/
├── contexts/                          authContext.ts + AuthProvider.tsx
├── hooks/                             useAuth, useCarreras, useEspacios,
│   ├                                  use-mobile, usePreferences, useRecomendaciones,
│   └                                  useRolePermissions, useSidebarTransition,
│                                      useSystemMetrics, useTiposElemento
├── lib/                               Cliente API y utilidades
│   ├── api/                           Servicios HTTP por dominio
│   ├── config/                        Constantes y configuración
│   ├── types/                         Tipos TypeScript compartidos
│   └── utils/                         Helpers (cn, fechas, csv, etc.)
└── data/                              Datos estáticos / mocks
```

Configuración:

- `package.json` — scripts (`dev`, `dev:network`, `build`, `lint`, `preview`).
- `vite.config.ts` — plugins (incluye `@tailwindcss/vite`), aliases.
- `tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json` — TypeScript multi-target.
- `eslint.config.js` — configuración de lint.
- `components.json` — configuración de shadcn/ui.
- Sin `tailwind.config.*` (Tailwind v4).

Dockerfile basado en `node:20-alpine` para desarrollo. Imagen de producción genera estáticos con `npm run build` y los sirve detrás de un servidor estático.

### 3.4 Migraciones de base de datos

Ubicación: `backend/src/main/resources/db/changelog/`.

```
db.changelog-master.xml                Archivo maestro
cambiosdb/                             Migraciones numeradas, en orden de aplicación
├── 001-create-tables.xml
├── 002-add-pass-user.xml
├── 002-rename-salon-to-espacio.xml
├── 003-add-user-fields.xml
├── 003-create-tipo-elemento-and-update-inventario.xml
├── 004-remove-inventario-fields.xml
├── 005-make-espacio-nullable.xml
├── 006-add-espacio-color.xml
├── 007-move-color-to-tipo-espacio.xml
├── 008-add-espacio-estado.xml
├── 009-create-carrera-table.xml
├── 010-add-carrera-to-reserva.xml
├── 011-create-reserva-item-solicitado.xml
├── 012-add-analista-to-reserva.xml
├── 013-create-usuario-configuracion.xml
├── 014-add-recomendaciones-fields.xml
├── 015-add-es-publica-to-reserva.xml
├── 016-migrate-to-timestamptz.xml
├── 017-create-edificio-table.xml
├── 018-add-edificio-to-espacio.xml
├── 019-add-mensaje-cancelacion-to-reserva.xml
├── 020-enhance-audit-log.xml
├── 021-create-hechos-tables.xml
└── 022-create-ml-tables.xml
```

La migración 022 crea las tablas `modelo_forecast` y `prediccion_reserva`, que persisten los resultados del pipeline de Machine Learning (servicio `ml-svc` en Python). Ver `pipeline-de-ml.md` para el detalle del modelo, los hiperparámetros y la arquitectura de servicios.

La migración 021 introduce la **capa analítica**: dos tablas de hechos (`hechos_reserva_diario`, `hechos_inventario_diario`) que se mantienen separadas del modelo transaccional y se pueblan por un scheduler nocturno (`EstadisticasScheduledService`). Estas tablas alimentan los endpoints nuevos bajo `/api/v1/stats/reservas/*` y constituyen la base sobre la cual se calculan métricas como ocupación, heatmap, tasa de cancelación, distribución por edificio y top usuarios. Ver `sistema-de-estadisticas.md` para el detalle del modelado dimensional y la justificación de mantener todo en el mismo Postgres en lugar de un DWH separado.

`db.changelog-master.xml` usa `<includeAll path="db/changelog/cambiosdb"/>`, por lo que agregar una migración nueva sólo requiere depositar el XML numerado en esa carpeta.

Liquibase corre automáticamente al iniciar el backend (`spring.liquibase.enabled=true`).

### 3.5 Servicios y orquestación (Docker Compose)

`docker-compose.yml` (build local):

| Servicio | Imagen / Build | Puerto | Función | Lenguaje |
|---|---|---|---|---|
| `db` | `postgres:15` | 5432 | Base de datos principal | — |
| `redis` | `redis:7-alpine` | 6379 | Caché de recomendaciones y estadísticas | — |
| `minio` | `minio/minio:latest` | 9000 (S3), 9001 (consola) | Almacenamiento de archivos S3-compatible (opcional) | — |
| `backend` | `./backend` (multi-stage) | 8080 | API REST principal | Java (Spring Boot) |
| `frontend` | `./frontend` | 5173 | App web | TypeScript (React + Vite) |
| `ml-svc` | `./ml` | 8000 | Pipeline de Machine Learning (forecasting) | Python (FastAPI + Prophet) |

Dependencias: `backend` depende de `db`, `redis` y `minio`. `frontend` depende de `backend`. `ml-svc` depende sólo de `db` (no participa en el camino crítico del backend).

El proyecto adopta deliberadamente un stack **políglota** en el que cada servicio usa el lenguaje más adecuado a su dominio: Java para la lógica transaccional con tipado fuerte y orientación a objetos, TypeScript para la UI web reactiva, y Python para el pipeline de Machine Learning donde el ecosistema (Prophet, pandas, scikit-learn) es el estándar industrial.

`docker-compose.hub.yml` reemplaza los builds locales por imágenes publicadas en Docker Hub (`mathiaspena/utec-backend:latest`, `mathiaspena/utec-frontend:latest`). Está pensado para despliegues rápidos sin compilar.

### 3.6 Variables de entorno

El sistema separa variables por componente con archivos `.env` independientes. Plantillas en el repositorio:

- `.env.example` (raíz) — variables para Docker Compose.
- `backend/.env.example` — variables del backend.
- `frontend/.env.example` — variables del frontend.

Detalle completo en el manual de instalación, sección 6.1.

> **Particularidad de carga**: el `pom.xml` declara `-Ddotenv.file=../.env`, por lo que cuando se ejecuta `./mvnw spring-boot:run` desde la carpeta `backend/`, se lee el `.env` de la raíz del proyecto, no el de `backend/`. Con Docker Compose esto no aplica porque las variables se inyectan desde el compose.

### 3.7 CI/CD

`.github/workflows/`:

- `build.yml` — pipeline de build y tests.
- `docker-push.yml` — publica imágenes en Docker Hub.

Herramientas adicionales configuradas en el repo:

- **JaCoCo**: cobertura de tests Java. Se ejecuta con `./mvnw test jacoco:report` (reporte HTML en `backend/target/site/jacoco/`).
- **SonarQube**: análisis estático del backend (`./mvnw sonar:sonar`).
- **GitGuardian** y **GitLeaks**: detección de secretos en commits.

---

## 4. Métricas / evidencia

- **Componentes principales**: 2 (backend, frontend).
- **Servicios en orquestación**: 5 (db, redis, minio, backend, frontend).
- **Migraciones Liquibase aplicadas**: 22 (numeradas 001 a 020, con dos números repetidos por convivencia de cambios paralelos: 002 y 003).
- **Paquetes backend**: 12 paquetes raíz (`audit`, `common`, `config`, `controller`, `dto`, `exception`, `model`, `repository`, `security`, `service`, `util` + `BackendApplication`).
- **Áreas frontend** (`app/`): 10 (audit, auth, calendar, dashboard, inventory, reservations, rooms, statistics, system, users).
- **Carpetas de componentes**: 17 áreas dentro de `frontend/src/components/`.
- **Hooks personalizados**: 10.

---

## 5. Riesgos, limitaciones y TODOs

### 5.1 Limitaciones conocidas

- **Numeración duplicada en migraciones Liquibase**: existen dos archivos `002-*` y dos `003-*`. Liquibase los aplica en el orden definido por el master XML, así que funcionalmente está bien, pero puede confundir. Convendría renumerar al hacer una limpieza.
- **Doble fuente de permisos en backend**: ver `documentation/fichas-tecnicas/roles-y-permisos.md` §5.1.
- **El `.env` que carga el backend cuando corre con Maven no es el de `backend/`** sino el de la raíz, lo que puede sorprender (ver §3.6).
- **No hay infraestructura como código** (Terraform, Ansible) para el despliegue: el manual de instalación documenta pasos manuales.

### 5.2 TODOs

- [ ] Renumerar las migraciones Liquibase para eliminar duplicados de `002` y `003`.
- [ ] Documentar la convención de nombrado para nuevos módulos backend y frontend (por ejemplo, ¿plural o singular en nombres de carpetas?).
- [ ] Sumar un diagrama visual de arquitectura (componentes + flujos) y enlazarlo desde acá.
- [ ] Sumar una sección de "decisiones de arquitectura" (ADR) que registre los porqués (elección de Liquibase, MinIO opcional, JWT en vez de sesiones, etc.).
