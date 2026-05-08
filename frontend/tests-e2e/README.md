# tests-e2e

Tests punta a punta con **Playwright**. Levantan un navegador real (Chromium)
y se conectan al frontend + backend reales.

## Qué va acá

Happy paths del usuario, no edge cases. Cada test debe contar una historia
completa que un usuario haría:

- Login → ver dashboard → reservar una sala → confirmar que aparece en "Mis reservas".
- Admin: aprobar una reserva pendiente → el solicitante recibe email.
- Analista: exportar reporte de reservas a PDF.
- Encargado: registrar entrega de elemento de inventario.

## Qué NO va acá

- Validaciones de formularios → `tests-integration/`.
- Cálculos de fechas, helpers → `tests/lib/`.
- Componentes aislados → `tests/components/`.

## Pre-requisitos

- Backend corriendo en `http://localhost:8080` con base limpia (perfil `test`).
- Frontend corriendo en `http://localhost:5173`.
- Usuarios seed: `admin@test`, `analista@test`, `estudiante@test` (password en `tests-e2e/fixtures/users.ts`).

## Stack pendiente de instalar

```bash
npm i -D @playwright/test
npx playwright install chromium
```
