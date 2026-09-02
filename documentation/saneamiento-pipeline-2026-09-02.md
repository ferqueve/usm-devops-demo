# Saneamiento del pipeline · 2 de septiembre de 2026

Registro del trabajo de una jornada sobre la integración continua, el despliegue y
el análisis estático. Complementa a [`devops.md`](devops.md), que describe **cómo
funciona** el pipeline; este documento cuenta **qué se cambió y por qué**.

Resultado en una línea: la CI volvió a correr y ahora reprueba, el frontend dejó de
servirse con el servidor de desarrollo, aparecieron 52 tests rotos que nadie veía y
cuatro bugs de código que salieron de arreglarlos, y SonarQube bajó de Railway a la
máquina de desarrollo, donde el backend quedó en cero hallazgos.

Diez commits en `dev`, 78 archivos.

## El marcador

| | Antes | Después |
|---|---|---|
| Corridas de CI | rojas desde el 14 ago | verdes |
| Tests en verde | 930 | 982 (452 backend + 530 frontend) |
| RAM del backend | 757 MB | 442 MB (−42 %) |
| Imagen del frontend | dev server de Vite | 99 MB con nginx |
| Escaneo de Sonar | 8 m 36 s | 22 s |
| Hallazgos de Sonar | 177 | 0 |
| Calificaciones | D · C · A | A · A · A |

Todas las cifras están medidas, no estimadas: la memoria sale de la API de Railway
(ventana de 24 h) y de contenedores locales con la aplicación levantada.

## Las dos fallas que iban a explotar

No eran deuda técnica: eran fallas activas que todavía no se habían manifestado.

### Dos lockfiles peleados

`package-lock.json` era del 9 de junio y `pnpm-lock.yaml` del 14 de agosto.
`package.json` se movió con pnpm, así que el lock de npm quedó viejo y la CI moría
con `Missing: locate-path@5.0.0 from lock file`.

Lo que no se veía: `frontend/Dockerfile` hacía `npm ci --frozen-lockfile` contra ese
mismo lock, así que **el próximo push a `main` habría roto el despliegue del
frontend**. No explotó antes porque el último deploy fue el 22 de junio, previo a la
divergencia.

Arreglo: todo a pnpm, con `packageManager` fijado en `package.json` (commit
`f085e63`).

### Producción servía el sitio con el servidor de desarrollo

El contenedor corría `vite --host 0.0.0.0`: código fuente sin minificar módulo por
módulo, sourcemaps, el websocket de HMR expuesto y cero caché de assets.

El Dockerfile pasó a tres etapas: `dev` (el servidor de Vite, que es lo que usa
`docker-compose.yml` en local), `build` y `runtime` (nginx sirviendo `dist/`, target
por defecto). La imagen quedó en 99 MB.

Verificado sobre el contenedor: `/healthz` y las rutas profundas del router dan 200,
un asset inexistente da 404, los assets con hash salen con caché inmutable de un año,
y la URL del backend quedó horneada en el bundle. El build falla a propósito si falta
`VITE_API_URL`: sin ella el bundle apunta a `localhost:8080` y el sitio queda roto en
silencio (commit `be7f4a1`).

## 52 tests rotos que el pipeline ocultaba

Corrían con `-Dmaven.test.failure.ignore=true` y `continue-on-error`, así que
fallaban en silencio: 28 en el frontend y 24 en el backend.

Casi todos eran tests que quedaron viejos tras el refactor de la capa académica:

- **Frontend**: props que ya no existen (`AuditFilters.showFilters`,
  `SpaceCard.canEdit`, `PendingReservationsAlert` pasó de recibir una lista a un
  `count`), textos que cambiaron, y dos archivos que testeaban componentes borrados.
  En `lib/api`, mocks desactualizados: `dashboard.ts` pasó a endpoints paginados y
  `client.ts` sumó un caché de dedupe de 1 s que contaminaba un test con la respuesta
  del anterior.
- **Backend**: servicios que ganaron colaboradores que los tests no inyectaban
  (`AuditService`, la auto-inyección `@Lazy self`, `ReservaItemSolicitadoRepository`),
  un guard nuevo en `EmailService` sin stubear, y consultas que pasaron de `findAll()`
  a queries filtradas.

### Cuatro bugs de código real

Salieron de arreglar lo anterior. Los cuatro producen *unhandled rejections* también
en el navegador, no sólo en la suite:

