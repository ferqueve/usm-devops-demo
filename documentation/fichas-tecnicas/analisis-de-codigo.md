# Análisis de Código

> **Última actualización**: 2026-05-04 · **Instancia SonarQube**: `https://usm-sonarqube.up.railway.app` · **Proyectos**: `USM-backend`, `USM-frontend`

## 1. Introducción

UTEC Space Manager incorpora desde el inicio un proceso continuo de **análisis estático de código y medición de cobertura de pruebas**. Esta práctica permite contar con indicadores objetivos sobre la calidad del software a lo largo de todo el ciclo de desarrollo y dejar evidencia trazable del cumplimiento de los criterios de calidad definidos por el equipo.

El análisis cubre los dos componentes del sistema de manera **independiente**, en línea con cómo se evalúan en la auditoría académica:

- **Backend** (Spring Boot + Java): proyecto SonarQube `USM-backend`, con cobertura medida por JaCoCo.
- **Frontend** (React + TypeScript): proyecto SonarQube `USM-frontend`. La cobertura se incorporará cuando se sumen pruebas automatizadas al frontend.

El presente documento resume la metodología utilizada, los indicadores actuales para cada componente y la evolución del proyecto en el tiempo. Está pensado como **documento de progreso**: cada nuevo análisis se incorpora a la sección de evolución, para visibilizar la mejora continua.

## 2. Metodología y herramientas

### 2.1 Herramientas

| Herramienta | Propósito | Alcance |
|---|---|---|
| **SonarQube** (proyecto `USM-backend`) | Análisis estático de calidad y seguridad del código backend. | Backend Java + Spring Boot. |
| **SonarQube** (proyecto `USM-frontend`) | Análisis estático de calidad y seguridad del código frontend. | Frontend React + TypeScript. |
| **JaCoCo** | Medición de cobertura de pruebas (líneas y ramas). | Backend. |
| **GitGuardian** y **GitLeaks** | Detección de credenciales o secretos accidentalmente commiteados al repositorio. | Todo el repositorio. |

Ambos proyectos SonarQube se alojan en la misma instancia dedicada del proyecto, lo que permite un acceso unificado a los dos dashboards manteniendo la separación lógica que requiere la evaluación académica.

JaCoCo se ejecuta como parte del ciclo estándar de Maven y su reporte se publica automáticamente en `USM-backend`. En el frontend, la cobertura de pruebas se incorporará cuando se sumen pruebas automatizadas con un test runner adecuado (por ejemplo, Vitest); hasta entonces el análisis del frontend cubre solo la calidad estática del código.

El pipeline de Integración Continua del proyecto ejecuta ambos análisis automáticamente en cada incorporación de código a la rama de desarrollo, mediante dos jobs paralelos en GitHub Actions: uno con Maven para el backend y otro con el escáner oficial de SonarQube para el frontend.

### 2.2 Quality Gate

El Quality Gate aplicado evalúa principalmente el **código nuevo** que se incorpora al proyecto. Los umbrales actuales son:

| Condición | Umbral |
|---|---|
| Violaciones nuevas | 0 |
| Densidad de líneas duplicadas en código nuevo | menor a 3 % |

Esta política tiene una intención clara: **garantizar que cada cambio nuevo eleve el estándar del proyecto**, aceptando que la base heredada mejora gradualmente con el trabajo de refactor planificado.

### 2.3 Indicadores monitoreados

El equipo monitorea los siguientes indicadores en cada análisis:

- **Tamaño y complejidad**: líneas de código, archivos, complejidad ciclomática y cognitiva.
- **Cobertura de pruebas**: cobertura global, de líneas y de ramas, sumado a la cantidad de pruebas y su tasa de éxito.
- **Calidad y confiabilidad**: bugs, vulnerabilidades, code smells, hotspots de seguridad.
- **Mantenibilidad**: deuda técnica estimada y rating asociado.
- **Duplicación**: líneas, bloques y archivos con código duplicado.
- **Calificaciones globales**: ratings de mantenibilidad, confiabilidad y seguridad (escala de A a E).

