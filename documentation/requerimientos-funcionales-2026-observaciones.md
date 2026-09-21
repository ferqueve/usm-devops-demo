# Observaciones internas sobre los RF 2026

Pendientes y huecos detectados al relevar el código (21/09/2026). No forman parte del documento de requerimientos.

## Huecos que conviene resolver (los ◐)

**Reglas que el backend no valida**
- **Correlativas:** el mapa marca una materia como bloqueada, pero la inscripción la acepta igual.
- **Estados vencidos:** nada se cierra ni se finaliza solo. Se puede agendar una tutoría que ya pasó e inscribirse a un evento cancelado o finalizado.
- **Chequeo de dueño:** falta en varias acciones.
  - Cualquier docente puede avisar por email a los inscriptos de cualquier materia o tutoría, ver sus inscriptos y subirles recursos.
  - Cualquier analista puede editar cualquier evento.
- **Choques de espacio (asimétrico):** la tutoría y el evento revisan si el espacio está ocupado, pero aprobar una reserva no revisa tutorías ni eventos.
- **Eventos:** no se valida que el fin sea posterior al inicio ni que el cupo sea positivo. Un externo puede abrir por id un evento interno o en borrador.
- **Cancelaciones sin aviso:** cancelar o eliminar una tutoría o un evento no avisa a los inscriptos.

**Funciones del backend a las que la pantalla no llega**
- **Lista de espera de eventos:** el botón queda deshabilitado con "Sin plazas".
- **Docente que aprueba inscripciones:** el backend lo permite, pero la pantalla no le muestra el botón.
- **QR de check-in:** el estudiante no ve su QR, así que no tiene qué mostrar.
- **Detalles de tutoría y de evento:** no se puede agendar ni inscribirse desde ahí.
- **Certificado de curso:** solo lo descarga el organizador; el participante no.
- **Borradores:** un evento no se puede crear como borrador.

**IA**
- La página del asistente es solo para admin y analista, pero la burbuja flotante la ve cualquier rol.
- No hay límite de uso.
- La búsqueda de espacios por descripción depende de reindexar a mano.

**Otros**
- La meta anual de Sostenibilidad se guarda solo en el navegador.
- Mantenimiento no ve la predicción de inventario, aunque es el más interesado.
- Mobile:
  - no tiene la capa académica;
  - docente y externo no pueden crear reservas;
  - no se puede cancelar reservas ni eliminar espacios o inventario;
  - la dirección del servidor está fija en el código.

## Documentación desactualizada

`capa-academica.md`, `capa-ia-generativa.md`, `sistema-de-estadisticas.md`, `sostenibilidad.md`, `capas-de-inteligencia.md` y `pipeline-de-ml.md` ya no coinciden con el código. Por ejemplo:
- Sostenibilidad la ven admin y mantenimiento, no el analista.
- Hay 10 endpoints de IA, no 6.
- Son tres modelos de ML con un job semanal, no uno solo con un cron de Railway.
- `sostenibilidad.md` describe funciones que no existen: modo presentación, índice 0–100 y proyección.

## No funcionales del período (no son RF)

- **Rendimiento:** carga de pantallas por demanda, estadísticas calculadas en SQL, calendario del mes en una sola consulta (antes eran unas 1.600) y respuestas comprimidas.
- **Calidad:** backend en cero hallazgos de SonarQube, pipeline de CI/CD en Railway y 100 tests E2E.
- **Diseño:** base visual sobre el manual de marca UTEC.
