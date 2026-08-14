# Refactor capa académica — Materias / Tutorías / Eventos

Estado: **en curso**. Arrancado el 2026-08-14 sobre `feat/capa-academica`.

## Por qué

La capa académica (materias, tutorías, eventos, recursos) se agregó de una para dar
funcionalidad a los roles ESTUDIANTE, DOCENTE y EXTERNO. Se modelaron como tres features
paralelas, pero en el dominio hay **dos conceptos y un catálogo**:

- **Materia** es un catálogo. No tiene tiempo. Tiene código, créditos, semestre, carrera, correlativas.
- **Tutoría** y **Evento** son la misma cosa: una *ocurrencia agendable* — pasa en un rango
  horario, en un espacio, con cupo, alguien se anota, después se califica.

Son dos ejes distintos que no compiten: la tutoría **se parece** al evento, y **depende** de
la materia (`Tutoria.materia_id` es `nullable = false`; las 154 tutorías en DB tienen materia).
El refactor tiene que respetar los dos.

### Duplicación medida

| | Tutoria | Evento |
|---|---|---|
| inicio / fin / cupo / espacio | ✓ | ✓ |
| dueño | docente | organizador |
| estado | ABIERTA/CERRADA/CANCELADA | PUBLICADO/BORRADOR/FINALIZADO/CANCELADO |
| `patron` (recurrencia) | ✓ | ✓ |
| `recordatorioEnviado` | ✓ | ✓ |
| participación | `TutoriaReserva` | `EventoInscripcion` |
| feedback (rating + comentario) | `TutoriaFeedback` | `EventoFeedback` |
| recordatorio programado | `TutoriaScheduledService` (127 líneas) | `EventoRecordatorioScheduledService` (86) |

En el front: `TutoriasCalendario.tsx` y `EventosCalendario.tsx` son el mismo archivo
renombrado (~6 líneas de diferencia real normalizando nombres). `buildICS` / `downloadICS` /
`googleCalUrl` están clonados en `tutoriaCalendar.ts` y `eventoUtils.ts`.

## Problemas encontrados

### 1. Tutorías y eventos no chequean si el espacio está ocupado (bug funcional)

`ReservaService` tiene detección de conflictos hecha y en uso (`findConflictingReservas`,
4 call sites). `TutoriaService` y `EventoService` **nunca la llaman**. Hay tres calendarios
ciegos entre sí sobre el mismo recurso físico.

Verificado contra la DB de dev:

```
tutoria-vs-reserva | 178
evento-vs-reserva  |  10
tutoria-vs-evento  |   0
```

### 1-bis. Los controllers anulan el GlobalExceptionHandler

Descubierto al hacer la fase 1: hay **37 `catch (RuntimeException)`** que atrapan todo y
devuelven un status fijo, sin mirar el tipo — 16 en `TutoriaController`, 11 en
`EventoController`, 10 en `MateriaController`. El `GlobalExceptionHandler` nunca llega a
correr para esos endpoints. Peor: `EventoController.actualizar` devuelve **404** para
cualquier `RuntimeException`.

Por eso el 403 de la fase 2 no alcanza solo con cambiar la excepción: hay que sacar los
catch-all. En la fase 1 se hizo solo el parche mínimo (re-lanzar `EspacioOcupadoException`
en los 4 handlers de crear/editar tutoría y evento); en la fase 2 se sacaron los 47
try/catch de los tres controllers y el status lo decide el `GlobalExceptionHandler` según
el tipo de excepción.

**Contrato de errores resultante** (para replicar en el resto de la app):

| Excepción | Status | Cuándo |
|---|---|---|
| `AccesoDenegadoException` | 403 | no sos el dueño ni gestor |
| `RecursoNoEncontradoException` | 404 | no existe o está borrado |
| `IllegalArgumentException` | 400 | lo que mandaste está mal |
| `EspacioOcupadoException` | 409 | el aula ya está tomada |
| `IllegalStateException` | 409 | conflicto de estado (cupo lleno, ya inscripto) |
| `MissingServletRequestParameterException` | 400 | falta un query param requerido |

### 2. Authz devuelve el código equivocado

Los chequeos de dueño tiran `IllegalStateException("No tienes permiso...")` y
`GlobalExceptionHandler:87` lo mapea a **409 CONFLICT** en vez de 403. Además el mismo
chequeo está copiado 7 veces dentro de `TutoriaService` (líneas 105, 213, 280, 330, 344,
591, 609).

### 3. Tres vocabularios para la misma acción

