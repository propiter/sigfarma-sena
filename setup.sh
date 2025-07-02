#!/bin/bash

# SIGFARMA-SENA - Script de Instalación Automática
# Este script configura todo el sistema automáticamente

echo "🏥 SIGFARMA-SENA - Sistema Integral de Gestión Farmacéutica"
echo "📋 Iniciando configuración automática..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Por favor instala Docker primero:"
    echo "  - Windows/Mac: https://www.docker.com/products/docker-desktop"
    echo "  - Linux: https://docs.docker.com/engine/install/"
    exit 1
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose no está instalado. Por favor instala Docker Compose primero:"
    echo "  - https://docs.docker.com/compose/install/"
    exit 1
fi

print_success "Docker y Docker Compose están instalados"

# Verificar si ya existe una instalación
if [ -f ".env" ] && [ -d "node_modules" ]; then
    print_warning "Instalación existente detectada"
    echo ""
    echo "¿Qué deseas hacer?"
    echo "1) Iniciar servicios existentes (recomendado)"
    echo "2) Reinstalar completamente (BORRARÁ TODOS LOS DATOS)"
    echo "3) Cancelar"
    echo ""
    read -p "Selecciona una opción (1-3): " choice
    
    case $choice in
        1)
            print_status "Iniciando servicios existentes..."
            docker-compose up -d
            ;;
        2)
            print_warning "⚠️  ADVERTENCIA: Esto borrará TODOS los datos existentes"
            read -p "¿Estás seguro? Escribe 'BORRAR' para confirmar: " confirm
            if [ "$confirm" = "BORRAR" ]; then
                print_status "Eliminando instalación anterior..."
                docker-compose down -v
                docker system prune -f
                rm -rf node_modules .env
            else
                print_status "Operación cancelada"
                exit 0
            fi
            ;;
        3)
            print_status "Operación cancelada"
            exit 0
            ;;
        *)
            print_error "Opción inválida"
            exit 1
            ;;
    esac
fi

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    print_status "Creando archivo de configuración..."
    cat > .env << EOF
# Base de datos
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sigfarma_sena"

# JWT Configuration
JWT_SECRET="$(openssl rand -base64 32)"
JWT_EXPIRES_IN="7d"

# Server Configuration
NODE_ENV="production"
PORT=3000

# Client Configuration
CLIENT_URL="http://localhost:3000"
EOF
    print_success "Archivo .env creado"
fi

# Instalar dependencias Node.js
if [ ! -d "node_modules" ]; then
    print_status "Instalando dependencias..."
    if command -v npm &> /dev/null; then
        npm install
    else
        print_error "npm no está instalado. Por favor instala Node.js primero:"
        echo "  - https://nodejs.org/"
        exit 1
    fi
    print_success "Dependencias instaladas"
fi

# Generar cliente Prisma
print_status "Configurando base de datos..."
npx prisma generate

# Construir la aplicación
print_status "Construyendo aplicación..."
npm run build

# Iniciar servicios con Docker
print_status "Iniciando servicios..."
docker-compose up -d

# Esperar a que la base de datos esté lista
print_status "Esperando a que la base de datos esté lista..."
sleep 10

# Ejecutar migraciones
print_status "Configurando esquema de base de datos..."
npx prisma db push

# Verificar si ya hay datos
USERS_COUNT=$(docker-compose exec -T database psql -U postgres -d sigfarma_sena -t -c "SELECT COUNT(*) FROM usuarios;" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$USERS_COUNT" = "0" ] || [ -z "$USERS_COUNT" ]; then
    print_status "Cargando datos iniciales..."
    npx prisma db seed
    print_success "Datos de ejemplo cargados"
else
    print_success "Base de datos ya contiene datos"
fi

# Verificar que los servicios estén funcionando
print_status "Verificando servicios..."
sleep 5

if curl -f http://localhost:3000/api/health &> /dev/null; then
    print_success "Servidor backend funcionando"
else
    print_warning "El servidor backend puede tardar unos segundos más en iniciar"
fi

if curl -f http://localhost:8080 &> /dev/null; then
    print_success "Adminer (gestor de BD) funcionando"
else
    print_warning "Adminer puede tardar unos segundos más en iniciar"
fi

echo ""
echo "🎉 ¡INSTALACIÓN COMPLETADA EXITOSAMENTE!"
echo ""
echo "📱 ACCESOS AL SISTEMA:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Aplicación Principal: http://localhost:3000"
echo "🗄️  Gestor de Base de Datos: http://localhost:8080"
echo ""
echo "👤 CREDENCIALES DE ACCESO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 Administrador:"
echo "   📧 Email: admin@farmacia.com"
echo "   🔒 Contraseña: admin123"
echo ""
echo "🔑 Cajero:"
echo "   📧 Email: cajero@farmacia.com"
echo "   🔒 Contraseña: cajero123"
echo ""
echo "🔑 Inventario:"
echo "   📧 Email: inventario@farmacia.com"
echo "   🔒 Contraseña: inventario123"
echo ""
echo "⚠️  IMPORTANTE: Cambia estas contraseñas después del primer acceso"
echo ""
echo "🛠️  COMANDOS ÚTILES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Reiniciar servicios: docker-compose restart"
echo "⏹️  Detener servicios: docker-compose down"
echo "📊 Ver logs: docker-compose logs -f"
echo "🗄️  Backup BD: docker-compose exec database pg_dump -U postgres sigfarma_sena > backup.sql"
echo ""
echo "📚 Para más información, consulta el README.md"
echo ""