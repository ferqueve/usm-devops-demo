# Requerimientos funcionales agregados en 2026

**Versión 1.0 · 21/09/2026**

Período: 01/01/2026 al 21/09/2026. Relevamiento de lo implementado, hecho sobre el código (backend, frontend, `ml/`, `ai/`, `mobile/`) y el historial de git.

Reservas, espacios, inventario, usuarios, auditoría, recomendaciones y las estadísticas básicas ya existían en 2025. En 2026 se pulieron; acá solo figura lo que cambió su funcionalidad.

**Roles:** ADM (admin), ANA (analista), DOC (docente), EST (estudiante), EXT (externo), MAN (mantenimiento).

---

## 1. Capa académica

> **En revisión.** El módulo está en rediseño; estos RF pueden ajustarse en próximas versiones.

### 1.1 Materias

| ID | Requerimiento | Roles |
|---|---|---|
| RF-MAT-01 | El sistema debe mostrar el catálogo de materias con búsqueda por nombre o código, filtros por carrera y semestre, orden y paginado. | ADM, ANA, DOC, EST |
| RF-MAT-02 | El sistema debe permitir crear una materia con nombre, código, carrera, docente, semestre, créditos y correlativas. | ADM, ANA |
| RF-MAT-03 | El sistema debe permitir editar una materia. Un docente solo puede editar las que dicta. | ADM, ANA, DOC |
| RF-MAT-04 | El sistema debe validar las correlativas: una materia no es correlativa de sí misma, la correlativa existe, está activa y es de la misma carrera, y no se forman ciclos. | ADM, ANA |
| RF-MAT-05 | El sistema debe permitir dar de baja una materia (baja lógica). | ADM, ANA |
| RF-MAT-06 | El docente debe ver las materias que dicta y el estudiante las que cursa, con sus créditos. | DOC, EST |
| RF-MAT-07 | El estudiante debe poder inscribirse a una materia y cancelar su inscripción; no puede inscribirse dos veces. | EST |
| RF-MAT-08 | El sistema debe permitir inscribir o quitar estudiantes a mano. | ADM, ANA |
| RF-MAT-09 | El sistema debe mostrar los inscriptos de una materia y exportarlos a CSV. | ADM, ANA, DOC |
| RF-MAT-10 | El sistema debe permitir marcar una inscripción como aprobada o revertirla, para registrar el avance del estudiante. | ADM, ANA, DOC (backend) |
| RF-MAT-11 | El sistema debe permitir enviar un aviso por email a todos los inscriptos de una materia. | ADM, ANA, DOC |
| RF-MAT-12 | El detalle de una materia debe reunir sus recursos, tutorías, inscriptos y actividad reciente. | ADM, ANA, DOC, EST |

### 1.2 Mapa de carrera

| ID | Requerimiento | Roles |
|---|---|---|
| RF-MAP-01 | El sistema debe mostrar el plan de cada carrera como un grafo de correlativas por semestre, con zoom, y abrir el detalle de una materia al tocarla. | ADM, ANA, DOC, EST |
| RF-MAP-02 | Para el estudiante, el mapa debe marcar cada materia como aprobada, cursando, disponible o bloqueada, y mostrar su avance en materias, créditos y porcentaje. | EST |

### 1.3 Recursos académicos

| ID | Requerimiento | Roles |
|---|---|---|
| RF-REC-01 | El sistema debe listar los recursos de una materia, con búsqueda, y permitir abrirlos o descargarlos. | ADM, ANA, DOC, EST |
| RF-REC-02 | El sistema debe permitir subir archivos a una materia: PDF, imágenes, Office o texto, hasta 50 MB. | ADM, DOC |
| RF-REC-03 | El sistema debe permitir agregar enlaces a una materia. | ADM, DOC |
| RF-REC-04 | El sistema debe permitir borrar un recurso; el docente solo puede borrar los que subió él. | ADM, DOC |

### 1.4 Tutorías

