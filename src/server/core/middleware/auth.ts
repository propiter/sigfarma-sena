import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client.js';

export interface AuthRequest extends Request {
  user?: {
    usuarioId: number;
    correo: string;
    rol: string;
    nombre: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token de acceso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.usuario.findUnique({
      where: { usuarioId: decoded.usuarioId },
      select: { usuarioId: true, correo: true, rol: true, nombre: true, activo: true }
    });

    if (!user || !user.activo) {
      return res.status(401).json({ message: 'Usuario no encontrado o inactivo' });
    }

    req.user = {
      usuarioId: user.usuarioId,
      correo: user.correo,
      rol: user.rol,
      nombre: user.nombre
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
    }
    next();
  };
};