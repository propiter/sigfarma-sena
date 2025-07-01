import { Response } from 'express';
import { prisma } from '../../core/prisma/client.js';
import { AuthRequest } from '../../core/middleware/auth.js';

export class SettingsController {
  getSettings = async (req: AuthRequest, res: Response) => {
    try {
      const settings = await prisma.configuracion.findMany();
      
      const configMap = settings.reduce((acc: any, setting) => {
        acc[setting.clave] = {
          valor: setting.valor,
          descripcion: setting.descripcion,
          tipoDato: setting.tipoDato
        };
        return acc;
      }, {});

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
}