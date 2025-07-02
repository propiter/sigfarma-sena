import { Response } from 'express';
import { prisma } from '../../core/prisma/client.js';
import { AuthRequest } from '../../core/middleware/auth.js';

interface SettingValue {
  valor: string;
  descripcion: string;
  tipoDato: string;
}

interface SettingsMap {
  [key: string]: SettingValue;
}

export class SettingsController {
  getSettings = async (_req: AuthRequest, res: Response) => {
    try {
      const settings = await prisma.configuracion.findMany();
      
      const configMap: SettingsMap = settings.reduce<SettingsMap>((acc: SettingsMap, setting) => {
        acc[setting.clave] = {
          valor: setting.valor,
          descripcion: setting.descripcion,
          tipoDato: setting.tipoDato
        };
        return acc;
      }, {});

      // Add default settings if they don't exist
      const defaultSettings: SettingsMap = {
        nombre_farmacia: { valor: 'Farmacia SENA', descripcion: 'Nombre de la farmacia', tipoDato: 'texto' },
        nit_farmacia: { valor: '', descripcion: 'NIT de la farmacia', tipoDato: 'texto' },
        direccion_farmacia: { valor: '', descripcion: 'Dirección de la farmacia', tipoDato: 'texto' },
        telefono_farmacia: { valor: '', descripcion: 'Teléfono de la farmacia', tipoDato: 'texto' },
        zona_horaria: { valor: 'America/Bogota', descripcion: 'Zona horaria del sistema', tipoDato: 'texto' },
        formato_fecha: { valor: 'DD/MM/YYYY', descripcion: 'Formato de fecha', tipoDato: 'texto' },
        auto_calcular_iva: { valor: 'true', descripcion: 'Calcular IVA automáticamente', tipoDato: 'booleano' },
        stock_minimo_default: { valor: '5', descripcion: 'Stock mínimo por defecto', tipoDato: 'numero' },
        stock_maximo_default: { valor: '1000', descripcion: 'Stock máximo por defecto', tipoDato: 'numero' },
        reorden_automatico: { valor: 'false', descripcion: 'Reorden automático habilitado', tipoDato: 'booleano' },
        fefo_habilitado: { valor: 'true', descripcion: 'FEFO habilitado', tipoDato: 'booleano' },
        requerir_numero_lote: { valor: 'true', descripcion: 'Requerir número de lote', tipoDato: 'booleano' },
        permitir_venta_vencidos: { valor: 'false', descripcion: 'Permitir venta de productos vencidos', tipoDato: 'booleano' },
        remover_auto_vencidos: { valor: 'true', descripcion: 'Remover automáticamente productos vencidos', tipoDato: 'booleano' },
        modo_compacto: { valor: 'false', descripcion: 'Modo compacto habilitado', tipoDato: 'booleano' },
        animaciones_habilitadas: { valor: 'true', descripcion: 'Animaciones habilitadas', tipoDato: 'booleano' },
        sidebar_comportamiento: { valor: 'auto', descripcion: 'Comportamiento del sidebar', tipoDato: 'texto' },
        densidad_tablas: { valor: 'normal', descripcion: 'Densidad de tablas', tipoDato: 'texto' },
        mostrar_tooltips: { valor: 'true', descripcion: 'Mostrar tooltips', tipoDato: 'booleano' },
        gestos_tactiles: { valor: 'true', descripcion: 'Gestos táctiles habilitados', tipoDato: 'booleano' },
        botones_grandes: { valor: 'false', descripcion: 'Botones grandes para móviles', tipoDato: 'booleano' },
        tiempo_sesion: { valor: '60', descripcion: 'Tiempo de sesión en minutos', tipoDato: 'numero' },
        intentos_maximos_login: { valor: '5', descripcion: 'Intentos máximos de login', tipoDato: 'numero' },
        contrasenas_seguras: { valor: 'true', descripcion: 'Requerir contraseñas seguras', tipoDato: 'booleano' },
        autenticacion_2fa: { valor: 'false', descripcion: 'Autenticación de dos factores', tipoDato: 'booleano' },
        registro_auditoria: { valor: 'true', descripcion: 'Registro de auditoría habilitado', tipoDato: 'booleano' },
        restriccion_ip: { valor: 'false', descripcion: 'Restricción por IP habilitada', tipoDato: 'booleano' },
        requerir_aprobacion: { valor: 'false', descripcion: 'Requerir aprobación para cambios críticos', tipoDato: 'booleano' },
        frecuencia_respaldos: { valor: 'daily', descripcion: 'Frecuencia de respaldos', tipoDato: 'texto' },
        retencion_datos: { valor: '365', descripcion: 'Retención de datos en días', tipoDato: 'numero' },
        encriptar_datos: { valor: 'true', descripcion: 'Encriptar datos sensibles', tipoDato: 'booleano' }
      };

      // Merge with defaults
      Object.keys(defaultSettings).forEach((key: string) => {
        if (!configMap[key]) {
          configMap[key] = defaultSettings[key];
        }
      });

      res.json(configMap);
    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(500).json({ message: 'Error al obtener configuración' });
    }
  };

  updateSettings = async (req: AuthRequest, res: Response) => {
    try {
      const settings = req.body;

      const updatePromises = Object.entries(settings).map(([clave, data]: [string, any]) => {
        return prisma.configuracion.upsert({
          where: { clave },
          update: { valor: data.valor },
          create: {
            clave,
            valor: data.valor,
            descripcion: data.descripcion || '',
            tipoDato: data.tipoDato || 'texto'
          }
        });
      });

      await Promise.all(updatePromises);

      // Log settings update
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: 'Configuración actualizada',
          detalles: { configuraciones: Object.keys(settings) }
        }
      });

      res.json({ message: 'Configuración actualizada exitosamente' });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ message: 'Error al actualizar configuración' });
    }
  };

  resetSettings = async (req: AuthRequest, res: Response) => {
    try {
      // Delete all current settings
      await prisma.configuracion.deleteMany({});

      // Log settings reset
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: 'Configuración restablecida a valores por defecto',
          detalles: { accion: 'reset_settings' }
        }
      });

      res.json({ message: 'Configuración restablecida exitosamente' });
    } catch (error) {
      console.error('Error resetting settings:', error);
      res.status(500).json({ message: 'Error al restablecer configuración' });
    }
  };

  exportSettings = async (_req: AuthRequest, res: Response) => {
    try {
      const settings = await prisma.configuracion.findMany();
      
      const exportData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        settings: settings.reduce((acc: any, setting) => {
          acc[setting.clave] = {
            valor: setting.valor,
            descripcion: setting.descripcion,
            tipoDato: setting.tipoDato
          };
          return acc;
        }, {})
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=sigfarma-settings.json');
      res.json(exportData);
    } catch (error) {
      console.error('Error exporting settings:', error);
      res.status(500).json({ message: 'Error al exportar configuración' });
    }
  };
}