## 3. Indicadores actuales

Los indicadores se presentan separados por componente (backend / frontend), reflejando los dos proyectos SonarQube.

### 3.1 Backend (snapshot del 4 de mayo de 2026)

#### Estado del Quality Gate

El proyecto utiliza un Quality Gate personalizado (`USM Strict`) que evalúa el estado total del código contra el estándar máximo. El indicador refleja honestamente cuánto falta para alcanzar ese máximo y se actualiza con cada análisis.

#### Tamaño y complejidad

| Indicador | Valor |
|---|---|
| Líneas de código (sin comentarios) | 12.180 |
| Líneas totales | 16.653 |
| Archivos | 151 |
| Complejidad ciclomática | 1.743 |
| Complejidad cognitiva | 1.464 |

#### Cobertura de pruebas

| Indicador | Valor |
|---|---|
| Cobertura global | 46,4 % |
| Cobertura de líneas | 51,5 % |
| Cobertura de ramas | 32,4 % |
| Cantidad de pruebas unitarias | 377 |
| Tasa de éxito | 94,4 % |

#### Calidad y mantenibilidad

| Indicador | Valor |
|---|---|
| Issues totales | 396 |
| Issues de confiabilidad (bugs) | 7 |
| Issues de seguridad (vulnerabilidades) | 1 |
| Issues de mantenibilidad (code smells) | 388 |
| Hotspots de seguridad | 2 |
| Densidad de líneas duplicadas | 3,8 % |
| Deuda técnica estimada | 4.078 minutos (~68 horas) |

#### Calificaciones

| Dimensión | Calificación |
|---|:-:|
| Mantenibilidad | A |
| Confiabilidad | D |
| Seguridad | E |

### 3.2 Frontend

El primer análisis del frontend se ejecutará al integrar la rama de desarrollo al pipeline configurado para el proyecto `USM-frontend`. Esta sección se completará con los datos resultantes del primer escaneo.

| Indicador | Valor |
|---|---|
| Estado del Quality Gate | (pendiente del primer análisis) |
| Líneas de código | (pendiente) |
| Issues totales | (pendiente) |
| Hotspots de seguridad | (pendiente) |
| Densidad de líneas duplicadas | (pendiente) |
| Calificación de mantenibilidad | (pendiente) |
| Calificación de confiabilidad | (pendiente) |
| Calificación de seguridad | (pendiente) |

> El frontend aún no cuenta con pruebas automatizadas, por lo que la cobertura no se mide en esta etapa. Se incorporará un test runner en una iteración posterior y, a partir de ese momento, los indicadores de cobertura aparecerán en esta tabla.

## 4. Lectura de los resultados

Esta lectura corresponde al estado del **backend** (snapshot del 4 de mayo de 2026). La interpretación de los resultados del frontend se sumará tras el primer análisis del proyecto `USM-frontend`.

### 4.1 Fortalezas observadas

- **Mantenibilidad alta**: la calificación A en mantenibilidad refleja que la deuda técnica relativa al tamaño del proyecto es baja, lo que facilita la incorporación de nuevas funcionalidades.
- **Suite de pruebas significativa**: el proyecto cuenta con 377 pruebas unitarias activas, lo que demuestra una práctica establecida de testing automatizado.
- **Duplicación bajo control**: la densidad de líneas duplicadas se mantiene en un 3,8 %, dentro de rangos saludables para un proyecto de este tamaño.
- **Estándar elevado autoimpuesto**: el equipo eligió un Quality Gate estricto (con condiciones sobre el código total y no solo el nuevo) para utilizar el indicador como vara de progreso hacia la calidad máxima.

### 4.2 Áreas en proceso de mejora

