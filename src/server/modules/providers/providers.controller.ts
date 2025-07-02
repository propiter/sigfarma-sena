import { Response } from 'express';
import { prisma } from '../../core/prisma/client.js';
import { AuthRequest } from '../../core/middleware/auth.js';

export class ProviderController {
  getProviders = async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 100, activo = 'true', search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (activo !== 'all') {
        where.activo = activo === 'true';
      }
      if (search) {
        where.OR = [
          { nombre: { contains: search as string, mode: 'insensitive' } },
          { nit: { contains: search as string, mode: 'insensitive' } },
          { contacto: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [providers, total] = await Promise.all([
        prisma.proveedor.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { nombre: 'asc' },
          include: {
            _count: {
              select: {
                ordenesCompra: true,
                actasRecepcion: true
              }
            }
          }
        }),
        prisma.proveedor.count({ where })
      ]);

      // Return providers array directly for simple requests
      if (req.query.simple === 'true') {
        return res.json(providers);
      }

      res.json({
        providers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting providers:', error);
      res.status(500).json({ message: 'Error al obtener proveedores' });
    }
  };

  getProvider = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const provider = await prisma.proveedor.findUnique({
        where: { proveedorId: Number(id) },
        include: {
          ordenesCompra: {
            orderBy: { fechaOrden: 'desc' },
            take: 10,
            include: {
              usuarioCreador: { select: { nombre: true } },
              _count: { select: { detalleOrdenCompra: true } }
            }
          },
          actasRecepcion: {
            orderBy: { fechaRecepcion: 'desc' },
            take: 10,
            include: {
              usuarioReceptor: { select: { nombre: true } },
              _count: { select: { detalleActaRecepcion: true } }
            }
          }
        }
      });

      if (!provider) {
        return res.status(404).json({ message: 'Proveedor no encontrado' });
      }

      res.json(provider);
    } catch (error) {
      console.error('Error getting provider:', error);
      res.status(500).json({ message: 'Error al obtener proveedor' });
    }
  };

  createProvider = async (req: AuthRequest, res: Response) => {
    try {
      const { nombre, nit, contacto, telefono, correo, direccion } = req.body;

      if (!nombre) {
        return res.status(400).json({ message: 'El nombre del proveedor es requerido' });
      }

      // Check if provider name already exists
      const existingProvider = await prisma.proveedor.findUnique({
        where: { nombre }
      });

      if (existingProvider) {
        return res.status(400).json({ message: 'Ya existe un proveedor con este nombre' });
      }

      // Check if NIT already exists (if provided)
      if (nit) {
        const existingNit = await prisma.proveedor.findUnique({
          where: { nit }
        });

        if (existingNit) {
          return res.status(400).json({ message: 'Ya existe un proveedor con este NIT' });
        }
      }

      const provider = await prisma.proveedor.create({
        data: {
          nombre: nombre.trim(),
          nit: nit?.trim() || null,
          contacto: contacto?.trim() || null,
          telefono: telefono?.trim() || null,
          correo: correo?.trim() || null,
          direccion: direccion?.trim() || null
        }
      });

      // Log creation
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Proveedor creado: ${provider.nombre}`,
          detalles: { proveedorId: provider.proveedorId, ...req.body }
        }
      });

      res.status(201).json(provider);
    } catch (error) {
      console.error('Error creating provider:', error);
      res.status(500).json({ message: 'Error al crear proveedor' });
    }
  };

  updateProvider = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const provider = await prisma.proveedor.update({
        where: { proveedorId: Number(id) },
        data: updateData
      });

      // Log update
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Proveedor actualizado: ${provider.nombre}`,
          detalles: { proveedorId: provider.proveedorId, cambios: updateData }
        }
      });

      res.json(provider);
    } catch (error) {
      console.error('Error updating provider:', error);
      res.status(500).json({ message: 'Error al actualizar proveedor' });
    }
  };

  deleteProvider = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const provider = await prisma.proveedor.update({
        where: { proveedorId: Number(id) },
        data: { activo: false }
      });

      // Log deletion
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Proveedor desactivado: ${provider.nombre}`,
          detalles: { proveedorId: provider.proveedorId }
        }
      });

      res.json({ message: 'Proveedor desactivado exitosamente' });
    } catch (error) {
      console.error('Error deleting provider:', error);
      res.status(500).json({ message: 'Error al desactivar proveedor' });
    }
  };

  getProviderStats = async (req: AuthRequest, res: Response) => {
    try {
      const [total, active, withOrders, withReceptions] = await Promise.all([
        prisma.proveedor.count(),
        prisma.proveedor.count({ where: { activo: true } }),
        prisma.proveedor.count({
          where: {
            activo: true,
            ordenesCompra: { some: {} }
          }
        }),
        prisma.proveedor.count({
          where: {
            activo: true,
            actasRecepcion: { some: {} }
          }
        })
      ]);

      res.json({
        total,
        active,
        withOrders,
        withReceptions
      });
    } catch (error) {
      console.error('Error getting provider stats:', error);
      res.status(500).json({ message: 'Error al obtener estadísticas de proveedores' });
    }
  };
}