# Documentación · UTEC Space Manager

Esta carpeta contiene la documentación del proyecto en formato Markdown. Está pensada como **fuente de verdad viva**: vive junto al código, evoluciona con él y está versionada con git. Cuando se cierra una etapa académica, los archivos se exportan a `.docx` y se entregan en la carpeta externa del proyecto (ver `PLAN_DE_DOCUMENTACION.md` en la raíz del repositorio).

## Estructura

```
documentation/
├── README.md                          ← este archivo
├── manuales/                          ← lectores: usuarios y TI
│   ├── manual-de-usuario.md
│   └── manual-de-instalacion.md
└── fichas-tecnicas/                   ← lectores: devs, revisor técnico, auditor
    ├── sistema-de-recomendaciones.md
    ├── roles-y-permisos.md
    ├── arquitectura-y-estructura.md
    ├── sistema-de-diseno-ui.md
    ├── capa-academica.md
    ├── sostenibilidad.md
    ├── cliente-mobile.md
    └── analisis-de-codigo.md
```

Fichas técnicas pendientes de creación (cuando se desarrolle el contenido):
`plan-de-calidad.md`, `analisis-de-seguridad.md`.

## Manuales

Documentos pensados para lectura humana de principio a fin, narrativos y formales.

| Archivo | Audiencia | Contenido |
|---|---|---|
| [`manuales/manual-de-usuario.md`](manuales/manual-de-usuario.md) | Usuarios finales (todos los roles) | Cómo usar el sistema día a día: reservas, espacios, inventario, calendario, estadísticas, recomendaciones, preferencias. |
| [`manuales/manual-de-instalacion.md`](manuales/manual-de-instalacion.md) | Personal técnico de TI / DevOps | Cómo instalar, configurar, desplegar y mantener el sistema en distintos entornos. |

## Fichas técnicas

Documentos de profundización por subsistema. Siguen un patrón estándar de **5 secciones**:

1. Resumen ejecutivo (1 párrafo accesible).
2. Cómo se usa (link al manual de usuario si aplica).
3. Detalle técnico.
4. Métricas / evidencia.
5. Riesgos, limitaciones y TODOs.

| Archivo | Tema |
|---|---|
| [`fichas-tecnicas/sistema-de-recomendaciones.md`](fichas-tecnicas/sistema-de-recomendaciones.md) | Subsistema de recomendaciones inteligentes: algoritmos, scoring, jobs, caché. |
| [`fichas-tecnicas/roles-y-permisos.md`](fichas-tecnicas/roles-y-permisos.md) | Modelo de roles, mapa de permisos por rol, integración con Spring Security. |
| [`fichas-tecnicas/arquitectura-y-estructura.md`](fichas-tecnicas/arquitectura-y-estructura.md) | Organización del proyecto, stack tecnológico, módulos backend y frontend, migraciones. |
| [`fichas-tecnicas/sistema-de-diseno-ui.md`](fichas-tecnicas/sistema-de-diseno-ui.md) | Paleta UTEC, componentes UI propios, tokens de diseño, modo oscuro, convenciones de frontend. |
| [`fichas-tecnicas/capa-academica.md`](fichas-tecnicas/capa-academica.md) | Materias, recursos, tutorías y eventos: modelo de datos, endpoints, vistas por rol, detalle por ruta, check-in/lista de espera, afiches/QR/kiosko. |
| [`fichas-tecnicas/sostenibilidad.md`](fichas-tecnicas/sostenibilidad.md) | Dashboard de sostenibilidad: modelo de estimación, factores, ranking, y secciones del dashboard. |
| [`fichas-tecnicas/cliente-mobile.md`](fichas-tecnicas/cliente-mobile.md) | Cliente mobile Expo / React Native: stack, reuso de la API REST, pantallas, navegación por rol, tema. |
| [`fichas-tecnicas/analisis-de-codigo.md`](fichas-tecnicas/analisis-de-codigo.md) | Snapshot de calidad de código del backend según SonarQube + JaCoCo: cobertura, bugs, vulnerabilidades, code smells, deuda técnica. |

## Tono y nivel técnico

- En los **manuales** no aparecen nombres de clases, paths del código fuente ni jerga arquitectural en el cuerpo principal. Se escribe para que lo lea cualquier usuario o personal de TI.
- En las **fichas técnicas** sí: se citan archivos, métodos, tablas de base de datos, valores numéricos exactos.

Las reglas operativas para mantener la documentación alineada con el código están en `CLAUDE.md` (en la raíz del repositorio, no commiteado).

## Cómo agregar contenido nuevo

Antes de crear un archivo nuevo, verificar si el contenido pertenece a uno existente. Si efectivamente corresponde a un subsistema nuevo y se quiere destacar como documentación viva, crear una ficha técnica siguiendo el patrón de 5 secciones.

Detalles del flujo completo en [`PLAN_DE_DOCUMENTACION.md`](../PLAN_DE_DOCUMENTACION.md).
