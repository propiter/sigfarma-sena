import { Response } from 'express';
import { prisma } from '../../core/prisma/client.js';
import { AuthRequest } from '../../core/middleware/auth.js';

interface ReceptionItem {
  productoId: number;
  numeroLoteRecibido: string;
  fechaVencimientoRecibida: string;
  cantidadRecibida: number;
  precioCompraRecibido: number;
}

export class InventoryController {
  createReception = async (req: AuthRequest, res: Response) => {
    try {
      const { 
        proveedorId, 
        numeroFactura, 
        observaciones, 
        items 
      }: {
        proveedorId: number;
        numeroFactura?: string;
        observaciones?: string;
        items: ReceptionItem[];
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'La recepción debe tener al menos un producto' });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Create reception act
        const acta = await tx.actaRecepcion.create({
          data: {
            proveedorId,
            usuarioReceptorId: req.user!.usuarioId,
            numeroFactura,
            observaciones
          }
        });

        // Process each item
        for (const item of items) {
          const producto = await tx.producto.findUnique({
            where: { productoId: item.productoId }
          });

          if (!producto) {
            throw new Error(`Producto ${item.productoId} no encontrado`);
          }

          // Calculate sale price (add margin to purchase price)
          const margen = 0.3; // 30% margin
          const precioVentaCalculado = Number(item.precioCompraRecibido) * (1 + margen);

          // Create lot
          const lote = await tx.lote.create({
            data: {
              productoId: item.productoId,
              numeroLote: item.numeroLoteRecibido,
              fechaVencimiento: new Date(item.fechaVencimientoRecibida),
              cantidadInicial: item.cantidadRecibida,
              cantidadDisponible: item.cantidadRecibida,
              precioCompra: Number(item.precioCompraRecibido),
              precioVentaLote: precioVentaCalculado
            }
          });

          // Create reception detail
          await tx.detalleActaRecepcion.create({
            data: {
              actaId: acta.actaId,
              productoId: item.productoId,
              numeroLoteRecibido: item.numeroLoteRecibido,
              fechaVencimientoRecibida: new Date(item.fechaVencimientoRecibida),
              cantidadRecibida: item.cantidadRecibida,
              precioCompraRecibido: Number(item.precioCompraRecibido),
              loteCreadoId: lote.loteId
            }
          });

          // Update product total stock
          await tx.producto.update({
            where: { productoId: item.productoId },
            data: { stockTotal: { increment: item.cantidadRecibida } }
          });
        }

        // Complete the reception
        await tx.actaRecepcion.update({
          where: { actaId: acta.actaId },
          data: { estado: 'Completada' }
        });

        // Log reception
        await tx.historialCambio.create({
          data: {
            usuarioId: req.user!.usuarioId,
            accion: `Recepción #${acta.actaId} completada`,
            detalles: { 
              actaId: acta.actaId, 
              cantidadItems: items.length,
              proveedor: proveedorId 
            }
          }
        });

        return acta;
      });

      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating reception:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Error al crear recepción'
      });
    }
  };

  getReceptions = async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, estado } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (estado) {
        where.estado = estado;
      }

      const [receptions, total] = await Promise.all([
        prisma.actaRecepcion.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { fechaRecepcion: 'desc' },
          include: {
            proveedor: {
              select: { nombre: true }
            },
            usuarioReceptor: {
              select: { nombre: true }
            },
            detalleActaRecepcion: {
              include: {
                producto: {
                  select: { nombre: true, presentacion: true }
                }
              }
            }
          }
        }),
        prisma.actaRecepcion.count({ where })
      ]);

      res.json({
        receptions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting receptions:', error);
      res.status(500).json({ message: 'Error al obtener recepciones' });
    }
  };

  getReception = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const reception = await prisma.actaRecepcion.findUnique({
        where: { actaId: Number(id) },
        include: {
          proveedor: true,
          usuarioReceptor: {
            select: { nombre: true }
          },
          detalleActaRecepcion: {
            include: {
              producto: true,
              loteCreado: true
            }
          }
        }
      });

      if (!reception) {
        return res.status(404).json({ message: 'Recepción no encontrada' });
      }

      res.json(reception);
    } catch (error) {
      console.error('Error getting reception:', error);
      res.status(500).json({ message: 'Error al obtener recepción' });
    }
  };

  completeReception = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const reception = await prisma.actaRecepcion.update({
        where: { actaId: Number(id) },
        data: { estado: 'Completada' }
      });

      // Log completion
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Recepción #${reception.actaId} marcada como completada`,
          detalles: { actaId: reception.actaId }
        }
      });

      res.json(reception);
    } catch (error) {
      console.error('Error completing reception:', error);
      res.status(500).json({ message: 'Error al completar recepción' });
    }
  };

  getExpiringLotes = async (req: AuthRequest, res: Response) => {
    try {
      const now = new Date();
      const alertaRojaDias = 180; // Default 6 months
      const alertaAmarillaDias = 365; // Default 1 year

      const alertaRojaDate = new Date();
      alertaRojaDate.setDate(now.getDate() + alertaRojaDias);

      const alertaAmarillaDate = new Date();
      alertaAmarillaDate.setDate(now.getDate() + alertaAmarillaDias);

      const lotes = await prisma.lote.findMany({
        where: {
          cantidadDisponible: { gt: 0 },
          fechaVencimiento: { lte: alertaAmarillaDate }
        },
        include: {
          producto: {
            select: { nombre: true, presentacion: true, laboratorio: true }
          }
        },
        orderBy: { fechaVencimiento: 'asc' }
      });

      const categorized = {
        expired: lotes.filter(lote => lote.fechaVencimiento < now),
        critical: lotes.filter(lote => 
          lote.fechaVencimiento >= now && lote.fechaVencimiento <= alertaRojaDate
        ),
        warning: lotes.filter(lote => 
          lote.fechaVencimiento > alertaRojaDate && lote.fechaVencimiento <= alertaAmarillaDate
        )
      };

      res.json(categorized);
    } catch (error) {
      console.error('Error getting expiring lotes:', error);
      res.status(500).json({ message: 'Error al obtener lotes próximos a vencer' });
    }
  };

  getLowStockProducts = async (req: AuthRequest, res: Response) => {
    try {
      const products = await prisma.producto.findMany({
        where: {
          activo: true,
          stockTotal: { lte: prisma.producto.fields.stockMinimo }
        },
        orderBy: { stockTotal: 'asc' },
        include: {
          lotes: {
            where: { cantidadDisponible: { gt: 0 } },
            orderBy: { fechaVencimiento: 'asc' }
          }
        }
      });

      res.json(products);
    } catch (error) {
      console.error('Error getting low stock products:', error);
      res.status(500).json({ message: 'Error al obtener productos con bajo stock' });
    }
  };
}