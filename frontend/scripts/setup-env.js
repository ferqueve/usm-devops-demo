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

// Leer GOOGLE_CLIENT_ID del .env raíz o del entorno (Docker)
let googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || '';
if (!googleClientId) {
  const rootEnvPath = path.join(__dirname, '..', '..', '.env');
  if (fs.existsSync(rootEnvPath)) {
    const rootEnvContent = fs.readFileSync(rootEnvPath, 'utf-8');
    const match = rootEnvContent.match(/GOOGLE_CLIENT_ID=(.+)/);
    if (match) {
      googleClientId = match[1].trim();
    }
  }
}

// Determinar host a usar
// En Docker: usar 'backend' (nombre del servicio en docker-compose)
// En Local: usar IP detectada
let host;
const inDocker = fs.existsSync('/.dockerenv');

if (inDocker) {
  // En Docker, siempre usar el nombre del servicio backend
  host = 'backend';
  console.log(`🐳 Docker detectado - usando host: ${host}`);
} else {
  // En local, usar IP detectada
  host = getLocalIP();
  console.log(`🌐 IP detectada: ${host}`);
}

// Generar contenido del .env
let envContent = `# Configuración automática para desarrollo
# Host: ${host} - ${new Date().toLocaleString()}

VITE_API_URL=http://${host}:8080/api/v1
VITE_FRONTEND_URL=http://${host}:5173
`;

// Agregar Google Client ID si existe
if (googleClientId) {
  envContent += `\n# Google OAuth (copiado desde .env raíz)\n`;
  envContent += `VITE_GOOGLE_CLIENT_ID=${googleClientId}\n`;
}

// Escribir archivo .env
const envPath = path.join(__dirname, '..', '.env');
fs.writeFileSync(envPath, envContent);

console.log(`📝 Frontend: http://${host}:5173`);
console.log(`🔗 API: http://${host}:8080/api/v1`);
if (googleClientId) {
  console.log(`🔐 Google OAuth configurado`);
}
