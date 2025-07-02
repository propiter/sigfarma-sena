@echo off
echo 🏥 SIGFARMA-SENA - Instalador de Aplicación de Escritorio
echo.
echo Iniciando instalación...

REM Verificar si Docker está instalado
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker no está instalado. Por favor instala Docker Desktop primero:
    echo    https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker está instalado

REM Iniciar servicios de Docker
echo 📋 Iniciando servicios de base de datos...
docker-compose up -d database adminer

echo 🎉 ¡Instalación completada!
echo.
echo La aplicación SIGFARMA-SENA se iniciará automáticamente.
echo.
echo Para cerrar la aplicación, utiliza el icono en la bandeja del sistema.
echo.
pause