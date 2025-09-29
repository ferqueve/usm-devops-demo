# UTEC---PF---USM-UTEC-Space-Manager-
UTEC - Final grade project - A space manager app

## Scripts de Desarrollo (Frontend)

### `npm run dev`
Ejecuta el servidor de desarrollo en modo local únicamente.
- **Acceso**: Solo desde `localhost:5173`
- **Uso**: Desarrollo normal en tu máquina local

### `npm run dev:network`
Ejecuta el servidor de desarrollo accesible desde la red local.
- **Acceso**: Desde cualquier dispositivo en la red local en `[tu-ip]:5173`
- **Uso**: Para probar en dispositivos móviles, tablets, o compartir con otros desarrolladores en la misma red

**Nota**: Ambos scripts ejecutan automáticamente `setup-env.js` que detecta tu IP local y configura las variables de entorno necesarias para la comunicación con el backend.