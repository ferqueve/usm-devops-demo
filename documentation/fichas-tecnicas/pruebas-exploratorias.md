# Pruebas exploratorias

## 1. Introducción

Las pruebas exploratorias son sesiones de validación manual del sistema en las
que se recorre la aplicación con la intención de descubrir comportamientos
incorrectos, inconsistencias entre módulos o decisiones de diseño que no se
sostienen con datos reales. A diferencia de las pruebas unitarias, de
integración y E2E descritas en `sistema-de-pruebas.md`, no producen un artefacto
ejecutable: el resultado de cada sesión es un conjunto de hallazgos y, cuando
corresponde, una serie de cambios que cierran cada hallazgo dentro de la misma
sesión.

Estas pruebas son complementarias al stack automatizado: cubren el espacio
fuera del happy path que las suites automatizadas no exploran (combinaciones de
estados, transiciones inválidas, vistas por rol, interacciones cruzadas entre
módulos) y permiten detectar bugs de UX que un assertion difícilmente capta.

## 2. Metodología y herramientas

Cada sesión sigue una estructura comparable a la de las anteriores para que el
resultado sea comparable a lo largo del tiempo.

**Estructura de una sesión**

1. Recorrido por roles. Se inicia sesión secuencialmente con los seis usuarios
   semilla (`admin`, `analista`, `docente`, `estudiante`, `externo`,
   `mantenimiento`) y se navega cada vista accesible para ese rol.
2. Ejercicio de los flujos principales. Para cada módulo relevante (reservas,
   espacios, inventario, solicitudes de items) se ejecuta el camino feliz y al
   menos una variante alternativa.
3. Exploración de bordes. Para el módulo de mayor riesgo de la sesión se
   recorren transiciones inválidas, combinaciones de estados, validaciones
   cruzadas y acciones por API directa sin pasar por la UI.
4. Resolución en línea. Los bugs detectados se reproducen y se arreglan en la
   misma sesión cuando son acotados; los que requieren rediseño quedan
   registrados como hallazgos sin cierre y se trasladan a la siguiente sesión.

**Criterios para considerar un comportamiento como bug**

- Provoca una respuesta 5xx del backend en un flujo válido del producto.
- Deja datos inconsistentes (huérfanos, estados terminales con relaciones
  rotas, contadores desalineados respecto del contenido).
- La UI y la API arrojan resultados distintos sobre la misma acción.
- La interfaz expone una acción que el modelo de permisos o de estado no
  permite ejecutar.

**Herramientas utilizadas**

- Chrome DevTools MCP para conducir el navegador: navegación, snapshots de
  accesibilidad, captura de network y consola, ejecución de JavaScript en la
  página activa.
- `curl` con tokens JWT de los seis roles para ejercitar la API por fuera de
  la UI y verificar consistencia.
- Cliente `psql` directo sobre el contenedor Postgres para inspeccionar
  estado final tras cada flujo.
- Logs del backend Spring Boot para resolver casos donde la respuesta HTTP
  expone un mensaje genérico.

## 3. Indicadores actuales

Snapshot tomado en la última sesión cerrada.

| Indicador | Valor |
|---|---|
| Módulos recorridos | 8 (Inicio, Calendario, Reservas, Espacios, Estadísticas, Usuarios, Sistema, Auditoría) |
| Roles ejercitados | 6 (ADMIN, ANALISTA, DOCENTE, ESTUDIANTE, EXTERNO, MANTENIMIENTO) |
| Flujos profundizados | Creación y ciclo de vida de reservas; ciclo completo de solicitudes de inventario; CRUD de items de inventario |
| Hallazgos abiertos al inicio | 0 |
| Hallazgos detectados en la sesión | 10 |
| Hallazgos cerrados en la sesión | 10 |
| Hallazgos abiertos al cierre | 0 |
| Archivos modificados | 10 (8 backend, 2 frontend) |

**Áreas que quedaron sin cobertura en esta sesión**

- Recuperación de contraseña, registro de usuario y flujo OAuth con Google.
- Sistema de recomendaciones (recomendaciones de horarios, prioritarias,
  recomendaciones de inventario).
- Subida de imágenes a espacios (MinIO).
- Notificaciones por correo (Gmail API deshabilitada en el entorno de
  pruebas).
- Pantalla de Estadísticas con filtros avanzados aplicados.
- CRUD de carreras y de tipos de espacio.
- Importación de inventario desde CSV.

## 4. Lectura de los resultados

La sesión confirmó que los flujos principales se sostienen para los seis
roles. La autenticación, la navegación, la creación y aprobación de reservas y
el ciclo de solicitudes de items completaron sin errores bloqueantes una vez
resueltos los hallazgos.

Los problemas encontrados se concentran en tres áreas. La primera es la capa
de serialización del cache Redis: una List<DTO> cacheada producía una
excepción al volver a leerse porque la información de tipo en el JSON no
quedaba escrita en la raíz de la colección. El front interpretaba el 5xx
resultante como expiración de sesión y devolvía al usuario a la pantalla de
login. El segundo grupo cubre cálculos del dashboard que se sostenían sobre
campos del modelo que no existían (filtrar espacios por un atributo `activo`
ausente, dejar `totalReservas` con el valor original mientras el resto se
zeroaba para mantenimiento) y campos faltantes en una respuesta del backend
que el front esperaba (`disponibles`, `enMantenimiento`, `ocupados` en
`/espacios/stats`). El tercer grupo se concentra en el módulo de inventario:
era posible asignar un item perteneciente a un espacio distinto del de la
reserva, eliminar un item que estaba referenciado por una solicitud activa,
aprobar una solicitud sin tener item asignado por la vía de la API directa, y
cancelar una reserva sin que sus solicitudes de items se cerraran. Además, el
modal "Gestionar solicitud" no exponía la transición APROBADO → ENTREGADO, que
sí estaba disponible desde la vista de cards.

También se corrigió que el AuditLog de eventos de autenticación quedaba
registrado como acción del usuario "Sistema" incluso cuando el correo del
usuario era conocido, lo que dificultaba el rastreo. Ahora se resuelve por
correo y se asocia al usuario real.

El equipo está trabajando en extender la cobertura de pruebas exploratorias
para incluir las áreas que quedaron sin recorrer en esta sesión, en particular
recomendaciones, OAuth y subida de imágenes.

## 5. Evolución del proyecto

Cada sesión nueva se agrega como una fila al final, sin reemplazar las
anteriores.

| Fecha | Alcance | Roles | Bugs encontrados | Bugs cerrados | Archivos modificados |
|---|---|---|---|---|---|
| 2026-05-16 | Walkthrough completo de los 8 módulos + módulo de inventario a fondo (CRUD, asignación, liberación, reasignación, transiciones inválidas, cross-espacio, cancelación con items) | 6 (todos) | 10 | 10 | 10 |

## 6. Cierre

La sesión deja el sistema funcionando para los seis roles en sus flujos
nominales y con los bugs detectados resueltos en el mismo paso. Las áreas no
recorridas (recomendaciones, OAuth, subida de imágenes, notificaciones por
correo, estadísticas con filtros avanzados, CRUD de carreras y tipos de
espacio, importación CSV de inventario) son entrada natural de la próxima
sesión y figuran en la sección 3 como referencia.
