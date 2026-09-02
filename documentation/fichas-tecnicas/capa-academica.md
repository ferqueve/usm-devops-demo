# Ficha técnica · Capa Académica (Materias, Tutorías, Eventos)

## 1. Resumen ejecutivo

UTEC Space Manager incorpora una **capa académica** que extiende el sistema más allá de la reserva de espacios, agregando cuatro dominios conectados: **Materias** (catálogo de asignaturas), **Recursos académicos** (archivos y enlaces por materia), **Tutorías** (franjas horarias que un docente ofrece y los estudiantes agendan) y **Eventos** (eventos y cursos de oferta abierta con inscripción). Todos comparten un mismo lenguaje de UI (KPIs en `StatStrip`, detalle por ruta con layout *bento*, acciones de edición/estado, búsqueda y filtros) y se integran con espacios, carreras y usuarios existentes.

Cada dominio tiene **vistas diferenciadas por rol**: el administrador/analista gestiona el catálogo y la oferta, el docente produce contenido (sus materias, recursos y tutorías) y el estudiante consume (se inscribe, accede a recursos, agenda tutorías y se anota a eventos). La capa también alimenta el dashboard de Sostenibilidad (ver ficha aparte), que deriva su impacto ambiental de los recursos digitales subidos.

---

## 2. Cómo se usa

Para la guía orientada al usuario final, ver el manual de usuario (capítulos de Materias, Tutorías y Eventos). Resumen por rol:

- **Admin / Analista:** crea y administra materias (alta/edición/baja, asignar docente y carrera), supervisa todas las tutorías y eventos, ve inscriptos, cambia estados y notifica por email.
- **Docente:** ve "Mis materias", sube recursos, crea y gestiona sus tutorías, ve a sus inscriptos.
- **Estudiante:** se inscribe a materias, consulta recursos, agenda tutorías (ocupa una plaza) y se anota a eventos publicados.
- **Externo:** solo ve e inscribe a eventos públicos.

Cada entidad tiene una **página de detalle** propia (`/materias/:id`, `/tutorias/:id`, `/eventos/:id`) con un diseño tipo *bento*: tarjeta de identidad + *stat tiles* de color + paneles de contenido (inscriptos/agendados, recursos, ocupación, contexto).

---

## 3. Detalle técnico

### 3.1 Modelo de datos

| Entidad | Campos clave | Relaciones |
|---|---|---|
| `Materia` | nombre, codigo, descripcion, semestre, creditos | `carrera`, `docente` (Usuario) |
| `InscripcionMateria` | estado (`ACTIVA`/`CANCELADA`) | `materia`, `estudiante` |
| `RecursoAcademico` | titulo, descripcion, tipo (`ARCHIVO`/`ENLACE`), url, mimeType, tamanoBytes, paginasEstimadas | `materia`, `subidoPor` |
| `Tutoria` | inicio, fin, cupo, estado (`ABIERTA`/`CERRADA`/`CANCELADA`) | `materia`, `docente`, `espacio` |
| `TutoriaReserva` | estado (`AGENDADA`/`CANCELADA`) | `tutoria`, `estudiante` |
| `Evento` | titulo, descripcion, tipo (`EVENTO`/`CURSO`), inicio, fin, cupo, esPublico, estado (`BORRADOR`/`PUBLICADO`/`FINALIZADO`/`CANCELADO`) | `espacio`, `organizador` |
| `EventoInscripcion` | estado (`INSCRITO`/`ESPERA`/`ASISTIO`) | `evento`, `usuario` |

> Los **estados de inscripción a eventos** se reutilizan para implementar la **lista de espera** (`ESPERA` cuando el cupo está lleno) y el **check-in de asistencia** (`ASISTIO`) sin tablas adicionales.

### 3.2 Endpoints (backend `controller/`)

**Materias** (`/api/v1/materias`): `GET /`, `/mias`, `/{id}`, `/por-carrera/{carreraId}`, `/{id}/inscriptos`; `POST`, `PUT /{id}`, `DELETE /{id}`; `POST /{id}/inscripciones` (auto), `GET /inscripciones/mias`, `DELETE /inscripciones/{id}`; **admin:** `POST /{id}/inscripciones/admin`, `DELETE /inscripciones/{id}/admin`; `POST /{id}/notificar`.

**Tutorías** (`/api/v1/tutorias`): `GET /` (`?materiaId`), `/mias`, `/{id}`, `/{id}/agendados`; `POST`, `PUT /{id}`, `DELETE /{id}`; `POST /{id}/agendar`, `DELETE /reservas/{id}`; `POST /{id}/notificar`. Editar/eliminar permitido al **docente dueño o admin/analista**.