- `useEspacios`, `useTiposElemento` y `useCarreras` llamaban a una promesa en el
  `useEffect` sin capturar el rechazo.
- `SlowEndpointsCard` tenía `try/finally` sin `catch`: si el actuator no responde, el
  rechazo se escapa de una función que nadie espera.

El último lo encontró la CI. En la máquina de desarrollo no se reproducía porque hay
algo escuchando en el puerto 8080, así que un test unitario estaba haciendo una
petición de red real que «pasaba» por accidente. Se reprodujo apuntando
`VITE_API_URL` a un puerto muerto (commits `bcc878e`, `b20c386`).

## El pipeline

Antes había dos caminos que no se hablaban: `build.yml` verificaba en `dev` y
`deploy.yml` desplegaba desde `main` sin correr nada. Y `build.yml` tampoco
verificaba de verdad, porque todos sus pasos ignoraban los fallos.

La estructura resultante está documentada en [`devops.md`](devops.md). Lo que importa
del cambio:

- **No queda ningún `continue-on-error`.** Si un test falla, la corrida es roja.
- `deploy.yml` llama a `ci.yml` como puerta previa y, al final, **espera a que el
  backend responda `UP` y el frontend `200`**. Antes terminaba en verde apenas subía
  el código, sin saber si la aplicación levantaba.
- Se agregó `concurrency` (dos pushes seguidos a `main` se pisaban entre sí) y el
  commit viaja en el mensaje del deploy: las imágenes se construían con
  `VCS_REF=unknown`, sin forma de saber qué código estaba corriendo.
- Se ejecuta gitleaks, que estaba configurado en el repo (`.gitleaksignore`) pero no
  lo corría nadie, y ruff sobre `ml/` y `ai/`, que se desplegaban sin ninguna
  verificación.
- `main` quedó protegida: PR obligatorio con cero aprobaciones (hay un solo
  mantenedor), sin force-push ni borrado de rama, y **sin aplicarse a admins**, para
  poder saltearla en una emergencia.

## SonarQube, de Railway a la máquina de desarrollo

El motivo no fue el ahorro —era menos de un dólar al mes, porque el apagado
automático ya se había implementado en junio— sino el tiempo y la fragilidad.

El bloque de Sonar era más de la mitad del pipeline: encender el servicio en Railway,
40 s de gracia, sondear, 60 s de warm-up de Elasticsearch, escanear, y si se caía
esperar la recuperación y reintentar. Unas 90 líneas de YAML frágil que
desaparecieron.

El alcance del análisis se redujo a **sólo el backend**. El frontend y los servicios
Python siguen verificándose en `ci.yml`, que es la puerta que bloquea de verdad.

### Los 177 hallazgos

| | Primer escaneo | Después |
|---|---|---|
| Bugs | 7 | 0 |
| Vulnerabilidades | 3 | 0 |
| Security hotspots | 2 | 0 |
| Code smells | 165 | 0 |
| Deuda técnica | 119 h | 0 |
| Duplicación | 0,2 % | 0,2 % |
| Cobertura | 35,6 % | 35,6 % (fuera de alcance) |

#### Arreglado (59 hallazgos)

- **Cinco `.now()` sin zona horaria.** Sonar los marcaba como *code smell*, pero en
  este proyecto son un defecto concreto: `LocalDate.now()` usa la zona del servidor y
  Railway corre en UTC, así que entre las 21 y las 24 hora uruguaya «hoy» ya era el
  día siguiente. Afectaba al recálculo diario de estadísticas, al histórico del
  forecasting y al nombre de los CSV exportados.
- **Tres `InterruptedException` que se tragaban** en `AiService` y los dos health
  indicators: `HttpClient.send` la lanza y, sin re-interrumpir el hilo, se pierde la
  señal de cancelación.
- **Un `Random` nuevo por invocación** en el generador de tráfico, ahora
  `ThreadLocalRandom`.
- **Campos públicos mutables** en dos DTO del panel de sistema: `SlowEndpoint` pasó a
  *record* y `AggregatedError` a getters. El JSON que consume el frontend no cambió.
- **Siete métodos por encima del límite de complejidad**, hasta 30 de 15 permitidos, y
  **un método de nueve parámetros** que ahora agrupa su contexto en un *record*.
