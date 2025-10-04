# Script que detecta automáticamente la IP local y configura los .env
# Funciona nativamente en Windows sin dependencias externas

param(
    [string]$Interface = $null
)

function Get-LocalIP {
    param([string]$PreferredInterface = $null)
    
    # Obtener todas las interfaces de red activas
    $networkAdapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
    
    # Prioridad de interfaces
    $interfacePriority = @("Ethernet", "eth0", "en0", "Wi-Fi", "WiFi", "Wireless")
    
    # Si se especifica una interfaz, usarla
    if ($PreferredInterface) {
        $targetAdapter = $networkAdapters | Where-Object { 
            $_.Name -like "*$PreferredInterface*" -or 
            $_.InterfaceDescription -like "*$PreferredInterface*" 
        } | Select-Object -First 1
        
        if ($targetAdapter) {
            $ipConfig = Get-NetIPAddress -InterfaceIndex $targetAdapter.InterfaceIndex -AddressFamily IPv4 | 
                       Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -ne "WellKnown" }
            if ($ipConfig) {
                return $ipConfig.IPAddress
            }
        }
    }
    
    # Buscar en interfaces prioritarias
    foreach ($priorityName in $interfacePriority) {
        $adapter = $networkAdapters | Where-Object { 
            $_.Name -like "*$priorityName*" -or 
            $_.InterfaceDescription -like "*$priorityName*" 
        } | Select-Object -First 1
        
        if ($adapter) {
            # Ignorar adaptadores virtuales
            if ($adapter.InterfaceDescription -match "(VMware|VirtualBox|Hyper-V|WSL|Loopback|Teredo|ISATAP)") {
                continue
            }
            
            $ipConfig = Get-NetIPAddress -InterfaceIndex $adapter.InterfaceIndex -AddressFamily IPv4 | 
                       Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -ne "WellKnown" }
            if ($ipConfig) {
                return $ipConfig.IPAddress
            }
        }
    }
    
    # Si no encontró en prioritarias, buscar en todas las interfaces
    foreach ($adapter in $networkAdapters) {
        # Ignorar adaptadores virtuales
        if ($adapter.InterfaceDescription -match "(VMware|VirtualBox|Hyper-V|WSL|Loopback|Teredo|ISATAP)") {
            continue
        }
        
        $ipConfig = Get-NetIPAddress -InterfaceIndex $adapter.InterfaceIndex -AddressFamily IPv4 | 
                   Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -ne "WellKnown" }
        if ($ipConfig) {
            return $ipConfig.IPAddress
        }
    }
    
    return "localhost"
}