| | anotarse | ver lo mío | cancelar |
|---|---|---|---|
| materia | `POST /materias/{id}/inscripciones` | `/materias/inscripciones/mias` | `DELETE /materias/inscripciones/{inscId}` |
| tutoría | `POST /tutorias/{id}/agendar` | `/tutorias/mias` | `DELETE /tutorias/reservas/{resId}` |
| evento | `POST /eventos/{id}/inscripciones` | `/eventos/mias/inscripciones` | `DELETE /eventos/{id}/inscripciones` ← por id del evento |

Y `/mias` cambia de contrato según el rol: en `MateriaService:116`, si sos docente devuelve
las que dictás; si no, las que cursás.

### 4. Dos sistemas de recursos paralelos

`RecursoAcademico` es el completo (archivo a MinIO, mime, tamaño, subidoPor, páginas).
`TutoriaRecurso` es degenerado: solo `titulo` + `url`, no soporta archivos. Un docente que
sube un PDF a su materia no lo puede compartir en la tutoría de esa misma materia.

### 5. Tres mecanismos distintos de gating por rol en el front

- `MateriasManagement` usa `hasPermission()` — el correcto, y lo usa **una sola vez**.
- `TutoriasManagement` hardcodea `const DOCENTE_ROLES = [...]`.
- `EventosManagement` hardcodea `const ADMIN_ROLES = [...]`, redefinido idéntico en `MateriaDetail.tsx`.

El sistema de permisos de `permissions.ts` está bien pensado; simplemente no se usó.

### Inconsistencias visuales de paso

- Día de hoy en el calendario: `bg-utec-blue` en tutorías, `bg-utec-cyan` en eventos.
- Eventos rellena la última semana de la grilla (`while (cells.length % 7 !== 0)`), tutorías no
  → la grilla se estira distinto.
- Botón de vista activa con distinto color en cada pantalla.

## Modelo objetivo

```
Materia (catálogo, sin tiempo)
  └── recursos, correlativas, inscriptos, docente

Actividad (ocurrencia agendable) ──── ocupa Espacio en un rango
  ├── Tutoría  → cuelga de Materia, dueño = docente
  └── Evento   → suelto, dueño = organizador
       └── participación + feedback + recordatorio: compartidos
```

Materia sube de nivel (pasa a ser el hub real). Evento queda aparte — es la superficie
del rol EXTERNO, otro público. Se unifica la **tripa** que comparten, no la identidad.

**No** fusionar `Tutoria` y `Evento` en una tabla con discriminador: comparten forma pero
tienen reglas distintas (tutoría necesita materia y docente; evento tiene borrador/público
y audiencia externa).

## Fases

| # | Qué | Visible | Estado |
|---|-----|---------|--------|
| 1 | Chequeo de espacio ocupado en tutorías y eventos | no (arregla bug) | **hecha** |
| 2 | Authz → 403 en vez de 409, chequeo de dueño extraído | no | **hecha** |
| 3 | Unificar tripa tutoría/evento (calendario, ICS, helpers de tiempo, recordatorios) | no (borra duplicado) | **parcial** |
| 4 | Partir `/mias` por rol; emparejar la forma de las rutas | no | **hecha** |
| 5 | Tutorías como pestaña dentro del detalle de materia | **sí** | pendiente |

Lo visual va último a propósito: si se mueve la navegación antes de unificar la tripa, queda
el mismo código duplicado repartido en dos secciones — peor de mantener.

### Lo que la fase 3 dejó compartido

| Antes (duplicado) | Ahora (compartido) |
|---|---|
| `tutoriaCalendar.ts` + mitad de `eventoUtils.ts` | `lib/agenda/ics.ts` |
| `TutoriasCalendario.tsx` + `EventosCalendario.tsx` | `components/agenda/AgendaCalendario.tsx` |
| helpers de tiempo en `eventoUtils.ts` (que tutorías ya importaba) | `lib/agenda/tiempo.ts` |
| esqueleto de los dos schedulers | `RecordatorioAgendaService` |

La pieza clave es `lib/agenda/types.ts`: el tipo `Agendable` con `tutoriaToAgendable` /
`eventoToAgendable`. Todo lo que sólo necesita "pasa en un rango, en un lugar" se escribe
contra ese tipo y no contra la entidad.

**Falta de la fase 3** (se puede hacer aparte): unificar participación
(`TutoriaReserva` / `EventoInscripcion`) y feedback (`TutoriaFeedback` /
`EventoFeedback`), que son duplicación de modelo y tocan la DB.

### Lo que hizo la fase 4

**Se descartó la idea de "un solo vocabulario".** Para una tutoría *agendás* un horario;
a una materia te *inscribís* por semestre. Son verbos distintos porque son cosas distintas
— unificarlos habría perdido significado. Lo que sí estaba mal era la **forma** de las
rutas y el `/mias` polimórfico.