| ID | Requerimiento | Roles |
|---|---|---|
| RF-TUT-01 | El sistema debe permitir crear franjas de tutoría con materia, horario, cupo, espacio, modalidad (presencial o virtual con enlace), tipo (grupal o individual) y etiquetas. | ADM, DOC |
| RF-TUT-02 | El sistema debe permitir crear tutorías recurrentes (diaria, semanal o mensual, hasta 52 repeticiones). | ADM, DOC |
| RF-TUT-03 | El sistema debe rechazar una tutoría o un evento si su espacio ya está ocupado en ese horario por una reserva aprobada, otra tutoría o un evento. | ADM, ANA, DOC |
| RF-TUT-04 | El sistema debe mostrar las tutorías en grilla, calendario y agenda, con filtros por fecha y estado. | ADM, ANA, DOC, EST |
| RF-TUT-05 | El sistema debe permitir editar una tutoría y abrirla, cerrarla o cancelarla. | ADM, DOC (dueño) |
| RF-TUT-06 | El estudiante debe poder agendarse a una tutoría indicando qué quiere repasar. Con el cupo lleno, queda en lista de espera. | EST |
| RF-TUT-07 | El estudiante debe confirmar su asistencia. Si faltan 2 horas y no confirmó, el sistema libera su lugar y avisa por email. | EST |
| RF-TUT-08 | Al liberarse un lugar (cancelación, suba de cupo o no confirmación), el sistema debe pasar al primero de la lista de espera y avisarle por email. | Sistema |
| RF-TUT-09 | El sistema debe enviar por email un recordatorio 24 horas antes de la tutoría. | Sistema |
| RF-TUT-10 | El docente debe ver los agendados y la lista de espera, con su temario, y exportarlos a CSV. | ADM, ANA, DOC |
| RF-TUT-11 | El docente debe poder registrar la asistencia a mano o escaneando un QR. | ADM, ANA, DOC |
| RF-TUT-12 | El docente debe poder marcar la tutoría "en vivo" para recibir estudiantes sin agenda previa. | ADM, DOC |
| RF-TUT-13 | El sistema debe agrupar los temas que pidieron los estudiantes y resumirlos con IA. | ADM, ANA, DOC |
| RF-TUT-14 | El sistema debe permitir adjuntar enlaces de material a una tutoría. | ADM, DOC |
| RF-TUT-15 | El docente debe poder enviar un aviso por email a los agendados de una tutoría. | ADM, ANA, DOC |
| RF-TUT-16 | El estudiante debe poder valorar de 1 a 5 una tutoría terminada, con comentario, y ver el promedio y la distribución. | EST |
| RF-TUT-17 | El sistema debe permitir exportar una tutoría o un evento al calendario (.ics o Google Calendar) y copiar su enlace. | Todos |

### 1.5 Rankings y gamificación

| ID | Requerimiento | Roles |
|---|---|---|
| RF-GAM-01 | El sistema debe mostrar un ranking de tutores por valoración, con distinciones: tutor del mes, excelente, muy demandado y constante. | ADM, ANA, DOC, EST |
| RF-GAM-02 | El sistema debe mostrarle al estudiante su racha de asistencias y sus medallas: primera tutoría, 5 y 10 tutorías, racha ×3, "Madrugador" y "Salvado en finales". | EST |

### 1.6 Eventos y cursos

| ID | Requerimiento | Roles |
|---|---|---|
| RF-EVE-01 | El sistema debe permitir crear eventos o cursos con título, descripción, etiquetas, horario, cupo, espacio y visibilidad pública o interna, también en forma recurrente. | ADM, ANA |
| RF-EVE-02 | El sistema debe generar con IA el título, la descripción y las etiquetas de un evento a partir de una idea. | ADM, ANA |
| RF-EVE-03 | El sistema debe permitir editar un evento, cambiar su estado (borrador, publicado, finalizado o cancelado), duplicarlo y eliminarlo. | ADM, ANA |
| RF-EVE-04 | El externo solo debe ver eventos públicos y publicados; el resto de los roles ve también los internos. | Todos |
| RF-EVE-05 | El usuario debe poder inscribirse a un evento y cancelar su inscripción. Con el cupo lleno, queda en lista de espera y pasa automáticamente al liberarse un lugar. | ADM, ANA, DOC, EST, EXT |
| RF-EVE-06 | El organizador debe ver los inscriptos, registrar la asistencia, ver la tasa de asistencia y exportar a CSV. | ADM, ANA |
| RF-EVE-07 | El sistema debe generar un certificado PDF para quienes asistieron a un curso. | ADM, ANA |
| RF-EVE-08 | El sistema debe permitir difundir un evento: aviso por email a los inscriptos, QR, afiche en PNG o PDF y modo kiosko que rota los próximos eventos. | ADM, ANA |
| RF-EVE-09 | El sistema debe mostrar los eventos en las vistas Descubrir, Calendario y Todos, con filtros por tipo, estado y etiqueta, más métricas de ocupación y popularidad. | Todos (métricas: ADM, ANA) |
| RF-EVE-10 | El participante debe poder valorar de 1 a 5 un evento finalizado. | ADM, ANA, DOC, EST, EXT |
| RF-EVE-11 | El sistema debe enviar por email un recordatorio 2 días antes del evento. | Sistema |

