import { Response } from 'express';
import { prisma } from '../../core/prisma/client.js';
import { AuthRequest } from '../../core/middleware/auth.js';

interface SaleItem {
  productoId: number;
  cantidad: number;
}

export class POSController {
  createSale = async (req: AuthRequest, res: Response) => {
    try {
      const { items, metodoPago, descuentoTotal = 0 }: { 
        items: SaleItem[], 
        metodoPago: string,
        descuentoTotal?: number 
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'La venta debe tener al menos un producto' });
      }

      const result = await prisma.$transaction(async (tx) => {
        let subtotal = 0;
        let impuestoTotal = 0;
        const saleDetails: any[] = [];

        // Process each item with FEFO logic
        for (const item of items) {
          const producto = await tx.producto.findUnique({
            where: { productoId: item.productoId },
            include: {
              lotes: {
                where: { cantidadDisponible: { gt: 0 } },
                orderBy: { fechaVencimiento: 'asc' }
              }
            }
          });

          if (!producto) {
            throw new Error(`Producto ${item.productoId} no encontrado`);
          }

          let cantidadRestante = item.cantidad;
          const detalles: any[] = [];

          // Apply FEFO (First-Expired, First-Out) logic
          for (const lote of producto.lotes) {
            if (cantidadRestante <= 0) break;

            const cantidadTomar = Math.min(cantidadRestante, lote.cantidadDisponible);
            
            // Update lot quantity
            await tx.lote.update({
              where: { loteId: lote.loteId },
              data: { cantidadDisponible: lote.cantidadDisponible - cantidadTomar }
            });

            // Calculate line total
            const lineTotal = Number(lote.precioVentaLote) * cantidadTomar;
            const lineIva = producto.aplicaIva ? lineTotal * 0.19 : 0;
            
            subtotal += lineTotal;
            impuestoTotal += lineIva;

            detalles.push({
              loteId: lote.loteId,
              cantidad: cantidadTomar,
              precioVentaUnitario: lote.precioVentaLote,
              totalLinea: lineTotal
            });

            cantidadRestante -= cantidadTomar;
          }

          if (cantidadRestante > 0) {
            throw new Error(`Stock insuficiente para ${producto.nombre}. Faltante: ${cantidadRestante}`);
          }

          saleDetails.push(...detalles);

          // Update product total stock
          await tx.producto.update({
            where: { productoId: item.productoId },
            data: { stockTotal: { decrement: item.cantidad } }
          });
        }

        const totalAPagar = subtotal + impuestoTotal - Number(descuentoTotal);

        // Create sale
        const venta = await tx.venta.create({
          data: {
            usuarioId: req.user!.usuarioId,
            subtotal,
            descuentoTotal: Number(descuentoTotal),
            impuestoTotal,
            totalAPagar,
            metodoPago,
            detalleVenta: {
              create: saleDetails
            }
          },
          include: {
            detalleVenta: {
              include: {
                lote: {
                  include: {
                    producto: true
                  }
                }
              }
            }
          }
        });

        // Log sale
        await tx.historialCambio.create({
          data: {
            usuarioId: req.user!.usuarioId,
            accion: `Venta #${venta.ventaId} completada`,
            detalles: { 
              ventaId: venta.ventaId, 
              totalAPagar: venta.totalAPagar,
              cantidadItems: items.length 
            }
          }
        });

        return venta;
      });

      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating sale:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Error al crear la venta'
      });
    }
  };

  getSales = async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, fecha } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      
      if (fecha) {
        const startDate = new Date(fecha as string);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        
        where.fechaVenta = {
          gte: startDate,
          lt: endDate
        };
      }

      const [sales, total] = await Promise.all([
        prisma.venta.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { fechaVenta: 'desc' },
          include: {
            usuario: {
              select: { nombre: true }
            },
            detalleVenta: {
              include: {
                lote: {
                  include: {
                    producto: {
                      select: { nombre: true, presentacion: true }
                    }
                  }
                }
              }
            }
          }
        }),
        prisma.venta.count({ where })
      ]);

      res.json({
        sales,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting sales:', error);
      res.status(500).json({ message: 'Error al obtener ventas' });
    }
  };

  getSale = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const sale = await prisma.venta.findUnique({
        where: { ventaId: Number(id) },
        include: {
          usuario: {
            select: { nombre: true }
          },
          detalleVenta: {
            include: {
              lote: {
                include: {
                  producto: true
                }
              }
            }
          }
        }
      });

      if (!sale) {
        return res.status(404).json({ message: 'Venta no encontrada' });
      }

      res.json(sale);
    } catch (error) {
      console.error('Error getting sale:', error);
      res.status(500).json({ message: 'Error al obtener venta' });
    }
  };

  cancelSale = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await prisma.$transaction(async (tx) => {
        const sale = await tx.venta.findUnique({
          where: { ventaId: Number(id) },
          include: {
            detalleVenta: {
              include: {
                lote: {
                  include: { producto: true }
                }
              }
            }
          }
        });

        if (!sale) {
          throw new Error('Venta no encontrada');
        }

        if (sale.estado === 'Cancelada') {
          throw new Error('La venta ya está cancelada');
        }

        // Restore stock
        for (const detail of sale.detalleVenta) {
          await tx.lote.update({
            where: { loteId: detail.loteId },
            data: { cantidadDisponible: { increment: detail.cantidad } }
          });

          await tx.producto.update({
            where: { productoId: detail.lote.producto.productoId },
            data: { stockTotal: { increment: detail.cantidad } }
          });
        }

        // Cancel sale
        const cancelledSale = await tx.venta.update({
          where: { ventaId: Number(id) },
          data: { estado: 'Cancelada' }
        });

        // Log cancellation
        await tx.historialCambio.create({
          data: {
            usuarioId: req.user!.usuarioId,
            accion: `Venta #${sale.ventaId} cancelada`,
            detalles: { ventaId: sale.ventaId, motivo: 'Cancelación manual' }
          }
        });

        return cancelledSale;
      });

      res.json({ message: 'Venta cancelada exitosamente', sale: result });
    } catch (error) {
      console.error('Error cancelling sale:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Error al cancelar la venta'
      });
    }
  };
}