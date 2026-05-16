# Plan de Documentación · UTEC Space Manager

Este documento describe cómo está organizada la documentación del proyecto, tanto la que vive **en el repositorio** (markdown, junto al código) como la que se entrega académicamente **en la carpeta externa** (formatos `.docx` / `.pdf`).

Objetivo: **una fuente de verdad por tema, escrita en el nivel técnico apropiado para su audiencia**.

---

## 1. Documentación en el repositorio

Ubicación: `documentation/`

```
documentation/
├── README.md                              ← índice + guía rápida
├── manuales/                              ← lectores: usuarios y TI
│   ├── manual-de-usuario.md
│   └── manual-de-instalacion.md
└── fichas-tecnicas/                       ← lectores: devs, revisor técnico, auditor
    ├── sistema-de-recomendaciones.md
    ├── roles-y-permisos.md
    ├── arquitectura-y-estructura.md
    ├── sistema-de-diseno-ui.md
    ├── analisis-de-codigo.md
    ├── pruebas-exploratorias.md
    ├── plan-de-calidad.md                 (futuro)
    └── analisis-de-seguridad.md           (futuro)
```

### Categorías y nivel técnico

| Categoría | Audiencia | Tono | Reglas de estilo |
|---|---|---|---|
| **Manuales** | Usuarios finales (manual de usuario) o personal de TI (manual de instalación) | Accesible, formal, narrativo | Sin nombres de clases, sin paths del código, sin jerga arquitectural en el cuerpo principal. El manual de instalación admite tecnicismo en comandos y configuración. |
| **Fichas técnicas** | Devs, revisor técnico, auditor | Técnico, profundo, con datos concretos | Nombres de archivos y clases permitidos. Estructura obligatoria de 5 secciones (ver abajo). |

### Patrones de ficha técnica

Existen dos subtipos de ficha técnica, según su propósito:

#### A) Fichas técnicas de implementación

Documentan **cómo está hecho** un subsistema. Sirven al equipo y al revisor técnico para entender la arquitectura. Pueden incluir TODOs internos porque son parte del trabajo del equipo y dejan visibilidad sobre la deuda conocida.

Ejemplos: `sistema-de-recomendaciones.md`, `roles-y-permisos.md`, `arquitectura-y-estructura.md`, `sistema-de-diseno-ui.md`.

Estructura de 5 secciones:

1. **Resumen ejecutivo** — un párrafo accesible para cualquiera.
2. **Cómo se usa** — desde el punto de vista del usuario (link al manual de usuario si aplica).
3. **Detalle técnico** — implementación, decisiones, datos numéricos.
4. **Métricas / evidencia** — números concretos.
5. **Riesgos, limitaciones y TODOs**.

#### B) Fichas técnicas de análisis y progreso

Documentan **el estado de un atributo del producto** (calidad, seguridad, plan de tests) y su evolución en el tiempo. Están pensadas para ser leídas también por revisores académicos y cliente, por lo que **no incluyen TODOs internos** y se redactan en tono descriptivo, no imperativo. La evolución se registra acumulativamente en una sección dedicada para visibilizar la mejora continua.

Ejemplos: `analisis-de-codigo.md`, `analisis-de-seguridad.md` (futuro), `plan-de-calidad.md` (futuro).

Estructura de 6 secciones:

1. **Introducción** — qué se mide y por qué.
2. **Metodología y herramientas** — cómo se mide.
3. **Indicadores actuales** — los números concretos del snapshot.
4. **Lectura de los resultados** — interpretación descriptiva (fortalezas y áreas en proceso de mejora). Sin checklist accionable.
5. **Evolución del proyecto** — tabla acumulativa de snapshots, hitos del proceso.
6. **Cierre** — síntesis breve.

---

## 2. Documentación en la carpeta externa

Ubicación: carpeta de entrega académica `Proyecto USM/`.

```
Proyecto USM/
├── 1 · Documentos Principales/            ← Documento general, manuales, informe, rúbrica
├── 2 · Fichas Técnicas/                   ← acá llegan las fichas exportadas desde el repo
├── 3 · Diagramas/                         ← arquitectura, base de datos, flujos
├── 4 · Relevamiento y Requerimientos/     ← acta de constitución, requerimientos, stack
├── 5 · Gestión del Proyecto/              ← planificación, historias, reuniones, status reports
├── 6 · QA/                                ← plan de calidad de proceso, incidencias, métricas
├── 7 · DevOps/                            ← pipeline, automatización
├── 8 · Ética y Normas Legales/
├── 9 · Recursos Multimedia/               ← fotos, capturas
└── Histórico/                             ← etapas anteriores cerradas
```

---

## 3. Mapeo repo ↔ carpeta externa

| Repo | Carpeta externa |
|---|---|
| `documentation/manuales/manual-de-usuario.md` | `1 · Documentos Principales/Manual de Usuario.docx` |
| `documentation/manuales/manual-de-instalacion.md` | `1 · Documentos Principales/Manual de Instalación.docx` |
| `documentation/fichas-tecnicas/*.md` | `2 · Fichas Técnicas/*.docx` |

Los `.md` del repo son **fuente de verdad viva**: evolucionan con el código y están versionados con git. Cuando se cierra una etapa académica, se exportan a `.docx` y se colocan en la carpeta externa.

---

## 4. Cuándo crear una ficha técnica nueva

**Crear** una ficha técnica cuando:
- Existe un subsistema con lógica propia que se quiere destacar (recomendaciones, jobs, caché).
- Hay un análisis recurrente que se va a actualizar (calidad de código, seguridad, cobertura).
- Se necesita una referencia técnica que no encaja en un manual.

**No crear** una ficha técnica cuando:
- El contenido es transitorio o de una sola tarea (eso va al PR / commit message).
- Se solapa con una ficha existente (mejor sumarle una sección).
- Se está documentando algo evidente al leer el código.

---

## 5. Mantenimiento

Cada vez que se modifica código que afecte un área documentada, debe revisarse y actualizarse la documentación correspondiente en la misma tarea. Las reglas operativas para sesiones de Claude Code están en `CLAUDE.md` (no commiteado).
