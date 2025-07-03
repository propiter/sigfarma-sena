#!/bin/bash

# SIGFARMA-SENA - Script de Instalación Automática para macOS
# Este script configura todo el sistema automáticamente

echo
echo "🏥 SIGFARMA-SENA - Sistema Integral de Gestión Farmacéutica"
echo "📋 Iniciando configuración automática..."
echo

# Verificar si Docker está instalado
if ! command -v docker &>/dev/null; then
  echo "❌ Docker no está instalado. Por favor instala Docker Desktop desde:"
  echo "   https://www.docker.com/products/docker-desktop"
  exit 1
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &>/dev/null; then
  echo "❌ Docker Compose no está instalado. Por favor instala Docker Desktop desde:"
  echo "   https://www.docker.com/products/docker-desktop"
  exit 1
fi

echo "✅ Docker y Docker Compose están instalados"

# Verificar si ya existe una instalación
if [ -f ".env" ] && [ -d "node_modules" ]; then
  echo
  echo "⚠️  Instalación existente detectada"
  echo
  echo "¿Qué deseas hacer?"
  echo "1) Iniciar servicios existentes (recomendado)"
  echo "2) Reinstalar completamente (BORRARÁ TODOS LOS DATOS)"
  echo "3) Cancelar"
  echo
  read -p "Selecciona una opción (1-3): " choice

  if [ "$choice" = "1" ]; then
    echo "📋 Iniciando servicios existentes..."
    docker compose build
    docker compose up -d
  elif [ "$choice" = "2" ]; then
    echo
    echo "⚠️  ADVERTENCIA: Esto borrará TODOS los datos existentes"
    read -p "¿Estás seguro? Escribe 'BORRAR' para confirmar: " confirm
    if [ "$confirm" = "BORRAR" ]; then
      echo "📋 Eliminando instalación anterior..."
      docker compose down -v
      docker system prune -f
      rm -rf node_modules .env
    else
      echo "📋 Operación cancelada"
      exit 0
    fi
  else
    echo "📋 Operación cancelada"
    exit 0
  fi
fi

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
  echo "📋 Creando archivo de configuración..."
  cat <<EOF > .env
# Base de datos
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sigfarma_sena"

# JWT Configuration
JWT_SECRET="sigfarma-sena-jwt-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
NODE_ENV="production"
PORT=3000

# Client Configuration
CLIENT_URL="http://localhost:3000"
EOF
  echo "✅ Archivo .env creado"
fi

# Verificar si Node.js está instalado
if ! command -v node &>/dev/null; then
  echo "❌ Node.js no está instalado. Instálalo desde:"
  echo "   https://nodejs.org/"
  exit 1
fi

# Instalar dependencias Node.js
if [ ! -d "node_modules" ]; then
  echo "📋 Instalando dependencias..."
  npm install || { echo "❌ Error instalando dependencias"; exit 1; }
  echo "✅ Dependencias instaladas"
fi

# Iniciar servicios con Docker
echo "📋 Iniciando servicios..."
docker compose build
docker compose up -d

# Esperar a que la base de datos esté lista
echo "📋 Esperando a que la base de datos esté lista..."
sleep 10

# Generar cliente Prisma
echo "📋 Configurando base de datos..."
npx prisma generate

# Verificar si la base de datos existe
echo "📋 Verificando base de datos..."
if ! docker-compose exec -T database psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'sigfarma_sena'" | grep -q 1; then
  echo "📋 Creando base de datos..."
  docker-compose exec -T database psql -U postgres -c "CREATE DATABASE sigfarma_sena"
fi

# Esperar a que la base de datos esté completamente lista
docker-compose exec -T database bash -c 'until pg_isready -U postgres -d sigfarma_sena; do sleep 2; echo "Esperando a que la base de datos esté lista..."; done'

# Verificar si existe un usuario administrador
echo "📋 Verificando si existe un usuario administrador..."
if ! docker-compose exec -T database psql -U postgres -d sigfarma_sena -c "SELECT 1 FROM usuarios WHERE rol = 'administrador' LIMIT 1;" | grep -q 1; then
  echo "📋 No existe usuario administrador, aplicando migraciones y seeders..."
  docker-compose stop app
  docker-compose run --rm app npx prisma migrate dev --name init --skip-seed
  docker-compose run --rm app npm run db:seed
  echo "✅ Migraciones y seeders aplicados"
else
  echo "✅ Ya existe un usuario administrador, omitiendo seeders"
fi

# Reiniciar aplicación
echo "📋 Reiniciando la aplicación para aplicar cambios..."
docker compose restart app adminer

# Abrir navegador
echo "📋 Abriendo aplicación en navegador..."
open "http://localhost:3000"

# Crear acceso directo en el escritorio como archivo .webloc
DESKTOP_DIR=~/Desktop
APP_NAME="SIGFARMA-SENA"
WEBLOC_FILE="$DESKTOP_DIR/$APP_NAME.webloc"

if [ ! -f "$WEBLOC_FILE" ]; then
  cat <<EOF > "$WEBLOC_FILE"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>URL</key>
  <string>http://localhost:3000</string>
</dict>
</plist>
EOF
  echo "✅ Acceso directo creado en el escritorio"
else
  echo "ℹ️  Ya existe el acceso directo en el escritorio"
fi

echo
echo "🎉 ¡INSTALACIÓN COMPLETADA EXITOSAMENTE!"
echo
echo "📱 ACCESOS AL SISTEMA:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Aplicación Principal: http://localhost:3000"
echo "🗄️  Gestor de Base de Datos: http://localhost:8080"
echo
echo "👤 CREDENCIALES DE ACCESO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 Administrador:"
echo "   📧 Email: admin@farmacia.com"
echo "   🔒 Contraseña: admin123"
echo
echo "🔑 Cajero:"
echo "   📧 Email: cajero@farmacia.com"
echo "   🔒 Contraseña: cajero123"
echo
echo "🔑 Inventario:"
echo "   📧 Email: inventario@farmacia.com"
echo "   🔒 Contraseña: inventario123"
echo
echo "⚠️  IMPORTANTE: Cambia estas contraseñas después del primer acceso"
echo
echo "🛠️  COMANDOS ÚTILES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Reiniciar servicios: docker-compose restart"
echo "⏹️  Detener servicios: docker-compose down"
echo "📊 Ver logs: docker-compose logs -f"
echo
echo "📚 Para más información, consulta el README.md"
echo

exit 0
