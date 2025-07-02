import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../core/prisma/client.js';
import { AuthRequest, authenticateToken } from '../../core/middleware/auth.js';

export class AuthController {
  login = async (req: Request, res: Response) => {
    try {
      const { correo, contrasena } = req.body;

      if (!correo || !contrasena) {
        return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
      }

      const user = await prisma.usuario.findUnique({
        where: { correo: correo.toLowerCase() }
      });

      if (!user || !user.activo) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const isValidPassword = await bcrypt.compare(contrasena, user.contrasenaHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined');
      }
      
      const payload = { 
        usuarioId: user.usuarioId, 
        correo: user.correo, 
        rol: user.rol 
      };
      
      const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
      
      // Using type assertion to ensure proper types
      const token = jwt.sign(payload, jwtSecret, { expiresIn } as jwt.SignOptions);

      // Set secure cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Log login
      await prisma.historialCambio.create({
        data: {
          usuarioId: user.usuarioId,
          accion: 'Inicio de sesión',
          detalles: { correo: user.correo }
        }
      });

      res.json({
        user: {
          usuarioId: user.usuarioId,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  logout = async (_req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ message: 'Sesión cerrada exitosamente' });
  };

  me = async (req: AuthRequest, res: Response) => {
    authenticateToken(req, res, () => {
      res.json({ user: req.user });
    });
  };
}