`/materias/mias` y `/tutorias/mias` devolvían una cosa u otra **según el rol de quien
preguntaba**, y lista vacía sin avisar para los roles que no eran ni docente ni estudiante.
El front ya sabía desde qué vista llamaba (`DocenteMateriasView` vs `EstudianteMateriasView`
usaban el mismo hook), o sea que la información estaba y el backend la estaba adivinando.

| Antes | Ahora |
|---|---|
| `GET /materias/mias` (según rol) | `GET /materias/dictadas` + `GET /materias/cursando` |
| `GET /tutorias/mias` (según rol) | `GET /tutorias/dictadas` + `GET /tutorias/agendadas` |
| `GET /eventos/mias/inscripciones` | `GET /eventos/inscripciones/mias` (igual que materias) |
| `DELETE /eventos/{id}/inscripciones` | `DELETE /eventos/{id}/inscripciones/mia` |

En el front, `useMisMaterias()` pasa a `useMisMaterias('dicto' \| 'curso')` y el scope de
`useTutorias` pasa de `'mias' \| 'todas'` a `'dictadas' \| 'agendadas' \| 'todas'`.

**Queda pendiente** (no se hizo para no romper el modelo a mitad de camino):
`/tutorias/reservas/{id}` usa la palabra "reserva", que choca con las `Reserva` de espacios
— sobre todo ahora que la fase 1 los hizo interactuar. Renombrar solo la ruta dejaría la
ruta y el modelo `TutoriaReserva` con nombres distintos, así que va junto con la
unificación de participación.

### Ojo con el typecheck del front

`npx tsc --noEmit` sobre `tsconfig.json` **no chequea nada**: el config raíz tiene
`"files": []` y usa project references. Hay que correr
`npx tsc -p tsconfig.app.json --noEmit`. Con eso el repo tiene 61 errores preexistentes
(imports sin usar, `Permission` vs `string`, etc.) en módulos ajenos a la capa académica.

### Resultado visual (fase 5)

Sidebar: de `Materias / Tutorías / Eventos` a `Materias / Eventos`.
El detalle de materia gana una pestaña:

```
Info   Correlativas   Recursos   Tutorías
```

**A reubicar, no perder:** el panel de "mi ranking / mi racha / mis estudiantes" del docente
vive hoy en `/tutorias` y agrega sobre **todas** sus materias — no entra en la ficha de una
materia sola. Va al dashboard del docente.

## Después del refactor: dar peso a los tres roles

Toda la inteligencia construida apunta hoy solo a ADMIN/ANALISTA:

| Motor existente | Hoy sirve a |
|---|---|
| `ForecastingService` | analista |
| `RecomendacionService` ×4 | analista |
| `SostenibilidadService` | admin |
| `AiService` + servicio Python | analista |
| `EmailService` / recordatorios | todos |

Lo que les toca a los tres roles: DOCENTE tiene `recomendacion:solicitar`, ESTUDIANTE tiene
`estadisticas:ver`, EXTERNO nada. **Darles peso = apuntarles los motores que ya existen.**

### Ya construido y sin usar (lo más barato)

`POST /insights/resumen-temario` y `POST /insights/generar-evento` están completos —
backend, servicio Python, cliente del front. **Ninguna pantalla los llama.**

El de temario es el de mayor retorno porque el dato ya se guarda: al agendar, el estudiante
escribe `TutoriaReserva.temario`, y ya existe `GET /tutorias/{id}/temarios` para el docente.
Falta conectar el resumen:

> **Antes de tu tutoría del jueves** — 6 anotados. Cuatro preguntan por integrales por
> partes, dos por sustitución trigonométrica.

### Por rol

- **Docente** — cerrar el círculo: ya hay `TutoriaFeedback` (rating), asistencia, racha y
  ranking, pero sueltos en tres pantallas. Falta el agregado: "tus tutorías de Cálculo I:
  34 inscriptos, 12 vinieron, promedio 4.6, temas más pedidos".
- **Estudiante** — que la app diga qué hacer, no qué hay. Con inscripciones + correlativas +
  el motor de recomendaciones: "te falta Cálculo I para cursar Física II, y hay tutoría el jueves".
- **Externo** — el rol más flojo y el más fácil. Hoy hace dos cosas desconectadas: se anota a
  eventos y pide espacios (tiene `reserva:crear`, `reserva:ver_propias`, `reserva:cancelar`,
  `espacio:ver`). Unirlas: que pueda **organizar** un evento en el espacio que reserva —
  el circuito de aprobación ya existe (`Reserva.analistaAsignado`, `motivoSolicitud`,
  `mensajeAnalista`).

**Las features nuevas van después del refactor**, no antes: el forecast y las recomendaciones
necesitan que tutoría/evento/reserva compartan el concepto de ocupación de espacio. Si se hacen
antes, hay que escribir el forecast tres veces, uno por cada calendario ciego.