El análisis identifica áreas en las que el equipo está trabajando activamente como parte del proceso de calidad continua:

- **Cobertura de ramas**: el 32,4 % de cobertura de ramas refleja que existen caminos lógicos sin verificación automatizada, especialmente en condicionales complejos. La estrategia del equipo apunta a incrementar progresivamente este indicador como parte del trabajo de testing por feature.
- **Estabilidad de la suite**: una porción de las pruebas presenta fallos o errores de ejecución, lo que requiere estabilización antes de seguir ampliando la cobertura.
- **Confiabilidad**: la calificación D refleja la presencia de bugs identificados por SonarQube que están bajo análisis del equipo. Cada uno será resuelto y registrado en el siguiente snapshot.
- **Seguridad**: la calificación E está condicionada por dos hotspots de seguridad pendientes de revisión humana y una vulnerabilidad identificada. El equipo realiza una revisión específica que se documenta en la ficha de Análisis de Seguridad.
- **Patrones de mejora estructural**: el análisis detecta patrones recurrentes de oportunidad de refactor, principalmente la extracción de literales repetidos a constantes y la migración de inyección por campo a inyección por constructor en algunos servicios. Forman parte del backlog técnico planificado.

### 4.3 Sobre la calificación global

Es importante interpretar correctamente las calificaciones de SonarQube. Una calificación E en seguridad **no implica que existan vulnerabilidades activas explotables**, sino que existen hotspots — puntos del código que SonarQube señala como sensibles y que requieren revisión humana para confirmarse como seguros. Una vez que los hotspots son revisados y marcados según corresponda, la calificación se ajusta automáticamente.

De la misma forma, los 388 code smells son sugerencias de mejora de calidad estructural, no defectos funcionales. Son atendidos según prioridad en el plan de refactor del equipo.

## 5. Evolución del proyecto

Esta sección registra los sucesivos snapshots de análisis para visualizar la evolución del proyecto en el tiempo. Cada nuevo análisis se incorpora como una nueva fila, sin reemplazar los anteriores. Las dos tablas muestran la evolución por separado para backend y frontend.

### 5.1 Backend (`USM-backend`)

| Fecha | Cobertura | Confiabilidad (bugs) | Seguridad (vuln.) | Hotspots revisados | Mantenibilidad | Confiabilidad | Seguridad | Deuda (h) |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 2026-05-04 | 46,4 % | 7 | 1 | 0 % | A | D | E | 68 |

### 5.2 Frontend (`USM-frontend`)

| Fecha | LOC | Issues totales | Hotspots revisados | Mantenibilidad | Confiabilidad | Seguridad |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| (pendiente del primer análisis) | — | — | — | — | — | — |

### 5.3 Hitos del proceso de calidad

| Fecha | Hito |
|---|---|
| 2025-12-22 | Incorporación de SonarQube al pipeline de análisis del proyecto (commit `6077513`). |
| 2026-01-04 | Incorporación de JaCoCo para medición de cobertura del backend (commit `224f696`). |
| 2026-05-04 | Primer snapshot formal documentado en esta ficha y adopción del Quality Gate estricto `USM Strict` para evaluación contra estándar máximo. |
| 2026-05-04 | Separación del análisis en dos proyectos SonarQube (`USM-backend` y `USM-frontend`) y configuración del pipeline de Integración Continua para escanear ambos componentes en paralelo. |

## 6. Cierre

El análisis estático y la medición de cobertura permiten al equipo de UTEC Space Manager **conocer con datos objetivos el estado del código**, identificar áreas de mejora y demostrar progreso a lo largo del ciclo de vida del proyecto. La incorporación temprana de estas herramientas al flujo de trabajo refleja una decisión consciente de priorizar la calidad como atributo del producto.

Este documento se actualiza en cada nuevo análisis y constituye, junto con el Plan de Calidad de proceso, la evidencia técnica del cumplimiento de los criterios de calidad definidos para el proyecto.
