import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para obtener la IP de la red local
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    // Ignorar adaptadores virtuales y WSL
    if (name.includes('WSL') || name.includes('VMware') || name.includes('VirtualBox')) {
      continue;
    }
    
    for (const iface of interfaces[name]) {
      // Buscar IPv4, no interna (127.0.0.1)
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost'; // fallback
}

// Generar contenido del .env
const localIP = getLocalIP();
const envContent = `# Configuración automática para desarrollo en red local
# IP detectada: ${localIP} - ${new Date().toLocaleString()}
VITE_API_URL=http://${localIP}:8080/api/v1
VITE_FRONTEND_URL=http://${localIP}:5173
`;

// Escribir archivo .env
const envPath = path.join(__dirname, '..', '.env');
fs.writeFileSync(envPath, envContent);

console.log(`🌐 IP detectada automáticamente: ${localIP}`);
console.log(`📝 Frontend: http://${localIP}:5173`);
console.log(`🔗 API: http://${localIP}:8080/api/v1`);
