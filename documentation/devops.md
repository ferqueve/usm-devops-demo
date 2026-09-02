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

## Imágenes: se construyen una vez y se publican

El pipeline construye cada imagen **una sola vez**, en Actions, y la publica en
GitHub Container Registry. Railway no construye nada: baja ese artefacto y lo
corre. Es el patrón *build once, deploy the artifact*: lo que se verificó es
exactamente lo que corre en producción.

| Servicio | Imagen |
|---|---|
| `utec-backend` | `ghcr.io/mathiaspena/usm-utec-backend` |
| `utec-frontend` | `ghcr.io/mathiaspena/usm-utec-frontend` |
| `ml-svc` | `ghcr.io/mathiaspena/usm-utec-ml` |
| `ai-svc` | `ghcr.io/mathiaspena/usm-utec-ai` |

Cada build publica dos tags: el **SHA del commit**, que permite volver a una
versión exacta, y **`latest`**, que es el que Railway vuelve a bajar en cada
despliegue (`railway redeploy --from-source`).

### Las imágenes son públicas, y es una decisión consciente

Railway sólo admite credenciales de registry privado en el plan Pro; con imágenes
públicas funciona en cualquier plan. Como este es un proyecto académico sin
explotación comercial, se optó por publicarlas: el repositorio sigue siendo
privado, pero el contenido de las imágenes (el `.jar` del backend y el código
Python de `ml` y `ai`) es visible para cualquiera.

Antes de publicarlas se verificó que no hubiera credenciales dentro: todos los
valores sensibles se leen de variables de entorno con default **vacío**
(`${JWT_SECRET:}`, `${GMAIL_CLIENT_SECRET:}`, …), `.env` está excluido en los
cuatro `.dockerignore`, y no hay claves duras en `ml/` ni en `ai/`. El único
literal es el `jwt.secret` de `application-e2e.properties`, que es el fixture de
Playwright y sólo se carga con el perfil `e2e`.

### Las variables del frontend

Vite hornea las `VITE_*` en el bundle, así que tienen que existir **en el build**.
Cuando construía Railway, las tomaba de las variables del servicio; ahora las
provee el repositorio como *variables* (no secrets, porque terminan dentro del
bundle igual): `VITE_API_URL` y `VITE_FRONTEND_URL`.

## Por qué el despliegue vive en GitHub Actions y no en la integración nativa

Railway ofrece autodeploy conectando el repositorio: despliega solo al pushear, y
con el flag **Wait for CI** espera a que las Actions terminen en verde antes de
desplegar. Sería menos código: `deploy.yml` desaparecería entero, junto con el CLI,
el `RAILWAY_TOKEN` y la matriz de cuatro servicios.

Se eligió igual el despliegue explícito desde Actions por dos razones:

1. **El pipeline es parte de lo que se entrega.** Este es un proyecto académico: un
   workflow versionado, revisable y con sus puertas visibles muestra el trabajo de
   integración continua; conectar un repositorio y activar un interruptor no deja
   nada que revisar.
2. **Railway no necesita acceso permanente al repositorio.** Con `railway up` recibe
   un tarball en cada despliegue; con la integración nativa habría que instalar su
   GitHub App con lectura sobre el repo privado, incluidos historial y otras ramas.

Lo que sí se tomó de la plataforma es el **healthcheck**, porque ahí la integración
nativa era mejor: es una configuración del servicio y se aplica a cualquier
despliegue, venga de donde venga.

## Healthchecks

Cada servicio tiene configurado un path que Railway consulta **antes** de mandarle
tráfico a la versión nueva. Hasta que responda 200, la versión anterior sigue
sirviendo; si nunca responde, el despliegue se marca como fallido y no hay caída.

| Servicio | Path | Timeout |
|---|---|---|
| `utec-backend` | `/actuator/health/railway` | 420 s |
| `utec-frontend` | `/healthz` | 180 s |

Dos detalles que costaron encontrarse, y por los que el primer intento habría roto
el despliegue:

- **`/actuator/**` exigía `ROLE_ADMIN`.** La sonda de Railway va sin credenciales, así
  que recibía 403 y el despliegue habría quedado marcado como fallido para siempre.
  Ahora `/actuator/health` y sus grupos son públicos, pero con
  `show-details=when_authorized`: anónimo ve sólo `{"status":"UP"}` y el detalle por
  componente sigue siendo sólo para ADMIN.
- **`/actuator/health` completo agrega `ai-svc` y `ml-svc`**, que duermen por
  inactividad, así que devolvía `DOWN` aunque el backend estuviera perfecto. Por eso
  la sonda usa el grupo `railway`, que incluye únicamente la aplicación y la base de
  datos: que una dependencia esté dormida no debe impedir desplegar el backend.

El sondeo posterior que hace `deploy.yml` se mantuvo aunque Railway ya valide antes:
deja la confirmación escrita en el log de la corrida.

## El puerto del dominio

Cada dominio de Railway apunta a un **puerto destino** del contenedor, y esa
configuración vive en el servicio, no en el repositorio. Al pasar el frontend del
servidor de Vite a nginx, el contenedor pasó a escuchar en 8080 pero el dominio
seguía apuntando al 5173, así que el sitio devolvía 502 con nginx corriendo
perfectamente.

| Servicio | Puerto del contenedor | Puerto del dominio |
|---|---|---|
| `utec-frontend` | 8080 (nginx) | 8080 |
| `utec-backend` | 8080 | 8080 |

Si alguna vez se cambia el puerto que expone un contenedor, hay que actualizar el
puerto destino del dominio en la configuración del servicio (*Settings → Networking*).

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
