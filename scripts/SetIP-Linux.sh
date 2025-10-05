#!/bin/bash

# Script que detecta automáticamente la IP local y configura los .env
# Funciona nativamente en Linux sin dependencias externas
# SCRIPT NO TESTADO!! PUEDE NO ANDAR

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo -e "${CYAN}UTEC Space Manager - Deteccion automatica de IP (Linux)

Uso:
  ./auto-set-ip.sh                    # Detecta automáticamente la mejor IP
  ./auto-set-ip.sh ethernet           # Usa específicamente interfaz Ethernet
  ./auto-set-ip.sh wlan0              # Usa específicamente interfaz WiFi
  ./auto-set-ip.sh --help             # Muestra esta ayuda

Características:
  ✅ Detecta automáticamente la mejor IP disponible
  ✅ Prioriza Ethernet > WiFi por confiabilidad
  ✅ Descarta adaptadores virtuales (VMware, VirtualBox, WSL)
  ✅ Configura automáticamente frontend/.env y backend/.env
  ✅ Funciona nativamente en Linux (Bash)

Casos de uso:
  👨‍💻 Desarrollo local (laptop/escritorio)
  🖥️ Servidores de producción con Ethernet
  🌐 Cualquier interfaz de red

Ejemplos:
  ./auto-set-ip.sh                    # Detección inteligente universal
  ./auto-set-ip.sh eth0               # Forzar interfaz Ethernet (servidores)
  ./auto-set-ip.sh wlan0              # Forzar interfaz WiFi (laptops)
${NC}"
}

# Función para obtener la IP local
get_local_ip() {
    local preferred_interface="$1"
    
    # Prioridad de interfaces - ordenado por confiabilidad
    local interface_priority=("eth0" "en0" "Ethernet" "wlan0" "wifi0" "Wi-Fi")
    
    # Si se especifica una interfaz, usarla primero
    if [ -n "$preferred_interface" ]; then
        local ip=$(ip route get 8.8.8.8 2>/dev/null | grep -oP "src \K[0-9.]+" | head -1)
        if [ -n "$ip" ] && [ "$ip" != "127.0.0.1" ]; then
            # Verificar que la interfaz especificada esté activa
            if ip link show "$preferred_interface" >/dev/null 2>&1; then
                echo "$ip"
                return
            fi
        fi
    fi
    
    # Buscar en interfaces prioritarias
    for interface in "${interface_priority[@]}"; do
        # Verificar si la interfaz existe y está activa
        if ip link show "$interface" >/dev/null 2>&1; then
            # Ignorar adaptadores virtuales
            if [[ "$interface" =~ (vmnet|vboxnet|wsl|docker|br-) ]]; then
                continue
            fi
            
            # Obtener IP de la interfaz
            local ip=$(ip addr show "$interface" 2>/dev/null | grep -oP 'inet \K[0-9.]+' | head -1)
            if [ -n "$ip" ] && [ "$ip" != "127.0.0.1" ]; then
                echo "$ip"
                return
            fi
        fi
    done
    
    # Si no encontró en prioritarias, buscar en todas las interfaces activas
    while IFS= read -r interface; do
        # Ignorar adaptadores virtuales y loopback
        if [[ "$interface" =~ (lo|vmnet|vboxnet|wsl|docker|br-|tun|tap) ]]; then
            continue
        fi
        
        local ip=$(ip addr show "$interface" 2>/dev/null | grep -oP 'inet \K[0-9.]+' | head -1)
        if [ -n "$ip" ] && [ "$ip" != "127.0.0.1" ]; then
            echo "$ip"
            return
        fi
    done < <(ip link show | grep -oP '^[0-9]+: \K[^:]+' | grep -v '^lo$')
    
    echo "localhost" # fallback
}

