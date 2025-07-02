# 🏥 SIGFARMA-SENA

**Sistema Integral de Gestión Farmacéutica para el SENA**

Un sistema completo de punto de venta y gestión de inventario farmacéutico desarrollado con tecnologías modernas, diseñado específicamente para farmacias del SENA.

![SIGFARMA-SENA](https://img.shields.io/badge/SIGFARMA-SENA-orange?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

---

## 🚀 **Instalación Rápida (Un Solo Comando)**

### **Windows:**
```bash
git clone https://github.com/tu-usuario/sigfarma-sena.git
cd sigfarma-sena
cmd /c setup.bat
```

### **Linux/Mac:**
```bash
git clone https://github.com/tu-usuario/sigfarma-sena.git
cd sigfarma-sena
chmod +x setup.sh
./setup.sh
```

**¡Y listo!** El sistema se configura automáticamente y estará disponible en: **http://localhost:3000**

---

## 📋 **Requisitos del Sistema**

### **Mínimos:**
- **RAM:** 4GB
- **Almacenamiento:** 2GB libres
- **Sistema Operativo:** Windows 10+, macOS 10.14+, Ubuntu 18.04+

### **Software Necesario:**
- **Docker Desktop** ([Descargar aquí](https://www.docker.com/products/docker-desktop))
- **Node.js 18+** ([Descargar aquí](https://nodejs.org/))
- **Git** ([Descargar aquí](https://git-scm.com/))

---

## 🎯 **Características Principales**

### 💊 **Gestión de Inventario**
- ✅ Control de lotes con fechas de vencimiento
- ✅ Alertas automáticas de stock bajo
- ✅ Sistema FEFO (First Expired, First Out)
- ✅ Gestión de productos controlados
- ✅ Control de cadena de frío

### 🛒 **Punto de Venta (POS)**
- ✅ Interfaz intuitiva para cajeros
- ✅ Búsqueda rápida de productos
- ✅ Múltiples métodos de pago
- ✅ Cálculo automático de IVA
- ✅ Impresión de facturas

### 📦 **Recepción de Mercancía**
- ✅ Actas de recepción digitales
- ✅ Flujo de aprobación administrativa
- ✅ Trazabilidad completa de lotes
- ✅ Integración con órdenes de compra

### 📊 **Reportes y Analytics**
- ✅ Dashboard ejecutivo en tiempo real
- ✅ Reportes de ventas detallados
- ✅ Análisis de vencimientos
- ✅ Métricas de rendimiento
- ✅ Exportación a Excel/PDF

### 👥 **Gestión de Usuarios**
- ✅ Roles diferenciados (Admin, Cajero, Inventario)
- ✅ Permisos granulares
- ✅ Auditoría de acciones
- ✅ Autenticación segura

### ⚙️ **Configuración Avanzada**
- ✅ Personalización completa
- ✅ Temas claro/oscuro
- ✅ Configuración de alertas
- ✅ Backup automático

---

## 🔐 **Credenciales por Defecto**

| Rol | Email | Contraseña | Permisos |
|-----|-------|------------|----------|
| **Administrador** | admin@farmacia.com | admin123 | Acceso completo |
| **Cajero** | cajero@farmacia.com | cajero123 | POS y consultas |
| **Inventario** | inventario@farmacia.com | inventario123 | Gestión de stock |

> ⚠️ **IMPORTANTE:** Cambia estas contraseñas inmediatamente después del primer acceso.

---

## 🛠️ **Comandos Útiles**

### **Gestión de Servicios:**
```bash
# Iniciar todos los servicios
docker-compose up -d

# Detener todos los servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Ver logs en tiempo real
docker-compose logs -f

# Ver estado de servicios
docker-compose ps
```

### **Base de Datos:**
```bash
# Backup de la base de datos
docker-compose exec database pg_dump -U postgres sigfarma_sena > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker-compose exec -T database psql -U postgres sigfarma_sena < backup.sql

# Acceder a la consola de PostgreSQL
docker-compose exec database psql -U postgres sigfarma_sena

# Ver tablas
docker-compose exec database psql -U postgres sigfarma_sena -c "\dt"
```

### **Desarrollo:**
```bash
# Modo desarrollo (con hot reload)
npm run dev

# Construir para producción
npm run build

# Ejecutar migraciones
npx prisma db push

# Generar cliente Prisma
npx prisma generate

# Abrir Prisma Studio
npx prisma studio
```

---

## 🌐 **Accesos del Sistema**

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Aplicación Principal** | http://localhost:3000 | Sistema completo SIGFARMA |
| **Gestor de BD (Adminer)** | http://localhost:8080 | Administración de base de datos |
| **API Health Check** | http://localhost:3000/api/health | Estado del servidor |

### **Credenciales para Adminer:**
- **Servidor:** database
- **Usuario:** postgres
- **Contraseña:** postgres
- **Base de datos:** sigfarma_sena

---

## 🎨 **Personalización**

### **Cambiar Logo:**
1. Coloca tu logo en: `public/logos/logo.png`
2. Ve a **Configuración → General**
3. El logo se actualizará automáticamente

### **Configurar Farmacia:**
1. Accede como **Administrador**
2. Ve a **Configuración → General**
3. Actualiza:
   - Nombre de la farmacia
   - NIT
   - Dirección
   - Teléfono

### **Temas y Apariencia:**
1. Ve a **Configuración → Apariencia**
2. Personaliza:
   - Tema (Claro/Oscuro)
   - Modo compacto
   - Comportamiento del sidebar

---

## 🔧 **Solución de Problemas**

### **El sistema no inicia:**
```bash
# Verificar Docker
docker --version
docker-compose --version

# Verificar puertos ocupados
netstat -tulpn | grep :3000
netstat -tulpn | grep :5432

# Limpiar y reiniciar
docker-compose down -v
docker system prune -f
./setup.sh  # o setup.bat en Windows
```

### **Error de base de datos:**
```bash
# Verificar estado de la BD
docker-compose exec database pg_isready -U postgres

# Reiniciar solo la base de datos
docker-compose restart database

# Ver logs de la base de datos
docker-compose logs database
```

### **Error de permisos (Linux/Mac):**
```bash
# Dar permisos al script
chmod +x setup.sh

# Ejecutar con sudo si es necesario
sudo ./setup.sh
```

### **Puerto ocupado:**
```bash
# Cambiar puerto en docker-compose.yml
# Buscar: "3000:3000" y cambiar por "3001:3000"
# Luego reiniciar: docker-compose up -d
```

---

## 📁 **Estructura del Proyecto**

```
sigfarma-sena/
├── 📁 src/
│   ├── 📁 components/          # Componentes React reutilizables
│   ├── 📁 pages/              # Páginas principales
│   ├── 📁 server/             # Backend Node.js/Express
│   ├── 📁 store/              # Estado global (Zustand)
│   └── 📁 lib/                # Utilidades y helpers
├── 📁 prisma/                 # Esquema y migraciones de BD
├── 📁 public/                 # Archivos estáticos
│   └── 📁 logos/              # Logos personalizables
├── 📁 docker/                 # Configuración Docker
├── 🐳 docker-compose.yml      # Orquestación de servicios
├── 🔧 setup.sh               # Script instalación Linux/Mac
├── 🔧 setup.bat              # Script instalación Windows
└── 📖 README.md              # Esta documentación
```

---

## 🔒 **Seguridad**

### **Características de Seguridad:**
- ✅ **Autenticación JWT** con tokens seguros
- ✅ **Encriptación de contraseñas** con bcrypt
- ✅ **Validación de roles** en cada endpoint
- ✅ **Auditoría completa** de acciones
- ✅ **Sesiones con timeout** automático
- ✅ **Validación de entrada** en formularios

### **Recomendaciones:**
1. **Cambia las contraseñas por defecto** inmediatamente
2. **Usa contraseñas seguras** (mínimo 8 caracteres)
3. **Habilita 2FA** para administradores
4. **Realiza backups regulares** de la base de datos
5. **Mantén el sistema actualizado**

---

## 📊 **Monitoreo y Mantenimiento**

### **Logs del Sistema:**
```bash
# Ver todos los logs
docker-compose logs

# Logs de un servicio específico
docker-compose logs app
docker-compose logs database

# Logs en tiempo real
docker-compose logs -f --tail=100
```

### **Métricas de Rendimiento:**
- **CPU y Memoria:** `docker stats`
- **Espacio en disco:** `df -h`
- **Estado de servicios:** `docker-compose ps`

### **Backup Automático:**
```bash
# Crear script de backup diario
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T database pg_dump -U postgres sigfarma_sena > "backups/backup_$DATE.sql"
```

---

## 🖥️ Crear aplicación de escritorio

Para compilar la aplicación de escritorio con Electron, usa uno de los siguientes comandos según tu sistema operativo:

### 🔵 Windows
```bash
npm run electron:build:win
```

### 🍎 macOS

```bash
npm run electron:build:mac
```

### 🐧 Linux

```bash
npm run electron:build:linux
```

---

## 🆘 **Soporte y Ayuda**

### **Documentación Adicional:**
- 📚 **Manual de Usuario:** [Ver documentación completa]
- 🎥 **Videos Tutoriales:** [Canal de YouTube]
- 💬 **Foro de Soporte:** [Comunidad SENA]

### **Contacto Técnico:**
- 📧 **Email:** soporte@sigfarma-sena.com
- 📱 **WhatsApp:** +57 300 123 4567
- 🌐 **Web:** https://sigfarma-sena.com

### **Reportar Problemas:**
1. Describe el problema detalladamente
2. Incluye los logs relevantes
3. Especifica tu sistema operativo
4. Adjunta capturas de pantalla si es necesario

---

## 📄 **Licencia**

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 🙏 **Agradecimientos**

Desarrollado con ❤️ para el **Servicio Nacional de Aprendizaje (SENA)** de Colombia.

**Tecnologías utilizadas:**
- ⚛️ React 18 + TypeScript
- 🎨 Tailwind CSS + Radix UI
- 🚀 Node.js + Express
- 🗄️ PostgreSQL + Prisma
- 🐳 Docker + Docker Compose
- 🔐 JWT + bcrypt

---

## 📈 **Roadmap**

### **Próximas Características:**
- [ ] 📱 App móvil nativa
- [ ] 🔔 Notificaciones push
- [ ] 📊 Dashboard avanzado con IA
- [ ] 🌐 API pública para integraciones
- [ ] 📋 Módulo de facturación electrónica
- [ ] 🏪 Soporte multi-farmacia

---

**¿Necesitas ayuda?** No dudes en contactarnos. ¡Estamos aquí para apoyarte! 🚀

---

*Última actualización: Julio 2025*