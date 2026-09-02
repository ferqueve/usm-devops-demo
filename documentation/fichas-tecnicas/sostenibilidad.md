# Ficha técnica · Dashboard de Sostenibilidad

## 1. Resumen ejecutivo

El módulo de **Sostenibilidad** muestra el **impacto ambiental estimado** de la digitalización de recursos académicos. La idea base: cada **archivo** subido a una materia evita que cada estudiante inscripto imprima una copia física; a partir de eso se estiman hojas, papel, CO₂ y agua ahorrados, más equivalencias tangibles (árboles, km en auto, duchas, etc.). Es una **estimación derivada** con factores de referencia, no una medición real de sensores.

El dashboard es de **solo lectura** (permiso `sostenibilidad:ver`, hoy ADMIN y ANALISTA) y está pensado tanto para análisis interno como para difusión (modo presentación, exportar PDF, compartir).

---

## 2. Cómo se usa

Se accede desde el menú lateral → **Sostenibilidad**. La página incluye un botón **"Cómo funciona"** que abre un diálogo con la metodología (la misma de la sección 3.2). Para la guía de usuario, ver el manual de usuario, capítulo de Sostenibilidad.

---

## 3. Detalle técnico

### 3.1 Origen de los datos

Todo se deriva de `RecursoAcademico` (tipo `ARCHIVO`) en `SostenibilidadService` (`backend/.../service/SostenibilidadService.java`). No hay tablas propias de métricas: se calcula on-the-fly sobre los recursos activos.

### 3.2 Cálculo

1. **Hojas evitadas por recurso** = `hojas × copias evitadas`, donde:
   - `hojas` = `paginasEstimadas`; si no, `ceil(tamanoBytes / 50000)` (~50 KB por hoja); si no hay datos, 1.
   - `copias evitadas` = inscriptos en la materia (mínimo 1).
2. **Total** = suma de todos los archivos. Los **enlaces** no cuentan para papel (solo se muestran en el donut de tipo de recurso).
3. **Factores fijos** (constantes del service):

| Métrica | Fórmula | Factor |
|---|---|---|
| Papel | hojas × 4,5 g / 1000 | 4,5 g/hoja |
| CO₂ | hojas × 4,7 g / 1000 | 4,7 g/hoja |
| Agua | hojas × 10 | 10 L/hoja |
| Árboles | papelKg / 8,3 | 8,3 kg papel/árbol |
| Km en auto | CO₂kg / 0,12 | 0,12 kg CO₂/km |

4. **Ahorro por mes** = hojas agrupadas por mes del `createdAt` del recurso.

### 3.3 Endpoints (`/api/v1/stats`)

- `GET /sostenibilidad` → KPIs (`SostenibilidadStatsDto`: hojas, papel, CO₂, agua, recursos archivo/enlace, árboles, km, ahorroPorMes).
- `GET /sostenibilidad/ranking` → **ranking** de carreras y docentes por impacto (hojas) + **comparativa mensual** (mes actual vs anterior, `deltaPct`). Agrupa por `materia.carrera` y `materia.docente`.

### 3.4 Frontend

`frontend/src/components/sostenibilidad/`:
- `SostenibilidadDashboard.tsx` — orquesta todo.
- `useCountUp.ts` — hook de número animado.
- `BosqueForest.tsx` — "bosque UTEC" en SVG que crece según árboles salvados.

Secciones del dashboard:
- **Hero count-up**: 6 KPIs que animan al cargar.
- **Índice de sostenibilidad** (0-100): `40% adopción digital + 60% impacto` (medidor semicircular).
- **Bosque que crece** (SVG animado).
- **Contador en vivo** (tickea para sentirse "vivo").
- **Equivalencias** en carrusel (duchas, cargas de celular, vueltas en auto, tazas de agua, árboles).
- **Evolución + proyección** (`ComposedChart`: área mensual + acumulado + proyección punteada a 3 meses) con badge de comparativa.
- **Donut** archivos vs enlaces.
- **Meta anual** (progreso editable, guardado en `localStorage`) + **badges/hitos**.
- **Leaderboard** de carreras y docentes.
- **Asistente de impacto** (IA, vía `/ai/chat`).
- Toolbar: **Cómo funciona** (diálogo), **Compartir**, **Exportar PDF** (`jspdf`), **Modo Presentación** (fullscreen).

---

## 4. Métricas / evidencia

- 2 endpoints (`/stats/sostenibilidad`, `/stats/sostenibilidad/ranking`).
- Con datos de demo (8 recursos): ~238 hojas, ~1,1 kg papel, ~1,1 kg CO₂, ~2.380 L agua, ~0,1 árboles, índice ~33/100.
- Librerías frontend: `recharts` (gráficas), `jspdf` (PDF), `qrcode`/`three` disponibles para futuras visualizaciones.

---

## 5. Riesgos, limitaciones y TODOs

- Los números son **estimaciones** con factores de referencia, no mediciones; conviene mantener la nota de "estimación" visible (ya está en el diálogo "Cómo funciona").
- El **asistente de impacto** depende de `ai-svc` (hoy caído).
- La **meta** se persiste en el navegador (`localStorage`), no en el servidor; un endpoint de metas configurables queda pendiente.
- TODOs ideados (no implementados): bosque 3D (three.js), simulador "¿y si todo UTEC digitalizara?", widget embebible / landing pública, integración con consumo real (IoT).