---

## 2. Sostenibilidad

| ID | Requerimiento | Roles |
|---|---|---|
| RF-SOS-01 | El sistema debe estimar el impacto de digitalizar el material (papel, hojas, agua, CO₂, árboles y km en auto evitados) a partir de los archivos subidos y los inscriptos de cada materia. | ADM, MAN |
| RF-SOS-02 | El sistema debe mostrar la evolución mensual, equivalencias, archivos contra enlaces y rankings de carreras y docentes. | ADM, MAN |
| RF-SOS-03 | El sistema debe mostrar el avance contra una meta anual de árboles. | ADM, MAN |
| RF-SOS-04 | El sistema debe explicar cómo se calcula y exportar un reporte en PDF. | ADM, MAN |

---

## 3. Análisis

### 3.1 Estadísticas por área

| ID | Requerimiento | Roles |
|---|---|---|
| RF-EST-01 | El sistema debe ofrecer estadísticas en tres áreas: Reservas, Inventario y Académico. Cada rol ve solo las que su permiso habilita. | ADM, ANA (3 áreas), MAN (Inventario) |
| RF-EST-02 | El sistema debe permitir elegir el período (30 días, 90 días, 12 meses o este año) y compararlo con el período anterior o con el año pasado. | ADM, ANA, MAN |
| RF-EST-03 | El sistema debe permitir filtrar por edificio, espacio, tipo de espacio, rol y carrera, también tocando un elemento de un gráfico. Los filtros quedan en la URL para poder compartirla. | ADM, ANA, MAN |
| RF-EST-04 | El sistema debe destacar automáticamente los cambios más llamativos contra el período de comparación ("Novedades"). | ADM, ANA |
| RF-EST-05 | En Reservas, el sistema debe mostrar evolución, resultado, uso por día y hora, ocupación por espacio y edificio, quién reserva, tiempos de aprobación, carga por analista y uso del aforo. | ADM, ANA |
| RF-EST-06 | En Inventario, el sistema debe mostrar el estado del parque, la demanda (del pedido a la entrega, si alcanza lo que hay) y su evolución. | ADM, ANA, MAN |
| RF-EST-07 | En Académico, el sistema debe mostrar la asistencia y el cupo de las tutorías y la ocupación y las valoraciones de los eventos. | ADM, ANA |
| RF-EST-08 | El sistema debe permitir ampliar cada gráfico con una explicación: qué responde, cómo se calcula, cómo leerlo y de dónde sale el dato. | ADM, ANA, MAN |
| RF-EST-09 | El sistema debe exportar cada área a CSV y PDF con el período y los filtros aplicados. | ADM, ANA, MAN |
| RF-EST-10 | El sistema debe guardar cada noche un histórico diario de reservas e inventario. | Sistema |

### 3.2 Predicciones con machine learning

| ID | Requerimiento | Roles |
|---|---|---|
| RF-PRE-01 | El sistema debe pronosticar la demanda de reservas de los próximos 30 días, en total y por tipo de espacio, con una banda de confianza. | ADM, ANA |
| RF-PRE-02 | El sistema debe estimar el riesgo de que falte equipamiento por tipo de elemento en los próximos 30 días (sin stock, alto, medio o bajo). | ADM, ANA |
| RF-PRE-03 | El sistema debe estimar la asistencia esperada a las próximas tutorías y marcar las que corren riesgo de quedar vacías o llenas. | ADM, ANA |
| RF-PRE-04 | El sistema debe mostrar qué tan confiable es cada modelo comparado con una alternativa simple. | ADM, ANA |
| RF-PRE-05 | El sistema debe reentrenar los modelos todas las semanas y permitir al admin reentrenarlos a pedido. | ADM |
| RF-PRE-06 | El sistema debe ofrecer una lectura en lenguaje natural de cada predicción, generada con IA. | ADM, ANA |

### 3.3 Dashboards por rol

| ID | Requerimiento | Roles |
|---|---|---|
| RF-DSH-01 | Cada rol debe tener su propio dashboard, en una sola pantalla y con su dato más urgente destacado arriba. Admin: reservas por aprobar. Analista: su cola. Mantenimiento: el ítem más urgente. Docente y estudiante: su próxima tutoría. Externo: su próximo evento. | Todos |