function Update-EnvFiles {
    param([string]$ip)
    
    # Obtener el directorio del script y navegar a la raíz del proyecto
    $scriptPath = $MyInvocation.MyCommand.Path
    if (-not $scriptPath) {
        # Si no se puede obtener la ruta del script, usar el directorio actual
        $scriptPath = Join-Path (Get-Location) "scripts\auto-set-ip.ps1"
    }
    $scriptDir = Split-Path -Parent $scriptPath
    $projectRoot = Split-Path -Parent $scriptDir
    
    $frontendEnvPath = Join-Path $projectRoot "frontend\.env"
    $backendEnvPath = Join-Path $projectRoot "backend\.env"
    
    $timestamp = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
    $autoComment = "# Configuración automática generada por el script auto-set-ip.ps1 - $timestamp`n# Para configuración manual, borra este comentario y configura las IPs directamente`n`n"
    
    Write-Host "Configurando IP: $ip" -ForegroundColor Yellow
    Write-Host "Script path: $scriptPath" -ForegroundColor Gray
    Write-Host "Project root: $projectRoot" -ForegroundColor Gray
    Write-Host "Frontend .env path: $frontendEnvPath" -ForegroundColor Gray
    Write-Host "Backend .env path: $backendEnvPath" -ForegroundColor Gray
    
    # Frontend
    if (Test-Path $frontendEnvPath) {
        $frontendContent = Get-Content $frontendEnvPath -Raw
        
        # Si no tiene comentario automático, agregarlo al inicio
        if ($frontendContent -notmatch "Configuración automática generada por el script") {
            $frontendContent = $autoComment + $frontendContent
        }
        
        # Actualizar o crear VITE_API_URL
        if ($frontendContent -match "VITE_API_URL\s*=") {
            # Verificar si la URL actual es válida y completa
            $currentApiUrl = [regex]::Match($frontendContent, "VITE_API_URL\s*=\s*(.+)").Groups[1].Value.Trim()
            if ($currentApiUrl -match "^http://[0-9.]+:8080/api/v1$") {
                # URL válida, solo actualizar IP
                $frontendContent = $frontendContent -replace "VITE_API_URL\s*=\s*http://[0-9.]+:8080/api/v1", "VITE_API_URL=http://$ip`:8080/api/v1"
                Write-Host "  - VITE_API_URL: IP actualizada" -ForegroundColor Gray
            } else {
                # URL inválida, incompleta o mal formada, reemplazar completamente
                $frontendContent = $frontendContent -replace "VITE_API_URL\s*=.*", "VITE_API_URL=http://$ip`:8080/api/v1"
                Write-Host "  - VITE_API_URL: URL corregida (estaba mal formada)" -ForegroundColor Yellow
            }
        } else {
            # Crear VITE_API_URL si no existe
            $frontendContent += "`nVITE_API_URL=http://$ip`:8080/api/v1`n"
            Write-Host "  - VITE_API_URL: Creada (no existía)" -ForegroundColor Cyan
        }
        
        # Actualizar o crear VITE_FRONTEND_URL
        if ($frontendContent -match "VITE_FRONTEND_URL\s*=") {
            # Verificar si la URL actual es válida y completa
            $currentFrontendUrl = [regex]::Match($frontendContent, "VITE_FRONTEND_URL\s*=\s*(.+)").Groups[1].Value.Trim()
            if ($currentFrontendUrl -match "^http://[0-9.]+:5173$") {
                # URL válida, solo actualizar IP
                $frontendContent = $frontendContent -replace "VITE_FRONTEND_URL\s*=\s*http://[0-9.]+:5173", "VITE_FRONTEND_URL=http://$ip`:5173"
                Write-Host "  - VITE_FRONTEND_URL: IP actualizada" -ForegroundColor Gray
            } else {
                # URL inválida, incompleta o mal formada, reemplazar completamente
                $frontendContent = $frontendContent -replace "VITE_FRONTEND_URL\s*=.*", "VITE_FRONTEND_URL=http://$ip`:5173"
                Write-Host "  - VITE_FRONTEND_URL: URL corregida (estaba mal formada)" -ForegroundColor Yellow
            }
        } else {
            # Crear VITE_FRONTEND_URL si no existe
            $frontendContent += "`nVITE_FRONTEND_URL=http://$ip`:5173`n"
            Write-Host "  - VITE_FRONTEND_URL: Creada (no existía)" -ForegroundColor Cyan
        }
        
        # Actualizar comentario con nueva fecha/hora
        $frontendContent = $frontendContent -replace "# Configuración automática generada por el script auto-set-ip\.ps1 - .*", "# Configuración automática generada por el script auto-set-ip.ps1 - $timestamp"
        
        Set-Content $frontendEnvPath $frontendContent -NoNewline
        Write-Host "Frontend actualizado: http://$ip`:5173" -ForegroundColor Green
    } else {
        # Crear archivo .env del frontend si no existe
        $frontendContent = $autoComment + "VITE_API_URL=http://$ip`:8080/api/v1`nVITE_FRONTEND_URL=http://$ip`:5173`n"
        Set-Content $frontendEnvPath $frontendContent -NoNewline
        Write-Host "Frontend .env creado: http://$ip`:5173" -ForegroundColor Green
    }
    
    # Backend
    if (Test-Path $backendEnvPath) {
        $backendContent = Get-Content $backendEnvPath -Raw
        
        # Si no tiene comentario automático, agregarlo antes de FRONTEND_URL
        if ($backendContent -notmatch "Configuración automática generada por el script") {
            $frontendUrlIndex = $backendContent.IndexOf("FRONTEND_URL=")
            if ($frontendUrlIndex -ne -1) {
                $beforeFrontendUrl = $backendContent.Substring(0, $frontendUrlIndex)
                $frontendUrlAndAfter = $backendContent.Substring($frontendUrlIndex)
                $backendContent = $beforeFrontendUrl + "`n# Configuración automática generada por el script auto-set-ip.ps1`n" + $frontendUrlAndAfter
            }
        }
        
        # Actualizar o crear FRONTEND_URL
        if ($backendContent -match "FRONTEND_URL\s*=") {
            # Verificar si la URL actual es válida y completa
            $currentBackendUrl = [regex]::Match($backendContent, "FRONTEND_URL\s*=\s*(.+)").Groups[1].Value.Trim()
            if ($currentBackendUrl -match "^http://[0-9.]+:5173$") {
                # URL válida, solo actualizar IP
                $backendContent = $backendContent -replace "FRONTEND_URL\s*=\s*http://[0-9.]+:5173", "FRONTEND_URL=http://$ip`:5173"
                Write-Host "  - FRONTEND_URL: IP actualizada" -ForegroundColor Gray
            } else {
                # URL inválida, incompleta o mal formada, reemplazar completamente
                $backendContent = $backendContent -replace "FRONTEND_URL\s*=.*", "FRONTEND_URL=http://$ip`:5173"
                Write-Host "  - FRONTEND_URL: URL corregida (estaba mal formada)" -ForegroundColor Yellow
            }
        } else {
            # Crear FRONTEND_URL si no existe
            $backendContent += "`n# Configuración automática generada por el script auto-set-ip.ps1`nFRONTEND_URL=http://$ip`:5173`n"
            Write-Host "  - FRONTEND_URL: Creada (no existía)" -ForegroundColor Cyan
        }
        
        # Actualizar comentario con nueva fecha/hora
        $backendContent = $backendContent -replace "# Configuración automática generada por el script auto-set-ip\.ps1.*", "# Configuración automática generada por el script auto-set-ip.ps1 - $timestamp"
        
        Set-Content $backendEnvPath $backendContent -NoNewline
        Write-Host "Backend CORS actualizado: http://$ip`:5173" -ForegroundColor Green
    } else {
        # Crear archivo .env del backend si no existe
        $backendContent = "# Configuración automática generada por el script auto-set-ip.ps1 - $timestamp`nFRONTEND_URL=http://$ip`:5173`n"
        Set-Content $backendEnvPath $backendContent -NoNewline
        Write-Host "Backend .env creado: http://$ip`:5173" -ForegroundColor Green
    }
    
    Write-Host "`nConfiguracion automatica completada!" -ForegroundColor Green
    Write-Host "URLs configuradas:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://$ip`:5173" -ForegroundColor White
    Write-Host "   Backend:  http://$ip`:8080" -ForegroundColor White
    Write-Host "`nPara acceder desde otros dispositivos en la red:" -ForegroundColor Yellow
    Write-Host "   http://$ip`:5173" -ForegroundColor White
}

# Función principal
$detectedIP = Get-LocalIP -PreferredInterface $Interface
Write-Host "IP detectada: $detectedIP" -ForegroundColor Cyan
Update-EnvFiles -ip $detectedIP