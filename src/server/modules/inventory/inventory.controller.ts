import { Response } from 'express';
import { prisma } from '../../core/prisma/client.js';
import { AuthRequest } from '../../core/middleware/auth.js';

interface ReceptionItem {
  productoId: number;
  numeroLoteRecibido: string;
  registroInvima?: string;
  fechaVencimientoRecibida: string;
  cantidadRecibida: number;
  precioCompraRecibido: number;
  tipoMovimiento: 'Ingreso' | 'Ajuste' | 'Bonificacion' | 'Faltante';
  notas?: string;
}

export class InventoryController {
  createReception = async (req: AuthRequest, res: Response) => {
    try {
      const { 
        proveedorId, 
        numeroFactura, 
        observacionesReceptor, 
        tipoRecepcion = 'Normal',
        items 
      }: {
        proveedorId: number;
        numeroFactura?: string;
        observacionesReceptor?: string;
        tipoRecepcion?: 'Normal' | 'Urgente' | 'Bonificacion' | 'Devolucion';
        items: ReceptionItem[];
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'La recepción debe tener al menos un producto' });
      }

      // Validar que el usuario tenga permisos
      if (!['administrador', 'inventario'].includes(req.user!.rol)) {
        return res.status(403).json({ message: 'No tienes permisos para crear actas de recepción' });
      }

