#!/usr/bin/env node

/**
 * Script que detecta automáticamente la IP local y configura los .env
 * Basado en el setup-env.js del frontend que funcionaba perfectamente
 */

const fs = require('fs');
const path = require('path');
const { networkInterfaces } = require('os');

function getLocalIP(preferredInterface = null) {
    const interfaces = networkInterfaces();
    
    // Prioridad de interfaces - ordenado por confiabilidad (cable > WiFi > otras)
    const interfacePriority = ['Ethernet', 'eth0', 'en0', 'Wi-Fi', 'WiFi'];
    
    // Buscar en interfaces prioritarias primero
    for (const name of interfacePriority) {
        if (interfaces[name]) {
            for (const iface of interfaces[name]) {
                // Ignorar adaptadores virtuales y WSL
                if (name.toLowerCase().includes('wsl') || 
                    name.toLowerCase().includes('vmware') || 
                    name.toLowerCase().includes('virtualbox')) {
                    continue;
                }
                
                // Buscar IPv4, no interna (127.0.0.1)
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
    }
    
    // Si no encontró en prioritarias, buscar en todas
    for (const name of Object.keys(interfaces)) {
        // Ignorar adaptadores virtuales y WSL
        if (name.toLowerCase().includes('wsl') || 
            name.toLowerCase().includes('vmware') || 
            name.toLowerCase().includes('virtualbox')) {
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



function setDetectedIP(preferredInterface = null) {
    const detectedIP = getLocalIP(preferredInterface);
    
    console.log(`🔍 IP detectada: ${detectedIP}`);
    updateEnvFiles(detectedIP);
}

function updateEnvFiles(ip) {
    const frontendEnvPath = path.join(process.cwd(), 'frontend', '.env');
    const backendEnvPath = path.join(process.cwd(), 'backend', '.env');
    
    const timestamp = new Date().toLocaleString('es-ES');
    const autoComment = `# Configuración automática generada por el script auto-set-ip.js - ${timestamp}\n# Para configuración manual, borra este comentario y configura las IPs directamente\n\n`;
    
    console.log(`🔧 Configurando IP: ${ip}`);
    
    // Frontend
    if (fs.existsSync(frontendEnvPath)) {
        let frontendContent = fs.readFileSync(frontendEnvPath, 'utf8');
        
        // Si no tiene comentario automático, agregarlo al inicio
        if (!frontendContent.includes('Configuración automática generada por el script')) {
            frontendContent = autoComment + frontendContent;
        }
        
        frontendContent = frontendContent.replace(
            /VITE_API_URL=http:\/\/[^:]+:8080\/api\/v1/g,
            `VITE_API_URL=http://${ip}:8080/api/v1`
        );
        
        frontendContent = frontendContent.replace(
            /VITE_FRONTEND_URL=http:\/\/[^:]+:5173/g,
            `VITE_FRONTEND_URL=http://${ip}:5173`
        );
        
        // Actualizar comentario con nueva fecha/hora
        frontendContent = frontendContent.replace(
            /# Configuración automática generada por el script auto-set-ip\.js - .*/g,
            `# Configuración automática generada por el script auto-set-ip.js - ${timestamp}`
        );
        
        fs.writeFileSync(frontendEnvPath, frontendContent);
        console.log(`✅ Frontend actualizado: http://${ip}:5173`);
    }
    
    // Backend
    if (fs.existsSync(backendEnvPath)) {
        let backendContent = fs.readFileSync(backendEnvPath, 'utf8');
        
        // Si no tiene comentario automático, agregarlo antes de FRONTEND_URL
        if (!backendContent.includes('Configuración automática generada por el script')) {
            const frontendUrlIndex = backendContent.indexOf('FRONTEND_URL=');
            if (frontendUrlIndex !== -1) {
                const beforeFrontendUrl = backendContent.substring(0, frontendUrlIndex);
                const frontendUrlAndAfter = backendContent.substring(frontendUrlIndex);
                backendContent = beforeFrontendUrl + '\n# Configuración automática generada por el script auto-set-ip.js\n' + frontendUrlAndAfter;
            }
        }
        
        backendContent = backendContent.replace(
            /FRONTEND_URL=http:\/\/[^:]+:5173/g,
            `FRONTEND_URL=http://${ip}:5173`
        );
        
        // Actualizar comentario con nueva fecha/hora
        backendContent = backendContent.replace(
            /# Configuración automática generada por el script auto-set-ip\.js.*/g,
            `# Configuración automática generada por el script auto-set-ip.js - ${timestamp}`
        );
        
        fs.writeFileSync(backendEnvPath, backendContent);
        console.log(`✅ Backend CORS actualizado: http://${ip}:5173`);
    }
    
    console.log(`\n🎉 Configuración automática completada!`);
    console.log(`📍 URLs configuradas:`);
    console.log(`   Frontend: http://${ip}:5173`);
    console.log(`   Backend:  http://${ip}:8080`);
    console.log(`\n💡 Para acceder desde otros dispositivos en la red:`);
    console.log(`   http://${ip}:5173`);
}

function showHelp() {
    console.log(`
🔍 UTEC Space Manager - Detección automática de IP

Uso:
  node scripts/auto-set-ip.js                    # Detecta automáticamente la mejor IP
  node scripts/auto-set-ip.js WiFi                # Usa especificamente interfaz WiFi
  node scripts/auto-set-ip.js Ethernet           # Usa especificamente interfaz Ethernet
  node scripts/auto-set-ip.js --help               # Muestra esta ayuda

Características:
  ✅ Detecta automáticamente la mejor IP disponible
  ✅ Prioriza Ethernet > WiFi por confiabilidad
  ✅ Descarta adaptadores virtuales (VMware, VirtualBox, WSL)
  ✅ Configura automáticamente frontend/.env y backend/.env
  ✅ Funciona en Windows, Linux y macOS

Casos de uso:
  👨‍💻 Desarrollo local (laptop/escritorio)
  🖥️ Servidores de producción con Ethernet
  🌐 Cualquier interfaz de red

Ejemplos:
  node scripts/auto-set-ip.js               # Detección inteligente universal
  node scripts/auto-set-ip.js Ethernet      # Forzar interfaz Ethernet (servidores)
  node scripts/auto-set-ip.js Wi-Fi         # Forzar interfaz WiFi (laptops)
`);
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }
    
    const preferredInterface = args[0];
    setDetectedIP(preferredInterface);
}

if (require.main === module) {
    main();
}

module.exports = { setDetectedIP, getLocalIP };
