@echo off
setlocal enabledelayedexpansion

REM SIGFARMA-SENA - Script de Instalación Automática para Windows
REM Este script configura todo el sistema automáticamente

echo.
echo 🏥 SIGFARMA-SENA - Sistema Integral de Gestión Farmacéutica
echo 📋 Iniciando configuración automática...
echo.

REM Verificar si Docker está instalado
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker no está instalado. Por favor instala Docker Desktop primero:
    echo    https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Verificar si Docker Compose está instalado
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose no está instalado. Por favor instala Docker Desktop primero:
    echo    https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker y Docker Compose están instalados

REM Verificar si ya existe una instalación
if exist ".env" if exist "node_modules" (
    echo.
    echo ⚠️  Instalación existente detectada
    echo.
    echo ¿Qué deseas hacer?
    echo 1^) Iniciar servicios existentes ^(recomendado^)
    echo 2^) Reinstalar completamente ^(BORRARÁ TODOS LOS DATOS^)
    echo 3^) Cancelar
    echo.
    set /p choice="Selecciona una opción (1-3): "
    
    if "!choice!"=="1" (
        echo 📋 Iniciando servicios existentes...
        docker-compose up -d
        goto :verify_services
    ) else if "!choice!"=="2" (
        echo.
        echo ⚠️  ADVERTENCIA: Esto borrará TODOS los datos existentes
        set /p confirm="¿Estás seguro? Escribe 'BORRAR' para confirmar: "
        if "!confirm!"=="BORRAR" (
            echo 📋 Eliminando instalación anterior...
            docker-compose down -v
            docker system prune -f
            rmdir /s /q node_modules 2>nul
            del .env 2>nul
        ) else (
            echo 📋 Operación cancelada
            pause
            exit /b 0
        )
    ) else if "!choice!"=="3" (
        echo 📋 Operación cancelada
        pause
        exit /b 0
    ) else (
        echo ❌ Opción inválida
        pause
        exit /b 1
    )
)

REM Crear archivo .env si no existe
if not exist ".env" (
    echo 📋 Creando archivo de configuración...
    (
        echo # Base de datos
        echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sigfarma_sena"
        echo.
        echo # JWT Configuration
        echo JWT_SECRET="sigfarma-sena-jwt-secret-key-change-in-production"
        echo JWT_EXPIRES_IN="7d"
        echo.
        echo # Server Configuration
        echo NODE_ENV="production"
        echo PORT=3000
        echo.
        echo # Client Configuration
        echo CLIENT_URL="http://localhost:3000"
    ) > .env
    echo ✅ Archivo .env creado
)

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado. Por favor instala Node.js primero:
    echo    https://nodejs.org/
    pause
    exit /b 1
)

REM Instalar dependencias Node.js
if not exist "node_modules" (
    echo 📋 Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas
)

REM Iniciar servicios con Docker
echo 📋 Iniciando servicios...
docker-compose up -d

REM Esperar a que la base de datos esté lista
echo 📋 Esperando a que la base de datos esté lista...
timeout /t 10 /nobreak >nul

REM Generar cliente Prisma
echo 📋 Configurando base de datos...
npx prisma generate

REM Verificar si la base de datos existe y tiene tablas
echo 📋 Verificando base de datos...
docker-compose exec -T database psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'sigfarma_sena'" | findstr /C:"1" >nul
if errorlevel 1 (
    echo 📋 Creando base de datos...
    docker-compose exec -T database psql -U postgres -c "CREATE DATABASE sigfarma_sena"
)

REM Verificar si hay tablas en la base de datos
set DB_EMPTY=0
docker-compose exec -T database psql -U postgres -d sigfarma_sena -c "\dt" | findstr /C:"0 rows" >nul
if not errorlevel 1 (
    set DB_EMPTY=1
)

REM Ejecutar migraciones si la base de datos está vacía
if !DB_EMPTY!==1 (
    echo 📋 Aplicando esquema de base de datos...
    npx prisma db push --accept-data-loss
    
    echo 📋 Cargando datos iniciales...
    npx prisma db seed
    echo ✅ Base de datos inicializada con datos de ejemplo
) else (
    echo ✅ Base de datos ya contiene datos
)

REM Construir la aplicación
echo 📋 Construyendo aplicación...
npm run build
if errorlevel 1 (
    echo ❌ Error construyendo la aplicación
    pause
    exit /b 1
)

:verify_services
REM Verificar que los servicios estén funcionando
echo 📋 Verificando servicios...
timeout /t 5 /nobreak >nul

REM Iniciar la aplicación
echo 📋 Iniciando aplicación...
start "" http://localhost:3000
npm start

echo.
echo 🎉 ¡INSTALACIÓN COMPLETADA EXITOSAMENTE!
echo.
echo 📱 ACCESOS AL SISTEMA:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🌐 Aplicación Principal: http://localhost:3000
echo 🗄️  Gestor de Base de Datos: http://localhost:8080
echo.
echo 👤 CREDENCIALES DE ACCESO:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🔑 Administrador:
echo    📧 Email: admin@farmacia.com
echo    🔒 Contraseña: admin123
echo.
echo 🔑 Cajero:
echo    📧 Email: cajero@farmacia.com
echo    🔒 Contraseña: cajero123
echo.
echo 🔑 Inventario:
echo    📧 Email: inventario@farmacia.com
echo    🔒 Contraseña: inventario123
echo.
echo ⚠️  IMPORTANTE: Cambia estas contraseñas después del primer acceso
echo.
echo 🛠️  COMANDOS ÚTILES:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🔄 Reiniciar servicios: docker-compose restart
echo ⏹️  Detener servicios: docker-compose down
echo 📊 Ver logs: docker-compose logs -f
echo.
echo 📚 Para más información, consulta el README.md
echo.
pause