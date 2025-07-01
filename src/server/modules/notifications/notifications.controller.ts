import { Response } from 'express';
import { prisma } from '../../core/prisma/client.js';
import { AuthRequest } from '../../core/middleware/auth.js';

export class NotificationController {
  getNotifications = async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, unread = false } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = { activo: true };
      if (unread === 'true') {
        where.fechaVisto = null;
      }

      const [notifications, total] = await Promise.all([
        prisma.notificacionReabastecimiento.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: [
            { fechaVisto: 'asc' }, // Unread first
            { fechaCreacion: 'desc' }
          ],
          include: {
            producto: {
              select: {
                nombre: true,
                presentacion: true,
                stockTotal: true,
                stockMinimo: true
              }
            }
          }
        }),
        prisma.notificacionReabastecimiento.count({ where })
      ]);

      res.json({
        notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ message: 'Error al obtener notificaciones' });
    }
  };

  getNotificationCount = async (req: AuthRequest, res: Response) => {
    try {
      const unreadCount = await prisma.notificacionReabastecimiento.count({
        where: {
          activo: true,
          fechaVisto: null
        }
      });

      res.json({ unreadCount });
    } catch (error) {
      console.error('Error getting notification count:', error);
      res.status(500).json({ message: 'Error al obtener contador de notificaciones' });
    }
  };

  markAsRead = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const notification = await prisma.notificacionReabastecimiento.update({
        where: { notificacionId: Number(id) },
        data: { fechaVisto: new Date() }
      });

      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Error al marcar notificación como leída' });
    }
  };

  markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
      await prisma.notificacionReabastecimiento.updateMany({
        where: {
          activo: true,
          fechaVisto: null
        },
        data: { fechaVisto: new Date() }
      });

      res.json({ message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Error al marcar todas las notificaciones como leídas' });
    }
  };

  dismissNotification = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.notificacionReabastecimiento.update({
        where: { notificacionId: Number(id) },
        data: { activo: false }
      });

      res.json({ message: 'Notificación descartada' });
    } catch (error) {
      console.error('Error dismissing notification:', error);
      res.status(500).json({ message: 'Error al descartar notificación' });
    }
  };

  createNotification = async (req: AuthRequest, res: Response) => {
    try {
      const { productoId, tipoNotificacion, mensaje, prioridad = 'Media' } = req.body;

      const notification = await prisma.notificacionReabastecimiento.create({
        data: {
          productoId: Number(productoId),
          tipoNotificacion,
          mensaje,
          prioridad
        },
        include: {
          producto: {
            select: {
              nombre: true,
              presentacion: true,
              stockTotal: true,
              stockMinimo: true
            }
          }
        }
      });

      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ message: 'Error al crear notificación' });
    }
  };
}