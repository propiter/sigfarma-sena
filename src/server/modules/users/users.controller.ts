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

      res.json(users);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ message: 'Error al obtener usuarios' });
    }
  };

  createUser = async (req: AuthRequest, res: Response) => {
    try {
      const { nombre, correo, contrasena, rol } = req.body;

      if (!nombre || !correo || !contrasena || !rol) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
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
          nombre,
          correo: correo.toLowerCase(),
          contrasenaHash: hashedPassword,
          rol
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
          detalles: { usuarioCreado: user.usuarioId, rol: user.rol }
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

      const updateData: any = {};
      
      if (nombre) updateData.nombre = nombre;
      if (correo) updateData.correo = correo.toLowerCase();
      if (rol) updateData.rol = rol;
      if (typeof activo === 'boolean') updateData.activo = activo;
      if (contrasena) {
        updateData.contrasenaHash = await bcrypt.hash(contrasena, 12);
      }

      const user = await prisma.usuario.update({
        where: { usuarioId: Number(id) },
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
          detalles: { usuarioActualizado: user.usuarioId, cambios: updateData }
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

      if (Number(id) === req.user!.usuarioId) {
        return res.status(400).json({ message: 'No puedes desactivar tu propia cuenta' });
      }

      const user = await prisma.usuario.update({
        where: { usuarioId: Number(id) },
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