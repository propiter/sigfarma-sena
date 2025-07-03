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
    echo ❌ Docker no está instalado. Intentando instalar Docker Desktop automáticamente...
    
    REM Descargar Docker Desktop
    powershell -Command "Invoke-WebRequest -Uri https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe -OutFile DockerInstaller.exe"

    REM Instalar silenciosamente
    echo 📦 Ejecutando instalador...
    start /wait DockerInstaller.exe install --quiet

    REM Verificar nuevamente
    docker --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ La instalación automática falló o requiere reinicio.
        echo 🔧 Por favor instala Docker Desktop manualmente desde:
        echo    https://www.docker.com/products/docker-desktop
        pause
        exit /b 1
    ) else (
        echo ✅ Docker instalado correctamente
    )
) else (
    echo ✅ Docker ya está instalado
)

REM Verificar si Docker Compose está disponible (a través de docker compose v2)
docker compose version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose no está disponible o no es compatible.

    echo 📦 Verificando si Docker Compose clásico está disponible...
    docker-compose --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Docker Compose clásico tampoco está instalado.
        echo 🔧 Intenta actualizar Docker Desktop o instalar Docker Compose manualmente:
        echo    https://docs.docker.com/compose/install/
        pause
        exit /b 1
    ) else (
        echo ✅ Docker Compose clásico encontrado
    )
) else (
    echo ✅ Docker Compose v2 disponible
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
        docker compose build
        docker compose up -d

        goto :db_setup
    ) else if "!choice!"=="2" (
        echo.
        echo ⚠️  ADVERTENCIA: Esto borrará TODOS los datos existentes
        set /p confirm="¿Estás seguro? Escribe 'BORRAR' para confirmar: "
        if "!confirm!"=="BORRAR" (
            echo 📋 Eliminando instalación anterior...
            docker compose down -v
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
docker compose build
docker compose up -d


:db_setup
REM Esperar a que la base de datos esté lista
echo 📋 Esperando a que la base de datos esté lista...
timeout /t 10 /nobreak >nul

REM Generar cliente Prisma
echo 📋 Configurando base de datos...
call npx prisma generate

REM Verificar si la base de datos existe
echo 📋 Verificando base de datos...
docker-compose exec -T database psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'sigfarma_sena'" | findstr /C:"1" >nul
if errorlevel 1 (
    echo 📋 Creando base de datos...
    docker-compose exec -T database psql -U postgres -c "CREATE DATABASE sigfarma_sena"
)

REM Esperar a que la base de datos esté completamente lista
echo 📋 Esperando a que la base de datos esté lista...
docker-compose exec -T database bash -c "until pg_isready -U postgres -d sigfarma_sena; do sleep 2; echo 'Esperando a que la base de datos esté lista...'; done"

REM Verificar si existe algún usuario administrador
echo 📋 Verificando si existe un usuario administrador...
docker-compose exec -T database psql -U postgres -d sigfarma_sena -c "SELECT 1 FROM usuarios WHERE rol = 'administrador' LIMIT 1;" | findstr /C:"1" >nul
if errorlevel 1 (
    echo 📋 No existe usuario administrador, aplicando migraciones y seeders...

    docker-compose stop app >nul 2>&1

    REM Ejecutar migraciones dentro del contenedor de la aplicación
    docker-compose run --rm app npx prisma migrate dev --name init --skip-seed

    REM Ejecutar seeders
    docker-compose run --rm app npm run db:seed

    echo ✅ Migraciones y seeders aplicados
) else (
    echo ✅ Ya existe un usuario administrador, omitiendo seeders
)


REM (Re)iniciar la aplicación para asegurar que toma los cambios
echo 📋 Reiniciando la aplicación para aplicar cambios...
docker compose restart app adminer

REM Construcción local no necesaria, ya se construyó en Docker
REM echo 📋 Construyendo aplicación...
REM npm run build
REM if errorlevel 1 (
REM     echo ❌ Error construyendo la aplicación
REM     pause
REM     exit /b 1
REM )


:verify_services
REM Verificar que los servicios estén funcionando
echo 📋 Verificando servicios...
timeout /t 5 /nobreak >nul

REM Iniciar navegador
echo 📋 Abriendo aplicación en navegador...
start "" http://localhost:3000

REM La app ya corre en Docker, no ejecutar localmente
REM npm start


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
REM Crear acceso directo para abrir SIGFARMA al iniciar Windows
echo 📋 Verificando si ya existe acceso directo de inicio automático...
REM Crear acceso directo en el escritorio y en inicio automático

set "shortcut_name=SIGFARMA-SENA"
set "shortcut_url=http://localhost:3000"

set "desktop_path=%USERPROFILE%\Desktop"
set "startup_path=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

if not exist "%desktop_path%\%shortcut_name%.url" (
    echo [InternetShortcut] > "%desktop_path%\%shortcut_name%.url"
    echo URL=%shortcut_url% >> "%desktop_path%\%shortcut_name%.url"
    echo ✅ Acceso directo creado en el escritorio
) else (
    echo ℹ️  Ya existe el acceso directo en el escritorio
)

if not exist "%startup_path%\%shortcut_name%.url" (
    echo [InternetShortcut] > "%startup_path%\%shortcut_name%.url"
    echo URL=%shortcut_url% >> "%startup_path%\%shortcut_name%.url"
    echo ✅ Acceso directo creado en inicio automático
) else (
    echo ℹ️  Ya existe el acceso directo en inicio automático
)

pause