/**
 * A dónde apunta el frontend.
 *
 * Estaba escrita cinco veces —en `client`, `spaces`, `recursos`, `system` y
 * `users`—, con el mismo valor por defecto repetido en cada una.
 *
 * Vive acá y no en `lib/api/client` a propósito: los tests mockean el cliente
 * entero, y una constante de configuración no tiene por qué desaparecer con
 * él.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
