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

interface BajaItem {
  loteId: number;
  cantidad: number;
  motivo: string;
  observaciones?: string;
  requiereAprobacion: boolean;
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

  // Bajas de inventario
  createBaja = async (req: AuthRequest, res: Response) => {
    try {
      const { 
        loteId, 
        cantidad, 
        motivo, 
        observaciones, 
        requiereAprobacion = true 
      }: BajaItem = req.body;

      // Validar que el usuario tenga permisos
      if (!['administrador', 'inventario'].includes(req.user!.rol)) {
        return res.status(403).json({ message: 'No tienes permisos para dar de baja productos' });
      }

      // Validar que el lote exista y tenga suficiente stock
      const lote = await prisma.lote.findUnique({
        where: { loteId: Number(loteId) },
        include: { producto: true }
      });

      if (!lote) {
        return res.status(404).json({ message: 'Lote no encontrado' });
      }

      if (lote.cantidadDisponible < cantidad) {
        return res.status(400).json({ message: `Stock insuficiente. Disponible: ${lote.cantidadDisponible}` });
      }

      // Si no requiere aprobación y el usuario es administrador, procesar inmediatamente
      if (!requiereAprobacion && req.user!.rol === 'administrador') {
        // Procesar baja inmediatamente
        await prisma.$transaction(async (tx) => {
          // Crear registro de baja
          const baja = await tx.bajaInventario.create({
            data: {
              loteId: Number(loteId),
              usuarioId: req.user!.usuarioId,
              cantidad,
              motivo,
              observaciones,
              estado: 'Aprobada',
              usuarioAprobadorId: req.user!.usuarioId,
              fechaAprobacion: new Date()
            }
          });

          // Actualizar stock del lote
          await tx.lote.update({
            where: { loteId: Number(loteId) },
            data: { cantidadDisponible: { decrement: cantidad } }
          });

          // Actualizar stock total del producto
          await tx.producto.update({
            where: { productoId: lote.productoId },
            data: { stockTotal: { decrement: cantidad } }
          });

          // Log baja
          await tx.historialCambio.create({
            data: {
              usuarioId: req.user!.usuarioId,
              accion: `Baja de inventario #${baja.bajaId} procesada directamente`,
              detalles: { 
                bajaId: baja.bajaId,
                loteId: lote.loteId,
                producto: lote.producto.nombre,
                cantidad,
                motivo
              }
            }
          });

          return baja;
        });

        return res.status(201).json({ 
          message: 'Baja de inventario procesada exitosamente',
          requirioAprobacion: false
        });
      } else {
        // Crear solicitud de baja pendiente de aprobación
        const baja = await prisma.bajaInventario.create({
          data: {
            loteId: Number(loteId),
            usuarioId: req.user!.usuarioId,
            cantidad,
            motivo,
            observaciones,
            estado: 'Pendiente'
          },
          include: {
            lote: {
              include: {
                producto: { select: { nombre: true } }
              }
            },
            usuario: { select: { nombre: true } }
          }
        });

        // Log solicitud
        await prisma.historialCambio.create({
          data: {
            usuarioId: req.user!.usuarioId,
            accion: `Solicitud de baja #${baja.bajaId} creada - Pendiente de aprobación`,
            detalles: { 
              bajaId: baja.bajaId,
              loteId: lote.loteId,
              producto: lote.producto.nombre,
              cantidad,
              motivo
            }
          }
        });

        // Crear notificación para administradores
        await this.createBajaApprovalNotification(baja.bajaId, lote.producto.nombre);

        return res.status(201).json({ 
          message: 'Solicitud de baja creada exitosamente. Pendiente de aprobación por un administrador.',
          baja
        });
      }
    } catch (error) {
      console.error('Error creating baja:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Error al crear baja de inventario'
      });
    }
  };

  getBajas = async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, estado } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (estado) {
        where.estado = estado;
      }

      const [bajas, total] = await Promise.all([
        prisma.bajaInventario.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { fechaSolicitud: 'desc' },
          include: {
            lote: {
              include: {
                producto: { select: { nombre: true, presentacion: true } }
              }
            },
            usuario: { select: { nombre: true } },
            usuarioAprobador: { select: { nombre: true } }
          }
        }),
        prisma.bajaInventario.count({ where })
      ]);

      res.json({
        bajas,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting bajas:', error);
      res.status(500).json({ message: 'Error al obtener bajas de inventario' });
    }
  };

  getBaja = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const baja = await prisma.bajaInventario.findUnique({
        where: { bajaId: Number(id) },
        include: {
          lote: {
            include: {
              producto: true
            }
          },
          usuario: { select: { nombre: true, correo: true } },
          usuarioAprobador: { select: { nombre: true, correo: true } }
        }
      });

      if (!baja) {
        return res.status(404).json({ message: 'Baja de inventario no encontrada' });
      }

      res.json(baja);
    } catch (error) {
      console.error('Error getting baja:', error);
      res.status(500).json({ message: 'Error al obtener baja de inventario' });
    }
  };

  getPendingBajas = async (req: AuthRequest, res: Response) => {
    try {
      // Solo administradores pueden ver bajas pendientes
      if (req.user!.rol !== 'administrador') {
        return res.status(403).json({ message: 'No tienes permisos para ver bajas pendientes' });
      }

      const pendingBajas = await prisma.bajaInventario.findMany({
        where: { estado: 'Pendiente' },
        orderBy: { fechaSolicitud: 'asc' },
        include: {
          lote: {
            include: {
              producto: { select: { nombre: true, presentacion: true } }
            }
          },
          usuario: { select: { nombre: true } }
        }
      });

      res.json(pendingBajas);
    } catch (error) {
      console.error('Error getting pending bajas:', error);
      res.status(500).json({ message: 'Error al obtener bajas pendientes' });
    }
  };

  approveBaja = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { observacionesAprobador } = req.body;

      // Validar que el usuario sea administrador
      if (req.user!.rol !== 'administrador') {
        return res.status(403).json({ message: 'Solo los administradores pueden aprobar bajas' });
      }

      const baja = await prisma.bajaInventario.findUnique({
        where: { bajaId: Number(id) },
        include: {
          lote: true
        }
      });

      if (!baja) {
        return res.status(404).json({ message: 'Baja de inventario no encontrada' });
      }

      if (baja.estado !== 'Pendiente') {
        return res.status(400).json({ message: 'La baja ya ha sido procesada' });
      }

      // Validar que el lote tenga suficiente stock
      if (baja.lote.cantidadDisponible < baja.cantidad) {
        return res.status(400).json({ 
          message: `Stock insuficiente. Disponible: ${baja.lote.cantidadDisponible}, Solicitado: ${baja.cantidad}` 
        });
      }

      // Procesar la aprobación en una transacción
      const result = await prisma.$transaction(async (tx) => {
        // Actualizar la baja
        const updatedBaja = await tx.bajaInventario.update({
          where: { bajaId: Number(id) },
          data: {
            estado: 'Aprobada',
            usuarioAprobadorId: req.user!.usuarioId,
            fechaAprobacion: new Date(),
            observacionesAprobador
          }
        });

        // Actualizar stock del lote
        await tx.lote.update({
          where: { loteId: baja.loteId },
          data: { cantidadDisponible: { decrement: baja.cantidad } }
        });

        // Actualizar stock total del producto
        await tx.producto.update({
          where: { productoId: baja.lote.productoId },
          data: { stockTotal: { decrement: baja.cantidad } }
        });

        return updatedBaja;
      });

      // Log approval
      await prisma.historialCambio.create({
        data: {
          usuarioId: req.user!.usuarioId,
          accion: `Baja de inventario #${id} aprobada y procesada`,
          detalles: { 
            bajaId: Number(id),
            aprobadaPor: req.user!.nombre,
            observaciones: observacionesAprobador
          }
        }
      });

      res.json({ message: 'Baja aprobada y procesada exitosamente', baja: result });
    } catch (error) {
      console.error('Error approving baja:', error);
      res.status(500).json({ message: 'Error al aprobar baja de inventario' });
    }
  };

  rejectBaja = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { observacionesAprobador, motivo } = req.body;

      // Validar que el usuario sea administrador
      if (req.user!.rol !== 'administrador') {
        return res.status(403).json({ message: 'Solo los administradores pueden rechazar bajas' });
      }

      const baja = await prisma.bajaInventario.findUnique({
        where: { bajaId: Number(id) }
      });

      if (!baja) {
        return res.status(404).json({ message: 'Baja de inventario no encontrada' });
      }

      if (baja.estado !== 'Pendiente') {
        return res.status(400).json({ message: 'La baja ya ha sido procesada' });
      }

      const updatedBaja = await prisma.bajaInventario.update({
        where: { bajaId: Number(id) },
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
          accion: `Baja de inventario #${id} rechazada`,
          detalles: { 
            bajaId: Number(id),
            rechazadaPor: req.user!.nombre,
            motivo,
            observaciones: observacionesAprobador
          }
        }
      });

      res.json({ message: 'Baja rechazada exitosamente', baja: updatedBaja });
    } catch (error) {
      console.error('Error rejecting baja:', error);
      res.status(500).json({ message: 'Error al rechazar baja de inventario' });
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
      for (const _admin of administrators) {
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

  private async createBajaApprovalNotification(bajaId: number, nombreProducto: string) {
    try {
      // Obtener todos los administradores
      const administrators = await prisma.usuario.findMany({
        where: { 
          rol: 'administrador',
          activo: true 
        }
      });

      // Crear notificación para cada administrador
      for (const _admin of administrators) {
        await prisma.notificacionReabastecimiento.create({
          data: {
            productoId: 1, // Temporal, necesitaríamos una tabla de notificaciones generales
            tipoNotificacion: 'BajaPendienteAprobacion',
            mensaje: `Nueva solicitud de baja #${bajaId} para ${nombreProducto} pendiente de aprobación`,
            prioridad: 'Alta'
          }
        });
      }
    } catch (error) {
      console.error('Error creating baja approval notification:', error);
    }
  }

  getExpiringLotes = async (_req: AuthRequest, res: Response) => {
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

  getLowStockProducts = async (_req: AuthRequest, res: Response) => {
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