# Refactor capa académica — Materias / Tutorías / Eventos

Estado: **cerrado**. Las 5 fases del refactor más una pasada de rediseño visual,
el 2026-08-14 sobre `feat/capa-academica`.

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

Verificado contra la DB de dev (178 en la primera medición, 114 filtrando canceladas
y reservas no aprobadas):

```
tutoria-vs-reserva | 114
evento-vs-reserva  |   2
tutoria-vs-evento  |   0
```

**Resuelto.** La causa era `AcademicDataInitializer`, que elegía espacio al azar sin mirar
la agenda; ahora usa `OcupacionEspacioService.buscarConflictos` (ver `espacioLibre`). Los
datos viejos se limpiaron re-sembrando con `scripts/reseed-capa-academica.sql` + reinicio.
Después del re-seed: **0 colisiones** en las cuatro combinaciones (tutoría-reserva,
evento-reserva, tutoría-evento, tutoría-tutoría), con 138 de 144 tutorías y 9 de 10 eventos
consiguiendo espacio; el resto cae al fallback sin espacio.

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
| 3 | Unificar tripa tutoría/evento (calendario, ICS, helpers de tiempo, recordatorios, valoraciones) | no (borra duplicado) | **hecha** |
| 4 | Partir `/mias` por rol; emparejar la forma de las rutas | no | **hecha** |
| 5 | Tutorías dentro de Materias; sidebar de 3 ítems a 2 | **sí** | **hecha** |

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

**Sobre unificar participación y feedback.** Se evaluó fusionar `TutoriaReserva` con
`EventoInscripcion` y `TutoriaFeedback` con `EventoFeedback`, y **se decidió no hacerlo**:
cada uno tiene una FK real a su entidad, y una tabla polimórfica cambiaría esa integridad
referencial por nada. Lo que sí estaba duplicado era el **cálculo**: el promedio y la
distribución de estrellas estaban escritos dos veces, idénticos. Eso se extrajo a
`ValoracionAgregada`, sin tocar la base.

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

### Lo que hizo la fase 5

Sidebar: de `Materias / Tutorías / Eventos` a `Materias / Eventos`.

**Tutorías no se eliminó como superficie, se mudó.** El detalle de materia ya tenía un
`TutoriasPanel`, pero como tarjeta angosta en la columna lateral, tercera abajo de
Inscriptos. Y `/tutorias` cargaba cosas que ninguna materia sola puede mostrar: el
progreso y las medallas del estudiante, y el ranking/racha agregado del docente sobre
**todas** sus materias. Borrar la página habría perdido eso.

Quedó en dos niveles:

1. **`/materias?tab=tutorias`** — tercera pestaña, junto a Mapa y Listado. Adentro va
   `TutoriasManagement` completo (con `embedded`, para no repetir el encabezado que ya
   pone la página). Ahí sobreviven el ranking del docente y la gamificación del estudiante.
2. **Detalle de materia** — el `TutoriasPanel` sube a la columna principal, debajo de
   Recursos: es la razón por la que un estudiante entra al detalle, no un dato al costado.
   Las filas pasan a ser navegables al detalle de la tutoría, se muestran en grilla de dos
   columnas y el cupo libre se resalta en verde. El tile de "Recursos" del encabezado se
   reemplaza por uno de "Tutorías".

La ruta `/tutorias` redirige a `/materias?tab=tutorias` para no romper links guardados.
`/tutorias/:id` sigue existiendo: es el detalle, al que ahora se llega desde la materia.
El breadcrumb de ese detalle pasa de `Tutorías › {materia}` a
`Materias › {materia} › Tutoría`, y borrar una tutoría vuelve a su materia.

La pestaña activa vive en la query string, así que el link es compartible.

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

---

## Pasada de rediseño visual

Con el refactor hecho, las tres pantallas seguían sintiéndose raras. El diagnóstico:
**no estaban vacías, estaban llenas del mismo dato**. En el detalle de tutoría,
«Cupo 7 · Agendados 6 · Disponibles 1 · Ocupación 86%» eran cuatro tiles para un número,
más una dona lateral que lo repetía por quinta vez.

El criterio fue **menos elementos, más información distinta**.

### Detalles de tutoría y evento

