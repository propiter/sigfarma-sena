import { Response } from 'express';
import { prisma } from '../../core/prisma/client.js';
import { AuthRequest } from '../../core/middleware/auth.js';

interface OrderItem {
  productoId: number;
  cantidadSolicitada: number;
  precioUnitario: number;
  notas?: string;
}

export class OrderController {
  createOrder = async (req: AuthRequest, res: Response) => {
    try {
      const { 
        proveedorId, 
        fechaEntregaEsperada, 
        observaciones, 
        items 
      }: {
        proveedorId: number;
        fechaEntregaEsperada?: string;
        observaciones?: string;
        items: OrderItem[];
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'La orden debe tener al menos un producto' });
      }

      // Generate order number
      const orderCount = await prisma.ordenCompra.count();
      const numeroOrden = `OC-${String(orderCount + 1).padStart(6, '0')}`;

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.cantidadSolicitada * item.precioUnitario), 0);
      const impuestos = subtotal * 0.19; // 19% IVA
      const total = subtotal + impuestos;

      const order = await prisma.ordenCompra.create({
        data: {
          proveedorId,
          usuarioCreadorId: req.user!.usuarioId,
          numeroOrden,
          fechaEntregaEsperada: fechaEntregaEsperada ? new Date(fechaEntregaEsperada) : null,
          observaciones,
          subtotal,
          impuestos,
          total,
          detalleOrdenCompra: {
            create: items.map(item => ({
              productoId: item.productoId,
              cantidadSolicitada: item.cantidadSolicitada,
              precioUnitario: Number(item.precioUnitario),
              totalLinea: item.cantidadSolicitada * Number(item.precioUnitario),
              notas: item.notas
            }))
          }
        },
        include: {
          proveedor: { select: { nombre: true } },
          usuarioCreador: { select: { nombre: true } },
          detalleOrdenCompra: {
            include: {
              producto: { select: { nombre: true, presentacion: true } }
            }
          }
        }
      });

      // Log creation
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Orden de compra ${numeroOrden} creada`,
          detalles: { 
            ordenId: order.ordenId, 
            proveedor: proveedorId,
            total: order.total,
            cantidadItems: items.length
          }
        }
      });

      res.status(201).json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Error al crear orden de compra' });
    }
  };

  getOrders = async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, estado, proveedorId } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (estado) {
        where.estado = estado;
      }
      if (proveedorId) {
        where.proveedorId = Number(proveedorId);
      }

      const [orders, total] = await Promise.all([
        prisma.ordenCompra.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { fechaOrden: 'desc' },
          include: {
            proveedor: { select: { nombre: true } },
            usuarioCreador: { select: { nombre: true } },
            _count: { select: { detalleOrdenCompra: true } }
          }
        }),
        prisma.ordenCompra.count({ where })
      ]);

      res.json({
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting orders:', error);
      res.status(500).json({ message: 'Error al obtener órdenes de compra' });
    }
  };

  getOrder = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const order = await prisma.ordenCompra.findUnique({
        where: { ordenId: Number(id) },
        include: {
          proveedor: true,
          usuarioCreador: { select: { nombre: true, correo: true } },
          detalleOrdenCompra: {
            include: {
              producto: true
            }
          },
          actasRecepcion: {
            include: {
              usuarioReceptor: { select: { nombre: true } },
              _count: { select: { detalleActaRecepcion: true } }
            }
          }
        }
      });

      if (!order) {
        return res.status(404).json({ message: 'Orden de compra no encontrada' });
      }

      res.json(order);
    } catch (error) {
      console.error('Error getting order:', error);
      res.status(500).json({ message: 'Error al obtener orden de compra' });
    }
  };

  updateOrderStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { estado, observaciones } = req.body;

      const validStates = ['Pendiente', 'Enviada', 'Recibida', 'Completada', 'Cancelada'];
      if (!validStates.includes(estado)) {
        return res.status(400).json({ message: 'Estado no válido' });
      }

      const order = await prisma.ordenCompra.update({
        where: { ordenId: Number(id) },
        data: { 
          estado,
          observaciones: observaciones || undefined,
          fechaRecepcion: estado === 'Recibida' ? new Date() : undefined
        }
      });

      // Log status change
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Orden ${order.numeroOrden} cambió a estado: ${estado}`,
          detalles: { 
            ordenId: order.ordenId, 
            estadoAnterior: order.estado,
            estadoNuevo: estado,
            observaciones
          }
        }
      });

      res.json(order);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Error al actualizar estado de la orden' });
    }
  };

  generateAutoOrders = async (req: AuthRequest, res: Response) => {
    try {
      // Find products with low stock
      const lowStockProducts = await prisma.producto.findMany({
        where: {
          activo: true,
          stockTotal: { lte: prisma.producto.fields.stockMinimo }
        },
        include: {
          lotes: {
            where: { cantidadDisponible: { gt: 0 } },
            orderBy: { fechaVencimiento: 'asc' },
            take: 1
          }
        }
      });

      if (lowStockProducts.length === 0) {
        return res.json({ message: 'No hay productos que requieran reabastecimiento', orders: [] });
      }

      // Group products by suggested provider (for now, we'll use a default provider)
      // In a real system, you'd have product-provider relationships
      const defaultProvider = await prisma.proveedor.findFirst({
        where: { activo: true }
      });

      if (!defaultProvider) {
        return res.status(400).json({ message: 'No hay proveedores activos para generar órdenes' });
      }

      const orderItems = lowStockProducts.map(product => {
        const cantidadSugerida = Math.max(
          product.stockMaximo - product.stockTotal,
          product.stockMinimo * 2
        );
        
        // Estimate price based on last lot price or suggested price
        const precioEstimado = product.lotes[0]?.precioCompra || 
                              Number(product.precioVentaSugerido) * 0.7;

        return {
          productoId: product.productoId,
          cantidadSolicitada: cantidadSugerida,
          precioUnitario: Number(precioEstimado),
          notas: `Reabastecimiento automático - Stock actual: ${product.stockTotal}, Mínimo: ${product.stockMinimo}`
        };
      });

      // Create the auto-generated order
      const orderCount = await prisma.ordenCompra.count();
      const numeroOrden = `OC-AUTO-${String(orderCount + 1).padStart(6, '0')}`;

      const subtotal = orderItems.reduce((sum, item) => sum + (item.cantidadSolicitada * item.precioUnitario), 0);
      const impuestos = subtotal * 0.19;
      const total = subtotal + impuestos;

      const order = await prisma.ordenCompra.create({
        data: {
          proveedorId: defaultProvider.proveedorId,
          usuarioCreadorId: req.user!.usuarioId,
          numeroOrden,
          observaciones: 'Orden generada automáticamente por stock bajo',
          subtotal,
          impuestos,
          total,
          detalleOrdenCompra: {
            create: orderItems
          }
        },
        include: {
          proveedor: { select: { nombre: true } },
          detalleOrdenCompra: {
            include: {
              producto: { select: { nombre: true, presentacion: true } }
            }
          }
        }
      });

      // Log auto-generation
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Orden automática ${numeroOrden} generada por stock bajo`,
          detalles: { 
            ordenId: order.ordenId,
            productosIncluidos: lowStockProducts.length,
            total: order.total
          }
        }
      });

      res.json({ 
        message: `Orden automática generada para ${lowStockProducts.length} productos`,
        order 
      });
    } catch (error) {
      console.error('Error generating auto orders:', error);
      res.status(500).json({ message: 'Error al generar órdenes automáticas' });
    }
  };

  createReceptionFromOrder = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { observacionesReceptor, numeroFactura } = req.body;

      const order = await prisma.ordenCompra.findUnique({
        where: { ordenId: Number(id) },
        include: {
          detalleOrdenCompra: {
            include: { producto: true }
          },
          proveedor: true
        }
      });

      if (!order) {
        return res.status(404).json({ message: 'Orden de compra no encontrada' });
      }

      if (order.estado === 'Completada') {
        return res.status(400).json({ message: 'Esta orden ya ha sido completada' });
      }

      // Create reception act with order data as template
      const acta = await prisma.actaRecepcion.create({
        data: {
          proveedorId: order.proveedorId,
          usuarioReceptorId: req.user!.usuarioId,
          ordenCompraId: order.ordenId,
          numeroFactura,
          observacionesReceptor: observacionesReceptor || `Recepción basada en orden ${order.numeroOrden}`,
          estado: 'PendienteAprobacion',
          tipoRecepcion: 'Normal',
          detalleActaRecepcion: {
            create: order.detalleOrdenCompra.map(detalle => ({
              productoId: detalle.productoId,
              numeroLoteRecibido: '', // To be filled by user
              fechaVencimientoRecibida: new Date(), // To be updated by user
              cantidadRecibida: detalle.cantidadSolicitada, // Default to ordered quantity
              precioCompraRecibido: detalle.precioUnitario,
              tipoMovimiento: 'Ingreso',
              notas: `Basado en orden ${order.numeroOrden} - Cantidad solicitada: ${detalle.cantidadSolicitada}`
            }))
          }
        },
        include: {
          proveedor: { select: { nombre: true } },
          usuarioReceptor: { select: { nombre: true } },
          detalleActaRecepcion: {
            include: {
              producto: { select: { nombre: true, presentacion: true } }
            }
          }
        }
      });

      // Update order status
      await prisma.ordenCompra.update({
        where: { ordenId: Number(id) },
        data: { estado: 'Recibida' }
      });

      // Log reception creation
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Acta de recepción #${acta.actaId} creada desde orden ${order.numeroOrden}`,
          detalles: { 
            actaId: acta.actaId,
            ordenId: order.ordenId,
            cantidadItems: order.detalleOrdenCompra.length
          }
        }
      });

      res.status(201).json({
        message: 'Acta de recepción creada desde la orden. Completa los datos faltantes y envía para aprobación.',
        acta
      });
    } catch (error) {
      console.error('Error creating reception from order:', error);
      res.status(500).json({ message: 'Error al crear acta desde orden' });
    }
  };

  getOrderStats = async (req: AuthRequest, res: Response) => {
    try {
      const [total, pending, sent, received, completed] = await Promise.all([
        prisma.ordenCompra.count(),
        prisma.ordenCompra.count({ where: { estado: 'Pendiente' } }),
        prisma.ordenCompra.count({ where: { estado: 'Enviada' } }),
        prisma.ordenCompra.count({ where: { estado: 'Recibida' } }),
        prisma.ordenCompra.count({ where: { estado: 'Completada' } })
      ]);

      res.json({
        total,
        pending,
        sent,
        received,
        completed
      });
    } catch (error) {
      console.error('Error getting order stats:', error);
      res.status(500).json({ message: 'Error al obtener estadísticas de órdenes' });
    }
  };
}