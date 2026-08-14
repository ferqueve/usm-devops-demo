# 📘 MANUAL DE USUARIO
# UTEC Space Manager
# Sistema de Gestión de Espacios y Reservas

---

**Versión del Manual:** 1.0.0  
**Fecha de Publicación:** Mayo 2026  
**Para:** Universidad Tecnológica del Uruguay (UTEC)  
**Sistema:** UTEC Space Manager v1.0.0

---

## 📋 TABLA DE CONTENIDOS

1. [Introducción](#1-introducción)
   - [1.1 Bienvenida](#11-bienvenida)
   - [1.2 Descripción General del Sistema](#12-descripción-general-del-sistema)
   - [1.3 Objetivo del Manual](#13-objetivo-del-manual)
   - [1.4 Convenciones Utilizadas](#14-convenciones-utilizadas)
2. [Requisitos y Acceso](#2-requisitos-y-acceso)
   - [2.1 Requisitos del Sistema](#21-requisitos-del-sistema)
   - [2.2 URLs de Acceso](#22-urls-de-acceso)
   - [2.3 Primer Acceso al Sistema](#23-primer-acceso-al-sistema)
   - [2.4 Solución de Problemas de Acceso](#24-solución-de-problemas-de-acceso)
3. [Autenticación y Registro](#3-autenticación-y-registro)
   - [3.1 Registro de Nuevos Usuarios](#31-registro-de-nuevos-usuarios)
   - [3.2 Inicio de Sesión Tradicional](#32-inicio-de-sesión-tradicional)
   - [3.3 Inicio de Sesión con Google OAuth](#33-inicio-de-sesión-con-google-oauth)
   - [3.4 Verificación de Email](#34-verificación-de-email)
   - [3.5 Recuperación de Contraseña](#35-recuperación-de-contraseña)
   - [3.6 Cierre de Sesión](#36-cierre-de-sesión)
4. [Roles y Permisos](#4-roles-y-permisos)
   - [4.1 Descripción de Roles](#41-descripción-de-roles)
   - [4.2 Permisos por Rol](#42-permisos-por-rol)
   - [4.3 Tabla Comparativa de Permisos](#43-tabla-comparativa-de-permisos)
   - [4.4 Áreas Accesibles por Rol](#44-áreas-accesibles-por-rol)
5. [Estructura de la Interfaz](#5-estructura-de-la-interfaz)
   - [5.1 Dashboard Layout](#51-dashboard-layout)
   - [5.2 Navegación Principal](#52-navegación-principal)
   - [5.3 Componentes Comunes](#53-componentes-comunes)
   - [5.4 Menú de Usuario](#54-menú-de-usuario)
   - [5.5 Preferencias de Usuario](#55-preferencias-de-usuario)
6. [Dashboard Principal](#6-dashboard-principal)
   - [6.1 Visión General](#61-visión-general)
   - [6.2 Métricas Principales](#62-métricas-principales)
   - [6.3 Próximas Reservas](#63-próximas-reservas)
   - [6.4 Gráficos y Estadísticas](#64-gráficos-y-estadísticas)
   - [6.5 Acciones Rápidas](#65-acciones-rápidas)
   - [6.6 Filtros del Dashboard](#66-filtros-del-dashboard)
7. [Gestión de Reservas](#7-gestión-de-reservas)
   - [7.1 Ver Todas las Reservas](#71-ver-todas-las-reservas)
   - [7.2 Crear Nueva Reserva](#72-crear-nueva-reserva)
   - [7.3 Crear Reserva con Recurrencia](#73-crear-reserva-con-recurrencia)
   - [7.4 Solicitar Reserva](#74-solicitar-reserva)
   - [7.5 Editar Reserva](#75-editar-reserva)
   - [7.6 Cancelar Reserva](#76-cancelar-reserva)
   - [7.7 Aprobar/Rechazar Reservas](#77-aprobarrechazar-reservas)
   - [7.8 Ver Detalles de Reserva](#78-ver-detalles-de-reserva)
   - [7.9 Filtros y Búsqueda](#79-filtros-y-búsqueda)
   - [7.10 Vistas de Reservas](#710-vistas-de-reservas)
   - [7.11 Solicitudes de Inventario para Reservas](#711-solicitudes-de-inventario-para-reservas)
8. [Gestión de Espacios](#8-gestión-de-espacios)
   - [8.1 Ver Todos los Espacios](#81-ver-todos-los-espacios)
   - [8.2 Crear Espacio](#82-crear-espacio)
   - [8.3 Editar Espacio](#83-editar-espacio)
   - [8.4 Eliminar Espacio](#84-eliminar-espacio)
   - [8.5 Ver Detalles de Espacio](#85-ver-detalles-de-espacio)
   - [8.6 Gestionar Inventario del Espacio](#86-gestionar-inventario-del-espacio)
   - [8.7 Actualizar Estado del Espacio](#87-actualizar-estado-del-espacio)
   - [8.8 Filtros y Búsqueda](#88-filtros-y-búsqueda)
   - [8.9 Tipos de Espacio](#89-tipos-de-espacio)
9. [Gestión de Inventario](#9-gestión-de-inventario)
   - [9.1 Ver Todo el Inventario](#91-ver-todo-el-inventario)
   - [9.2 Crear Item de Inventario](#92-crear-item-de-inventario)
   - [9.3 Editar Item](#93-editar-item)
   - [9.4 Eliminar Item](#94-eliminar-item)
   - [9.5 Asignar Item a Espacio](#95-asignar-item-a-espacio)
   - [9.6 Cambiar Estado del Item](#96-cambiar-estado-del-item)
   - [9.7 Importar Inventario desde CSV](#97-importar-inventario-desde-csv)
   - [9.8 Exportar Inventario a CSV](#98-exportar-inventario-a-csv)
   - [9.9 Filtros y Búsqueda](#99-filtros-y-búsqueda)
   - [9.10 Vistas de Inventario](#910-vistas-de-inventario)
   - [9.11 Tipos de Elemento](#911-tipos-de-elemento)
   - [9.12 Solicitudes de Inventario](#912-solicitudes-de-inventario)
10. [Gestión de Usuarios](#10-gestión-de-usuarios)
    - [10.1 Ver Todos los Usuarios](#101-ver-todos-los-usuarios)
    - [10.2 Crear Usuario](#102-crear-usuario)
    - [10.3 Editar Usuario](#103-editar-usuario)
    - [10.4 Cambiar Rol de Usuario](#104-cambiar-rol-de-usuario)
    - [10.5 Activar/Desactivar Usuario](#105-activardesactivar-usuario)
    - [10.6 Verificar Email de Usuario](#106-verificar-email-de-usuario)
    - [10.7 Restablecer Contraseña](#107-restablecer-contraseña)
    - [10.8 Exportar Usuarios a CSV](#108-exportar-usuarios-a-csv)
    - [10.9 Estadísticas de Usuarios](#109-estadísticas-de-usuarios)
    - [10.10 Filtros y Búsqueda](#1010-filtros-y-búsqueda)
    - [10.11 Gestionar Carreras](#1011-gestionar-carreras)
11. [Calendario de Reservas](#11-calendario-de-reservas)
    - [11.1 Vista de Calendario](#111-vista-de-calendario)
    - [11.2 Navegación del Calendario](#112-navegación-del-calendario)
    - [11.3 Ver Reservas en el Calendario](#113-ver-reservas-en-el-calendario)
    - [11.4 Filtros del Calendario](#114-filtros-del-calendario)
    - [11.5 Modo Pantalla Completa](#115-modo-pantalla-completa)
12. [Estadísticas y Reportes](#12-estadísticas-y-reportes)
    - [12.1 Estadísticas de Inventario](#121-estadísticas-de-inventario)
    - [12.2 Estadísticas de Espacios](#122-estadísticas-de-espacios)
    - [12.3 Estadísticas de Reservas](#123-estadísticas-de-reservas)
    - [12.4 Gráficos y Visualizaciones](#124-gráficos-y-visualizaciones)
    - [12.5 Exportar Reportes](#125-exportar-reportes)
13. [Sistema y Configuración](#13-sistema-y-configuración)
    - [13.1 Panel de Sistema](#131-panel-de-sistema)
    - [13.2 Métricas del Sistema](#132-métricas-del-sistema)
    - [13.3 Logs de Aplicación](#133-logs-de-aplicación)
    - [13.4 Actividad HTTP](#134-actividad-http)
14. [Auditoría](#14-auditoría)
    - [14.1 Ver Registros de Auditoría](#141-ver-registros-de-auditoría)
    - [14.2 Filtrar Registros](#142-filtrar-registros)
    - [14.3 Ver Detalles de Registro](#143-ver-detalles-de-registro)
15. [Preferencias de Usuario](#15-preferencias-de-usuario)
    - [15.1 Notificaciones por Email](#151-notificaciones-por-email)
    - [15.2 Preferencias de Vista](#152-preferencias-de-vista)
    - [15.3 Guardar Preferencias](#153-guardar-preferencias)
16. [Recomendaciones Inteligentes](#16-recomendaciones-inteligentes)
    - [16.1 Qué son y para qué sirven](#161-qué-son-y-para-qué-sirven)
    - [16.2 Recomendaciones al crear una reserva](#162-recomendaciones-al-crear-una-reserva)
    - [16.3 Recomendaciones en el dashboard](#163-recomendaciones-en-el-dashboard)
    - [16.4 Recomendaciones para personal de mantenimiento](#164-recomendaciones-para-personal-de-mantenimiento)
    - [16.5 Recomendaciones para administradores y analistas](#165-recomendaciones-para-administradores-y-analistas)
    - [16.6 Cómo entender los puntajes](#166-cómo-entender-los-puntajes)
    - [16.7 Preguntas frecuentes sobre recomendaciones](#167-preguntas-frecuentes-sobre-recomendaciones)
17. [Carreras](#17-carreras)
    - [17.1 Ver Carreras](#171-ver-carreras)
    - [17.2 Gestionar Carreras](#172-gestionar-carreras)
18. [Guías Prácticas por Rol](#18-guias-prácticas-por-rol)
    - [18.1 Flujo para ADMIN](#181-flujo-para-admin)
    - [18.2 Flujo para ANALISTA](#182-flujo-para-analista)
    - [18.3 Flujo para MANTENIMIENTO](#183-flujo-para-mantenimiento)
    - [18.4 Flujo para DOCENTE](#184-flujo-para-docente)
    - [18.5 Flujo para ESTUDIANTE](#185-flujo-para-estudiante)
    - [18.6 Flujo para EXTERNO](#186-flujo-para-externo)
19. [Casos de Uso Comunes](#19-casos-de-uso-comunes)
20. [Solución de Problemas](#20-solución-de-problemas)
21. [Preguntas Frecuentes (FAQ)](#21-preguntas-frecuentes-faq)
22. [Glosario](#22-glosario)
23. [Anexos](#23-anexos)
24. [Materias, Tutorías y Eventos](#24-materias-tutorías-y-eventos)
    - [24.1 Materias](#241-materias)
    - [24.2 Tutorías](#242-tutorías)
    - [24.3 Eventos](#243-eventos)
25. [Sostenibilidad](#25-sostenibilidad)

---

# 1. INTRODUCCIÓN

## 1.1 Bienvenida

Bienvenido al **Manual de Usuario de UTEC Space Manager**, el sistema integral de gestión de espacios y reservas para la Universidad Tecnológica del Uruguay (UTEC).

Este manual está diseñado para guiar a todos los usuarios del sistema, independientemente de su rol o nivel de experiencia, a través de todas las funcionalidades disponibles en la plataforma.

## 1.2 Descripción General del Sistema

**UTEC Space Manager** es una aplicación web completa desarrollada para facilitar la gestión de espacios físicos (salones, laboratorios, auditorios) y recursos de la Universidad Tecnológica del Uruguay. El sistema permite:

- **Gestión de Espacios**: Registro y administración de todos los espacios disponibles en la universidad
- **Gestión de Reservas**: Sistema completo para reservar espacios con control de conflictos y solapamientos
- **Gestión de Inventario**: Administración de recursos y elementos asignados a cada espacio
- **Gestión de Usuarios**: Administración de usuarios con diferentes roles y permisos
- **Calendario Interactivo**: Visualización calendárica de todas las reservas
- **Estadísticas y Reportes**: Análisis detallado del uso de espacios y recursos
- **Auditoría**: Registro completo de todas las acciones realizadas en el sistema

### Características Principales

- ✅ **Autenticación Segura**: Sistema de autenticación con JWT y OAuth de Google
- ✅ **Roles y Permisos**: Sistema granular de permisos por rol
- ✅ **Interfaz Intuitiva**: Diseño moderno y responsive
- ✅ **Control de Conflictos**: Prevención automática de reservas solapadas
- ✅ **Notificaciones**: Sistema de notificaciones por email
- ✅ **Reportes Exportables**: Exportación a PDF y CSV
- ✅ **Auditoría Completa**: Registro de todas las acciones del sistema

## 1.3 Objetivo del Manual

Este manual tiene como objetivo:

1. **Guiar a los usuarios** en el uso efectivo del sistema
2. **Documentar todas las funcionalidades** disponibles según el rol del usuario
3. **Proporcionar ejemplos prácticos** de casos de uso comunes
4. **Resolver dudas frecuentes** sobre el funcionamiento del sistema
5. **Facilitar el onboarding** de nuevos usuarios

## 1.4 Convenciones Utilizadas

En este manual utilizamos las siguientes convenciones:

### Iconos y Símbolos

- 📘 **Iconos**: Se utilizan iconos emoji para identificar visualmente las secciones
- ⚠️ **Advertencias**: Información importante que requiere atención
- ✅ **Completado**: Indica que una acción está completada o disponible
- ❌ **No disponible**: Indica que una funcionalidad no está disponible para cierto rol
- 💡 **Consejos**: Sugerencias útiles para optimizar el uso del sistema

### Formato de Texto

- **Texto en negrita**: Indica nombres de botones, campos o elementos de la interfaz
- *Texto en cursiva*: Indica valores de ejemplo o opciones
- `Texto en código`: Indica nombres técnicos, estados o valores específicos
- [Enlaces]: Referencias a otras secciones del manual o recursos externos

### Estructura de Instrucciones

Las instrucciones paso a paso se presentan en formato numerado:

1. **Paso 1**: Descripción del primer paso
2. **Paso 2**: Descripción del segundo paso
   - Subpaso a
   - Subpaso b
3. **Paso 3**: Descripción del tercer paso

### Roles Mencionados

- **ADMIN**: Administrador del sistema
- **ANALISTA**: Personal administrativo
- **MANTENIMIENTO**: Personal de mantenimiento
- **DOCENTE**: Profesores
- **ESTUDIANTE**: Estudiantes
- **EXTERNO**: Usuarios externos

### Estados del Sistema

- **DISPONIBLE**: Recurso disponible para uso
- **MANTENIMIENTO**: Recurso en mantenimiento
- **OCUPADO**: Recurso ocupado
- **DANADO**: Item dañado
- **PENDIENTE**: Solicitud pendiente de aprobación
- **APROBADO**: Solicitud aprobada
- **RECHAZADO**: Solicitud rechazada
- **CANCELADO**: Reserva cancelada

---

# 2. REQUISITOS Y ACCESO

## 2.1 Requisitos del Sistema

Para utilizar UTEC Space Manager de manera óptima, su dispositivo debe cumplir con los siguientes requisitos:

### Navegadores Compatibles

El sistema es compatible con los siguientes navegadores web:

| Navegador | Versión Mínima | Estado |
|-----------|----------------|--------|
| **Google Chrome** | 90+ | ✅ Recomendado |
| **Mozilla Firefox** | 88+ | ✅ Compatible |
| **Microsoft Edge** | 90+ | ✅ Compatible |
| **Safari** | 14+ | ✅ Compatible |
| **Opera** | 76+ | ✅ Compatible |

⚠️ **Importante**: Se recomienda usar la versión más reciente del navegador para obtener la mejor experiencia y seguridad.

### Requisitos de Conexión

- **Internet**: Conexión a internet estable
- **Velocidad**: Mínimo 1 Mbps recomendado
- **Firewall**: Permitir conexiones HTTPS al servidor del sistema

### Dispositivos Compatibles

- 💻 **Computadoras de escritorio** (Windows, macOS, Linux)
- 📱 **Tablets** (iPad, Android tablets)
- 📱 **Smartphones** (iOS, Android)

> 💡 **Nota**: El sistema es responsive y se adapta a diferentes tamaños de pantalla, aunque la mejor experiencia se obtiene en dispositivos de escritorio.

### Configuraciones Recomendadas

- **Resolución mínima**: 1280x720 píxeles
- **JavaScript**: Debe estar habilitado
- **Cookies**: Deben estar habilitadas
- **Pop-ups**: Permitir ventanas emergentes del sitio

## 2.2 URLs de Acceso

El sistema está disponible en las siguientes URLs:

### Ambiente de Producción
- **URL Principal**: `https://spaces.utec.edu.uy` (o la URL asignada por su institución)

### Ambiente de Desarrollo
- **URL de Desarrollo**: Según la configuración de su administrador

> ⚠️ **Importante**: Contacte a su administrador del sistema para obtener la URL correcta de acceso.

## 2.3 Primer Acceso al Sistema

Al acceder por primera vez al sistema, seguir estos pasos:

1. **Abrir el navegador** y dirigirse a la URL del sistema
2. **Verificar la conexión**: Debe ver la página de inicio de sesión
3. Si no tiene cuenta:
   - Hacer clic en **"Registrarse"** o **"Crear cuenta"**
   - Completar el formulario de registro (ver sección [3.1](#31-registro-de-nuevos-usuarios))
4. Si ya tiene cuenta:
   - Ingresar email y contraseña
   - O usar **"Iniciar con Google"** (ver sección [3.3](#33-inicio-de-sesión-con-google-oauth))

## 2.4 Solución de Problemas de Acceso

### Problema: No puedo acceder al sitio

**Soluciones:**
1. Verificar la conexión a internet
2. Verificar que la URL sea correcta
3. Limpiar caché y cookies del navegador
4. Probar en otro navegador
5. Verificar que no haya bloqueadores de pop-ups activos
6. Contactar al administrador del sistema

### Problema: El sitio carga lentamente

**Soluciones:**
1. Verificar la velocidad de internet
2. Cerrar otras pestañas y aplicaciones que consuman ancho de banda
3. Limpiar caché del navegador
4. Actualizar el navegador a la última versión

### Problema: Error de conexión

**Soluciones:**
1. Verificar que el firewall no esté bloqueando la conexión
2. Verificar la configuración de proxy (si aplica)
3. Contactar al administrador del sistema
4. Verificar el estado del servidor

### Problema: Página en blanco

**Soluciones:**
1. Habilitar JavaScript en el navegador
2. Actualizar el navegador
3. Limpiar caché y cookies
4. Probar en modo incógnito/privado
5. Deshabilitar extensiones del navegador temporalmente

---

# 3. AUTENTICACIÓN Y REGISTRO

## 3.1 Registro de Nuevos Usuarios

Para crear una cuenta nueva en el sistema:

### Pasos para Registrarse

1. **Acceder a la página de registro**
   - En la página de inicio de sesión, hacer clic en **"Registrarse"** o **"Crear cuenta"**
   - O acceder directamente a `/auth/register` si conoce la URL

2. **Completar el formulario de registro**
   - **Nombre**: Ingresar su nombre
   - **Apellido**: Ingresar su apellido
   - **Email**: Ingresar su dirección de correo electrónico
     - ⚠️ Debe ser un email válido
     - Se utilizará para iniciar sesión y recibir notificaciones
   - **Contraseña**: Crear una contraseña segura
     - Mínimo 8 caracteres recomendado
     - Mezcla de letras, números y símbolos
   - **Confirmar contraseña**: Ingresar la misma contraseña nuevamente

3. **Enviar el formulario**
   - Hacer clic en **"Registrarse"** o **"Crear cuenta"**
   - Esperar el mensaje de confirmación

4. **Verificar el email** (ver sección [3.4](#34-verificación-de-email))
   - Revisar la bandeja de entrada del email registrado
   - Buscar el email de verificación del sistema
   - Hacer clic en el enlace de verificación o ingresar el código

### Asignación Automática de Rol

El sistema asigna automáticamente el rol según el dominio del email:

- **@estudiantes.utec.edu.uy** o **@utec.edu.uy** → Rol: **ESTUDIANTE**
- **Otros dominios** → Rol: **EXTERNO**

> 💡 **Nota**: Un administrador puede cambiar el rol posteriormente si es necesario.

### Importante

- ⚠️ El email debe ser único en el sistema
- ⚠️ Debe verificar su email antes de poder iniciar sesión
- ⚠️ Guarde su contraseña en un lugar seguro

## 3.2 Inicio de Sesión Tradicional

Para iniciar sesión con email y contraseña:

### Pasos para Iniciar Sesión

1. **Acceder a la página de inicio de sesión**
   - Abrir el navegador y dirigirse a la URL del sistema
   - Si ya está en otra página, hacer clic en **"Iniciar sesión"**

2. **Ingresar credenciales**
   - **Email**: Ingresar el email con el que se registró
   - **Contraseña**: Ingresar su contraseña
   - Opcional: Marcar **"Recordarme"** para mantener la sesión activa

3. **Hacer clic en "Iniciar sesión"**

4. **Esperar la redirección**
   - Si las credenciales son correctas, será redirigido al Dashboard
   - Si hay error, verá un mensaje indicando el problema

### Problemas Comunes al Iniciar Sesión

**Email o contraseña incorrectos:**
- Verificar que el email sea correcto
- Verificar que la contraseña sea correcta (revisar mayúsculas/minúsculas)
- Usar la opción "¿Olvidaste tu contraseña?" si no recuerda la contraseña

**Email no verificado:**
- Debe verificar su email antes de poder iniciar sesión
- Revisar la bandeja de entrada (y spam) para el email de verificación
- Solicitar un nuevo código de verificación si es necesario

**Cuenta desactivada:**
- Contactar al administrador del sistema
- Un administrador puede reactivar su cuenta

## 3.3 Inicio de Sesión con Google OAuth

El sistema permite iniciar sesión usando una cuenta de Google:

### Pasos para Iniciar Sesión con Google

1. **Acceder a la página de inicio de sesión**

2. **Hacer clic en "Iniciar con Google"** o el botón de Google OAuth

3. **Seleccionar cuenta de Google**
   - Se abrirá una ventana de Google para seleccionar la cuenta
   - Elegir la cuenta de Google que desea usar
   - Si no hay sesión iniciada, deberá iniciar sesión en Google primero

4. **Autorizar el acceso**
   - Google solicitará permiso para acceder a su información básica
   - Hacer clic en **"Permitir"** o **"Autorizar"**

5. **Esperar la redirección**
   - Será redirigido automáticamente al sistema
   - Si es la primera vez, el sistema creará una cuenta automáticamente

### Ventajas del Login con Google

- ✅ No necesita recordar una contraseña adicional
- ✅ Verificación de email automática
- ✅ Inicio de sesión más rápido
- ✅ Mayor seguridad con autenticación de dos factores de Google

### Primera Vez con Google OAuth

Si es la primera vez que inicia sesión con Google:

1. El sistema creará automáticamente una cuenta con:
   - Email de Google
   - Nombre de Google
   - Rol asignado según el dominio del email
   - Estado verificado automáticamente

2. Puede usar el sistema inmediatamente sin necesidad de verificar email

3. Un administrador puede cambiar su rol si es necesario

## 3.4 Verificación de Email

Después del registro, debe verificar su email para poder iniciar sesión:

### Pasos para Verificar Email

1. **Revisar su bandeja de entrada**
   - Buscar un email del sistema con el asunto: "Verifica tu email" o similar
   - Si no lo encuentra, revisar la carpeta de spam o correo no deseado

2. **Obtener el código de verificación**
   - Opción A: Hacer clic en el enlace de verificación del email
   - Opción B: Copiar el código numérico del email

3. **Ingresar el código**
   - Si hizo clic en el enlace, será redirigido automáticamente y verificado
   - Si copió el código, ir a la página de verificación e ingresarlo manualmente

4. **Confirmar la verificación**
   - Debe ver un mensaje de éxito
   - Ahora puede iniciar sesión normalmente

### Reenviar Código de Verificación

Si no recibió el email o el código expiró:

1. Ir a la página de verificación (`/auth/verify`)
2. Ingresar su email
3. Hacer clic en **"Reenviar código"** o **"Enviar nuevo código"**
4. Esperar el nuevo email (puede tardar unos minutos)

### ¿El código expiró?

- Los códigos de verificación tienen una duración limitada
- Si el código expiró, solicite uno nuevo
- Los administradores pueden reenviar códigos manualmente si es necesario

## 3.5 Recuperación de Contraseña

Si olvidó su contraseña, puede restablecerla:

### Pasos para Recuperar Contraseña

1. **En la página de inicio de sesión**
   - Hacer clic en **"¿Olvidaste tu contraseña?"** o enlace similar

2. **Ingresar su email**
   - Ingresar el email asociado a su cuenta
   - Hacer clic en **"Enviar enlace"** o **"Restablecer contraseña"**

3. **Revisar su email**
   - Buscar un email del sistema con el asunto "Restablecer contraseña"
   - Hacer clic en el enlace proporcionado

4. **Crear nueva contraseña**
   - Ingresar la nueva contraseña
   - Confirmar la nueva contraseña
   - Hacer clic en **"Restablecer contraseña"** o **"Guardar"**

5. **Iniciar sesión**
   - Ahora puede iniciar sesión con la nueva contraseña

### Restablecimiento por Administrador

Los administradores pueden restablecer contraseñas directamente:

1. El administrador accede a la gestión de usuarios
2. Selecciona el usuario
3. Hace clic en **"Restablecer contraseña"**
4. El sistema envía un email al usuario con instrucciones

## 3.6 Cierre de Sesión

Para cerrar sesión de manera segura:

### Pasos para Cerrar Sesión

1. **Hacer clic en el menú de usuario**
   - Ubicado en la esquina superior derecha del Dashboard
   - Icono de usuario o avatar

2. **Seleccionar "Cerrar sesión"**
   - En el menú desplegable, hacer clic en **"Cerrar sesión"**

3. **Confirmar**
   - Será redirigido a la página de inicio de sesión
   - Su sesión estará cerrada de manera segura

### Importante sobre el Cierre de Sesión

- ✅ Cerrar sesión es importante para proteger su cuenta en computadoras compartidas
- ✅ El token de sesión se invalida al cerrar sesión
- ✅ Si seleccionó "Recordarme", debe cerrar sesión manualmente

### Cierre Automático de Sesión

- La sesión expira automáticamente después de un período de inactividad
- Si su sesión expira, deberá iniciar sesión nuevamente
- Los datos no guardados pueden perderse si la sesión expira

---

# 4. ROLES Y PERMISOS

## 4.1 Descripción de Roles

El sistema UTEC Space Manager utiliza un sistema de roles para controlar el acceso a las diferentes funcionalidades. Cada usuario tiene un rol asignado que determina qué puede hacer en el sistema.

### ADMIN - Administrador del Sistema

El rol **ADMIN** tiene acceso completo al sistema. Puede gestionar todos los aspectos de la plataforma.

**Características principales:**
- ✅ Gestión completa de usuarios (crear, editar, eliminar, cambiar roles)
- ✅ Gestión completa de espacios e inventario
- ✅ Gestión completa de reservas
- ✅ Acceso exclusivo al panel de Sistema
- ✅ Acceso a Auditoría
- ✅ Estadísticas y reportes completos
- ✅ Configuración del sistema

**Tareas típicas:**
- Administrar usuarios y sus permisos
- Configurar el sistema
- Supervisar el funcionamiento general
- Revisar logs y auditoría

### ANALISTA - Personal Administrativo

El rol **ANALISTA** tiene autoridad completa sobre las reservas. Puede ver espacios e inventario para información, pero no gestionarlos directamente.

**Características principales:**
- ✅ CRUD completo de reservas (crear, editar, eliminar, aprobar/rechazar)
- ✅ Ver todas las reservas del sistema
- ✅ Crear solicitudes de inventario para reservas
- ✅ Ver espacios e inventario (solo lectura)
- ✅ Estadísticas de reservas
- ❌ No puede gestionar espacios directamente
- ❌ No puede gestionar inventario directamente

**Tareas típicas:**
- Gestionar reservas del sistema
- Aprobar/rechazar solicitudes de reserva
- Crear reservas para otros usuarios
- Ver disponibilidad de espacios

### MANTENIMIENTO - Personal de Mantenimiento

El rol **MANTENIMIENTO** gestiona completamente espacios e inventario, pero no puede crear reservas.

**Características principales:**
- ✅ Gestión completa de espacios (crear, editar, gestionar estado)
- ✅ Gestión completa de inventario (crear, editar, asignar, cambiar estado)
- ✅ Aprobar/rechazar/entregar solicitudes de inventario
- ✅ Gestionar tipos de espacio y tipos de elemento
- ✅ Ver reservas (para conocer ocupación)
- ✅ Estadísticas de espacios e inventario
- ❌ No puede crear reservas
- ❌ No puede gestionar usuarios

**Tareas típicas:**
- Mantener actualizado el inventario de espacios
- Registrar el estado de items (disponible, mantenimiento, dañado)
- Asignar/desasignar items entre espacios
- Actualizar capacidad y características de espacios
- Aceptar solicitudes de inventario para reservas

### DOCENTE - Profesores

El rol **DOCENTE** puede ver todas las reservas del sistema y solicitar reservas de todo tipo.

**Características principales:**
- ✅ Ver todas las reservas del sistema
- ✅ Solicitar reservas (se crean con estado PENDIENTE)
- ✅ Ver espacios y disponibilidad
- ✅ Ver calendario completo
- ✅ Ver inventario de espacios (al ver detalles)
- ❌ No puede crear reservas directamente (solo solicitar)
- ❌ No puede aprobar/rechazar reservas
- ❌ No puede gestionar espacios o inventario

**Tareas típicas:**
- Solicitar reservas de espacios para clases
- Ver disponibilidad de espacios
- Ver el calendario de reservas
- Ver estado de sus solicitudes

### ESTUDIANTE - Estudiantes

El rol **ESTUDIANTE** tiene acceso limitado, solo puede ver las reservas del sistema.

**Características principales:**
- ✅ Ver reservas del sistema
- ✅ Ver calendario con reservas
- ✅ Ver espacios (para contexto de reservas)
- ✅ Ver inventario de espacios (al ver detalles)
- ❌ No puede crear reservas
- ❌ No puede solicitar reservas
- ❌ No puede gestionar ningún recurso

**Tareas típicas:**
- Ver reservas disponibles
- Consultar el calendario de espacios
- Ver qué espacios están disponibles

### EXTERNO - Usuarios Externos

El rol **EXTERNO** puede solicitar reservas y ver reservas públicas.

**Características principales:**
- ✅ Solicitar reservas (se crean con estado PENDIENTE)
- ✅ Ver reservas públicas (aprobadas)
- ✅ Ver calendario público
- ✅ Ver espacios públicos
- ✅ Ver estado de sus solicitudes
- ❌ No puede crear reservas directamente
- ❌ No puede ver reservas pendientes de otros

**Tareas típicas:**
- Solicitar reservas para eventos
- Ver reservas públicas
- Ver disponibilidad en el calendario

## 4.2 Permisos por Rol

Cada rol tiene permisos granulares específicos. A continuación, se detallan los permisos principales:

### Permisos de Reservas

| Permiso | ADMIN | ANALISTA | MANTENIMIENTO | DOCENTE | ESTUDIANTE | EXTERNO |
|---------|:-----:|:--------:|:------------:|:-------:|:----------:|:-------:|
| Crear reservas directamente | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Solicitar reservas | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Ver todas las reservas | ✅ | ✅ | ✅* | ✅ | ✅ | ✅** |
| Editar reservas | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cancelar reservas | ✅ | ✅ | ❌ | ✅*** | ❌ | ❌ |
| Aprobar/rechazar reservas | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

*MANTENIMIENTO puede ver reservas para conocer ocupación  
**EXTERNO solo ve reservas públicas/aprobadas  
***DOCENTE solo puede cancelar sus propias reservas

### Permisos de Espacios

| Permiso | ADMIN | ANALISTA | MANTENIMIENTO | DOCENTE | ESTUDIANTE | EXTERNO |
|---------|:-----:|:--------:|:------------:|:-------:|:----------:|:-------:|
| Ver espacios | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear espacios | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Editar espacios | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Eliminar espacios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestionar estado | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

### Permisos de Inventario

| Permiso | ADMIN | ANALISTA | MANTENIMIENTO | DOCENTE | ESTUDIANTE | EXTERNO |
|---------|:-----:|:--------:|:------------:|:-------:|:----------:|:-------:|
| Ver inventario completo | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver inventario de espacio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear items | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Editar items | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Eliminar items | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Asignar items | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Aprobar solicitudes inventario | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

### Permisos de Usuarios

| Permiso | ADMIN | ANALISTA | MANTENIMIENTO | DOCENTE | ESTUDIANTE | EXTERNO |
|---------|:-----:|:--------:|:------------:|:-------:|:----------:|:-------:|
| Ver usuarios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cambiar roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Permisos de Sistema

| Permiso | ADMIN | ANALISTA | MANTENIMIENTO | DOCENTE | ESTUDIANTE | EXTERNO |
|---------|:-----:|:--------:|:------------:|:-------:|:----------:|:-------:|
| Acceso a Sistema | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Acceso a Auditoría | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver estadísticas completas | ✅ | ✅* | ✅** | ❌ | ❌ | ❌ |

*ANALISTA solo estadísticas de reservas  
**MANTENIMIENTO solo estadísticas de inventario y espacios

## 4.3 Tabla Comparativa de Permisos

Para una comparación rápida, consulte la ficha técnica completa en [`fichas-tecnicas/roles-y-permisos.md`](../fichas-tecnicas/roles-y-permisos.md).

## 4.4 Áreas Accesibles por Rol

### ADMIN
- ✅ Dashboard
- ✅ Reservas
- ✅ Calendario
- ✅ Espacios
- ✅ Inventario
- ✅ Usuarios
- ✅ Estadísticas
- ✅ Sistema
- ✅ Auditoría

### ANALISTA
- ✅ Dashboard
- ✅ Reservas
- ✅ Calendario
- ✅ Espacios (solo lectura)
- ✅ Inventario/Requests (solicitudes)
- ✅ Estadísticas (reservas)

### MANTENIMIENTO
- ✅ Dashboard
- ✅ Espacios
- ✅ Inventario
- ✅ Inventario/Requests (gestionar solicitudes)
- ✅ Calendario (solo lectura)
- ✅ Estadísticas (inventario y espacios)

### DOCENTE
- ✅ Dashboard
- ✅ Reservas
- ✅ Calendario
- ✅ Espacios (solo lectura)

### ESTUDIANTE
- ✅ Dashboard
- ✅ Calendario
- ✅ Espacios (solo lectura)

### EXTERNO
- ✅ Dashboard
- ✅ Reservas
- ✅ Calendario
- ✅ Espacios (solo lectura)

---

# 5. ESTRUCTURA DE LA INTERFAZ

## 5.1 Dashboard Layout

El layout principal del sistema está compuesto por tres áreas principales:

### Sidebar (Barra Lateral)

Ubicada en el lado izquierdo de la pantalla, contiene:

- **Logo de UTEC**: En la parte superior
- **Menú de navegación**: Enlaces a las diferentes secciones del sistema
  - Inicio (Dashboard)
  - Calendario
  - Reservas
  - Espacios
  - Estadísticas
  - Usuarios (solo ADMIN)
  - Sistema (solo ADMIN)
  - Auditoría (solo ADMIN)
- **Estado del menú**: El elemento activo se resalta visualmente

**Características:**
- En dispositivos móviles, el sidebar se puede colapsar/expandir
- El sidebar es responsive y se adapta al tamaño de pantalla
- Los elementos visibles dependen del rol del usuario

### Header (Encabezado)

Ubicado en la parte superior de la pantalla, contiene:

- **Botón de menú**: Para mostrar/ocultar el sidebar en móviles
- **Título de la página actual**: Muestra en qué sección está
- **Información adicional**: Badges, hora actual
- **Botón de tema**: Alterna entre modo claro y modo oscuro (icono de sol/luna). La preferencia se recuerda para próximas visitas.
- **Menú de usuario**: Avatar, nombre y opciones de usuario

**Características:**
- Fijo en la parte superior
- Muestra el contexto actual
- Acceso rápido al perfil y configuración

### Contenido Principal

El área central donde se muestra el contenido de cada sección:

- **Cards y widgets**: Métricas y resúmenes
- **Tablas y listas**: Datos organizados
- **Formularios**: Para crear y editar información
- **Gráficos y visualizaciones**: Estadísticas y reportes

**Características:**
- Responsive y adaptable
- Scroll independiente del header y sidebar
- Espaciado consistente

## 5.2 Navegación Principal

### Menú Principal

El menú principal se encuentra en la barra lateral y está organizado por funcionalidades. Contiene **ocho ítems**:

1. **Inicio** (`/dashboard`)
   - Dashboard principal con métricas y resúmenes

2. **Calendario** (`/calendar`)
   - Vista calendárica de reservas

3. **Reservas** (`/reservations`)
   - Gestión completa de reservas

4. **Espacios** (`/rooms`)
   - Gestión de espacios físicos. Desde acá también se accede al inventario asociado a cada espacio.

5. **Estadísticas** (`/statistics`)
   - Estadísticas y reportes

6. **Usuarios** (`/users`) - Solo ADMIN
   - Gestión de usuarios

7. **Sistema** (`/system`) - Solo ADMIN
   - Panel de sistema y configuración

8. **Auditoría** (`/audit`) - Solo ADMIN
   - Registros de auditoría

> El módulo de **Inventario** (`/inventory`) está disponible para ADMIN, ANALISTA y MANTENIMIENTO, pero no aparece como ítem propio en la barra lateral. Se accede desde el módulo de Espacios o navegando directamente a la URL.

### Navegación por Breadcrumbs

En algunas páginas se muestra una ruta de navegación (breadcrumb) que indica:

- La sección actual
- Las subsecciones
- Permite navegar hacia atrás

### Navegación con Tabs (Pestañas)

Algunas páginas utilizan pestañas para organizar el contenido:

- **Estadísticas**: Tabs para diferentes tipos de estadísticas
- **Sistema**: Tabs para diferentes métricas y logs

## 5.3 Componentes Comunes

### Botones

El sistema utiliza diferentes tipos de botones:

- **Botón Primario**: Acciones principales (azul)
- **Botón Secundario**: Acciones secundarias (gris)
- **Botón de Peligro**: Acciones destructivas (rojo)
- **Botón Outline**: Acciones alternativas (borde)

### Cards (Tarjetas)

Las cards se utilizan para mostrar información agrupada:

- **Card de métrica**: Muestra un valor numérico con icono
- **Card de contenido**: Contiene información detallada
- **Card de acción**: Incluye botones o enlaces

### Modales y Diálogos

Los modales se utilizan para:

- Formularios de creación/edición
- Confirmaciones de acciones
- Visualización de detalles
- Configuraciones

### Tablas

Las tablas muestran datos estructurados:

- **Ordenamiento**: Hacer clic en encabezados para ordenar
- **Paginación**: Navegar entre páginas de resultados
- **Acciones por fila**: Botones de acción en cada fila
- **Filtros**: Búsqueda y filtrado de datos

### Badges (Insignias)

Los badges se utilizan para mostrar estados:

- **Estado de reserva**: Aprobado, Pendiente, Cancelado
- **Estado de inventario**: Disponible, Mantenimiento, Dañado
- **Estado de usuario**: Activo, Inactivo, Verificado

### Formularios

Los formularios incluyen:

- **Campos de texto**: Input, textarea
- **Selectores**: Dropdown, multi-select
- **Selectores de fecha**: Date picker, time picker
- **Checkboxes y radios**: Selecciones múltiples o únicas
- **Validación**: Mensajes de error en tiempo real

## 5.4 Menú de Usuario

El menú de usuario se encuentra en el header, en la esquina superior derecha:

### Acceso al Menú

1. Hacer clic en el **avatar** o **nombre de usuario**
2. Se desplegará un menú con opciones:

### Opciones del Menú

- **Mi Perfil**: Ver y editar información personal
- **Preferencias**: Configurar preferencias del usuario
- **Cerrar Sesión**: Cerrar sesión de manera segura

### Avatar del Usuario

- Muestra las iniciales del usuario en un círculo colorido
- Los colores se generan automáticamente basados en el nombre
- En dispositivos móviles puede mostrar solo el avatar

## 5.5 Preferencias de Usuario

Las preferencias se acceden desde el ícono de configuración ubicado en la barra lateral, junto al menú de navegación. El panel se abre como ventana modal (ver sección [15](#15-preferencias-de-usuario)):

### Tipos de Preferencias

1. **Notificaciones por Email**
   - Configurar qué emails desea recibir

2. **Preferencias de Vista**
   - Modo de visualización por módulo
   - Tamaño de página por módulo
   - Vista de calendario preferida

### Guardar Preferencias

- Las preferencias se guardan automáticamente al hacer clic en **"Guardar"**
- Se aplican inmediatamente en la interfaz
- Son específicas por usuario

---

# 6. DASHBOARD PRINCIPAL

## 6.1 Visión General

El Dashboard principal es la primera página que ve después de iniciar sesión. Proporciona una vista general del estado del sistema y acceso rápido a las funcionalidades más utilizadas.

### Características Principales

- **Métricas principales**: Estadísticas clave según el rol del usuario
- **Próximas reservas**: Lista de reservas próximas
- **Gráficos y estadísticas**: Visualización de datos importantes
- **Acciones rápidas**: Accesos directos a funcionalidades comunes
- **Filtros personalizables**: Opciones para personalizar la vista

### Personalización por Rol

El dashboard muestra información diferente según el rol del usuario:

- **ADMIN**: Métricas completas del sistema, todas las reservas
- **ANALISTA**: Métricas de reservas, todas las reservas
- **MANTENIMIENTO**: Métricas de espacios e inventario
- **DOCENTE**: Información general, próximas reservas personales
- **ESTUDIANTE**: Información general, próximas reservas
- **EXTERNO**: Información general, próximas reservas públicas

## 6.2 Métricas Principales

Las métricas principales se muestran en cards en la parte superior del dashboard:

### Métricas para ADMIN

1. **Reservas Activas**
   - Cantidad de reservas aprobadas activas
   - Indicador de reservas de hoy
   - Tendencia comparativa

2. **Espacios Disponibles**
   - Cantidad de espacios disponibles
   - Espacios en mantenimiento
   - Estado general de espacios

3. **Ocupación Promedio**
   - Porcentaje de ocupación de espacios
   - Total de espacios en el sistema
   - Indicador de tendencia

4. **Usuarios Activos**
   - Cantidad de usuarios activos
   - Nuevos usuarios de hoy
   - Tendencias de registro

### Métricas para ANALISTA

1. **Reservas Activas**
   - Cantidad de reservas aprobadas
   - Reservas de hoy
   - Indicadores de actividad

2. **Espacios Disponibles**
   - Espacios disponibles para reservar
   - Espacios en mantenimiento

3. **Ocupación Promedio**
   - Porcentaje de uso de espacios
   - Total de espacios

### Métricas para MANTENIMIENTO

1. **Espacios Disponibles**
   - Cantidad de espacios disponibles
   - Espacios en mantenimiento

2. **Inventario Total**
   - Total de items en inventario
   - Items disponibles
   - Items en mantenimiento

3. **Espacios con Problemas**
   - Espacios con items dañados
   - Items que requieren atención

### Métricas para DOCENTE/ESTUDIANTE/EXTERNO

1. **Reservas Activas**
   - Reservas próximas
   - Reservas de hoy (si aplica)

2. **Espacios Disponibles**
   - Espacios disponibles para reservar

3. **Ocupación Promedio**
   - Indicador general de uso

## 6.3 Próximas Reservas

La sección de próximas reservas muestra una lista de reservas próximas:

### Características

- **Filtro "Mis reservas"**: Ver solo las reservas propias o todas
- **Información mostrada**:
  - Nombre del espacio
  - Fecha y hora de inicio
  - Fecha y hora de fin
  - Estado (Aprobado, Pendiente, Cancelado)
  - Usuario que realizó la reserva
- **Acciones disponibles**:
  - Ver detalles de la reserva
  - Cancelar reserva (si es propia o tiene permisos)

### Formato de Visualización

- **Cards**: Vista de tarjetas con información resumida
- **Badges de estado**: Color según el estado de la reserva
  - Verde: Aprobado
  - Amarillo: Pendiente
  - Rojo: Cancelado

## 6.4 Gráficos y Estadísticas

El dashboard incluye gráficos y visualizaciones de datos:

### Gráficos Disponibles (según rol)

1. **Gráfico de Reservas por Estado**
   - Distribución de reservas por estado (Aprobado, Pendiente, Cancelado)
   - Formato: Gráfico de barras o dona

2. **Gráfico de Reservas por Día**
   - Cantidad de reservas por día de la semana
   - Permite ver patrones de uso

3. **Espacios Más Usados**
   - Ranking de espacios por cantidad de reservas
   - Top 5 o 10 espacios

4. **Tendencia de Uso**
   - Evolución de reservas en el tiempo
   - Gráfico de línea temporal

### Personalización de Gráficos

- **Período**: Seleccionar período de tiempo a visualizar
- **Filtros**: Aplicar filtros por espacio, estado, etc.
- **Exportar**: Descargar gráficos como imagen o PDF

## 6.5 Acciones Rápidas

Las acciones rápidas proporcionan acceso directo a funcionalidades comunes:

### Acciones Disponibles (según rol)

1. **Nueva Reserva**
   - Acceso directo al formulario de creación de reserva
   - Disponible para: ADMIN, ANALISTA, DOCENTE, EXTERNO

2. **Ver Calendario**
   - Acceso directo al calendario de reservas
   - Disponible para: Todos los roles

3. **Gestionar Espacios**
   - Acceso a la gestión de espacios
   - Disponible para: ADMIN, MANTENIMIENTO

4. **Ver Estadísticas**
   - Acceso a estadísticas detalladas
   - Disponible para: ADMIN, ANALISTA, MANTENIMIENTO

5. **Gestionar Inventario**
   - Acceso a la gestión de inventario
   - Disponible para: ADMIN, MANTENIMIENTO

### Diseño de Acciones Rápidas

- **Iconos grandes**: Fácil identificación visual
- **Descripción breve**: Texto explicativo de cada acción
- **Accesibilidad**: Navegación por teclado disponible

## 6.6 Filtros del Dashboard

Los filtros permiten personalizar la información mostrada:

### Filtros Disponibles

1. **Filtro de Tiempo**
   - Hoy
   - Esta semana
   - Este mes
   - Personalizado

2. **Filtro de Reservas** (si aplica)
   - Ver todas las reservas
   - Ver solo mis reservas

3. **Filtro de Estado**
   - Ver todas
   - Solo aprobadas
   - Solo pendientes
   - Solo canceladas

### Aplicar Filtros

1. Seleccionar el filtro deseado en el panel de filtros
2. Los resultados se actualizan automáticamente
3. Los filtros se pueden combinar para resultados más específicos
4. Hacer clic en **"Limpiar filtros"** para resetear

### Guardar Preferencias de Filtros

- Las preferencias de filtros pueden guardarse en las preferencias del usuario
- Se aplican automáticamente al acceder al dashboard

---

# 7. GESTIÓN DE RESERVAS

## 7.1 Ver Todas las Reservas

La sección de reservas permite ver todas las reservas del sistema según sus permisos.

### Acceso a Reservas

1. En el menú principal, hacer clic en **"Reservas"** (`/reservations`)
2. Se mostrará la lista de reservas según sus permisos

### Información Mostrada

Cada reserva muestra:
- **Espacio**: Nombre del espacio reservado
- **Usuario**: Usuario que realizó la reserva
- **Fecha y hora de inicio**: Cuándo comienza la reserva
- **Fecha y hora de fin**: Cuándo termina la reserva
- **Estado**: Aprobado, Pendiente, Cancelado
- **Carrera**: Carrera asociada (si aplica)
- **Analista asignado**: Analista que gestiona la reserva (si aplica)

### Vista por Rol

- **ADMIN/ANALISTA**: Ven todas las reservas del sistema
- **MANTENIMIENTO**: Ven todas las reservas (para conocer ocupación)
- **DOCENTE**: Ven todas las reservas del sistema
- **ESTUDIANTE**: Ven todas las reservas públicas
- **EXTERNO**: Ven todas las reservas públicas/aprobadas

## 7.2 Crear Nueva Reserva

Para crear una nueva reserva (ADMIN y ANALISTA pueden crear directamente con estado APROBADO):

### Pasos para Crear Reserva

1. **Acceder al formulario**
   - Hacer clic en **"Nueva Reserva"** (cuando el usuario tiene permiso para reservar directamente) o **"Nueva Solicitud de Reserva"** (cuando el usuario solo puede solicitar y la reserva queda pendiente de aprobación). La etiqueta cambia automáticamente según el rol.
   - O usar la acción rápida del dashboard.

2. **Seleccionar el espacio**
   - Elegir el espacio que desea reservar del selector
   - Ver la capacidad y características del espacio
   - Verificar disponibilidad en el calendario

3. **Seleccionar fecha y hora**
   - **Fecha de inicio**: Seleccionar la fecha en el calendario
   - **Hora de inicio**: Seleccionar la hora
   - **Fecha de fin**: Seleccionar la fecha
   - **Hora de fin**: Seleccionar la hora
   - ⚠️ La duración mínima es de 30 minutos

4. **Seleccionar carrera (opcional)**
   - Elegir la carrera asociada a la reserva si aplica
   - Solo se muestra si hay carreras en el sistema

5. **Seleccionar analista (opcional)**
   - Si es DOCENTE, puede seleccionar un analista asignado
   - Solo se muestran analistas disponibles

6. **Agregar solicitudes de inventario (opcional)**
   - Hacer clic en **"Agregar item solicitado"**
   - Seleccionar el tipo de elemento
   - Indicar la cantidad solicitada
   - Agregar observaciones si es necesario
   - Puede agregar múltiples items

7. **Agregar recurrencia (opcional)**
   - Seleccionar tipo de recurrencia:
     - Diaria: La reserva se repite cada día
     - Semanal: La reserva se repite cada semana
     - Mensual: La reserva se repite cada mes
   - Indicar fecha de fin de recurrencia
   - El sistema calculará automáticamente cuántas reservas se crearán

8. **Revisar y crear**
   - Revisar todos los datos ingresados
   - Verificar que no haya conflictos (el sistema valida automáticamente)
   - Hacer clic en **"Crear Reserva"**

### Validaciones del Sistema

El sistema valida automáticamente:
- ✅ Que el espacio esté disponible en el rango de fechas
- ✅ Que no haya conflictos con otras reservas aprobadas
- ✅ Que la fecha de inicio sea anterior a la fecha de fin
- ✅ Que no sea en el pasado
- ✅ Que la duración mínima sea de 30 minutos
- ✅ Que la recurrencia no genere más de 1000 reservas

### Estado de la Reserva

- **ADMIN/ANALISTA**: La reserva se crea con estado **APROBADO** directamente
- **DOCENTE/EXTERNO**: La reserva se crea con estado **PENDIENTE** (requiere aprobación)

## 7.3 Crear Reserva con Recurrencia

Para crear una reserva que se repita periódicamente:

### Tipos de Recurrencia

1. **Recurrencia Diaria**
   - La reserva se repite cada día
   - Ejemplo: De lunes a viernes a las 9:00 AM

2. **Recurrencia Semanal**
   - La reserva se repite cada semana el mismo día
   - Ejemplo: Todos los lunes a las 10:00 AM

3. **Recurrencia Mensual**
   - La reserva se repite cada mes el mismo día
   - Ejemplo: Primer lunes de cada mes

### Pasos para Crear Reserva Recurrente

1. **Crear reserva base** (sección [7.2](#72-crear-nueva-reserva))
2. **Activar recurrencia**
   - Hacer clic en **"Agregar recurrencia"**
   - Seleccionar el tipo de recurrencia (Diaria, Semanal, Mensual)
   - Indicar la **fecha de fin de recurrencia**
3. **Revisar cantidad de reservas**
   - El sistema muestra cuántas reservas se crearán
   - ⚠️ Máximo 1000 reservas permitidas
4. **Confirmar**
   - Revisar el resumen
   - Hacer clic en **"Crear Reserva"**

### Ejemplo de Reserva Recurrente

**Escenario**: Reservar un salón todos los lunes de 9:00 AM a 11:00 AM durante el semestre

1. Seleccionar el espacio
2. Fecha de inicio: Primer lunes del semestre, 9:00 AM
3. Fecha de fin: Mismo día, 11:00 AM
4. Recurrencia: Semanal
5. Fecha de fin de recurrencia: Último lunes del semestre
6. El sistema creará una reserva para cada lunes en el rango

## 7.4 Solicitar Reserva

Para DOCENTE y EXTERNO, las reservas se crean como solicitudes (estado PENDIENTE) que requieren aprobación:

### Pasos para Solicitar Reserva

1. **Acceder al formulario** (mismo que crear reserva)
2. **Completar los datos** (igual que sección [7.2](#72-crear-nueva-reserva))
3. **Enviar solicitud**
   - Hacer clic en **"Enviar Solicitud"** o **"Crear Solicitud"** (la etiqueta puede variar levemente según desde dónde se abrió el formulario, por ejemplo desde el calendario aparece como **"Solicitar Reserva"**).
   - La reserva se creará con estado **PENDIENTE**.

### Seguimiento de Solicitud

1. **Estado PENDIENTE**
   - La solicitud está esperando aprobación
   - Puede verla en "Mis Reservas" con estado Pendiente

2. **Aprobación o Rechazo**
   - Un ADMIN o ANALISTA revisa y aprueba/rechaza
   - Recibirá un email de notificación (si está habilitado)

3. **Estado APROBADO**
   - La reserva está confirmada y activa
   - Aparece en el calendario

4. **Estado RECHAZADO**
   - La solicitud fue rechazada
   - Puede ver el motivo (si el analista lo agregó)

### Cancelar Solicitud

- Puede cancelar su propia solicitud si está pendiente
- Una vez aprobada, debe usar la opción de cancelar reserva

## 7.5 Editar Reserva

Solo ADMIN y ANALISTA pueden editar reservas:

### Pasos para Editar Reserva

1. **Encontrar la reserva** en la lista de reservas
2. **Hacer clic en "Editar"** o en el ícono de edición
3. **Modificar los campos** deseados:
   - Espacio
   - Fecha y hora de inicio/fin
   - Carrera
   - Analista asignado
   - Solicitudes de inventario
   - Estado (APROBADO, PENDIENTE, CANCELADO)
4. **Guardar cambios**
   - Hacer clic en **"Guardar Cambios"**
   - El sistema validará los cambios
   - Si hay conflictos, se mostrará un error

### Validaciones al Editar

- ✅ Verifica disponibilidad del espacio en el nuevo rango
- ✅ Valida que no haya conflictos con otras reservas
- ✅ Mantiene las validaciones básicas (duración, fechas, etc.)

## 7.6 Cancelar Reserva

Para cancelar una reserva:

### Quién Puede Cancelar

- **ADMIN**: Puede cancelar cualquier reserva
- **ANALISTA**: Puede cancelar cualquier reserva
- **DOCENTE**: Solo puede cancelar sus propias reservas
- **ESTUDIANTE/EXTERNO**: No pueden cancelar reservas

### Pasos para Cancelar Reserva

1. **Encontrar la reserva** en la lista
2. **Hacer clic en "Cancelar"** o el ícono de cancelar
3. **Confirmar la cancelación**
   - Aparecerá un diálogo de confirmación
   - Puede agregar un motivo de cancelación (opcional)
4. **Confirmar**
   - Hacer clic en **"Confirmar Cancelación"**
   - La reserva cambiará a estado **CANCELADO**

### Efectos de la Cancelación

- La reserva cambia a estado **CANCELADO**
- Se libera el espacio para otras reservas
- Se envía notificación al usuario (si está habilitado)
- Las solicitudes de inventario asociadas pueden cancelarse o mantenerse según configuración

## 7.7 Aprobar/Rechazar Reservas

Solo ADMIN y ANALISTA pueden aprobar o rechazar reservas pendientes:

### Pasos para Aprobar/Rechazar

1. **Ver reservas pendientes**
   - Filtrar por estado "Pendiente" en la lista de reservas
   - O ver la sección "Reservas Pendientes"

2. **Revisar la solicitud**
   - Hacer clic en la reserva para ver detalles
   - Revisar espacio, fechas, usuario, etc.

3. **Aprobar o rechazar**
   - **Aprobar**: Hacer clic en **"Aprobar"**
     - La reserva cambia a estado **APROBADO**
     - El usuario recibe notificación (si está habilitado)
   - **Rechazar**: Hacer clic en **"Rechazar"**
     - Aparecerá un campo para motivo (opcional)
     - La reserva cambia a estado **RECHAZADO**
     - El usuario recibe notificación (si está habilitado)

4. **Confirmar**
   - Hacer clic en **"Confirmar"** en el diálogo de confirmación

### Cambiar Estado de Reserva Existente

También puede cambiar el estado de una reserva existente:

1. Editar la reserva (sección [7.5](#75-editar-reserva))
2. Cambiar el estado en el selector
3. Guardar cambios

## 7.8 Ver Detalles de Reserva

Para ver información detallada de una reserva:

### Pasos para Ver Detalles

1. **Encontrar la reserva** en la lista
2. **Hacer clic en "Ver Detalles"** o en el nombre/espacio de la reserva
3. Se abrirá un diálogo o página con detalles completos

### Información Mostrada

- **Espacio**: Nombre, capacidad, tipo de espacio
- **Usuario**: Nombre y email del usuario que hizo la reserva
- **Fechas**: Inicio y fin completos con hora
- **Estado**: Estado actual de la reserva
- **Carrera**: Carrera asociada (si aplica)
- **Analista asignado**: Analista que gestiona la reserva (si aplica)
- **Solicitudes de inventario**: Items solicitados y su estado
- **Historial**: Cambios realizados (si está disponible)
- **Acciones disponibles**: Según permisos

## 7.9 Filtros y Búsqueda

La página de reservas incluye filtros avanzados:

### Filtros Disponibles

1. **Búsqueda por texto**
   - Buscar por nombre de espacio, usuario, carrera

2. **Filtro por estado**
   - Todas
   - Aprobadas
   - Pendientes
   - Canceladas

3. **Filtro por tiempo**
   - Todas
   - Hoy
   - Esta semana
   - Este mes
   - Personalizado (rango de fechas)

4. **Filtro por espacio**
   - Seleccionar un espacio específico
   - Ver solo reservas de ese espacio

5. **Filtro por carrera**
   - Seleccionar una carrera específica
   - Ver solo reservas de esa carrera

6. **Filtro por tipo de espacio**
   - Filtrar por tipo de espacio (Aula, Laboratorio, Auditorio, etc.)

7. **Filtro por usuario**
   - Solo para ADMIN/ANALISTA
   - Ver reservas de un usuario específico

### Aplicar Filtros

1. **Usar los controles de filtro** en el panel lateral o superior
2. **Seleccionar los valores** deseados
3. **Los resultados se actualizan automáticamente**
4. **Ver filtros activos** en la barra de filtros (pills removibles)

### Limpiar Filtros

- Hacer clic en **"Limpiar filtros"** para resetear todos
- O hacer clic en la X de cada filtro individual para removerlo

## 7.10 Vistas de Reservas

El sistema ofrece tres formas de visualizar las reservas:

### Vista de Tabla

- **Formato**: Tabla tradicional con columnas
- **Ventajas**:
  - Información compacta
  - Fácil comparación entre reservas
  - Ordenamiento por columnas
- **Mejor para**: Revisar muchas reservas rápidamente

### Vista de Tarjetas (Cards)

- **Formato**: Tarjetas individuales con información destacada
- **Ventajas**:
  - Información visualmente organizada
  - Fácil lectura
  - Buenas para pantallas medianas
- **Mejor para**: Revisar reservas de forma visual

### Vista de Calendario

- **Formato**: Vista calendárica con reservas en fechas
- **Ventajas**:
  - Visualización temporal clara
  - Fácil identificar disponibilidad
  - Múltiples vistas (día, semana, mes)
- **Mejor para**: Ver disponibilidad y planificación

### Cambiar Vista

- Usar los botones de vista en la parte superior de la página
- O en las preferencias de usuario (sección [15](#15-preferencias-de-usuario))

## 7.11 Solicitudes de Inventario para Reservas

Al crear una reserva, puede solicitar items de inventario que necesite:

### Agregar Solicitudes de Inventario

1. **Al crear o editar una reserva** (secciones [7.2](#72-crear-nueva-reserva) o [7.5](#75-editar-reserva))
2. **Hacer clic en "Agregar item solicitado"**
3. **Completar los datos**:
   - **Tipo de elemento**: Seleccionar del selector
   - **Cantidad solicitada**: Número de items necesarios
   - **Observaciones**: Notas adicionales (opcional)
4. **Agregar más items** si es necesario
5. **Guardar la reserva**

### Estados de Solicitudes de Inventario

- **PENDIENTE**: Esperando aprobación de MANTENIMIENTO o ADMIN
- **APROBADO**: Solicitud aprobada, preparando entrega
- **ENTREGADO**: Item entregado y asignado
- **RECHAZADO**: Solicitud rechazada por MANTENIMIENTO

### Gestión de Solicitudes

Las solicitudes de inventario se gestionan en la sección **"Solicitudes de Inventario"** (`/inventory/requests`):

- **MANTENIMIENTO y ADMIN** pueden:
  - Ver todas las solicitudes
  - Aprobar solicitudes
  - Rechazar solicitudes
  - Marcar como entregado
  - Asignar items de inventario existentes

- **ANALISTA** puede:
  - Ver solicitudes
  - Crear solicitudes al crear reservas
  - No puede aprobar/rechazar (solo MANTENIMIENTO/ADMIN)

Ver más detalles en la sección [9.12](#912-solicitudes-de-inventario).

---

# 8. GESTIÓN DE ESPACIOS

## 8.1 Ver Todos los Espacios

La sección de espacios permite ver todos los espacios disponibles en el sistema.

### Acceso a Espacios

1. En el menú principal, hacer clic en **"Espacios"** (`/rooms`)
2. Se mostrará la lista de espacios disponibles

### Información Mostrada

Cada espacio muestra:
- **Nombre**: Nombre del espacio
- **Tipo de espacio**: Categoría (Aula, Laboratorio, Auditorio, etc.)
- **Capacidad**: Número de personas que puede alojar
- **Estado**: Disponible, Mantenimiento, Ocupado
- **Inventario**: Cantidad de items asignados
- **Imagen**: Foto o plano del espacio (si está disponible)

### Vista por Rol

- **Todos los roles autenticados**: Pueden ver espacios
- **ADMIN/MANTENIMIENTO**: Pueden gestionar espacios (crear, editar, eliminar)
- **Otros roles**: Solo visualización

## 8.2 Crear Espacio

Solo ADMIN y MANTENIMIENTO pueden crear espacios:

### Pasos para Crear Espacio

1. **Acceder al formulario**
   - Hacer clic en **"Crear Espacio"** en la página de espacios
   - O usar la acción rápida del dashboard

2. **Completar información básica**
   - **Nombre**: Nombre del espacio (ej: "Aula 101")
   - **Tipo de espacio**: Seleccionar del selector
     - Si el tipo no existe, debe crearlo primero (ver sección [8.9](#89-tipos-de-espacio))
   - **Capacidad**: Número máximo de personas
   - **Imagen (opcional)**: URL de imagen o plano del espacio
   - **Estado**: Disponible (por defecto)

3. **Guardar**
   - Hacer clic en **"Crear Espacio"**
   - El espacio se creará y aparecerá en la lista

### Validaciones

- ✅ El nombre debe ser único
- ✅ El tipo de espacio debe existir
- ✅ La capacidad debe ser un número positivo
- ✅ El estado debe ser válido (DISPONIBLE, MANTENIMIENTO, OCUPADO)

## 8.3 Editar Espacio

Para editar un espacio existente:

### Pasos para Editar

1. **Encontrar el espacio** en la lista
2. **Hacer clic en "Editar"** o en el ícono de edición
3. **Modificar los campos** deseados:
   - Nombre
   - Tipo de espacio
   - Capacidad
   - Imagen URL
   - Estado
4. **Guardar cambios**
   - Hacer clic en **"Guardar Cambios"**

### Cambiar Estado del Espacio

También puede cambiar el estado directamente:
- **DISPONIBLE**: Espacio disponible para reservas
- **MANTENIMIENTO**: Espacio en mantenimiento, no disponible
- **OCUPADO**: Espacio ocupado (actualizado automáticamente por reservas)

## 8.4 Eliminar Espacio

Solo ADMIN puede eliminar espacios:

### Pasos para Eliminar

1. **Encontrar el espacio** en la lista
2. **Hacer clic en "Eliminar"** o el ícono de eliminar
3. **Confirmar la eliminación**
   - Aparecerá un diálogo de confirmación
   - ⚠️ Se verificará si hay reservas futuras asociadas
4. **Confirmar**
   - Hacer clic en **"Confirmar Eliminación"**
   - El espacio se eliminará (soft delete)

### Efectos de la Eliminación

- El espacio no aparecerá en listados normales
- Las reservas históricas se mantienen
- El espacio puede restaurarse por un ADMIN si es necesario

## 8.5 Ver Detalles de Espacio

Para ver información detallada de un espacio:

### Pasos para Ver Detalles

1. **Encontrar el espacio** en la lista
2. **Hacer clic en el nombre** o en **"Ver Detalles"**
3. Se abrirá la página de detalles del espacio

### Información Mostrada en Detalles

- **Información general**: Nombre, tipo, capacidad, estado
- **Imagen/Plano**: Visualización del espacio (ver "Vista 360°" más abajo)
- **Inventario asignado**: Lista de items de inventario en el espacio
- **Reservas**: Próximas reservas del espacio
- **Estadísticas**: Uso del espacio, ocupación promedio
- **Acciones**: Editar, eliminar, agregar inventario

### Vista 360°

Si la foto del espacio es una imagen panorámica de 360°, el sistema lo detecta automáticamente y muestra un botón **"360°"** sobre la imagen. Al pulsarlo se abre una vista interactiva a pantalla completa donde puede mirar alrededor del espacio: arrastre con el mouse (o el dedo) para girar la vista, use los controles para acercar o alejar y ver el espacio en pantalla completa. Para cerrar la vista, pulse la **X** de la esquina superior o la tecla **Esc**. Si la foto es una imagen común, simplemente se muestra como hasta ahora.

### Página de Detalles (`/rooms/:id`)

La página de detalles incluye:
- **Header**: Información principal del espacio
- **Tabs**: 
  - Información general
  - Inventario
  - Reservas
  - Estadísticas

## 8.6 Gestionar Inventario del Espacio

Desde la página de detalles del espacio, puede gestionar el inventario:

### Ver Inventario del Espacio

1. En los detalles del espacio, ir a la tab **"Inventario"**
2. Se mostrará la lista de items asignados al espacio
3. Información mostrada:
   - Tipo de elemento
   - Cantidad
   - Estado (Disponible, Mantenimiento, Dañado)
   - Observaciones

### Agregar Item al Espacio

1. En la tab **"Inventario"**, hacer clic en **"Agregar Elemento"**
2. **Opciones**:
   - **Asignar item existente**: Seleccionar un item de inventario sin asignar
   - **Crear nuevo item**: Crear un nuevo item de inventario directamente

### Crear Item de Inventario para el Espacio

1. Hacer clic en **"Agregar Elemento"** > **"Crear Nuevo"**
2. Completar el formulario:
   - **Tipo de elemento**: Seleccionar tipo
   - **Cantidad**: Número de items
   - **Estado**: Disponible (por defecto)
   - **Observaciones**: Notas adicionales
3. El item se creará y asignará automáticamente al espacio

### Editar Inventario del Espacio

1. En la lista de inventario, hacer clic en **"Editar"** del item
2. Modificar:
   - Cantidad
   - Estado
   - Observaciones
   - Asignación (desasignar si es necesario)
3. Guardar cambios

### Eliminar Inventario del Espacio

1. Hacer clic en **"Eliminar"** del item
2. Confirmar eliminación
3. ⚠️ Solo ADMIN puede eliminar items

## 8.7 Actualizar Estado del Espacio

El estado del espacio se puede actualizar manualmente o automáticamente:

### Estados Disponibles

- **DISPONIBLE**: Espacio disponible para reservas
- **MANTENIMIENTO**: Espacio en mantenimiento, no disponible
- **OCUPADO**: Espacio ocupado (se actualiza automáticamente con reservas)

### Actualización Manual

1. Editar el espacio (sección [8.3](#83-editar-espacio))
2. Cambiar el estado en el selector
3. Guardar cambios

### Actualización Automática

- El sistema actualiza el estado a **OCUPADO** cuando hay una reserva activa
- El estado vuelve a **DISPONIBLE** cuando la reserva termina
- Los espacios en **MANTENIMIENTO** no aparecen en reservas

## 8.8 Filtros y Búsqueda

La página de espacios incluye filtros:

### Filtros Disponibles

1. **Búsqueda por texto**
   - Buscar por nombre del espacio

2. **Filtro por tipo de espacio**
   - Filtrar por tipo específico
   - Ejemplo: Solo aulas, solo laboratorios

3. **Filtro por estado**
   - Disponibles
   - En mantenimiento
   - Ocupados
   - Todos

4. **Filtro por capacidad**
   - Capacidad mínima
   - Capacidad máxima
   - Rango de capacidad

5. **Filtro por edificio**
   - Permite restringir la lista de espacios a un edificio específico cuando se trabaja en un campus con varios edificios.

### Aplicar Filtros

1. Usar los controles de filtro
2. Los resultados se actualizan automáticamente
3. Los filtros se pueden combinar

## 8.9 Tipos de Espacio

Los tipos de espacio categorizan los espacios del sistema:

### Ver Tipos de Espacio

1. En la página de espacios, hacer clic en **"Gestionar Tipos"** o similar
2. Se mostrará la lista de tipos disponibles
3. Cada tipo muestra:
   - Nombre
   - Descripción
   - Color asociado (para visualización)
   - Cantidad de espacios de ese tipo

### Crear Tipo de Espacio

Solo ADMIN y MANTENIMIENTO:

1. Hacer clic en **"Crear Tipo"**
2. Completar:
   - **Nombre**: Ej: "Aula", "Laboratorio", "Auditorio"
   - **Descripción**: Descripción del tipo
   - **Color**: Color hexadecimal para visualización
3. Guardar

### Editar Tipo de Espacio

1. Hacer clic en **"Editar"** del tipo
2. Modificar nombre, descripción o color
3. Guardar cambios

### Eliminar Tipo de Espacio

Solo ADMIN:

1. Hacer clic en **"Eliminar"** del tipo
2. ⚠️ Solo se puede eliminar si no hay espacios asociados
3. Confirmar eliminación

---

# 9. GESTIÓN DE INVENTARIO

## 9.1 Ver Todo el Inventario

La sección de inventario permite gestionar todos los items de inventario del sistema.

### Acceso a Inventario

1. En el menú principal, hacer clic en **"Inventario"** (`/inventory`)
2. Se mostrará la lista de items de inventario

### Información Mostrada

Cada item muestra:
- **Tipo de elemento**: Categoría del item
- **Cantidad**: Número de unidades
- **Estado**: Disponible, Mantenimiento, Dañado
- **Espacio asignado**: Espacio donde está ubicado (o "Sin asignar")
- **Observaciones**: Notas adicionales
- **Fecha de creación**: Cuándo se agregó al sistema

### Vista por Rol

- **ADMIN/MANTENIMIENTO/ANALISTA**: Pueden ver todo el inventario
- **Otros roles**: Solo ven inventario de espacios (al ver detalles)

## 9.2 Crear Item de Inventario

Para agregar un nuevo item al inventario:

### Pasos para Crear Item

1. **Acceder al formulario**
   - Hacer clic en **"Crear Item"** en la página de inventario

2. **Completar información**
   - **Tipo de elemento**: Seleccionar del selector
     - Si el tipo no existe, debe crearlo primero (ver sección [9.11](#911-tipos-de-elemento))
   - **Cantidad**: Número de unidades
   - **Espacio (opcional)**: Asignar a un espacio específico o dejar sin asignar
   - **Estado**: Disponible (por defecto)
   - **Observaciones**: Notas adicionales (opcional)

3. **Guardar**
   - Hacer clic en **"Crear Item"**
   - El item se agregará al inventario

### Crear desde Espacio

También puede crear items directamente desde la página de detalles del espacio (ver sección [8.6](#86-gestionar-inventario-del-espacio))

## 9.3 Editar Item

Para modificar un item de inventario:

### Pasos para Editar

1. **Encontrar el item** en la lista
2. **Hacer clic en "Editar"** o el ícono de edición
3. **Modificar campos**:
   - Tipo de elemento
   - Cantidad
   - Espacio asignado (puede desasignar)
   - Estado
   - Observaciones
4. **Guardar cambios**

## 9.4 Eliminar Item

Solo ADMIN puede eliminar items:

### Pasos para Eliminar

1. **Encontrar el item** en la lista
2. **Hacer clic en "Eliminar"** o el ícono de eliminar
3. **Confirmar eliminación**
   - ⚠️ Verificar si está asociado a reservas activas
4. **Confirmar**
   - El item se eliminará (soft delete)

## 9.5 Asignar Item a Espacio

Para mover o asignar items entre espacios:

### Asignar Item Sin Asignar

1. **Ver items sin asignar**
   - Filtrar por "Sin asignar" en la lista
2. **Hacer clic en "Asignar"** del item
3. **Seleccionar espacio** del selector
4. **Confirmar asignación**

### Reasignar Item

1. **Editar el item** (sección [9.3](#93-editar-item))
2. **Cambiar el espacio** en el selector
   - O seleccionar "Sin asignar" para desasignar
3. **Guardar cambios**

### Asignación Masiva

Desde la barra de acciones masivas:

1. **Seleccionar múltiples items** (checkboxes)
2. **Hacer clic en "Asignar a Espacio"**
3. **Seleccionar espacio** destino
4. **Confirmar**
   - Todos los items seleccionados se asignarán al espacio

### Desasignar Item

1. **Editar el item**
2. **Seleccionar "Sin asignar"** o dejar vacío en el selector de espacio
3. **Guardar cambios**

## 9.6 Cambiar Estado del Item

Los items pueden tener diferentes estados:

### Estados Disponibles

- **DISPONIBLE**: Item disponible para uso
- **MANTENIMIENTO**: Item en mantenimiento
- **DANADO**: Item dañado, no disponible

### Cambiar Estado Individual

1. **Editar el item** (sección [9.3](#93-editar-item))
2. **Seleccionar nuevo estado** en el selector
3. **Guardar cambios**

### Cambio Masivo de Estado

1. **Seleccionar múltiples items** (checkboxes)
2. **Hacer clic en "Cambiar Estado"** en la barra de acciones
3. **Seleccionar nuevo estado**
4. **Confirmar**
   - Todos los items seleccionados cambiarán de estado

## 9.7 Importar Inventario desde CSV

Puede importar múltiples items de inventario desde un archivo CSV:

### Pasos para Importar

1. **Preparar archivo CSV**
   - Formato requerido:
     ```csv
     tipo_elemento,cantidad,estado,espacio,observaciones
     Proyector,1,DISPONIBLE,Aula 101,Proyector Epson
     Silla,20,DISPONIBLE,Aula 101,
     ```
   - Columnas:
     - `tipo_elemento`: Nombre del tipo (debe existir)
     - `cantidad`: Número de unidades
     - `estado`: DISPONIBLE, MANTENIMIENTO, DANADO
     - `espacio`: Nombre del espacio (opcional)
     - `observaciones`: Notas (opcional)

2. **Acceder a importación**
   - Hacer clic en **"Importar CSV"** en la página de inventario

3. **Seleccionar archivo**
   - Hacer clic en **"Seleccionar archivo"**
   - Elegir el archivo CSV

4. **Revisar preview**
   - El sistema mostrará un preview de los datos
   - Verificar que los datos sean correctos

5. **Importar**
   - Hacer clic en **"Importar"**
   - El sistema procesará el archivo
   - Se mostrarán resultados (éxitos, errores)

### Validaciones

- ✅ Los tipos de elemento deben existir
- ✅ Los espacios deben existir (si se especifican)
- ✅ Los estados deben ser válidos
- ✅ La cantidad debe ser un número positivo

## 9.8 Exportar Inventario a CSV

Para exportar el inventario actual:

### Pasos para Exportar

1. **Aplicar filtros** (si desea exportar solo una parte)
2. **Hacer clic en "Exportar CSV"**
3. **Descargar archivo**
   - El archivo CSV se descargará automáticamente
   - Incluye todos los datos del inventario (según filtros)

### Formato del Archivo Exportado

El CSV exportado incluye:
- ID del item
- Tipo de elemento
- Cantidad
- Estado
- Espacio asignado
- Observaciones
- Fecha de creación
- Fecha de actualización

## 9.9 Filtros y Búsqueda

Filtros avanzados para el inventario:

### Filtros Disponibles

1. **Búsqueda por texto**
   - Buscar por tipo de elemento, espacio, observaciones

2. **Filtro por tipo de elemento**
   - Seleccionar tipo específico

3. **Filtro por estado**
   - Disponibles
   - En mantenimiento
   - Dañados
   - Todos

4. **Filtro por espacio**
   - Seleccionar espacio específico
   - Opción "Sin asignar"

5. **Filtro combinado**
   - Combinar múltiples filtros para búsquedas específicas

## 9.10 Vistas de Inventario

Dos formas de visualizar el inventario:

### Vista de Tabla

- **Formato**: Tabla tradicional
- **Ventajas**: Información compacta, ordenamiento por columnas
- **Mejor para**: Revisar muchos items rápidamente

### Vista de Tarjetas (Cards)

- **Formato**: Tarjetas individuales
- **Ventajas**: Visualización clara, fácil lectura
- **Mejor para**: Revisar items de forma visual

## 9.11 Tipos de Elemento

Los tipos de elemento categorizan los items de inventario:

### Ver Tipos de Elemento

1. En la página de inventario, hacer clic en **"Gestionar Tipos"** o similar
2. Se mostrará la lista de tipos

### Crear Tipo de Elemento

Solo ADMIN y MANTENIMIENTO:

1. Hacer clic en **"Crear Tipo"**
2. Completar:
   - **Nombre**: Ej: "Proyector", "Silla", "Pizarra"
   - **Descripción**: Descripción del tipo
   - **Activo**: Marcar si está activo
3. Guardar

### Editar Tipo de Elemento

1. Hacer clic en **"Editar"** del tipo
2. Modificar información
3. Guardar cambios

### Eliminar Tipo de Elemento

Solo ADMIN:

1. Hacer clic en **"Eliminar"**
2. ⚠️ Solo se puede eliminar si no hay items asociados
3. Confirmar

## 9.12 Solicitudes de Inventario

Las solicitudes de inventario se crean cuando alguien solicita items para una reserva:

### Ver Solicitudes de Inventario

1. Acceder a **"Solicitudes de Inventario"** (`/inventory/requests`)
2. Se mostrará la lista de solicitudes

### Información de Solicitudes

Cada solicitud muestra:
- **Reserva asociada**: Reserva que solicitó el item
- **Tipo de elemento**: Tipo solicitado
- **Cantidad solicitada**: Cuántos items se necesitan
- **Estado**: Pendiente, Aprobado, Rechazado, Entregado
- **Item asignado**: Item de inventario asignado (si aplica)
- **Observaciones**: Notas adicionales

### Estados de Solicitudes

- **PENDIENTE**: Esperando aprobación
- **APROBADO**: Solicitud aprobada, preparando entrega
- **ENTREGADO**: Item entregado y asignado
- **RECHAZADO**: Solicitud rechazada

### Gestionar Solicitudes (MANTENIMIENTO/ADMIN)

#### Aprobar Solicitud

1. **Ver solicitudes pendientes** (filtrar por estado)
2. **Hacer clic en "Aprobar"** de la solicitud
3. **Opciones**:
   - Asignar item existente del inventario
   - O solo aprobar sin asignar
4. **Confirmar aprobación**

#### Rechazar Solicitud

1. **Hacer clic en "Rechazar"** de la solicitud
2. **Agregar motivo** (opcional)
3. **Confirmar rechazo**

#### Marcar como Entregado

1. **Después de aprobar**, cuando el item es entregado
2. **Hacer clic en "Entregar"**
3. **Confirmar entrega**
   - El estado cambia a **ENTREGADO**

#### Asignar Item de Inventario

1. **Al aprobar** o **desde "Asignar Item"**
2. **Seleccionar item** del inventario disponible
3. **Confirmar asignación**
   - El item se asigna a la solicitud y al espacio de la reserva

### Filtrar Solicitudes

- Por estado (Pendiente, Aprobado, Rechazado, Entregado)
- Por espacio
- Por tipo de elemento
- Por rango de fechas

---

# 10. GESTIÓN DE USUARIOS

> ⚠️ **Nota**: Esta sección es exclusiva para ADMIN. Solo los administradores pueden gestionar usuarios.

## 10.1 Ver Todos los Usuarios

La sección de usuarios permite gestionar todos los usuarios del sistema.

### Acceso a Usuarios

1. En el menú principal, hacer clic en **"Usuarios"** (`/users`)
2. Se mostrará la lista de usuarios registrados

### Información Mostrada

Cada usuario muestra:
- **Nombre**: Nombre completo del usuario
- **Email**: Dirección de correo electrónico
- **Rol**: Rol asignado (ADMIN, ANALISTA, DOCENTE, ESTUDIANTE, EXTERNO, MANTENIMIENTO)
- **Estado**: Activo o Inactivo
- **Verificado**: Si el email está verificado
- **Proveedor**: OAuth provider si usa login social (Google, etc.)
- **Fecha de registro**: Cuándo se registró

### Vista por Rol

- **Solo ADMIN**: Puede ver y gestionar usuarios
- **Otros roles**: No tienen acceso a esta sección

## 10.2 Crear Usuario

Para crear un nuevo usuario manualmente:

### Pasos para Crear Usuario

1. **Acceder al formulario**
   - Hacer clic en **"Crear Usuario"** en la página de usuarios

2. **Completar información**
   - **Nombre**: Nombre completo
   - **Email**: Dirección de correo electrónico
     - ⚠️ Debe ser único en el sistema
   - **Contraseña**: Contraseña temporal (opcional)
     - Si no se proporciona, el usuario deberá usar "Restablecer contraseña"
   - **Rol**: Seleccionar rol del usuario
   - **Verificado**: Marcar si el email está verificado

3. **Guardar**
   - Hacer clic en **"Crear Usuario"**
   - El usuario se creará en el sistema
   - Se enviará email de bienvenida (si está habilitado)

### Notas Importantes

- Los usuarios también pueden registrarse por su cuenta
- Al crear manualmente, puede asignar cualquier rol
- Si el email no está verificado, el usuario deberá verificarlo antes de iniciar sesión

## 10.3 Editar Usuario

Para modificar información de un usuario:

### Pasos para Editar

1. **Encontrar el usuario** en la lista
2. **Hacer clic en "Editar"** o el ícono de edición
3. **Modificar campos**:
   - Nombre
   - Email (debe seguir siendo único)
   - Otros campos disponibles según configuración
4. **Guardar cambios**

### Cambiar Email

- Al cambiar el email, el usuario debe verificar el nuevo email
- El email anterior ya no funcionará para iniciar sesión

## 10.4 Cambiar Rol de Usuario

Para cambiar el rol de un usuario:

### Pasos para Cambiar Rol

1. **Encontrar el usuario** en la lista
2. **Hacer clic en "Cambiar Rol"** o en el selector de rol
3. **Seleccionar nuevo rol** del selector:
   - ADMIN
   - ANALISTA
   - MANTENIMIENTO
   - DOCENTE
   - ESTUDIANTE
   - EXTERNO
4. **Confirmar cambio**
   - Hacer clic en **"Confirmar"**
   - El rol se cambiará inmediatamente

### Efectos del Cambio de Rol

- Los permisos del usuario cambian inmediatamente
- Debe recargar la página para ver los cambios
- El acceso a secciones puede cambiar según el nuevo rol

## 10.5 Activar/Desactivar Usuario

Para activar o desactivar un usuario:

### Activar Usuario

1. **Encontrar el usuario** en la lista (filtrar por "Inactivos" si es necesario)
2. **Hacer clic en el switch** de activación
3. **Confirmar activación**
   - El usuario volverá a tener acceso al sistema

### Desactivar Usuario

1. **Encontrar el usuario** en la lista
2. **Hacer clic en el switch** de activación
3. **Confirmar desactivación**
   - El usuario perderá acceso inmediatamente
   - No podrá iniciar sesión
   - Sus datos se mantienen en el sistema

### Efectos de Desactivación

- El usuario no puede iniciar sesión
- Sus reservas activas se mantienen
- Sus datos históricos se conservan
- Puede reactivarse en cualquier momento

## 10.6 Verificar Email de Usuario

Para verificar el email de un usuario manualmente:

### Pasos para Verificar Email

1. **Encontrar el usuario** en la lista
2. **Hacer clic en "Reenviar Verificación"** o similar
3. **Opciones**:
   - **Verificar manualmente**: Marcar como verificado directamente
   - **Reenviar código**: Enviar nuevo código de verificación al email

### Reenviar Código de Verificación

1. Hacer clic en **"Reenviar Verificación"**
2. El sistema enviará un nuevo código al email del usuario
3. El usuario puede usar ese código para verificar

## 10.7 Restablecer Contraseña

Para restablecer la contraseña de un usuario:

### Pasos para Restablecer Contraseña

1. **Encontrar el usuario** en la lista
2. **Hacer clic en "Restablecer Contraseña"**
3. **Confirmar restablecimiento**
   - El sistema enviará un email al usuario con instrucciones
   - El usuario podrá crear una nueva contraseña

### Establecer Contraseña Directamente

Si es necesario establecer la contraseña directamente (requiere edición del sistema):

1. Editar el usuario
2. Si hay opción de establecer contraseña, usarla
3. ⚠️ No es la forma recomendada, mejor usar "Restablecer Contraseña"

## 10.8 Exportar Usuarios a CSV

Para exportar la lista de usuarios:

### Pasos para Exportar

1. **Aplicar filtros** (si desea exportar solo una parte)
2. **Hacer clic en "Exportar CSV"** en la página de usuarios
3. **Descargar archivo**
   - El archivo CSV se descargará automáticamente
   - Incluye todos los datos de usuarios (según filtros)

### Formato del Archivo Exportado

El CSV exportado incluye:
- ID del usuario
- Nombre
- Email
- Rol
- Estado (Activo/Inactivo)
- Verificado (Sí/No)
- Proveedor OAuth
- Fecha de registro
- Fecha de última actualización

## 10.9 Estadísticas de Usuarios

El dashboard de usuarios muestra estadísticas:

### Métricas Mostradas

1. **Total de Usuarios**
   - Cantidad total de usuarios en el sistema

2. **Usuarios Activos**
   - Cantidad de usuarios activos
   - Cantidad de usuarios inactivos

3. **Usuarios Verificados**
   - Cantidad de usuarios con email verificado
   - Cantidad de usuarios no verificados

4. **Usuarios por Rol**
   - Distribución de usuarios por rol
   - Gráfico o tabla de distribución

5. **Usuarios por Proveedor**
   - Cantidad de usuarios por tipo de autenticación
   - OAuth vs tradicional

6. **Nuevos Usuarios**
   - Usuarios registrados hoy
   - Usuarios registrados este mes

## 10.10 Filtros y Búsqueda

Filtros avanzados para usuarios:

### Filtros Disponibles

1. **Búsqueda por texto**
   - Buscar por nombre o email

2. **Filtro por rol**
   - Seleccionar rol específico
   - Ver solo usuarios de ese rol

3. **Filtro por estado**
   - Activos
   - Inactivos
   - Todos

4. **Filtro por verificación**
   - Verificados
   - No verificados
   - Todos

5. **Filtro por fecha de registro**
   - Desde una fecha
   - Hasta una fecha
   - Rango de fechas

6. **Filtro por proveedor**
   - OAuth (Google, etc.)
   - Tradicional
   - Todos

### Aplicar Filtros

1. Usar los controles de filtro en el panel
2. Los resultados se actualizan automáticamente
3. Ver filtros activos en la barra de filtros

### Limpiar Filtros

- Hacer clic en **"Limpiar filtros"** para resetear todos
- O remover filtros individuales

## 10.11 Gestionar Carreras

Desde la página de usuarios, el administrador encuentra el botón **Gestionar Carreras**, que abre un diálogo dedicado para administrar las carreras académicas disponibles en el sistema. Esas carreras alimentan el selector que aparece al solicitar una reserva.

### Acciones disponibles

- **Crear carrera**: botón "Crear Carrera" en el pie del diálogo. Pide nombre (requerido) y código opcional, por ejemplo "Ingeniería en Sistemas" / "ITR-IS".
- **Editar carrera**: ícono de lápiz en cada fila para corregir nombre o código.
- **Eliminar carrera**: ícono de papelera con confirmación previa. La baja es lógica; la carrera deja de estar disponible para nuevas reservas pero las existentes preservan su asociación.

El cambio se refleja de inmediato en el selector de carreras del formulario de reserva, sin necesidad de recargar la página.

---

# 11. CALENDARIO DE RESERVAS

## 11.1 Vista de Calendario

El calendario proporciona una visualización temporal de todas las reservas del sistema.

### Acceso al Calendario

1. En el menú principal, hacer clic en **"Calendario"** (`/calendar`)
2. O usar la acción rápida del dashboard

### Características del Calendario

- **Visualización temporal**: Ver reservas en formato calendario
- **Múltiples vistas**: Día, semana, mes
- **Colores por tipo**: Reservas coloreadas según tipo de espacio o estado
- **Información rápida**: Ver detalles al pasar el mouse o hacer clic
- **Navegación fácil**: Navegar entre períodos rápidamente

### Información Mostrada en el Calendario

Cada reserva en el calendario muestra:
- **Espacio**: Nombre del espacio reservado
- **Hora**: Rango de horas (inicio - fin)
- **Usuario**: Usuario que hizo la reserva (si aplica)
- **Estado**: Indicador visual del estado
- **Carrera**: Carrera asociada (si aplica)

## 11.2 Navegación del Calendario

El calendario permite navegar entre diferentes períodos:

### Navegación Básica

- **Día anterior/siguiente**: Flechas izquierda/derecha en vista día
- **Semana anterior/siguiente**: Flechas en vista semana
- **Mes anterior/siguiente**: Flechas en vista mes
- **Ir a hoy**: Botón "Hoy" para volver a la fecha actual

### Selector de Fecha

- **Selector de fecha**: Hacer clic en la fecha para abrir un calendario
- **Seleccionar fecha específica**: Elegir una fecha del calendario
- **Ir directamente**: El calendario navegará a esa fecha

### Navegación Rápida

- **Botones de período**: Botones para ir a períodos comunes (hoy, esta semana, este mes)
- **Atajos de teclado**: Teclas de flecha para navegar (si está habilitado)

## 11.3 Ver Reservas en el Calendario

### Interacción con Reservas

1. **Pasar el mouse**: Ver información básica en un tooltip
2. **Hacer clic**: Ver detalles completos de la reserva
3. **Hacer doble clic**: Abrir diálogo de detalles (si está habilitado)

### Colores en el Calendario

Las reservas se colorean según:
- **Tipo de espacio**: Color asociado al tipo de espacio
- **Estado**: Color según estado (Aprobado: verde, Pendiente: amarillo, Cancelado: rojo)
- **Carrera**: Color según carrera (si está configurado)

### Identificación Visual

- **Líneas gruesas**: Reservas largas
- **Líneas delgadas**: Reservas cortas
- **Colores sólidos**: Estado aprobado
- **Colores semitransparentes**: Estado pendiente
- **Tachado**: Reservas canceladas

## 11.4 Filtros del Calendario

El calendario incluye filtros para personalizar la vista:

### Filtros Disponibles

1. **Filtro por espacio**
   - Seleccionar uno o más espacios
   - Ver solo reservas de esos espacios

2. **Filtro por tipo de espacio**
   - Filtrar por tipo (Aula, Laboratorio, etc.)
   - Ver solo reservas de ese tipo

3. **Filtro por carrera**
   - Seleccionar una carrera específica
   - Ver solo reservas de esa carrera

4. **Filtro por estado**
   - Ver solo aprobadas
   - Ver solo pendientes
   - Ver todas

5. **Filtro por tiempo**
   - Personalizar rango de fechas
   - Ver solo un período específico

### Aplicar Filtros

1. Usar el panel de filtros en el calendario
2. Seleccionar los filtros deseados
3. Los resultados se actualizan automáticamente
4. Los filtros persisten al cambiar de vista

### Limpiar Filtros

- Hacer clic en **"Limpiar filtros"**
- O remover filtros individuales

## 11.5 Modo Pantalla Completa

El calendario puede visualizarse en pantalla completa:

### Activar Modo Pantalla Completa

1. Hacer clic en el icono de **pantalla completa** en el calendario
2. El calendario ocupará toda la pantalla
3. El header y sidebar se ocultarán

### Características del Modo Pantalla Completa

- **Más espacio**: Visualización optimizada para ver más reservas
- **Navegación mejorada**: Controles de navegación más grandes
- **Mejor experiencia**: Ideal para revisar el calendario completo

### Desactivar Modo Pantalla Completa

1. Hacer clic en el icono de **salir de pantalla completa**
2. O presionar la tecla ESC
3. El calendario volverá a tamaño normal

---

# 12. ESTADÍSTICAS Y REPORTES

## 12.1 Estadísticas de Inventario

El sistema proporciona estadísticas detalladas del inventario.

### Acceso a Estadísticas de Inventario

1. En el menú principal, hacer clic en **"Estadísticas"** (`/statistics`)
2. Seleccionar la tab **"Inventario"** o similar

### Métricas de Inventario

1. **Totales y Básicas**
   - Total de items en inventario
   - Total de cantidad (suma de todas las cantidades)
   - Items disponibles
   - Items en mantenimiento
   - Items dañados
   - Items sin asignar vs asignados
   - Items inactivos

2. **Porcentajes**
   - Porcentaje de items disponibles
   - Porcentaje en mantenimiento
   - Porcentaje dañados
   - Porcentaje sin asignar/asignados

3. **Por Tipo de Elemento**
   - Items agrupados por tipo
   - Cantidad total por tipo
   - Disponibles/mantenimiento/dañados por tipo
   - Tipos únicos en el sistema

4. **Por Espacio**
   - Items agrupados por espacio
   - Cantidad total por espacio
   - Disponibles/mantenimiento/dañados por espacio
   - Espacios con inventario

5. **Rankings**
   - Top espacios con más inventario
   - Top tipos más abundantes
   - Espacios con más problemas
   - Tipos con más problemas

6. **Promedios**
   - Promedio de items por espacio
   - Promedio de cantidad por item
   - Promedio de items por tipo
   - Promedio de cantidad por espacio/tipo

7. **Análisis Temporal**
   - Items creados este mes/año
   - Items creados últimos 6/12 meses
   - Items actualizados este mes/últimos 7 días

8. **Análisis de Edad**
   - Items recientes (menos de 30 días)
   - Items jóvenes (30-180 días)
   - Items viejos (más de 180 días)
   - Promedio de antigüedad

### Filtros de Estadísticas

- **Por espacio**: Ver estadísticas de un espacio específico
- **Por tipo de elemento**: Filtrar por tipo
- **Por estado**: Filtrar por estado (Disponible, Mantenimiento, Dañado)
- **Por rango de fechas**: Período específico

### Gráficos de Inventario

- **Gráfico de distribución por tipo**: Barras o dona
- **Gráfico por espacio**: Barras horizontales
- **Gráfico de estado**: Distribución por estado
- **Tendencias temporales**: Gráfico de línea
- **Rankings**: Gráfico de barras para top espacios/tipos

### Métricas analíticas de inventario

Al final de la pestaña de Inventario se incluye una sección de "Métricas analíticas" con un selector de rango (Últimos 30 días, Últimos 90 días, Año actual) que se apoya en los snapshots diarios del parque para responder preguntas que el estado actual del inventario, por sí solo, no podría responder:

- **Evolución del estado del parque**: gráfico de líneas que muestra cómo cambió la cantidad de items disponibles, en mantenimiento y dañados a lo largo del tiempo. Permite identificar si el parque se está degradando o si las intervenciones de mantenimiento están manteniendo el ritmo.
- **Crecimiento del parque**: gráfico de barras que compara la evolución del número de items registrados y de las unidades totales por fecha. Es la base para justificar planes de compra o renovación.
- **Cambios entre snapshots**: tabla que compara la fotografía del inventario del inicio del período con la del final, listando los espacios donde hubo movimiento (incorporación o pérdida de items). Sirve como herramienta de auditoría y control patrimonial.
- **Matriz espacio × tipo**: mapa de calor que cruza cada espacio con cada tipo de elemento y muestra cuántos items hay en cada combinación. Permite detectar concentraciones y huecos en la distribución del equipamiento entre aulas, laboratorios y demás espacios.

Estas métricas se actualizan automáticamente cada noche, junto con las de reservas, y se sirven prácticamente al instante porque están pre-calculadas.

## 12.2 Estadísticas de Espacios

Estadísticas detalladas de los espacios del sistema.

### Métricas de Espacios

1. **Totales**
   - Total de espacios
   - Espacios disponibles
   - Espacios en mantenimiento
   - Espacios ocupados

2. **Por Tipo de Espacio**
   - Distribución por tipo
   - Cantidad de cada tipo
   - Promedio de capacidad por tipo

3. **Capacidad**
   - Capacidad total del sistema
   - Capacidad promedio por espacio
   - Espacios por rango de capacidad

4. **Ocupación**
   - Tasa de ocupación promedio
   - Ocupación por espacio
   - Espacios más utilizados
   - Espacios menos utilizados

5. **Reservas**
   - Total de reservas por espacio
   - Promedio de reservas por espacio
   - Reservas por período

### Gráficos de Espacios

- **Distribución por tipo**: Gráfico de barras o pie
- **Capacidad**: Histograma de capacidades
- **Ocupación**: Gráfico de barras por espacio
- **Tendencias**: Evolución temporal de ocupación

## 12.3 Estadísticas de Reservas

> ⚠️ **Nota**: Solo disponible para ADMIN y ANALISTA.

### Métricas de Reservas

1. **Totales**
   - Total de reservas
   - Reservas aprobadas
   - Reservas pendientes
   - Reservas canceladas

2. **Por Período**
   - Reservas hoy
   - Reservas esta semana
   - Reservas este mes
   - Reservas por día de la semana

3. **Por Espacio**
   - Espacios más reservados
   - Espacios menos reservados
   - Reservas por espacio

4. **Por Carrera**
   - Distribución por carrera
   - Top carreras con más reservas

5. **Por Usuario**
   - Usuarios más activos
   - Reservas por usuario
   - Promedio de reservas por usuario

6. **Tendencias**
   - Evolución de reservas en el tiempo
   - Comparación mes a mes
   - Patrones de uso

### Gráficos de Reservas

- **Reservas por estado**: Gráfico de barras o dona
- **Reservas por día**: Gráfico de barras
- **Espacios más usados**: Gráfico de barras
- **Tendencias temporales**: Gráfico de línea

### Métricas avanzadas

Al final de la pestaña de Reservas se incluye una sección de "Métricas avanzadas" con un selector de rango (Últimos 30 días, Mes actual, Año actual) que actualiza al instante las siguientes vistas:

- **Mapa de calor día × hora**: una grilla que cruza los días de la semana con las horas del día y muestra cuántas reservas aprobadas hay en cada celda. Los tonos azules más intensos marcan las franjas de mayor demanda, lo que ayuda a identificar horarios pico.
- **Porcentaje de ocupación por espacio**: para cada espacio se calcula cuántas horas estuvo reservado en el período frente a un total disponible asumido (catorce horas por día). El resultado se muestra como porcentaje y como barra, lo que permite reconocer espacios subutilizados o saturados.
- **Reservas por edificio**: distribución del total de reservas aprobadas entre los edificios de la sede en el período seleccionado.
- **Tasa de cancelación por carrera**: para cada carrera se indican las reservas aprobadas y el porcentaje de cancelaciones sobre el total. Las carreras con tasas elevadas se resaltan visualmente.
- **Top diez usuarios reservadores**: ranking de los usuarios con más reservas en el período, útil para detectar perfiles de uso intensivo.

Los datos de esta sección se actualizan automáticamente cada noche; el resto del tiempo se sirven prácticamente al instante porque están pre-calculados.

### Predicción de demanda (Machine Learning)

Como cierre de la sección de métricas analíticas se incluye un gráfico de **predicción de demanda para los próximos treinta días**. El sistema entrena un modelo de aprendizaje automático sobre el histórico de reservas aprobadas y proyecta la cantidad esperada por día, junto con una banda de confianza que indica el rango probable.

En el gráfico, la línea azul representa el histórico real, la línea cyan punteada la predicción del modelo, y el sombreado alrededor de la predicción la banda de confianza. Un panel lateral muestra el algoritmo utilizado, el error promedio del modelo (MAPE) y la fecha del último entrenamiento.

El modelo se reentrena automáticamente cada domingo de madrugada con los datos disponibles a esa fecha. Los usuarios con perfil de administrador pueden además dispararlo manualmente mediante el botón **"Reentrenar"** en el encabezado de la sección, útil si recientemente se ingresaron muchos datos nuevos y se desea refrescar la predicción.

Esta funcionalidad está pensada como insumo para la planificación de espacios y para anticipar picos de demanda en períodos académicos sensibles (inicio de cursos, semana de exámenes). La precisión efectiva del modelo mejora a medida que el sistema acumula más historia real de uso.

## 12.4 Gráficos y Visualizaciones

El sistema incluye múltiples tipos de gráficos:

### Tipos de Gráficos

1. **Gráfico de Barras**
   - Para comparar categorías
   - Horizontal o vertical

2. **Gráfico de Línea**
   - Para tendencias temporales
   - Evolución en el tiempo

3. **Gráfico de Dona/Pie**
   - Para distribución porcentual
   - Proporciones

4. **Histograma**
   - Para distribución de datos
   - Rangos y frecuencias

### Interactividad

- **Hover**: Ver valores exactos al pasar el mouse
- **Zoom**: Ampliar secciones (si está habilitado)
- **Filtros**: Actualizar gráficos con filtros
- **Exportar**: Descargar gráficos como imagen

## 12.5 Exportar Reportes

Puede exportar las estadísticas en diferentes formatos:

### Exportar a PDF

1. **Configurar filtros** (si aplica)
2. **Hacer clic en "Exportar PDF"**
3. **El sistema generará un PDF** con:
   - Estadísticas completas
   - Gráficos incluidos
   - Fecha de exportación
   - Filtros aplicados

### Exportar a CSV

1. **Configurar filtros**
2. **Hacer clic en "Exportar CSV"**
3. **Descargar archivo**
   - Datos tabulares
   - Formato compatible con Excel

### Personalizar Exportación

- **Incluir gráficos**: Opción para incluir/excluir gráficos
- **Rango de fechas**: Especificar período
- **Campos**: Seleccionar qué campos incluir

---

# 13. SISTEMA Y CONFIGURACIÓN

> ⚠️ **Nota**: Esta sección es exclusiva para ADMIN.

## 13.1 Panel de Sistema

El panel de sistema proporciona información y control sobre el estado del sistema.

### Acceso al Panel

1. En el menú principal, hacer clic en **"Sistema"** (`/system`)
2. Solo ADMIN puede acceder a esta sección

### Componentes del Panel

- **Métricas principales**: CPU, memoria, threads
- **Salud del sistema**: Estado general
- **Logs**: Logs de aplicación y base de datos
- **Actividad**: Actividad HTTP y endpoints
- **Configuración**: Ajustes del sistema

## 13.2 Métricas del Sistema

El panel muestra métricas en tiempo real:

### Métricas Principales

1. **CPU**
   - Uso actual de CPU
   - Promedio de uso
   - Gráfico de tendencia

2. **Memoria**
   - Memoria usada vs disponible
   - Porcentaje de uso
   - Gráfico de memoria

3. **Threads**
   - Cantidad de threads activos
   - Threads en uso
   - Gráfico de threads

4. **Uptime**
   - Tiempo de actividad del sistema
   - Último reinicio

### Información complementaria

- **Base de datos**: estado de la conexión, cantidad de conexiones activas y tablas relevantes.
- **Endpoints**: lista de endpoints disponibles del sistema con su estado.
- **Información de la aplicación**: versión, entorno, perfil activo y datos generales.
- **Usuarios activos**: usuarios conectados en la sesión actual.

### Auto-Refresh

- **Switch de auto-refresh**: Activar/desactivar actualización automática
- **Intervalo**: Configurar intervalo de actualización (ej: cada 5 segundos)

## 13.3 Logs de Aplicación

Visualización de logs del sistema:

### Ver Logs

1. En el panel de sistema, ir a la tab **"Logs"** o **"Database Logs"**
2. Se mostrarán los logs de la aplicación

### Tipos de Logs

1. **Logs de Aplicación**
   - Logs generales del sistema
   - INFO, WARN, ERROR, DEBUG

2. **Logs de Base de Datos**
   - Queries ejecutados
   - Tiempo de ejecución
   - Errores de base de datos

### Filtrar Logs

- **Por nivel**: INFO, WARN, ERROR, DEBUG
- **Por fecha**: Rango de fechas
- **Por búsqueda**: Texto específico
- **Por logger**: Logger específico

### Características

- **Scroll automático**: Seguir últimas líneas
- **Búsqueda**: Buscar texto en logs
- **Resaltado**: Resaltar errores y advertencias
- **Exportar**: Descargar logs

### Actualizar Niveles de Logger

1. **Seleccionar logger** del selector
2. **Seleccionar nuevo nivel** (INFO, WARN, ERROR, DEBUG, TRACE)
3. **Actualizar**
   - El nivel se cambiará dinámicamente
   - No requiere reiniciar el servidor

## 13.4 Actividad HTTP

Monitoreo de actividad HTTP:

### Información Mostrada

- **Endpoints activos**: Todos los endpoints disponibles
- **Requests recientes**: Últimas peticiones HTTP
- **Tiempo de respuesta**: Tiempo promedio por endpoint
- **Usuarios activos**: Usuarios con actividad reciente

### Detalles de Request

Cada request muestra:
- **Endpoint**: URL accedida
- **Método**: GET, POST, PUT, DELETE, etc.
- **Usuario**: Usuario que hizo la request
- **Timestamp**: Cuándo se hizo
- **Tiempo de respuesta**: Duración
- **Status code**: Código de respuesta HTTP

### Filtros

- **Por usuario**: Ver requests de un usuario específico
- **Por endpoint**: Filtrar por URL
- **Por método**: GET, POST, etc.
- **Por rango de tiempo**: Período específico

---

# 14. AUDITORÍA

> ⚠️ **Nota**: Esta sección es exclusiva para ADMIN.

## 14.1 Ver Registros de Auditoría

El sistema registra todas las acciones importantes realizadas por los usuarios.

### Acceso a Auditoría

1. En el menú principal, hacer clic en **"Auditoría"** (`/audit`)
2. Solo ADMIN puede acceder a esta sección

### Información de Registros

Cada registro de auditoría muestra:
- **Entidad**: Tipo de entidad afectada (Usuario, Espacio, Inventario, Reserva, etc.)
- **ID de entidad**: ID de la entidad afectada
- **Acción**: CREATE (crear), UPDATE (actualizar), DELETE (eliminar)
- **Usuario**: Usuario que realizó la acción
- **Timestamp**: Cuándo se realizó la acción
- **Datos previos**: Estado antes del cambio (si aplica)
- **Datos nuevos**: Estado después del cambio (si aplica)

## 14.2 Filtrar Registros

Filtros avanzados para encontrar registros específicos:

### Filtros Disponibles

1. **Por entidad**
   - Usuario
   - Espacio
   - Inventario
   - Reserva
   - Carrera
   - Tipo de Espacio
   - Tipo de Elemento
   - Todas

2. **Por acción**
   - CREATE (crear)
   - UPDATE (actualizar)
   - DELETE (eliminar)
   - Todas

3. **Por usuario**
   - Seleccionar usuario específico
   - Ver acciones de ese usuario

4. **Por rango de fechas**
   - Desde una fecha
   - Hasta una fecha
   - Período específico

5. **Búsqueda por texto**
   - Buscar en datos previos/nuevos
   - Buscar por ID de entidad

### Aplicar Filtros

1. Usar los controles de filtro en el panel
2. Los resultados se actualizan automáticamente
3. Los filtros se pueden combinar

## 14.3 Ver Detalles de Registro

Para ver información detallada de un registro:

### Pasos para Ver Detalles

1. **Encontrar el registro** en la lista
2. **Hacer clic en "Ver Detalles"** o en el registro
3. Se abrirá un diálogo con información completa

### Información en Detalles

- **Información básica**: Entidad, acción, usuario, timestamp
- **Datos previos**: Estado completo antes del cambio (formato JSON)
- **Datos nuevos**: Estado completo después del cambio (formato JSON)
- **Cambios específicos**: Diferencias resaltadas (si está disponible)

### Exportar Registros

1. **Aplicar filtros** (si desea exportar solo una parte)
2. **Hacer clic en "Exportar"**
3. **Seleccionar formato**:
   - CSV: Datos tabulares
   - JSON: Datos estructurados
4. **Descargar archivo**

### Entidades Auditadas

El sistema audita las siguientes entidades:
- **Usuario**: Creación, actualización, cambio de rol, activación/desactivación
- **Espacio**: Creación, actualización, eliminación, cambio de estado
- **Inventario**: Creación, actualización, eliminación, asignación, cambio de estado
- **Reserva**: Creación, actualización, cancelación, cambio de estado
- **Carrera**: Creación, actualización, eliminación
- **Tipo de Espacio**: Creación, actualización, eliminación
- **Tipo de Elemento**: Creación, actualización, eliminación

---

# 15. PREFERENCIAS DE USUARIO

## 15.1 Notificaciones por Email

Puede configurar qué notificaciones por email desea recibir.

### Acceso a Preferencias

1. Abrir el panel de **Preferencias** desde el ícono de configuración ubicado en la barra lateral, junto al menú de navegación principal.
2. El panel se abre como ventana modal sobre la pantalla actual; no es necesario navegar a otra página.

### Tipos de Notificaciones

Las notificaciones disponibles dependen de su rol:

1. **Verificación de cuenta** (todos los roles)
2. **Restablecimiento de contraseña** (todos los roles)
3. **Cambio de rol** (solo ADMIN puede cambiar roles)
4. **Cambio de estado** (activación/desactivación)
5. **Reserva aprobada**
6. **Reserva rechazada**
7. **Reserva cancelada**
8. **Reserva actualizada**
9. **Nueva solicitud de reserva** (solo ADMIN/ANALISTA)
10. **Recordatorio de reserva**
11. **Nueva solicitud de inventario** (solo ADMIN/ANALISTA/MANTENIMIENTO)
12. **Estado de solicitud de inventario**

### Configurar Notificaciones

1. **En la sección "Notificaciones por Email"**
2. **Marcar/desmarcar** las notificaciones que desea recibir
3. **Guardar preferencias**
   - Hacer clic en **"Guardar"**
   - Las preferencias se aplican inmediatamente

### Nota Importante

- ⚠️ Algunas notificaciones son obligatorias (ej: verificación de cuenta)
- Los administradores siempre reciben notificaciones administrativas

## 15.2 Preferencias de Vista

Puede personalizar cómo se muestran los datos según el módulo:

### Preferencias por Módulo

#### Reservas

1. **Modo de vista predeterminado**
   - Tarjetas (Cards)
   - Tabla
   - Calendario

2. **Vista de calendario predeterminada**
   - Día
   - Semana
   - Mes

3. **Tamaño de página**
   - 10
   - 25
   - 50
   - 100

#### Espacios

1. **Modo de vista predeterminado**
   - Tarjetas (Cards)
   - Tabla

2. **Tamaño de página**
   - 12
   - 24
   - 48

#### Inventario

1. **Modo de vista predeterminado**
   - Tabla
   - Tarjetas (Cards)

2. **Tamaño de página**
   - 10
   - 25
   - 50

#### Usuarios (solo ADMIN)

1. **Tamaño de página**
   - 10
   - 25
   - 50

#### Auditoría (solo ADMIN)

1. **Tamaño de página**
   - 20
   - 50
   - 100

### Configurar Preferencias de Vista

1. **En la sección "Preferencias de Vista"**
2. **Seleccionar valores** para cada módulo
3. **Guardar preferencias**
   - Las preferencias se aplican en el próximo acceso al módulo

## 15.3 Guardar Preferencias

### Pasos para Guardar

1. **Configurar todas las preferencias** deseadas
2. **Revisar configuración**
3. **Hacer clic en "Guardar"**
   - Las preferencias se guardan en el sistema
   - Se aplican inmediatamente

### Cancelar Cambios

- Si no desea guardar, hacer clic en **"Cancelar"**
- Los cambios no guardados se descartan
- Las preferencias anteriores se mantienen

### Aplicación de Preferencias

- Las preferencias son **específicas por usuario**
- Se **aplican automáticamente** al acceder a cada módulo
- Pueden **cambiar en cualquier momento** desde Preferencias

---

# 16. RECOMENDACIONES INTELIGENTES

## 16.1 Qué son y para qué sirven

UTEC Space Manager ofrece **sugerencias automáticas** que aparecen en distintas partes del sistema para ayudar a tomar mejores decisiones. Estas sugerencias se basan en el historial de uso, los patrones de actividad y la disponibilidad actual.

Las recomendaciones **nunca son obligatorias**: son opciones que se proponen para ahorrar tiempo o destacar lo más relevante. Siempre se puede ignorar la sugerencia y seleccionar manualmente.

Cada recomendación viene acompañada de un **porcentaje de relevancia**: cuanto más alto, más útil debería resultar para esa persona en ese momento.

## 16.2 Recomendaciones al crear una reserva

Al crear una nueva reserva (o solicitarla, según el rol), el sistema muestra tres tipos de sugerencias:

### Espacios recomendados

- Aparecen después de seleccionar fecha y horario.
- Muestran los espacios que la persona usa con más frecuencia, considerando la capacidad necesaria y la disponibilidad real para ese horario.
- Cómo usarlas: hacer clic en un espacio recomendado lo selecciona automáticamente en el formulario.

### Horarios recomendados

- Aparecen después de seleccionar un espacio y una fecha.
- Muestran los horarios que la persona suele usar, descartando los que ya están ocupados.
- Cómo usarlas: hacer clic en un horario lo aplica automáticamente al formulario.

### Items recomendados

- Aparecen después de seleccionar un espacio.
- Muestran los items que se solicitan con frecuencia para ese espacio (proyectores, cables, accesorios) y su disponibilidad actual.
- Cómo usarlas: el botón "Agregar" suma el item a la solicitud de la reserva.

## 16.3 Recomendaciones en el dashboard

Cada usuario tiene un dashboard personalizado según su rol:

- **Docentes**: ven los espacios recomendados para reservar en los próximos días.
- **Analistas**: ven las reservas que requieren atención prioritaria, ordenadas por urgencia (con una escala del 1 al 10 según los días pendientes y los días hasta la fecha de inicio).
- **Personal de mantenimiento**: ve los items y espacios que requieren intervención.
- **Administradores**: ven el panorama global con todas las recomendaciones del sistema.
- Estudiantes y usuarios externos no reciben recomendaciones en el dashboard.

## 16.4 Recomendaciones para personal de mantenimiento

### Items que requieren mantenimiento

El sistema identifica los items que están en estado de mantenimiento y los ordena por urgencia según el tiempo que llevan en ese estado:

- Más de 7 días → urgencia baja.
- Más de 15 días → urgencia media.
- Más de 30 días → urgencia alta.

Los items dañados aparecen en la sección "Espacios que requieren atención", no en esta lista.

### Espacios que requieren atención

Lista los espacios con un porcentaje alto de items dañados o en mantenimiento, sugiriendo una revisión general.

## 16.5 Recomendaciones para administradores y analistas

### Reasignación de items

El sistema sugiere mover items entre espacios cuando detecta que un item se solicita frecuentemente en un espacio distinto al que está asignado actualmente.

### Compras necesarias

Identifica items con alta demanda y bajo stock, sugiriendo qué conviene reponer.

### Asignación de analistas

Cuando un administrador asigna un analista a un docente, el sistema sugiere qué analista combinaría mejor para esa relación, considerando tres criterios:

- Si el analista ya trabajó antes con ese docente.
- La carga de trabajo actual del analista.
- La proporción de reservas aprobadas del analista.

## 16.6 Cómo entender los puntajes

Cada recomendación viene con un porcentaje de relevancia. Es una guía visual:

- **Más alto** = la sugerencia coincide más con el historial o las necesidades de la persona.
- **Más bajo** = sigue siendo una opción válida, simplemente menos prioritaria.

Las recomendaciones se mantienen actualizadas automáticamente: el sistema las recalcula cuando expira su tiempo de vida en caché (típicamente cada 30 minutos), las invalida cuando se crea o se cancela una reserva, y vuelve a procesarlas en un trabajo nocturno.

## 16.7 Preguntas frecuentes sobre recomendaciones

**¿Por qué no veo recomendaciones?**

- Las recomendaciones aparecen una vez que se completan ciertos campos (fecha, horario, espacio).
- Se necesita un mínimo de historial de uso para que el sistema pueda generar sugerencias personalizadas.
- Los roles "Estudiante" y "Externo" no reciben recomendaciones en el dashboard.

**¿Las recomendaciones son obligatorias?**

No. Son sugerencias para ahorrar tiempo. Siempre se puede ignorar la lista y seleccionar manualmente cualquier opción disponible.

**¿Puedo desactivarlas?**

No existe una opción para ocultarlas, pero se pueden ignorar sin que afecte el funcionamiento del formulario.

> Para detalles técnicos del subsistema de recomendaciones (algoritmos, pesos, jobs, caché), ver la ficha técnica `documentation/fichas-tecnicas/sistema-de-recomendaciones.md`.

---

# 16-bis. ASISTENTE DE INTELIGENCIA ARTIFICIAL

El sistema integra un asistente de inteligencia artificial generativa que aparece distribuido en las pantallas donde resulta más útil, en lugar de concentrarse en una página aparte. Las funcionalidades están disponibles según el rol del usuario.

## 16-bis.1 Resumen ejecutivo de estadísticas

En la pantalla de **Estadísticas**, en la parte superior, hay un panel destacado con un botón **Generar resumen**. Al presionarlo, el sistema interpreta el estado actual de las reservas y devuelve un párrafo de tres o cuatro oraciones describiendo la situación general, los hallazgos relevantes y posibles señales de alerta. Se puede regenerar las veces que se quiera.

## 16-bis.2 Explicación de recomendaciones

Cada tarjeta de recomendación de espacio incluye un botón **Explicar con IA**. Al presionarlo, el sistema reescribe la razón técnica de la recomendación en un texto natural. En lugar de leer "puntaje 0.85, razón: disponibilidad alta los jueves", aparece una frase como "Te conviene la Sala 203: suele estar libre los jueves y otras personas de tu carrera la usan habitualmente".

## 16-bis.3 Análisis del forecast de demanda

Dentro del bloque de **Predicción de demanda** de la pantalla de Estadísticas, el botón **Analizar** genera una lectura natural de las predicciones: tendencia general, picos esperados con fecha aproximada y sugerencias operativas (por ejemplo, "considerar liberar más espacios el próximo martes").

## 16-bis.4 Búsqueda semántica de espacios

En la pantalla de **Espacios**, junto al buscador habitual, está el botón **Buscar con IA**. Permite describir lo que se necesita en lenguaje natural, sin tener que conocer el nombre exacto del espacio. Por ejemplo, escribir "salón grande con proyector para un taller de 30 personas" devuelve los espacios cuyas características más se parecen al concepto consultado, ordenados por afinidad y con acceso directo al detalle de cada uno.

## 16-bis.5 Asistente conversacional

En la esquina inferior derecha de toda pantalla autenticada aparece un botón **Asistente**. Al pulsarlo se abre una ventana de chat donde se puede consultar al sistema en lenguaje natural sobre reservas propias, espacios disponibles, inventario y estadísticas. Entiende preguntas como "¿tengo reservas el jueves?", "buscame un salón para 50 personas el viernes a las 14" o "¿cuál es la ocupación de la última semana?".

Por seguridad, el asistente nunca puede acceder a datos de otros usuarios: aunque se le pida explícitamente, sólo opera sobre las reservas y configuraciones del usuario autenticado. Tampoco puede crear, modificar ni cancelar reservas, ni realizar ninguna operación de escritura: sólo consultar.

Las consultas que requieren información sensible (por ejemplo, ranking de usuarios o reservas globales) sólo se ejecutan si el rol del usuario lo permite; en caso contrario el asistente lo explica con palabras y, cuando corresponde, sugiere una alternativa.

Las respuestas pueden tomar de dos a seis segundos según la complejidad de la pregunta. Debajo de cada respuesta el sistema muestra etiquetas con las herramientas que el asistente utilizó para responder, de modo que el usuario sepa de dónde salió la información.

> Para detalles técnicos de la capa de IA (modelos utilizados, abstracción de proveedor, esquema de embeddings, manejo de seguridad), ver la ficha técnica `documentation/fichas-tecnicas/capa-ia-generativa.md`.

---

# 17. CARRERAS

Las carreras se utilizan para asociar reservas a programas académicos y permiten organizar y filtrar la información a nivel institucional.

## 17.1 Ver Carreras

Las carreras aparecen en los selectores de los formularios y filtros donde tiene sentido vincular una reserva o una estadística con una carrera específica:

- Al crear o editar una **reserva**: el formulario incluye un selector opcional de carrera.
- En el **calendario**: filtro por carrera para ver únicamente las reservas asociadas a un programa.
- En **estadísticas**: filtro y desglose por carrera.

Cada carrera registrada en el sistema tiene:

- **Nombre**: nombre completo de la carrera.
- **Código**: identificador corto único.
- **Fecha de creación**: cuándo fue dada de alta en el sistema.

## 17.2 Gestionar Carreras

> **Importante**: en la versión actual del sistema **no existe una pantalla de administración dedicada** para crear, editar o eliminar carreras desde la interfaz. La gestión se realiza por la API del sistema. Está previsto incorporar una pantalla de gestión en próximas versiones.

Mientras tanto, los administradores que necesiten dar de alta, modificar o dar de baja carreras deben coordinar con el equipo técnico para hacerlo a través de la API.

---

# 18. GUÍAS PRÁCTICAS POR ROL

Esta sección proporciona guías paso a paso específicas para cada rol del sistema.

## 18.1 Flujo para ADMIN

### Tareas Diarias Típicas de un ADMIN

1. **Revisar Dashboard**
   - Ver métricas generales del sistema
   - Revisar próximas reservas
   - Verificar usuarios activos

2. **Gestionar Usuarios**
   - Revisar nuevos registros
   - Cambiar roles si es necesario
   - Activar/desactivar usuarios

3. **Gestionar Espacios** (si es necesario)
   - Crear nuevos espacios
   - Actualizar información de espacios
   - Gestionar tipos de espacio

4. **Gestionar Inventario** (si es necesario)
   - Revisar estado del inventario
   - Asignar items a espacios
   - Actualizar estados de items

5. **Gestionar Reservas** (si es necesario)
   - Aprobar/rechazar reservas pendientes
   - Resolver conflictos
   - Crear reservas directamente

6. **Revisar Sistema**
   - Monitorear salud del sistema
   - Revisar logs de errores
   - Verificar métricas de rendimiento

7. **Revisar Auditoría**
   - Revisar acciones realizadas
   - Verificar cambios importantes
   - Exportar registros si es necesario

### Flujo Completo: Crear y Configurar Nuevo Espacio

1. **Crear tipo de espacio** (si no existe)
   - Ir a Gestión de Espacios > Tipos
   - Crear tipo (ej: "Aula")
   - Asignar color

2. **Crear espacio**
   - Ir a Gestión de Espacios
   - Crear nuevo espacio
   - Completar: nombre, tipo, capacidad
   - Guardar

3. **Agregar inventario inicial**
   - Ir a detalles del espacio
   - Tab "Inventario"
   - Agregar items necesarios
   - Asignar items al espacio

4. **Verificar disponibilidad**
   - Ver espacio en calendario
   - Verificar que aparezca correctamente

## 18.2 Flujo para ANALISTA

### Tareas Diarias Típicas de un ANALISTA

1. **Revisar Solicitudes de Reserva**
   - Ver reservas pendientes
   - Revisar detalles de cada solicitud
   - Aprobar o rechazar solicitudes

2. **Gestionar Reservas**
   - Crear reservas directamente
   - Editar reservas existentes
   - Cancelar reservas si es necesario

3. **Crear Solicitudes de Inventario**
   - Al crear reservas, agregar solicitudes de inventario
   - Ver estado de solicitudes

4. **Consultar Disponibilidad**
   - Ver calendario de espacios
   - Verificar disponibilidad antes de aprobar
   - Revisar conflictos

5. **Ver Estadísticas**
   - Revisar estadísticas de reservas
   - Exportar reportes si es necesario

### Flujo Completo: Procesar Solicitud de Reserva

1. **Revisar solicitud**
   - Ir a Reservas
   - Filtrar por estado "Pendiente"
   - Seleccionar reserva pendiente

2. **Verificar disponibilidad**
   - Ver detalles de la reserva
   - Verificar que el espacio esté disponible
   - Revisar conflictos con otras reservas

3. **Revisar solicitudes de inventario**
   - Ver items solicitados
   - Verificar disponibilidad de items

4. **Aprobar o rechazar**
   - Si todo está bien: Aprobar
   - Si hay problemas: Rechazar con motivo
   - Notificar al usuario

5. **Seguimiento**
   - Verificar que se creó correctamente
   - Verificar solicitudes de inventario

## 18.3 Flujo para MANTENIMIENTO

### Tareas Diarias Típicas de un MANTENIMIENTO

1. **Gestionar Inventario**
   - Ver items en mantenimiento
   - Actualizar estados de items
   - Asignar/desasignar items a espacios

2. **Gestionar Espacios**
   - Actualizar estados de espacios
   - Agregar items a espacios
   - Actualizar capacidad si es necesario

3. **Gestionar Solicitudes de Inventario**
   - Ver solicitudes pendientes
   - Aprobar/rechazar solicitudes
   - Asignar items de inventario
   - Marcar como entregado

4. **Revisar Inventario**
   - Ver items dañados que requieren atención
   - Verificar items en mantenimiento
   - Actualizar observaciones

5. **Ver Estadísticas**
   - Revisar estadísticas de inventario
   - Ver estadísticas de espacios
   - Exportar reportes

### Flujo Completo: Gestionar Solicitud de Inventario

1. **Ver solicitudes pendientes**
   - Ir a Inventario > Solicitudes
   - Filtrar por estado "Pendiente"

2. **Revisar solicitud**
   - Ver detalles de la solicitud
   - Ver reserva asociada
   - Verificar items disponibles

3. **Asignar item de inventario**
   - Seleccionar item del inventario
   - Asignar a la solicitud
   - O crear nuevo item si es necesario

4. **Aprobar solicitud**
   - Hacer clic en "Aprobar"
   - El item se asignará al espacio de la reserva

5. **Entregar item**
   - Cuando el item es entregado físicamente
   - Marcar como "Entregado"
   - Verificar que el estado se actualizó

## 18.4 Flujo para DOCENTE

### Tareas Típicas de un DOCENTE

1. **Solicitar Reservas**
   - Crear solicitudes de reserva
   - Agregar solicitudes de inventario si es necesario
   - Especificar detalles de la clase/actividad

2. **Seguimiento de Solicitudes**
   - Ver estado de solicitudes pendientes
   - Verificar si fueron aprobadas
   - Verificar solicitudes de inventario

3. **Ver Calendario**
   - Consultar disponibilidad de espacios
   - Ver reservas del sistema
   - Planificar reservas futuras

4. **Ver Mis Reservas**
   - Ver reservas propias
   - Ver próximas reservas
   - Cancelar reservas si es necesario

### Flujo Completo: Solicitar Reserva para Clase

1. **Ver disponibilidad**
   - Ir a Calendario
   - Ver espacios disponibles en el horario deseado

2. **Seleccionar espacio**
   - Ver detalles del espacio
   - Verificar capacidad y características
   - Verificar inventario disponible

3. **Crear solicitud**
   - Ir a Reservas > Nueva Reserva
   - Seleccionar espacio
   - Seleccionar fecha y hora
   - Seleccionar carrera si aplica
   - Agregar solicitudes de inventario si es necesario

4. **Agregar recurrencia** (si es clase recurrente)
   - Activar recurrencia semanal
   - Indicar fecha de fin (ej: fin del semestre)
   - Revisar cantidad de reservas que se crearán

5. **Enviar solicitud**
   - Revisar todos los datos
   - Hacer clic en "Solicitar Reserva"
   - Esperar aprobación

6. **Seguimiento**
   - Ver estado de la solicitud
   - Recibir notificación cuando sea aprobada
   - Verificar en el calendario

## 18.5 Flujo para ESTUDIANTE

### Tareas Típicas de un ESTUDIANTE

1. **Ver Calendario**
   - Consultar reservas disponibles
   - Ver disponibilidad de espacios
   - Planificar actividades

2. **Ver Espacios**
   - Consultar información de espacios
   - Ver capacidad y características
   - Ver inventario de espacios

3. **Ver Dashboard**
   - Ver información general
   - Ver próximas reservas

### Flujo: Consultar Disponibilidad de Espacio

1. **Acceder al calendario**
   - Ir a Calendario
   - Navegar al día/semana deseada

2. **Filtrar por espacio**
   - Seleccionar espacio específico en filtros
   - Ver reservas de ese espacio

3. **Ver detalles del espacio**
   - Hacer clic en el espacio en el calendario
   - O ir a Espacios > Ver detalles
   - Ver información completa

4. **Ver disponibilidad**
   - En el calendario, ver horarios libres
   - Identificar cuándo está disponible

## 18.6 Flujo para EXTERNO

### Tareas Típicas de un EXTERNO

1. **Solicitar Reservas**
   - Crear solicitudes para eventos
   - Agregar detalles del evento
   - Esperar aprobación

2. **Ver Reservas Públicas**
   - Ver calendario público
   - Ver reservas aprobadas
   - Consultar disponibilidad

3. **Seguimiento de Solicitudes**
   - Ver estado de solicitudes
   - Recibir notificaciones
   - Verificar aprobación

### Flujo: Solicitar Reserva para Evento Externo

1. **Consultar disponibilidad**
   - Ir a Calendario
   - Ver espacios disponibles
   - Seleccionar espacio adecuado

2. **Crear solicitud**
   - Ir a Reservas > Nueva Reserva
   - Seleccionar espacio
   - Fecha y hora del evento
   - Agregar detalles en observaciones (si hay campo)

3. **Agregar solicitudes de inventario** (si es necesario)
   - Especificar items necesarios
   - Cantidad requerida

4. **Enviar solicitud**
   - Revisar información
   - Enviar solicitud
   - Esperar aprobación

5. **Seguimiento**
   - Ver estado de la solicitud
   - Recibir notificación
   - Confirmar reserva cuando sea aprobada

---

# 19. CASOS DE USO COMUNES

Esta sección describe casos de uso frecuentes en el sistema.

## Caso de Uso 1: Reservar Espacio para una Clase Semanal

**Escenario**: Un docente necesita reservar un salón todos los lunes de 9:00 AM a 11:00 AM durante el semestre.

**Pasos**:
1. Ir a Reservas > Nueva Reserva
2. Seleccionar el espacio deseado
3. Fecha de inicio: Primer lunes del semestre, 9:00 AM
4. Fecha de fin: Mismo día, 11:00 AM
5. Activar recurrencia: Semanal
6. Fecha de fin de recurrencia: Último lunes del semestre
7. Revisar cantidad de reservas (debe ser 15-18 aproximadamente)
8. Solicitar reserva
9. Esperar aprobación del analista
10. Verificar que las reservas se crearon correctamente

## Caso de Uso 2: Gestionar Inventario de un Espacio

**Escenario**: Un personal de mantenimiento debe actualizar el inventario de un aula nueva.

**Pasos**:
1. Ir a Espacios > Ver detalles del espacio
2. Tab "Inventario"
3. Agregar items necesarios:
   - Proyector (crear o asignar existente)
   - Sillas (20 unidades)
   - Mesas (10 unidades)
   - Pizarra (1 unidad)
4. Establecer estados: Todos "Disponible"
5. Agregar observaciones si es necesario
6. Guardar cambios
7. Verificar inventario en la lista

## Caso de Uso 3: Aprobar Solicitud de Reserva

**Escenario**: Un analista recibe una solicitud de reserva y debe aprobarla o rechazarla.

**Pasos**:
1. Ir a Reservas
2. Filtrar por estado "Pendiente"
3. Seleccionar la solicitud pendiente
4. Revisar detalles:
   - Espacio solicitado
   - Fecha y hora
   - Usuario solicitante
   - Solicitudes de inventario
5. Verificar disponibilidad en el calendario
6. Si todo está bien:
   - Hacer clic en "Aprobar"
   - Confirmar aprobación
7. Si hay problemas:
   - Hacer clic en "Rechazar"
   - Agregar motivo de rechazo
   - Confirmar rechazo
8. El usuario recibirá notificación

## Caso de Uso 4: Crear Reserva Recurrente

**Escenario**: Un analista necesita crear reservas para un evento que se repite mensualmente.

**Pasos**:
1. Ir a Reservas > Nueva Reserva
2. Seleccionar espacio
3. Fecha de inicio: Fecha del primer evento
4. Fecha de fin: Fecha y hora de fin
5. Activar recurrencia: Mensual
6. Fecha de fin de recurrencia: Última fecha del evento
7. Revisar cantidad de reservas (ej: 6 reservas si son 6 meses)
8. Crear reserva (ADMIN/ANALISTA crea directamente aprobada)
9. Verificar que todas las reservas se crearon
10. Verificar en el calendario

## Caso de Uso 5: Gestionar Solicitud de Inventario

**Escenario**: Un docente solicitó proyectores para una reserva y el personal de mantenimiento debe gestionarla.

**Pasos**:
1. Personal de mantenimiento va a Inventario > Solicitudes
2. Filtrar por estado "Pendiente"
3. Ver solicitud pendiente
4. Verificar que hay proyectores disponibles
5. Si hay items disponibles:
   - Hacer clic en "Aprobar"
   - Seleccionar item del inventario
   - Asignar item
   - Confirmar
6. Cuando el item es entregado físicamente:
   - Marcar como "Entregado"
   - Verificar que el estado se actualizó
7. El docente recibe notificación

---

# 20. SOLUCIÓN DE PROBLEMAS

Esta sección ayuda a resolver problemas comunes en el sistema.

## Problemas de Autenticación

### No puedo iniciar sesión

**Soluciones**:
1. Verificar que el email sea correcto
2. Verificar que la contraseña sea correcta (revisar mayúsculas/minúsculas)
3. Verificar que el email esté verificado
4. Usar "¿Olvidaste tu contraseña?" para restablecer
5. Probar iniciar sesión con Google OAuth
6. Verificar que la cuenta no esté desactivada (contactar ADMIN)
7. Limpiar caché y cookies del navegador
8. Probar en otro navegador

### No recibí el email de verificación

**Soluciones**:
1. Revisar carpeta de spam/correo no deseado
2. Solicitar nuevo código de verificación
3. Verificar que el email ingresado sea correcto
4. Contactar administrador para verificación manual
5. Verificar configuración de spam del servidor de email

### Error al iniciar sesión con Google

**Soluciones**:
1. Verificar que esté conectado a internet
2. Verificar que tenga una cuenta de Google activa
3. Autorizar el acceso al sistema
4. Probar en otro navegador
5. Verificar configuración de OAuth del sistema

## Problemas de Permisos

### No puedo ver ciertas secciones

**Soluciones**:
1. Verificar su rol en el sistema
2. Revisar los permisos de su rol (sección [4](#4-roles-y-permisos))
3. Contactar administrador si cree que debería tener acceso
4. Cerrar sesión y volver a iniciar
5. Verificar que su rol no haya sido cambiado

### No puedo realizar ciertas acciones

**Soluciones**:
1. Verificar que tenga los permisos necesarios para esa acción
2. Revisar la tabla de permisos (sección [4.3](#43-tabla-comparativa-de-permisos))
3. Contactar administrador si necesita más permisos
4. Verificar que esté en la sección correcta

## Problemas de Funcionalidad

### No puedo crear una reserva

**Soluciones**:
1. Verificar que el espacio esté disponible en ese horario
2. Verificar que no haya conflictos con otras reservas
3. Verificar permisos para crear reservas
4. Intentar con otro espacio u otro horario
5. Revisar mensajes de error del sistema

### No aparece el espacio en el selector

**Soluciones**:
1. Verificar que el espacio esté activo
2. Verificar que el espacio esté disponible
3. Filtrar en la lista de espacios
4. Contactar administrador si el espacio no aparece

### No puedo asignar items de inventario

**Soluciones**:
1. Verificar permisos (solo MANTENIMIENTO/ADMIN)
2. Verificar que haya items disponibles sin asignar
3. Crear nuevo item si es necesario
4. Verificar que el espacio exista
5. Revisar mensajes de error

## Problemas Técnicos

### El sitio carga lentamente

**Soluciones**:
1. Verificar conexión a internet
2. Cerrar otras pestañas y aplicaciones
3. Limpiar caché del navegador
4. Actualizar el navegador
5. Probar en otro navegador
6. Contactar administrador del sistema

### Los cambios no se guardan

**Soluciones**:
1. Verificar conexión a internet
2. Recargar la página
3. Intentar nuevamente
4. Verificar que no haya mensajes de error
5. Cerrar sesión y volver a iniciar
6. Contactar administrador

### Error al exportar reportes

**Soluciones**:
1. Verificar que haya datos para exportar
2. Aplicar filtros más específicos
3. Probar exportar a otro formato
4. Verificar permisos de descarga del navegador
5. Contactar administrador

## Errores Comunes

### Error 401: No autorizado

**Solución**: Su sesión expiró. Cerrar sesión y volver a iniciar.

### Error 403: Prohibido

**Solución**: No tiene permisos para esa acción. Verificar su rol y permisos.

### Error 404: No encontrado

**Solución**: El recurso no existe o fue eliminado. Verificar la URL o contactar administrador.

### Error 500: Error del servidor

**Solución**: Error interno del sistema. Contactar administrador inmediatamente.

## Contacto con Soporte

Si no puede resolver el problema:

1. **Contactar al administrador del sistema**
   - Email: [proporcionar email de soporte]
   - Teléfono: [proporcionar teléfono si aplica]

2. **Proporcionar información**:
   - Descripción del problema
   - Pasos para reproducir
   - Mensajes de error (si hay)
   - Navegador y versión
   - Su rol y usuario

3. **Incluir capturas de pantalla** si es posible

---

# 21. PREGUNTAS FRECUENTES (FAQ)

## Preguntas Generales

### ¿Qué es UTEC Space Manager?

UTEC Space Manager es un sistema de gestión de espacios y reservas para la Universidad Tecnológica del Uruguay (UTEC). Permite gestionar reservas de espacios físicos, inventario, y usuarios.

### ¿Cómo me registro en el sistema?

Puede registrarse desde la página de inicio de sesión haciendo clic en "Registrarse" o usar el login con Google OAuth. Ver sección [3.1](#31-registro-de-nuevos-usuarios).

### ¿Necesito verificar mi email?

Sí, debe verificar su email antes de poder iniciar sesión. Se envía un código de verificación al email registrado. Ver sección [3.4](#34-verificación-de-email).

### ¿Puedo cambiar mi contraseña?

Sí, puede restablecer su contraseña desde la página de inicio de sesión usando "¿Olvidaste tu contraseña?" o contactar a un administrador. Ver sección [3.5](#35-recuperación-de-contraseña).

### ¿Qué diferencia hay entre "Crear Reserva" y "Solicitar Reserva"?

- **Crear Reserva**: ADMIN y ANALISTA crean reservas directamente con estado APROBADO
- **Solicitar Reserva**: DOCENTE y EXTERNO crean solicitudes que requieren aprobación (estado PENDIENTE)

Ver secciones [7.2](#72-crear-nueva-reserva) y [7.4](#74-solicitar-reserva).

## Preguntas por Rol

### Para DOCENTE

**¿Puedo crear reservas directamente?**

No, debe solicitar reservas que serán aprobadas por un ANALISTA o ADMIN.

**¿Cómo sé si mi solicitud fue aprobada?**

Recibirá un email de notificación (si está habilitado) y puede ver el estado en "Mis Reservas".

**¿Puedo cancelar una reserva?**

Sí, puede cancelar sus propias reservas antes de que comience.

### Para ESTUDIANTE

**¿Puedo reservar espacios?**

No, solo puede ver las reservas disponibles y el calendario.

**¿Puedo ver todas las reservas?**

Sí, puede ver todas las reservas públicas del sistema en el calendario.

### Para ANALISTA

**¿Puedo crear reservas directamente?**

Sí, puede crear reservas directamente y se aprobarán automáticamente.

**¿Puedo gestionar espacios e inventario?**

No, solo puede verlos. La gestión está a cargo de MANTENIMIENTO o ADMIN.

### Para MANTENIMIENTO

**¿Puedo crear reservas?**

No, solo puede gestionar espacios e inventario.

**¿Puedo aprobar solicitudes de inventario?**

Sí, puede aprobar/rechazar/entregar solicitudes de inventario.

### Para ADMIN

**¿Tengo acceso completo al sistema?**

Sí, tiene acceso a todas las funcionalidades del sistema.

**¿Puedo cambiar roles de usuarios?**

Sí, puede cambiar el rol de cualquier usuario desde la gestión de usuarios.

## Preguntas Técnicas

### ¿Qué navegadores son compatibles?

El sistema es compatible con Google Chrome, Mozilla Firefox, Microsoft Edge, Safari y Opera. Se recomienda usar la versión más reciente.

### ¿Funciona en dispositivos móviles?

Sí, el sistema es responsive y funciona en tablets y smartphones, aunque la mejor experiencia es en computadoras de escritorio.

### ¿Se guardan mis preferencias?**

Sí, sus preferencias se guardan en su cuenta y se aplican automáticamente. Ver sección [15](#15-preferencias-de-usuario).

### ¿Los datos se respaldan?**

Sí, el sistema realiza respaldos automáticos de la base de datos. Consulte con el administrador sobre políticas de respaldo.

### ¿Cómo funcionan las notificaciones por email?**

Puede configurar qué notificaciones desea recibir en sus preferencias. Ver sección [15.1](#151-notificaciones-por-email).

---

# 22. GLOSARIO

## Términos Técnicos

**API**: Application Programming Interface - Interfaz de programación de aplicaciones.

**Autenticación**: Proceso de verificación de identidad del usuario.

**Autorización**: Proceso de verificación de permisos para realizar una acción.

**Base de Datos**: Sistema de almacenamiento de datos del sistema.

**CSV**: Comma-Separated Values - Formato de archivo de valores separados por comas.

**Dashboard**: Panel principal con resumen de información.

**JWT**: JSON Web Token - Token de autenticación utilizado en el sistema.

**OAuth**: Protocolo de autenticación y autorización usado para login social (Google).

**PDF**: Portable Document Format - Formato de documento portable.

**REST**: Representational State Transfer - Estilo de arquitectura de API.

**Responsive**: Diseño que se adapta a diferentes tamaños de pantalla.

**Soft Delete**: Eliminación lógica (marca como eliminado pero conserva los datos).

## Estados del Sistema

### Estados de Reserva

- **PENDIENTE**: Reserva solicitada, esperando aprobación
- **APROBADO**: Reserva aprobada y activa
- **CANCELADO**: Reserva cancelada

### Estados de Inventario

- **DISPONIBLE**: Item disponible para uso
- **MANTENIMIENTO**: Item en mantenimiento
- **DANADO**: Item dañado, no disponible

### Estados de Espacio

- **DISPONIBLE**: Espacio disponible para reservas
- **MANTENIMIENTO**: Espacio en mantenimiento, no disponible
- **OCUPADO**: Espacio ocupado (actualizado automáticamente)

### Estados de Solicitud de Inventario

- **PENDIENTE**: Solicitud esperando aprobación
- **APROBADO**: Solicitud aprobada, preparando entrega
- **ENTREGADO**: Item entregado y asignado
- **RECHAZADO**: Solicitud rechazada

## Roles del Sistema

- **ADMIN**: Administrador del sistema
- **ANALISTA**: Personal administrativo
- **MANTENIMIENTO**: Personal de mantenimiento
- **DOCENTE**: Profesores
- **ESTUDIANTE**: Estudiantes
- **EXTERNO**: Usuarios externos

## Abreviaciones

- **CRUD**: Create, Read, Update, Delete (Crear, Leer, Actualizar, Eliminar)
- **UI/UX**: User Interface/User Experience (Interfaz/Experiencia de Usuario)
- **HTTP**: Hypertext Transfer Protocol
- **HTTPS**: HTTP Secure (HTTP seguro)
- **URL**: Uniform Resource Locator (Localizador de recursos uniforme)

---

# 23. ANEXOS

## Anexo A: Estados del Sistema

### Estados de Reserva

| Estado | Descripción | Quién Puede Cambiar |
|--------|-------------|---------------------|
| PENDIENTE | Reserva solicitada, esperando aprobación | ADMIN, ANALISTA (al aprobar) |
| APROBADO | Reserva aprobada y activa | ADMIN, ANALISTA (al aprobar) |
| CANCELADO | Reserva cancelada | ADMIN, ANALISTA, DOCENTE (solo propias) |

### Estados de Inventario

| Estado | Descripción | Quién Puede Cambiar |
|--------|-------------|---------------------|
| DISPONIBLE | Item disponible para uso | ADMIN, MANTENIMIENTO |
| MANTENIMIENTO | Item en mantenimiento | ADMIN, MANTENIMIENTO |
| DANADO | Item dañado, no disponible | ADMIN, MANTENIMIENTO |

### Estados de Espacio

| Estado | Descripción | Quién Puede Cambiar |
|--------|-------------|---------------------|
| DISPONIBLE | Espacio disponible para reservas | ADMIN, MANTENIMIENTO |
| MANTENIMIENTO | Espacio en mantenimiento | ADMIN, MANTENIMIENTO |
| OCUPADO | Espacio ocupado | Automático (por reservas) |

### Estados de Solicitud de Inventario

| Estado | Descripción | Quién Puede Cambiar |
|--------|-------------|---------------------|
| PENDIENTE | Esperando aprobación | ADMIN, MANTENIMIENTO |
| APROBADO | Solicitud aprobada | ADMIN, MANTENIMIENTO |
| ENTREGADO | Item entregado | ADMIN, MANTENIMIENTO |
| RECHAZADO | Solicitud rechazada | ADMIN, MANTENIMIENTO |

## Anexo B: Mapa de Permisos Detallado

### Permisos por Rol - Tabla Completa

Consulte la sección [4.3](#43-tabla-comparativa-de-permisos) para la tabla completa de permisos.

## Anexo C: Referencia de Endpoints API

Esta sección es para desarrolladores que necesiten interactuar con la API directamente.

### Autenticación

- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/register` - Registrarse
- `POST /api/v1/auth/logout` - Cerrar sesión
- `POST /api/v1/auth/refresh` - Refrescar token
- `GET /api/v1/oauth2/google/authorize` - Iniciar OAuth Google

### Usuarios

- `GET /api/v1/usuarios` - Listar usuarios
- `GET /api/v1/usuarios/{id}` - Obtener usuario
- `PUT /api/v1/usuarios/{id}` - Actualizar usuario
- `PUT /api/v1/usuarios/{id}/rol` - Cambiar rol
- `PUT /api/v1/usuarios/{id}/toggle-activo` - Activar/desactivar

### Reservas

- `POST /api/v1/reservas` - Crear reserva
- `GET /api/v1/reservas` - Listar reservas
- `GET /api/v1/reservas/{id}` - Obtener reserva
- `PUT /api/v1/reservas/{id}` - Actualizar reserva
- `DELETE /api/v1/reservas/{id}` - Cancelar reserva
- `PATCH /api/v1/reservas/{id}/estado` - Cambiar estado

### Espacios

- `POST /api/v1/espacios` - Crear espacio
- `GET /api/v1/espacios` - Listar espacios
- `GET /api/v1/espacios/{id}` - Obtener espacio
- `PUT /api/v1/espacios/{id}` - Actualizar espacio
- `DELETE /api/v1/espacios/{id}` - Eliminar espacio

### Inventario

- `POST /api/v1/inventario` - Crear item
- `GET /api/v1/inventario` - Listar items
- `GET /api/v1/inventario/{id}` - Obtener item
- `PUT /api/v1/inventario/{id}` - Actualizar item
- `DELETE /api/v1/inventario/{id}` - Eliminar item
- `POST /api/v1/inventario/import` - Importar CSV

### Solicitudes de Inventario

- `GET /api/v1/reservas/items-solicitados` - Listar solicitudes
- `PATCH /api/v1/reservas/items-solicitados/{id}` - Actualizar solicitud

### Estadísticas

- `GET /api/v1/stats/inventario/detailed` - Estadísticas de inventario
- `GET /api/v1/stats/reservas` - Estadísticas de reservas
- `GET /api/v1/stats/espacios` - Estadísticas de espacios

### Recomendaciones

- `GET /api/v1/recomendaciones/dashboard` - Recomendaciones personalizadas según rol
- `GET /api/v1/recomendaciones/reservas/espacios` - Espacios recomendados al crear reserva
- `GET /api/v1/recomendaciones/reservas/horarios` - Horarios recomendados
- `GET /api/v1/recomendaciones/reservas/espacios-similares` - Espacios similares a uno dado
- `GET /api/v1/recomendaciones/items/para-reserva` - Items recomendados para una reserva
- `GET /api/v1/recomendaciones/items/combinaciones` - Combinaciones frecuentes de items
- `GET /api/v1/recomendaciones/inventario/mantenimiento` - Items que requieren mantenimiento
- `GET /api/v1/recomendaciones/inventario/espacios-atencion` - Espacios que requieren atención
- `GET /api/v1/recomendaciones/inventario/reasignaciones` - Reasignaciones recomendadas
- `GET /api/v1/recomendaciones/inventario/compras` - Compras necesarias
- `GET /api/v1/recomendaciones/analistas/asignacion` - Sugerencia de analista para un docente
- `GET /api/v1/recomendaciones/analistas/prioritarias` - Reservas prioritarias para analistas

### Carreras

- `GET /api/v1/carreras` - Listar carreras
- `POST /api/v1/carreras` - Crear carrera
- `PUT /api/v1/carreras/{id}` - Actualizar carrera
- `DELETE /api/v1/carreras/{id}` - Eliminar carrera

### Edificios

- `GET /api/v1/edificios` - Listar edificios
- `POST /api/v1/edificios` - Crear edificio
- `PUT /api/v1/edificios/{id}` - Actualizar edificio
- `DELETE /api/v1/edificios/{id}` - Eliminar edificio

### Auditoría

- `GET /api/v1/audit` - Listar registros de auditoría (solo ADMIN)
- `GET /api/v1/audit/{id}` - Detalle de un registro

> **Nota**: Para documentación completa de la API, consulte la documentación Swagger disponible en `/swagger-ui.html` (solo ADMIN).

## Anexo D: Formatos de Archivo

### Formato CSV para Importar Inventario

```csv
tipo_elemento,cantidad,estado,espacio,observaciones
Proyector,1,DISPONIBLE,Aula 101,Proyector Epson
Silla,20,DISPONIBLE,Aula 101,
Pizarra,1,DISPONIBLE,Aula 101,Pizarra blanca
```

**Columnas**:
- `tipo_elemento`: Nombre del tipo (debe existir)
- `cantidad`: Número de unidades
- `estado`: DISPONIBLE, MANTENIMIENTO, DANADO
- `espacio`: Nombre del espacio (opcional)
- `observaciones`: Notas adicionales (opcional)

## Anexo E: Límites del Sistema

### Límites de Reservas

- **Duración mínima**: 30 minutos
- **Recurrencia máxima**: 1000 reservas generadas
- **Rango de fechas**: No se pueden crear reservas en el pasado

### Límites de Capacidad

- **Capacidad mínima de espacio**: 1 persona
- **Capacidad máxima**: Sin límite técnico (recomendado: razonable)

### Límites de Caracteres

- **Nombre de espacio**: 100 caracteres
- **Nombre de usuario**: 100 caracteres
- **Email**: 255 caracteres
- **Observaciones**: Sin límite (texto largo)

---

# 24. MATERIAS, TUTORÍAS Y EVENTOS

El sistema incluye una **capa académica** con cuatro secciones del menú lateral: **Materias**, **Tutorías**, **Eventos** y **Sostenibilidad**. Lo que ve cada persona depende de su rol.

## 24.1 Materias

Las **Materias** son las asignaturas de las carreras. Cada una tiene su página de detalle (al hacer clic en una fila o en "Ver detalle") con cuatro bloques: **Información**, **Inscriptos**, **Recursos académicos** y **Tutorías** de esa materia.

- **Administrador / Analista:** ve la lista completa con indicadores arriba (total, inscriptos, créditos, etc.), puede **buscar y filtrar** (por carrera y semestre), **crear, editar y eliminar** materias, **inscribir o quitar estudiantes** a mano y **notificar** por email a los inscriptos.
- **Docente:** ve "Mis materias" (las que dicta). Entra al detalle para **subir recursos** (archivos o enlaces), ver inscriptos y crear **tutorías**.
- **Estudiante:** ve sus materias inscriptas y las disponibles. Se **inscribe o desinscribe**, y entra al detalle para **descargar los recursos**.

## 24.2 Tutorías

Las **Tutorías** son franjas horarias que un docente ofrece para una materia, con un **cupo** limitado. El estudiante reserva un lugar.

- **Administrador / Analista:** ve **todas** las tutorías con indicadores (abiertas, próximas, ocupación) y filtros (por fecha y estado). Cada tutoría tiene su detalle con la **lista de agendados**, un **medidor de ocupación** y la posibilidad de **abrir/cerrar/cancelar**.
- **Docente:** crea y gestiona **sus** franjas (horario, cupo y aula), y ve quién se agendó.
- **Estudiante:** explora las tutorías disponibles y **se agenda** en una (ocupa una plaza); puede cancelar.

## 24.3 Eventos

Los **Eventos** son eventos y cursos de **oferta abierta** (charlas, talleres, cursos), públicos o internos, con estados Borrador → Publicado → Finalizado/Cancelado.

- **Administrador / Analista:** **crea, publica, edita, cancela y elimina** eventos, ve los **inscriptos**, hace **check-in de asistencia**, **duplica** un evento y **notifica** por email. Dispone de **tres vistas** (grilla, **cartelera** de afiches y **calendario** mensual), un **mapa de calor de demanda** y un **modo cartelera a pantalla completa** (ideal para los TV del campus) que rota los eventos con un **QR** para anotarse.
- En el detalle de un evento puede: ver la **cuenta regresiva**, **agregarlo a su calendario** (.ics o Google Calendar), **generar un afiche** descargable con el QR, descargar **certificados de asistencia** (en cursos) y compartir el link.
- **Estudiante / Externo:** ve el catálogo de eventos publicados y **se inscribe**. Si el cupo está lleno, queda en **lista de espera**.

---

# 25. SOSTENIBILIDAD

El panel de **Sostenibilidad** (visible para Administrador y Analista) muestra el **impacto ambiental estimado** de la digitalización: cada archivo que se sube a una materia evita que los estudiantes impriman copias, y con eso se estiman **hojas, papel, CO₂ y agua ahorrados**, además de equivalencias (árboles salvados, km en auto, duchas, etc.).

Incluye: un tablero con los indicadores principales, un **índice de sostenibilidad** (0-100), un **"bosque" que crece** con los árboles salvados, **equivalencias** que rotan, una **gráfica de evolución con proyección**, una **meta anual** con logros, y un **ranking** de carreras y docentes que más digitalizan. Desde la barra superior se puede **exportar un PDF**, **compartir** el link o entrar en **modo presentación** (pantalla completa).

> Los números son **estimaciones** con factores de referencia, no mediciones reales. El botón **"Cómo funciona"** explica la metodología completa.

---

**FIN DEL MANUAL**

---

**Información del Manual**:
- **Versión**: 1.0.0
- **Fecha de Publicación**: Mayo 2026  
- **Para**: Universidad Tecnológica del Uruguay (UTEC)
- **Sistema**: UTEC Space Manager v1.0.0

**Nota Final**: Este manual está diseñado para ser una guía completa del sistema UTEC Space Manager. Si tiene preguntas o necesita ayuda adicional, contacte al administrador del sistema.

**Última Actualización**: Junio 2026 (capa académica y sostenibilidad)  

