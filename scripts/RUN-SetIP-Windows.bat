@echo off
echo UTEC Space Manager - Configuracion automatica de IP
echo.
echo Ejecutando script de configuracion...
echo.

REM Cambiar al directorio del proyecto (un nivel arriba del script)
cd /d "%~dp0.."

REM Ejecutar el script PowerShell
powershell -ExecutionPolicy Bypass -File "scripts\auto-set-ip.ps1"

echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