# Función para actualizar archivos .env
update_env_files() {
    local ip="$1"
    local frontend_env_path="frontend/.env"
    local backend_env_path="backend/.env"
    
    local timestamp=$(date '+%d/%m/%Y %H:%M:%S')
    local auto_comment="# Configuración automática generada por el script auto-set-ip.sh - $timestamp
# Para configuración manual, borra este comentario y configura las IPs directamente

"
    
    echo -e "${YELLOW}Configurando IP: $ip${NC}"
    
    # Frontend
    if [ -f "$frontend_env_path" ]; then
        local frontend_content=$(cat "$frontend_env_path")
        
        # Si no tiene comentario automático, agregarlo al inicio
        if ! echo "$frontend_content" | grep -q "Configuración automática generada por el script"; then
            frontend_content="$auto_comment$frontend_content"
        fi
        
        # Actualizar o crear VITE_API_URL
        if echo "$frontend_content" | grep -q "VITE_API_URL[[:space:]]*="; then
            # Verificar si la URL actual es válida y completa
            local current_api_url=$(echo "$frontend_content" | grep "VITE_API_URL[[:space:]]*=" | sed 's/.*VITE_API_URL[[:space:]]*=[[:space:]]*//' | tr -d ' ')
            if echo "$current_api_url" | grep -q "^http://[0-9.]*:8080/api/v1$"; then
                # URL válida, solo actualizar IP
                frontend_content=$(echo "$frontend_content" | sed "s|VITE_API_URL[[:space:]]*=[[:space:]]*http://[0-9.]*:8080/api/v1|VITE_API_URL=http://$ip:8080/api/v1|g")
                echo -e "${GRAY}  - VITE_API_URL: IP actualizada${NC}"
            else
                # URL inválida, incompleta o mal formada, reemplazar completamente
                frontend_content=$(echo "$frontend_content" | sed "s|VITE_API_URL[[:space:]]*=.*|VITE_API_URL=http://$ip:8080/api/v1|g")
                echo -e "${YELLOW}  - VITE_API_URL: URL corregida (estaba mal formada)${NC}"
            fi
        else
            # Crear VITE_API_URL si no existe
            frontend_content="$frontend_content
VITE_API_URL=http://$ip:8080/api/v1"
            echo -e "${CYAN}  - VITE_API_URL: Creada (no existía)${NC}"
        fi
        
        # Actualizar o crear VITE_FRONTEND_URL
        if echo "$frontend_content" | grep -q "VITE_FRONTEND_URL[[:space:]]*="; then
            # Verificar si la URL actual es válida y completa
            local current_frontend_url=$(echo "$frontend_content" | grep "VITE_FRONTEND_URL[[:space:]]*=" | sed 's/.*VITE_FRONTEND_URL[[:space:]]*=[[:space:]]*//' | tr -d ' ')
            if echo "$current_frontend_url" | grep -q "^http://[0-9.]*:5173$"; then
                # URL válida, solo actualizar IP
                frontend_content=$(echo "$frontend_content" | sed "s|VITE_FRONTEND_URL[[:space:]]*=[[:space:]]*http://[0-9.]*:5173|VITE_FRONTEND_URL=http://$ip:5173|g")
                echo -e "${GRAY}  - VITE_FRONTEND_URL: IP actualizada${NC}"
            else
                # URL inválida, incompleta o mal formada, reemplazar completamente
                frontend_content=$(echo "$frontend_content" | sed "s|VITE_FRONTEND_URL[[:space:]]*=.*|VITE_FRONTEND_URL=http://$ip:5173|g")
                echo -e "${YELLOW}  - VITE_FRONTEND_URL: URL corregida (estaba mal formada)${NC}"
            fi
        else
            # Crear VITE_FRONTEND_URL si no existe
            frontend_content="$frontend_content
VITE_FRONTEND_URL=http://$ip:5173"
            echo -e "${CYAN}  - VITE_FRONTEND_URL: Creada (no existía)${NC}"
        fi
        
        # Actualizar comentario con nueva fecha/hora
        frontend_content=$(echo "$frontend_content" | sed "s|# Configuración automática generada por el script auto-set-ip\.sh - .*|# Configuración automática generada por el script auto-set-ip.sh - $timestamp|g")
        
        echo "$frontend_content" > "$frontend_env_path"
        echo -e "${GREEN}Frontend actualizado: http://$ip:5173${NC}"
    else
        # Crear archivo .env del frontend si no existe
        local frontend_content="$auto_comment
VITE_API_URL=http://$ip:8080/api/v1
VITE_FRONTEND_URL=http://$ip:5173"
        echo "$frontend_content" > "$frontend_env_path"
        echo -e "${GREEN}Frontend .env creado: http://$ip:5173${NC}"
    fi
    
    # Backend
    if [ -f "$backend_env_path" ]; then
        local backend_content=$(cat "$backend_env_path")
        
        # Si no tiene comentario automático, agregarlo antes de FRONTEND_URL
        if ! echo "$backend_content" | grep -q "Configuración automática generada por el script"; then
            local frontend_url_line=$(echo "$backend_content" | grep -n "FRONTEND_URL=" | head -1 | cut -d: -f1)
            if [ -n "$frontend_url_line" ]; then
                local before_frontend=$(echo "$backend_content" | head -n $((frontend_url_line - 1)))
                local frontend_and_after=$(echo "$backend_content" | tail -n +$frontend_url_line)
                backend_content="$before_frontend
# Configuración automática generada por el script auto-set-ip.sh
$frontend_and_after"
            fi
        fi
        
        # Actualizar o crear FRONTEND_URL
        if echo "$backend_content" | grep -q "FRONTEND_URL[[:space:]]*="; then
            # Verificar si la URL actual es válida y completa
            local current_backend_url=$(echo "$backend_content" | grep "FRONTEND_URL[[:space:]]*=" | sed 's/.*FRONTEND_URL[[:space:]]*=[[:space:]]*//' | tr -d ' ')
            if echo "$current_backend_url" | grep -q "^http://[0-9.]*:5173$"; then
                # URL válida, solo actualizar IP
                backend_content=$(echo "$backend_content" | sed "s|FRONTEND_URL[[:space:]]*=[[:space:]]*http://[0-9.]*:5173|FRONTEND_URL=http://$ip:5173|g")
                echo -e "${GRAY}  - FRONTEND_URL: IP actualizada${NC}"
            else
                # URL inválida, incompleta o mal formada, reemplazar completamente
                backend_content=$(echo "$backend_content" | sed "s|FRONTEND_URL[[:space:]]*=.*|FRONTEND_URL=http://$ip:5173|g")
                echo -e "${YELLOW}  - FRONTEND_URL: URL corregida (estaba mal formada)${NC}"
            fi
        else
            # Crear FRONTEND_URL si no existe
            backend_content="$backend_content
# Configuración automática generada por el script auto-set-ip.sh
FRONTEND_URL=http://$ip:5173"
            echo -e "${CYAN}  - FRONTEND_URL: Creada (no existía)${NC}"
        fi
        
        # Actualizar comentario con nueva fecha/hora
        backend_content=$(echo "$backend_content" | sed "s|# Configuración automática generada por el script auto-set-ip\.sh.*|# Configuración automática generada por el script auto-set-ip.sh - $timestamp|g")
        
        echo "$backend_content" > "$backend_env_path"
        echo -e "${GREEN}Backend CORS actualizado: http://$ip:5173${NC}"
    else
        # Crear archivo .env del backend si no existe
        local backend_content="# Configuración automática generada por el script auto-set-ip.sh - $timestamp
FRONTEND_URL=http://$ip:5173"
        echo "$backend_content" > "$backend_env_path"
        echo -e "${GREEN}Backend .env creado: http://$ip:5173${NC}"
    fi
    
    echo -e "\n${GREEN}Configuracion automatica completada!${NC}"
    echo -e "${CYAN}URLs configuradas:${NC}"
    echo -e "${WHITE}   Frontend: http://$ip:5173${NC}"
    echo -e "${WHITE}   Backend:  http://$ip:8080${NC}"
    echo -e "\n${YELLOW}Para acceder desde otros dispositivos en la red:${NC}"
    echo -e "${WHITE}   http://$ip:5173${NC}"
}

# Función principal
set_detected_ip() {
    local preferred_interface="$1"
    local detected_ip=$(get_local_ip "$preferred_interface")
    
    echo -e "${CYAN}IP detectada: $detected_ip${NC}"
    update_env_files "$detected_ip"
}

# Función principal
main() {
    # Verificar si se solicita ayuda
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_help
        exit 0
    fi
    
    # Verificar que estamos en el directorio correcto
    if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        echo -e "${RED}Error: Este script debe ejecutarse desde el directorio raiz del proyecto${NC}"
        echo -e "${YELLOW}Asegurate de estar en el directorio que contiene las carpetas 'frontend' y 'backend'${NC}"
        exit 1
    fi
    
    # Verificar que ip está disponible
    if ! command -v ip >/dev/null 2>&1; then
        echo -e "${RED}Error: El comando 'ip' no esta disponible${NC}"
        echo -e "${YELLOW}Este script requiere el comando 'ip' que viene con iproute2${NC}"
        exit 1
    fi
    
    set_detected_ip "$1"
}

# Ejecutar función principal
main "$@"
