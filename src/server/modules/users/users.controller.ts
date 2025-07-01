import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../core/prisma/client.js';
import { AuthRequest } from '../../core/middleware/auth.js';

export class UserController {
  getUsers = async (req: AuthRequest, res: Response) => {
    try {
      const users = await prisma.usuario.findMany({
        select: {
          usuarioId: true,
          nombre: true,
          correo: true,
          rol: true,
          activo: true,
          fechaCreacion: true
        },
        orderBy: { nombre: 'asc' }
      });

      // Get additional stats for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const [ventasCount, lastActivity] = await Promise.all([
            prisma.venta.count({
              where: { usuarioId: user.usuarioId }
            }),
            prisma.historialCambio.findFirst({
              where: { usuarioId: user.usuarioId },
              orderBy: { fechaCambio: 'desc' }
            })
          ]);

          return {
            ...user,
            ventasCount,
            ultimoAcceso: lastActivity?.fechaCambio
          };
        })
      );

      res.json(usersWithStats);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ message: 'Error al obtener usuarios' });
    }
  };

  getUserStats = async (req: AuthRequest, res: Response) => {
    try {
      const [total, active, administrators, cashiers, inventory] = await Promise.all([
        prisma.usuario.count(),
        prisma.usuario.count({ where: { activo: true } }),
        prisma.usuario.count({ where: { rol: 'administrador' } }),
        prisma.usuario.count({ where: { rol: 'cajero' } }),
        prisma.usuario.count({ where: { rol: 'inventario' } })
      ]);

      res.json({
        total,
        active,
        administrators,
        cashiers,
        inventory
      });
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({ message: 'Error al obtener estadísticas de usuarios' });
    }
  };

  getUserActivity = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { limit = 50 } = req.query;

      const activities = await prisma.historialCambio.findMany({
        where: { usuarioId: Number(id) },
        orderBy: { fechaCambio: 'desc' },
        take: Number(limit)
      });

      res.json(activities);
    } catch (error) {
      console.error('Error getting user activity:', error);
      res.status(500).json({ message: 'Error al obtener actividad del usuario' });
    }
  };

  createUser = async (req: AuthRequest, res: Response) => {
    try {
      const { nombre, correo, contrasena, rol, activo = true } = req.body;

      if (!nombre || !correo || !contrasena || !rol) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        return res.status(400).json({ message: 'El formato del correo no es válido' });
      }

      // Validate password length
      if (contrasena.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
      }

      // Validate role
      if (!['administrador', 'cajero', 'inventario'].includes(rol)) {
        return res.status(400).json({ message: 'Rol no válido' });
      }

      const existingUser = await prisma.usuario.findUnique({
        where: { correo: correo.toLowerCase() }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'El correo ya está registrado' });
      }

      const hashedPassword = await bcrypt.hash(contrasena, 12);

      const user = await prisma.usuario.create({
        data: {
          nombre: nombre.trim(),
          correo: correo.toLowerCase().trim(),
          contrasenaHash: hashedPassword,
          rol,
          activo
        },
        select: {
          usuarioId: true,
          nombre: true,
          correo: true,
          rol: true,
          activo: true,
          fechaCreacion: true
        }
      });

      // Log user creation
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Usuario creado: ${user.nombre}`,
          detalles: { 
            usuarioCreado: user.usuarioId, 
            rol: user.rol,
            correo: user.correo 
          }
        }
      });

      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Error al crear usuario' });
    }
  };

  updateUser = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { nombre, correo, rol, activo, contrasena } = req.body;

      const userId = Number(id);
      
      // Check if user exists
      const existingUser = await prisma.usuario.findUnique({
        where: { usuarioId: userId }
      });

      if (!existingUser) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Prevent self-deactivation
      if (req.user!.usuarioId === userId && activo === false) {
        return res.status(400).json({ message: 'No puedes desactivar tu propia cuenta' });
      }

      const updateData: any = {};
      
      if (nombre) {
        updateData.nombre = nombre.trim();
      }
      
      if (correo) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
          return res.status(400).json({ message: 'El formato del correo no es válido' });
        }

        // Check if email is already taken by another user
        const emailExists = await prisma.usuario.findFirst({
          where: { 
            correo: correo.toLowerCase().trim(),
            usuarioId: { not: userId }
          }
        });

        if (emailExists) {
          return res.status(400).json({ message: 'El correo ya está en uso por otro usuario' });
        }

        updateData.correo = correo.toLowerCase().trim();
      }
      
      if (rol && ['administrador', 'cajero', 'inventario'].includes(rol)) {
        updateData.rol = rol;
      }
      
      if (typeof activo === 'boolean') {
        updateData.activo = activo;
      }
      
      if (contrasena) {
        if (contrasena.length < 6) {
          return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }
        updateData.contrasenaHash = await bcrypt.hash(contrasena, 12);
      }

      const user = await prisma.usuario.update({
        where: { usuarioId: userId },
        data: updateData,
        select: {
          usuarioId: true,
          nombre: true,
          correo: true,
          rol: true,
          activo: true,
          fechaCreacion: true
        }
      });

      // Log user update
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Usuario actualizado: ${user.nombre}`,
          detalles: { 
            usuarioActualizado: user.usuarioId, 
            cambios: Object.keys(updateData)
          }
        }
      });

      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Error al actualizar usuario' });
    }
  };

  deleteUser = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = Number(id);

      if (userId === req.user!.usuarioId) {
        return res.status(400).json({ message: 'No puedes desactivar tu propia cuenta' });
      }

      const user = await prisma.usuario.update({
        where: { usuarioId: userId },
        data: { activo: false },
        select: {
          usuarioId: true,
          nombre: true,
          correo: true,
          rol: true,
          activo: true
        }
      });

      // Log user deletion
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Usuario desactivado: ${user.nombre}`,
          detalles: { usuarioDesactivado: user.usuarioId }
        }
      });

      res.json({ message: 'Usuario desactivado exitosamente', user });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Error al desactivar usuario' });
    }
  };
}