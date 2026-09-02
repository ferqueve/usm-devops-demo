# Eventos — estado y pendientes

> Mejoras del módulo de Eventos al nivel de Materias/Tutorías. Última sesión: 2026-06-23.

## ✅ Hecho

### Base (vista + detalle)
- Vista `/eventos` (admin): KPIs (`StatStrip`), filtros (búsqueda/tipo/estado), orden, cards con barra de cupo y fecha relativa.
- Detalle por ruta `/eventos/:id` (bento): identidad, 4 stat tiles, inscriptos, ocupación (donut), cambio de estado, espacio.
- Backend: `GET /eventos/{id}`, `/{id}/inscriptos`, `POST /{id}/notificar` (+ `EmailService` en `EventoService`). CRUD/eliminar ya existían.

### Fase 1 — Front (todo)
- **Detalle:** countdown gigante, agregar a calendario (`.ics` + Google), QR de inscripción, **generador de afiche** (canvas + QR → PNG/PDF), **certificado de asistencia** (PDF, cursos), compartir link.
- **Lista:** hero "Próximo evento" + countdown, **toggle Grilla/Cartelera/Calendario**, orden "Populares", **modo cartelera kiosko** (fullscreen rotando con QR), **mapa de calor de demanda**.
- Archivos nuevos: `eventoUtils.ts`, `AfichePoster.tsx`, `ProximoEventoHero.tsx`, `EventosCalendario.tsx`, `HeatmapDemanda.tsx`, `CarteleraKiosko.tsx`. Lib instalada: `qrcode`.

### Fase 2 — chunk 1 (sin migraciones, reusa `estado` de la inscripción)
- **Lista de espera:** si el cupo está lleno, `inscribir` crea estado `ESPERA` (no rechaza). El conteo de inscriptos excluye `ESPERA` (`countByEventoIdAndEstadoNotAndDeletedAtIsNull`).
- **Check-in / asistencia:** `PUT /eventos/inscripciones/{id}/asistencia?asistio=` → estado `ASISTIO`/`INSCRITO`. UI: botón Check-in/Presente + tasa de asistencia / no-show.
- **Duplicar evento:** botón en el header del detalle (clona vía `crear`).
- Estados de inscripción usados: `INSCRITO` · `ESPERA` · `ASISTIO`.

### Fase 2 — chunk 2 ✅ (sesión 2026-06-23 — migración `031-evento-tags-feedback.xml`)
- **Feedback post-evento** ✅ — tabla `evento_feedback` (rating 1-5 + comentario, índice único parcial por usuario/evento). `EventoFeedback` + `EventoFeedbackRepository` + `POST/GET /eventos/{id}/feedback`. UI: `FeedbackEventoPanel` (promedio, distribución de estrellas, comentarios, formulario). Solo valora quien tuvo inscripción activa y el evento está `FINALIZADO` (validado en back y front).
- **Tags / categorías** ✅ — columna `tags` (CSV) en `evento`, normalización (trim/dedup) en el service. Chips en cards (lista admin + catálogo) y detalle, input en el form, filtro por tag en la toolbar (click en un chip filtra).
- **Recordatorios automáticos por email** ✅ — `EventoRecordatorioScheduledService` (`@Scheduled` 08:00 diario): eventos `PUBLICADO` que arrancan en ≤2 días, sin recordatorio enviado, notifica inscriptos (excluye lista de espera) y marca el flag `recordatorio_enviado`.
- **Eventos recurrentes / series** ✅ — `recurrencia` (NONE/DIARIA/SEMANAL/MENSUAL) + `repeticiones` en el create; genera N eventos desplazando inicio/fin (sin tabla extra, máx. 52). Selector en el form. Probado: SEMANAL x3 genera 3 eventos +7 días.

### Auto-promover lista de espera ✅
- `DELETE /eventos/{id}/inscripciones` (cancelar la propia inscripción). Al cancelar una confirmada, promueve la primera `ESPERA` → `INSCRITO` y le manda email. Botón "Cancelar inscripción" en "Mis inscripciones". Probado end-to-end.

### Fase 3 — IA (la cadena queda lista; corre cuando `ai-svc` levante)
- **Generar título/descripción/tags** ✅ — endpoint `ai-svc` `POST /insights/generar-evento` (devuelve JSON titulo/descripcion/tags) + proxy backend `AiService.generarEvento` + `POST /api/v1/ai/insights/generar-evento` + botón "Generar con IA" en el form. Degrada con aviso si `ai-svc` está caído (verificado).
- **Chatbot de eventos** ✅ — se usa el asistente global `AiChatWidget` (FAB `bottom-5 right-5`, ya montado en `DashboardLayout`, mismo `/ai/chat` con function calling) que cubre consultas de eventos. Se quitó un `EventosChatbot` propio porque duplicaba ese botón flotante (quedaba uno detrás del otro).

---

## ⏳ Pendiente real (lo que NO se hizo y por qué)

- **Generar afiche con IA (imagen)** 🔴 — `ai-svc` hoy NO expone generación de imágenes (solo texto vía Gemini/Groq). Requiere integrar un proveedor de imágenes; queda fuera de alcance hasta decidirlo. (El afiche por canvas/QR ya existe y funciona.)
- **Sugerir mejor horario/aula** 🟡 — falta; idea: cruzar `HeatmapDemanda` + reservas para recomendar slot/espacio menos ocupado. No depende de IA, se puede hacer heurístico.
- **Check-in con escáner QR real (cámara)** 🟡 — el check-in sigue siendo manual desde la lista de inscriptos. Falta lib de cámara (ej. `html5-qrcode`) + vista de escaneo.
- **Landing pública del evento (sin login)** 🟡 — requiere ruta pública y endpoint sin auth; no tocado para no abrir superficie de seguridad sin definirlo.

---

## Punteros técnicos
- Backend: `backend/src/main/java/com/utec/backend/{controller,service}/Evento*.java`, repo `EventoInscripcionRepository`.
- Frontend: `frontend/src/components/eventos/*`, API `frontend/src/lib/api/eventos.ts`, tipos `frontend/src/lib/types/eventos.ts`.
- Login dev para probar: `admin@utec.edu.uy` / `password` (backend en :8082, front en :3001).
- Permisos de eventos en `frontend/src/lib/config/permissions.ts` (`evento:*`).