      const acta = await prisma.actaRecepcion.create({
        data: {
          proveedorId,
          usuarioReceptorId: req.user!.usuarioId,
          numeroFactura,
          observacionesReceptor,
          tipoRecepcion,
          estado: 'PendienteAprobacion',
          detalleActaRecepcion: {
            create: items.map(item => ({
              productoId: item.productoId,
              numeroLoteRecibido: item.numeroLoteRecibido,
              registroInvima: item.registroInvima,
              fechaVencimientoRecibida: new Date(item.fechaVencimientoRecibida),
              cantidadRecibida: item.cantidadRecibida,
              precioCompraRecibido: Number(item.precioCompraRecibido),
              tipoMovimiento: item.tipoMovimiento,
              notas: item.notas
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

      // Crear notificación para administradores
      await this.createApprovalNotification(acta.actaId);

      // Log creation
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Acta de recepción #${acta.actaId} creada - Pendiente de aprobación`,
          detalles: { 
            actaId: acta.actaId, 
            cantidadItems: items.length,
            proveedor: proveedorId,
            estado: 'PendienteAprobacion'
          }
        }
      });

      res.status(201).json(acta);
    } catch (error) {
      console.error('Error creating reception:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Error al crear acta de recepción'
      });
    }
  };

  approveReception = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { observacionesAprobador, firmaAprobador } = req.body;

      // Validar que el usuario sea administrador
      if (req.user!.rol !== 'administrador') {
        return res.status(403).json({ message: 'Solo los administradores pueden aprobar actas de recepción' });
      }

      const acta = await prisma.actaRecepcion.findUnique({
        where: { actaId: Number(id) },
        include: {
          detalleActaRecepcion: {
            include: { producto: true }
          }
        }
      });

      if (!acta) {
        return res.status(404).json({ message: 'Acta de recepción no encontrada' });
      }

      if (acta.estado !== 'PendienteAprobacion') {
        return res.status(400).json({ message: 'El acta ya ha sido procesada' });
      }

      // Procesar la aprobación en una transacción
      const result = await prisma.$transaction(async (tx) => {
        // Actualizar el acta
        const updatedActa = await tx.actaRecepcion.update({
          where: { actaId: Number(id) },
          data: {
            estado: 'Aprobada',
            usuarioAprobadorId: req.user!.usuarioId,
            fechaAprobacion: new Date(),
            observacionesAprobador,
            firmaAprobador
          }
        });

        // Crear lotes y actualizar inventario
        for (const detalle of acta.detalleActaRecepcion) {
          // Calcular precio de venta (margen del 30%)
          const margen = 0.3;
          const precioVentaCalculado = Number(detalle.precioCompraRecibido) * (1 + margen);

          // Calcular alerta de vencimiento
          const alertaVencimiento = this.calculateExpirationAlert(detalle.fechaVencimientoRecibida);

          // Crear lote
          const lote = await tx.lote.create({
            data: {
              productoId: detalle.productoId,
              numeroLote: detalle.numeroLoteRecibido,
              fechaVencimiento: detalle.fechaVencimientoRecibida,
              cantidadInicial: detalle.cantidadRecibida,
              cantidadDisponible: detalle.cantidadRecibida,
              precioCompra: detalle.precioCompraRecibido,
              precioVentaLote: precioVentaCalculado,
              alertaVencimiento,
              notas: detalle.notas
            }
          });

          // Actualizar detalle con el lote creado
          await tx.detalleActaRecepcion.update({
            where: { detalleActaId: detalle.detalleActaId },
            data: { loteCreadoId: lote.loteId }
          });

          // Actualizar stock del producto
          await tx.producto.update({
            where: { productoId: detalle.productoId },
            data: { stockTotal: { increment: detalle.cantidadRecibida } }
          });
        }

        // Marcar acta como completada
        await tx.actaRecepcion.update({
          where: { actaId: Number(id) },
          data: { estado: 'Completada' }
        });

        return updatedActa;
      });

      // Log approval
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Acta de recepción #${id} aprobada y procesada`,
          detalles: { 
            actaId: Number(id),
            aprobadaPor: req.user!.nombre,
            observaciones: observacionesAprobador
          }
        }
      });

      res.json({ message: 'Acta aprobada y procesada exitosamente', acta: result });
    } catch (error) {
      console.error('Error approving reception:', error);
      res.status(500).json({ message: 'Error al aprobar acta de recepción' });
    }
  };

  rejectReception = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { observacionesAprobador, motivo } = req.body;

      // Validar que el usuario sea administrador
      if (req.user!.rol !== 'administrador') {
        return res.status(403).json({ message: 'Solo los administradores pueden rechazar actas de recepción' });
      }

      const acta = await prisma.actaRecepcion.findUnique({
        where: { actaId: Number(id) }
      });

      if (!acta) {
        return res.status(404).json({ message: 'Acta de recepción no encontrada' });
      }

      if (acta.estado !== 'PendienteAprobacion') {
        return res.status(400).json({ message: 'El acta ya ha sido procesada' });
      }

      const updatedActa = await prisma.actaRecepcion.update({
        where: { actaId: Number(id) },
        data: {
          estado: 'Rechazada',
          usuarioAprobadorId: req.user!.usuarioId,
          fechaAprobacion: new Date(),
          observacionesAprobador: `RECHAZADA: ${motivo}\n\n${observacionesAprobador || ''}`
        }
      });

      // Log rejection
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Acta de recepción #${id} rechazada`,
          detalles: { 
            actaId: Number(id),
            rechazadaPor: req.user!.nombre,
            motivo,
            observaciones: observacionesAprobador
          }
        }
      });

      res.json({ message: 'Acta rechazada exitosamente', acta: updatedActa });
    } catch (error) {
      console.error('Error rejecting reception:', error);
      res.status(500).json({ message: 'Error al rechazar acta de recepción' });
    }
  };

  getReceptions = async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, estado, pendingApproval } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (estado) {
        where.estado = estado;
      }
      if (pendingApproval === 'true') {
        where.estado = 'PendienteAprobacion';
      }

      const [receptions, total] = await Promise.all([
        prisma.actaRecepcion.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { fechaRecepcion: 'desc' },
          include: {
            proveedor: { select: { nombre: true } },
            usuarioReceptor: { select: { nombre: true } },
            usuarioAprobador: { select: { nombre: true } },
            detalleActaRecepcion: {
              include: {
                producto: { select: { nombre: true, presentacion: true } }
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
      res.status(500).json({ message: 'Error al obtener actas de recepción' });
    }
  };

  getReception = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const reception = await prisma.actaRecepcion.findUnique({
        where: { actaId: Number(id) },
        include: {
          proveedor: true,
          usuarioReceptor: { select: { nombre: true, correo: true } },
          usuarioAprobador: { select: { nombre: true, correo: true } },
          detalleActaRecepcion: {
            include: {
              producto: true,
              loteCreado: true
            }
          }
        }
      });

      if (!reception) {
        return res.status(404).json({ message: 'Acta de recepción no encontrada' });
      }

      res.json(reception);
    } catch (error) {
      console.error('Error getting reception:', error);
      res.status(500).json({ message: 'Error al obtener acta de recepción' });
    }
  };

  exportReceptionPDF = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const reception = await prisma.actaRecepcion.findUnique({
        where: { actaId: Number(id) },
        include: {
          proveedor: true,
          usuarioReceptor: { select: { nombre: true, correo: true } },
          usuarioAprobador: { select: { nombre: true, correo: true } },
          detalleActaRecepcion: {
            include: {
              producto: true
            }
          }
        }
      });

      if (!reception) {
        return res.status(404).json({ message: 'Acta de recepción no encontrada' });
      }

      if (reception.estado !== 'Completada') {
        return res.status(400).json({ message: 'Solo se pueden exportar actas completadas' });
      }

      // Aquí iría la lógica de generación de PDF
      // Por ahora retornamos los datos para el frontend
      res.json({
        message: 'Datos para generar PDF',
        data: reception
      });
    } catch (error) {
      console.error('Error exporting reception PDF:', error);
      res.status(500).json({ message: 'Error al exportar acta de recepción' });
    }
  };

  getPendingApprovals = async (req: AuthRequest, res: Response) => {
    try {
      // Solo administradores pueden ver actas pendientes
      if (req.user!.rol !== 'administrador') {
        return res.status(403).json({ message: 'No tienes permisos para ver actas pendientes' });
      }

      const pendingReceptions = await prisma.actaRecepcion.findMany({
        where: { estado: 'PendienteAprobacion' },
        orderBy: { fechaRecepcion: 'asc' },
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

      res.json(pendingReceptions);
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      res.status(500).json({ message: 'Error al obtener actas pendientes' });
    }
  };

  // Métodos auxiliares
  private calculateExpirationAlert(fechaVencimiento: Date): 'Vencido' | 'Rojo' | 'Amarillo' | 'Naranja' | 'Verde' {
    const now = new Date();
    const diffTime = fechaVencimiento.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Vencido';
    if (diffDays <= 180) return 'Rojo';
    if (diffDays <= 365) return 'Amarillo';
    if (diffDays <= 730) return 'Naranja';
    return 'Verde';
  }

  private async createApprovalNotification(actaId: number) {
    try {
      // Obtener todos los administradores
      const administrators = await prisma.usuario.findMany({
        where: { 
          rol: 'administrador',
          activo: true 
        }
      });

      // Crear notificación para cada administrador
      for (const admin of administrators) {
        await prisma.notificacionReabastecimiento.create({
          data: {
            productoId: 1, // Temporal, necesitaríamos una tabla de notificaciones generales
            tipoNotificacion: 'ActaPendienteAprobacion',
            mensaje: `Nueva acta de recepción #${actaId} pendiente de aprobación`,
            prioridad: 'Alta'
          }
        });
      }
    } catch (error) {
      console.error('Error creating approval notification:', error);
    }
  }

  getExpiringLotes = async (req: AuthRequest, res: Response) => {
    try {
      const now = new Date();
      const alertaRojaDias = 180;
      const alertaAmarillaDias = 365;

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