**Eventos** (`/api/v1/eventos`): `GET /`, `/{id}`, `/{id}/inscriptos`, `/mias/inscripciones`; `POST`, `PUT /{id}`, `DELETE /{id}`; `POST /{id}/inscripciones` (entra en `ESPERA` si está lleno); `PUT /inscripciones/{id}/asistencia?asistio=` (check-in); `POST /{id}/notificar`.

Notificaciones por email vía `EmailService.enviarNotificacionSimple(...)`.

### 3.3 Frontend

- Páginas: `frontend/src/app/{materias,tutorias,eventos}/page.tsx` y `.../[id]/page.tsx` (detalle por ruta, registradas en `App.tsx`; `RoleProtectedRoute` + rutas `/x/:id` agregadas en `lib/config/constants.ts`; el sidebar marca activo el detalle).
- Componentes: `frontend/src/components/{materias,tutorias,eventos,recursos}/`.
- API: `frontend/src/lib/api/{materias,tutorias,eventos,recursos}.ts`. Tipos en `lib/types/`.
- Patrón común: KPIs con `StatStrip` (celdas de color UTEC), filtros (búsqueda + selects), tabla/cards ordenables, detalle *bento* con `StatTile`/`Panel`/`Donut`, acciones (editar, eliminar, cambiar estado, notificar, copiar link, CSV).

### 3.4 Funcionalidades destacadas por dominio

- **Materias:** KPIs (inscriptos, con/sin docente, carreras, créditos), búsqueda + filtros (carrera, semestre), tabla ordenable, drawer→**página de detalle** que une **inscriptos + recursos + tutorías** de la materia; inscribir/quitar estudiantes a mano (admin); notificar inscriptos.
- **Tutorías:** KPIs (abiertas, próximas, plazas, ocupación), filtros (tiempo/estado), cards con **barra de cupo** y fecha relativa; detalle con **lista de agendados**, **donut de ocupación**, cambio de estado, **otras tutorías de la materia** y card de materia/espacio.
- **Eventos:** KPIs (publicados, borradores, próximos, inscriptos, cursos), filtros (tipo/estado), **3 vistas** (grilla / cartelera de afiches / calendario mensual), **hero del próximo evento + countdown**, **mapa de calor de demanda**, **modo cartelera kiosko** (fullscreen rotando con QR). En el detalle: countdown, **agregar a calendario** (`.ics` + Google), **QR de inscripción**, **generador de afiche** (canvas + QR → PNG/PDF), **certificado de asistencia** (PDF, cursos), **check-in**, **lista de espera**, **duplicar**.

### 3.5 Permisos (resumen; ver ficha *Roles y Permisos*)

- **ADMIN:** todo (materia/tutoria/evento/recurso/inscripcion/sostenibilidad).
- **ANALISTA:** materias CRUD + inscriptos, eventos CRUD + inscriptos, tutorías solo ver, recursos ver, sostenibilidad ver.
- **DOCENTE:** materias ver/editar/ver_inscriptos, recursos CRUD, tutorías ver/crear/editar, eventos ver/inscribir.
- **ESTUDIANTE:** materias ver + inscripción propia, recursos ver, tutorías ver/agendar/cancelar, eventos ver/inscribir.
- **EXTERNO:** solo eventos ver/inscribir. **MANTENIMIENTO:** sin permisos académicos.

---

## 4. Métricas / evidencia

- 4 dominios, 7 entidades, ~40 endpoints REST.
- 3 páginas de detalle por ruta (`/materias/:id`, `/tutorias/:id`, `/eventos/:id`).
- Datos de demo sembrados (perfil `dev`, `AcademicDataInitializer`): 6 materias, 8 recursos, 3 tutorías, 3 eventos.
- Librerías agregadas en frontend para eventos: `qrcode` (QR de inscripción/afiche/kiosko), `jspdf` (afiche/certificado).

---

## 5. Riesgos, limitaciones y TODOs

### 5.1 Limitaciones de diseño
- Métricas/factores de **sostenibilidad** son estimaciones (ver ficha aparte).
- El **asistente IA contextual** (materias/eventos) está cableado pero depende de `ai-svc` (hoy sin venv → caído).
- El envío de emails depende de la **Gmail API** (ver ticket USM-73).
- El **check-in** es manual desde la lista (no hay escáner de cámara aún).

### 5.2 TODOs (ver `EVENTOS_TODO.md` en la raíz)
- **Eventos:** feedback post-evento (tabla nueva), tags/categorías (columna), recordatorios automáticos por email (job `@Scheduled`), eventos recurrentes/series, auto-promoción de lista de espera, landing pública.
- **IA:** generar título/descripción y afiche con IA, chatbot de eventos, sugerir horario/aula.