---

## 4. Inteligencia artificial generativa

| ID | Requerimiento | Roles |
|---|---|---|
| RF-IA-01 | El sistema debe ofrecer un asistente conversacional que responda con datos reales del sistema, con preguntas sugeridas según el rol. Solo puede consultar, no modificar. | ADM, ANA (página); todos (burbuja) |
| RF-IA-02 | El asistente solo debe acceder a los datos que el rol del usuario puede ver, y explicar la limitación cuando no puede. | Todos |
| RF-IA-03 | El sistema debe permitir buscar espacios describiendo lo que se necesita en lenguaje natural. | ADM, ANA, MAN, EST |
| RF-IA-04 | El sistema debe explicar con IA cada recomendación de mantenimiento. | ADM, MAN |
| RF-IA-05 | El sistema debe generar con IA un resumen de las estadísticas de reservas ("En pocas palabras"). | ADM, ANA |
| RF-IA-06 | El asistente de cada materia debe resumir sus recursos y generar preguntas de repaso. | ADM, ANA, DOC, EST |
| RF-IA-07 | Si el servicio de IA no responde, el sistema debe avisarlo con un mensaje claro sin romper la pantalla. | Todos |

La IA también se usa en la generación de eventos (RF-EVE-02), el resumen de temarios (RF-TUT-13) y las predicciones (RF-PRE-06).

---

## 5. Monitoreo del sistema

| ID | Requerimiento | Roles |
|---|---|---|
| RF-SIS-01 | El sistema debe mostrar la salud de los servicios externos (IA, ML, base de datos, Redis, almacenamiento y correo) y avisar cuáles están caídos y desde cuándo. | ADM |
| RF-SIS-02 | El sistema debe mostrar el tráfico HTTP (peticiones por minuto, demoras, porcentaje de errores 5xx) y los endpoints más lentos. | ADM |
| RF-SIS-03 | El sistema debe mostrar los errores recientes agrupados, con la opción de ocultar el ruido conocido, y el detalle de cada petición HTTP. | ADM |
| RF-SIS-04 | El sistema debe mostrar el pool de conexiones, la recolección de basura y las migraciones de la base. | ADM |
| RF-SIS-05 | El sistema debe permitir exportar métricas y peticiones a CSV, descargar el log y copiar un diagnóstico. | ADM |

---

## 6. Configuración

| ID | Requerimiento | Roles |
|---|---|---|
| RF-CFG-01 | El sistema debe reunir en una pantalla de Configuración los catálogos de tipos de espacio, tipos de inventario y carreras, con alta, edición, baja y búsqueda. Cada rol ve solo los catálogos que puede administrar. | ADM, ANA (carreras), MAN (tipos) |

---

## 7. Aplicación móvil

| ID | Requerimiento | Roles |
|---|---|---|
| RF-MOB-01 | La app móvil debe permitir iniciar sesión (email o Google), registrarse y recuperar la contraseña. | Todos |
| RF-MOB-02 | La app debe ofrecer dashboard, calendario, reservas (con aprobar y rechazar), espacios, inventario, estadísticas, asistente IA, usuarios, sistema y auditoría, según el rol. | Según rol |
| RF-MOB-03 | La app debe tener modo claro y oscuro. | Todos |

---

## 8. Otros cambios funcionales

| ID | Requerimiento | Roles |
|---|---|---|
| RF-SEG-01 | El sistema debe bloquear el login por 15 minutos después de 8 intentos fallidos seguidos. | Todos |
| RF-SEG-02 | Solo quien gestiona reservas debe ver el listado completo de reservas y el email de los demás solicitantes. | ADM, ANA |
| RF-SEG-03 | El sistema debe cerrar la sesión ante cualquier respuesta 401 si no logra renovar el token. | Todos |
| RF-RES-01 | El externo debe poder solicitar una reserva sin elegir analista; queda pendiente para cualquier analista. | EXT |
| RF-ESP-01 | El sistema debe mostrar las imágenes panorámicas de los espacios en un visor 360°. | Quienes ven espacios |
| RF-ESP-02 | El sistema debe mostrar miniaturas de las imágenes de los espacios en listados y detalles. | Quienes ven espacios |
| RF-UI-01 | El sistema debe ofrecer modo oscuro y recordar la elección de cada usuario. | Todos |

---

## Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 21/09/2026 | Relevamiento inicial de lo implementado entre enero y setiembre de 2026. |
