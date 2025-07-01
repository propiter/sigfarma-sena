import { Response } from 'express';
import { prisma } from '../../core/prisma/client.js';
import { AuthRequest } from '../../core/middleware/auth.js';

export class ProductController {
  getProducts = async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, activo = 'true' } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const where = {
        activo: activo === 'true'
      };

      const [products, total] = await Promise.all([
        prisma.producto.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { nombre: 'asc' },
          include: {
            lotes: {
              where: { cantidadDisponible: { gt: 0 } },
              select: { cantidadDisponible: true, fechaVencimiento: true }
            }
          }
        }),
        prisma.producto.count({ where })
      ]);

      res.json({
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting products:', error);
      res.status(500).json({ message: 'Error al obtener productos' });
    }
  };

  getProduct = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const product = await prisma.producto.findUnique({
        where: { productoId: Number(id) },
        include: {
          lotes: {
            orderBy: { fechaVencimiento: 'asc' }
          }
        }
      });

      if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      res.json(product);
    } catch (error) {
      console.error('Error getting product:', error);
      res.status(500).json({ message: 'Error al obtener producto' });
    }
  };

  createProduct = async (req: AuthRequest, res: Response) => {
    try {
      const productData = req.body;
      
      const product = await prisma.producto.create({
        data: {
          ...productData,
          precioVentaSugerido: Number(productData.precioVentaSugerido)
        }
      });

      // Log creation
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Producto creado: ${product.nombre}`,
          detalles: { productoId: product.productoId, ...productData }
        }
      });

      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Error al crear producto' });
    }
  };

  updateProduct = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const product = await prisma.producto.update({
        where: { productoId: Number(id) },
        data: {
          ...updateData,
          precioVentaSugerido: updateData.precioVentaSugerido ? Number(updateData.precioVentaSugerido) : undefined
        }
      });

      // Log update
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Producto actualizado: ${product.nombre}`,
          detalles: { productoId: product.productoId, cambios: updateData }
        }
      });

      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Error al actualizar producto' });
    }
  };

  deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const product = await prisma.producto.update({
        where: { productoId: Number(id) },
        data: { activo: false }
      });

      // Log deletion
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Producto desactivado: ${product.nombre}`,
          detalles: { productoId: product.productoId }
        }
      });

      res.json({ message: 'Producto desactivado exitosamente' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Error al desactivar producto' });
    }
  };

  searchProducts = async (req: AuthRequest, res: Response) => {
    try {
      const { query } = req.params;
      const { limit = 20 } = req.query;
      
      const products = await prisma.producto.findMany({
        where: {
          AND: [
            { activo: true },
            {
              OR: [
                { nombre: { contains: query, mode: 'insensitive' } },
                { codigoBarras: { contains: query, mode: 'insensitive' } },
                { principioActivo: { contains: query, mode: 'insensitive' } }
              ]
            }
          ]
        },
        take: Number(limit),
        orderBy: { nombre: 'asc' },
        include: {
          lotes: {
            where: { cantidadDisponible: { gt: 0 } },
            orderBy: { fechaVencimiento: 'asc' },
            take: 1
          }
        }
      });

      res.json(products);
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ message: 'Error al buscar productos' });
    }
  };

  getProductLotes = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const lotes = await prisma.lote.findMany({
        where: { 
          productoId: Number(id),
          cantidadDisponible: { gt: 0 }
        },
        orderBy: { fechaVencimiento: 'asc' },
        include: {
          producto: {
            select: { nombre: true, presentacion: true }
          }
        }
      });

      res.json(lotes);
    } catch (error) {
      console.error('Error getting product lotes:', error);
      res.status(500).json({ message: 'Error al obtener lotes del producto' });
    }
  };
}