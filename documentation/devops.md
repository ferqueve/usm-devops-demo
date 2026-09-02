# Integración y despliegue

Cómo se verifica y se publica USM_UTEC, y qué hay que tener configurado para que
funcione.

## Los cuatro workflows

| Workflow | Cuándo corre | Qué hace | ¿Bloquea? |
|---|---|---|---|
| `ci.yml` | cada PR, cada push a `dev`, y como paso previo de `deploy.yml` | backend (`mvn verify`), frontend (lint + tipos + tests + build), gitleaks, lint de `ml`/`ai` | **sí** |
| `deploy.yml` | push a `main` | corre `ci.yml`; si pasa, sube los 4 servicios a Railway y espera a que respondan | **sí** |
| `sonar.yml` | push a `dev`, o manual | análisis de calidad contra el SonarQube local, por Tailscale | sólo el quality gate |
| `e2e.yml` | manual | Playwright contra el stack completo | sí, cuando se ejecuta |

Nada tiene `continue-on-error` ni `-Dmaven.test.failure.ignore`. Si un test se
cae, la corrida es roja.

## Secrets necesarios

| Secret | Para qué | ¿Configurado? |
|---|---|---|
| `RAILWAY_TOKEN` | desplegar (project token de `usm-utec`/`dev`) | sí |
| `SONAR_TOKEN` | autenticar el scanner | sí, pero hay que regenerarlo en la instancia local |
| `SONAR_HOST_URL` | dónde está SonarQube | hay que cambiarlo al host de Tailscale |
| `TS_OAUTH_CLIENT_ID` | meter el runner en la tailnet | **falta** |
| `TS_OAUTH_SECRET` | ídem | **falta** |

Mientras falten los de Tailscale, `sonar.yml` se salta solo con un aviso: no
rompe la corrida, porque la puerta que bloquea es `ci.yml`.

## SonarQube en la máquina de desarrollo

Antes vivía en Railway y el workflow tenía que encenderlo, esperar el arranque en
frío de Elasticsearch, escanear, reintentar si se caía y apagarlo — más de la
mitad del tiempo del pipeline y unas 90 líneas de YAML frágil.

Levantarlo:

```bash
docker compose -f sonarqube/docker-compose.yml up -d
# la primera vez tarda un par de minutos (init de la base + Elasticsearch)
```

Apagarlo cuando no se use (pide entre 2 y 3 GB de RAM):

```bash
docker compose -f sonarqube/docker-compose.yml down
```

Queda en `http://localhost:9000` (admin/admin la primera vez). La imagen está
pinneada al mismo digest que corría en Railway para que la base no dispare una
migración con cada versión nueva.

### Lo que falta para completar la mudanza

1. Crear el proyecto `USM` en la instancia local y generar un token.
2. Actualizar los secrets `SONAR_TOKEN` y `SONAR_HOST_URL` (este último apuntando
   al nombre de Tailscale de la máquina, por ejemplo `http://desktop:9000`).
3. Crear unas credenciales OAuth en Tailscale con el tag `tag:ci` y cargarlas
   como `TS_OAUTH_CLIENT_ID` y `TS_OAUTH_SECRET`.
4. Borrar de Railway los servicios `sonarqube` y `Postgres-Sonar`.

El historial de issues del proyecto queda en la instancia de Railway. Si importa
conservarlo, hay que exportar su base antes de borrarla; si no, la instancia
local arranca de cero.

## Costo en Railway

Medido el 2 de septiembre de 2026 sobre 24 h, con tarifas de ~$0,000231 por
GB-min:

| Servicio | RAM media | Costo/mes aprox. |
|---|---|---|
| `utec-backend` | 0,757 GB | $7,55 |
| `Postgres-Sonar` | 0,047 GB | $0,47 |
| `sonarqube` | 0 (apagado entre scans) | $0,10 |

El backend es el gasto real, no SonarQube. Dos cosas al respecto:

- **La imagen ahora fija el heap.** `backend/Dockerfile` usa JRE en vez de JDK y
  arranca con `-Xmx384m`. Medido en local, el contenedor pasa de 757 MB a
  ~442 MB. El tope es absoluto y no un porcentaje porque sin límite de
  contenedor `-XX:MaxRAMPercentage=70` pedía un heap de 11 GB.
- **El backend nunca duerme.** `spring.datasource.hikari.keepalive-time` está en
  5 minutos, así que el pool le habla a Postgres para siempre y Railway nunca lo
  ve inactivo. Es una decisión abierta: subir `HIKARI_KEEPALIVE` (o ponerlo en 0)
  como variable del servicio lo dejaría dormir, a cambio de que la primera
  petición después de la siesta tarde bastante. No se cambió por eso.

## Frontend: cómo se sirve

Hasta ahora producción corría `vite --host 0.0.0.0`, o sea el servidor de
desarrollo, sirviendo el código fuente sin minificar con el websocket de HMR
expuesto. Ahora `frontend/Dockerfile` tiene tres etapas:

- `dev` — servidor de Vite, es lo que usa `docker-compose.yml` en local.
- `build` — `pnpm build`.
- `runtime` — nginx sirviendo `dist/`, y es el target por defecto.

Las variables `VITE_*` se hornean **en el build**, no al arrancar. Railway las
pasa como build args porque el Dockerfile las declara con `ARG`. Si falta
`VITE_API_URL` el build falla a propósito: sin ella el bundle apunta a
`localhost:8080` y el sitio queda roto en silencio.

## Gestor de paquetes

El frontend usa **pnpm**, fijado en `package.json` con `packageManager`. Había
dos lockfiles conviviendo (`package-lock.json` de junio y `pnpm-lock.yaml` de
agosto): la CI hacía `npm ci` contra el lock viejo y venía fallando desde el 14
de agosto, y el Dockerfile del frontend habría fallado igual en el siguiente
despliegue.