Eran la misma página con las palabras cambiadas: mismo hero con countdown, mismos 4 tiles,
misma lista con check-in, mismo panel de Estado. En los dos, los tiles se reemplazan por
**una barra de ocupación** con la misma forma, para que se lean igual.

Lo que los distingue pasa a ser el **contenido**, no el color:

- **Tutoría** lidera con `TemariosPanel`: lo que cada estudiante anotó al agendar, agrupado
  por palabras clave y ordenado por frecuencia («Repasar integrales por partes ×5» en vez
  de cinco líneas iguales). El dato se mostraba, pero disperso: una línea por persona, así
  que no se veía qué se repetía.
- **Evento** lidera con la difusión: el QR, el afiche y el link al calendario estaban al
  fondo de la barra lateral, debajo de Estado y Espacio.

También se sacaron: la dona lateral de la tutoría y la barra de cupo dentro del panel de
Inscriptos del evento, que tras el cambio contaba la ocupación por tercera vez.

### Eventos

El calendario mensual ocupaba ~600 px casi vacíos **como vista por defecto** para 10
eventos, y abajo aparecían los mismos 10 otra vez como tarjetas. El calendario pasa a ser
una vista más y la portada es la cartelera.

Las secciones eran rieles horizontales con tarjetas de 280 px fijos, y «Próximos» +
«Cursos abiertos» iban 50/50 sin importar cuántos ítems tenía cada uno: con 4 próximos y
1 curso, los próximos necesitaban 1169 px dentro de 614 px y **la mitad quedaba escondida**
tras un scroll sin flecha ni degradado. Todas las secciones pasan a la grilla que fluye que
ya usaba el camino con filtros en ese mismo archivo.

Un CURSO caía en dos baldes a la vez y se veía dos veces. Y «Cartelera» nombraba dos cosas
en la misma barra: ahora las vistas son Descubrir / Calendario / Todos / Métricas, y el
botón de al lado es «Pantalla completa».

### Materias

**Las tres pestañas se quedan.** La idea de fusionar Mapa y Listado estaba mal: la lista
lateral del mapa está acotada a la carrera del selector, mientras que el listado son las
252 materias de las 18 carreras con sus filtros, el alta y baja del admin y el flujo de
inscripción del estudiante.

Lo que estaba mal era el marco: el H1 decía siempre «Materias» aunque estuvieras mirando
144 tutorías. Ahora cada pestaña trae su título y su bajada, y las etiquetas pasan a
**Plan / Catálogo / Tutorías**, que nombran la tarea en vez del formato — «Mapa» y
«Listado» describían la forma, y por eso el toggle prometía «la misma info de otra manera»
cuando en realidad cada pestaña es otra tarea.

### Bugs que aparecieron en el camino

- `AiService` armaba el mensaje de error con `ex.getMessage()`, que es null en una
  `ConnectException`: el error terminaba siendo «No se pudo contactar al servicio de IA:
  null». Mismo bug que tenían los health indicators de ai-svc y ml-svc, donde además
  `withDetail(clave, null)` tiraba excepción y volteaba `/actuator/health` **entero**.
- Cuando la IA no responde, el backend devuelve 200 con `success: true` y un
  `{status:"error"}` escondido en `data`. Los 8 endpoints pasan ahora por `verificarIA`,
  que lo convierte en un throw con el motivo real.
- El seeder no cargaba ni un temario, así que el panel no se podía ni ver. Ahora 3 de cada
  4 reservas anotan uno, y la mitad de esos pide el tema dominante de esa tutoría: sin
  repetición, el agrupado no muestra para qué sirve.
- Los detalles tenían ocho íconos seguidos sin etiqueta. Las acciones principales ahora
  dicen su nombre y la destructiva va separada.

### Lo que queda pendiente

- `/tutorias/reservas/{id}` sigue usando «reserva», que choca con las `Reserva` de espacios.
- 15 `IllegalArgumentException` de «no encontrado» en `CarreraService`, `EspacioService`,
  `TipoElementoService` y `TipoEspacioService`: sus controllers todavía tienen los catch-all
  que anulan el `GlobalExceptionHandler`. La fase 2 se acotó a la capa académica a propósito.
- Las ideas para darle peso a los tres roles (docente: cerrar el círculo de feedback;
  estudiante: recomendaciones por correlativas; externo: organizar eventos en el espacio que
  reserva) siguen sin empezar.