- El resto, mecánico: constantes en vez de literales repetidos, `Math.clamp`,
  `entrySet`, `Locale.of`, parámetros sin uso, una excepción propia en vez de
  `RuntimeException`, bucles sin `continue`, javadoc colgado, casts y declaraciones.

#### Falsos positivos (3)

Sonar marcaba `dow == DayOfWeek.SUNDAY` como comparación indebida de una
*value-based class*. `DayOfWeek` es un **enum**: comparar con `==` es correcto,
idiomático y null-safe, y `.equals()` habría empeorado el código para complacer al
analizador. Quedaron marcados como falso positivo en la instancia, con la explicación
escrita en cada uno.

Nota menor: dos hallazgos de «TODO sin completar» eran el analizador leyendo la
palabra española **«todo»** en comentarios. Se reformularon las frases.

#### Riesgos aceptados (6)

Marcados como *accepted* en la instancia, cada uno con su justificación escrita:

- La contraseña del seeder E2E es un fixture de una clase `@Profile("e2e")` que tiene
  que coincidir con `frontend/tests-e2e/fixtures/users.ts`.
- El límite de subida de 50 MB es deliberado, para las imágenes de espacios en alta
  calidad. **Conviene revisarlo si alguna vez se expone a usuarios no autenticados.**
- `JwtService` usa `java.util.Date` porque la API de JJWT lo exige.
- El singleton de `AuditBeanHolder` es intencional y ya estaba explicado en su
  javadoc: el listener de JPA necesita acceso estático al bean.
- Los dos security hotspots son generadores de datos de demo; `Random` alcanza porque
  no hay tokens ni claves de por medio.

#### Fuera de alcance (110)

El 62 % del total es una sola regla de severidad informativa: usar el reloj del
sistema en tests. Los 110 casos son fixtures del tipo `Instant.now().plus(1, DAYS)`,
siempre futuras respecto del reloj real, así que no producen la intermitencia que la
regla busca evitar.

Fijarlas a una fecha concreta las volvería pasado y rompería las validaciones de los
servicios, que sí consultan el reloj real. Hacerlo correctamente exige inyectar un
`Clock` en una veintena de servicios: es una mejora legítima, pero es un refactor
grande con riesgo de regresión para una regla informativa.

Quedó desactivada para `src/test` en `sonar-project.properties`, con el razonamiento
escrito ahí mismo y una nota de qué borrar el día que se inyecte el `Clock`. Se hizo
en configuración versionada, y no marcando 110 issues en la interfaz, para que la
decisión quede visible y revisable en el repositorio.

## Lo que quedó pendiente

- **Terminar la mudanza de Sonar**: faltan las credenciales OAuth de Tailscale
  (`TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`) y actualizar `SONAR_TOKEN` y
  `SONAR_HOST_URL`. Mientras falten, `sonar.yml` se salta solo con un aviso en vez de
  romper la corrida. Después se pueden borrar de Railway los servicios `sonarqube` y
  `Postgres-Sonar`. Detalle en [`devops.md`](devops.md).
- **Decidir si el backend duerme.** Sigue despierto las 24 h porque
  `hikari.keepalive-time` está en 5 minutos: el pool le habla a Postgres para siempre
  y Railway nunca lo ve inactivo. Subir `HIKARI_KEEPALIVE` lo dejaría dormir y
  ahorraría el grueso de los $7,55/mes, a cambio de que la primera petición después de
  la siesta tarde bastante. Es una decisión de producto, no técnica.
- **La cobertura**, que quedó explícitamente fuera de este trabajo: 35,6 % en el
  backend.

## Los diez commits

| SHA | Mensaje |
|---|---|
| `f085e63` | Unificar el frontend en pnpm |
| `be7f4a1` | Servir el frontend compilado con nginx en vez del dev server de Vite |
| `bcc878e` | Arreglar los 52 tests que estaban rotos y ocultos |
| `883666b` | Poner ml y ai bajo lint y dentro del análisis de Sonar |
| `741b3ff` | Bajar la memoria del backend: JRE y tope de heap explícito |
| `df76493` | Rehacer el pipeline: puertas que bloquean y Sonar fuera de Railway |
| `cd94190` | Apuntar pnpm/action-setup al package.json del frontend |
| `b20c386` | Capturar el rechazo de SlowEndpointsCard y aislar su test de la red |
| `e93ca54` | Analizar sólo el backend en SonarQube |
| `9f5f662` | Dejar el backend en cero hallazgos de SonarQube |
