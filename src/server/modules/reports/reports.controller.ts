import { Response } from 'express';
import { prisma } from '../../core/prisma/client.js';
import { AuthRequest } from '../../core/middleware/auth.js';

export class ReportController {
  getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Calculate expiration alerts
      const alertaRojaDias = 180;
      const alertaAmarillaDias = 365;
      const alertaRojaDate = new Date();
      alertaRojaDate.setDate(today.getDate() + alertaRojaDias);
      const alertaAmarillaDate = new Date();
      alertaAmarillaDate.setDate(today.getDate() + alertaAmarillaDias);

      const [
        todaySales,
        monthSales,
        totalProducts,
        lowStockCount,
        expiredLotes,
        criticalLotes,
        warningLotes,
        recentSales
      ] = await Promise.all([
        // Today's sales
        prisma.venta.aggregate({
          where: {
            fechaVenta: { gte: startOfDay },
            estado: 'Completada'
          },
          _sum: { totalAPagar: true },
          _count: true
        }),
        
        // This month's sales
        prisma.venta.aggregate({
          where: {
            fechaVenta: { gte: startOfMonth },
            estado: 'Completada'
          },
          _sum: { totalAPagar: true },
          _count: true
        }),

        // Total active products
        prisma.producto.count({
          where: { activo: true }
        }),

        // Low stock products
        prisma.producto.count({
          where: {
            activo: true,
            stockTotal: { lte: prisma.producto.fields.stockMinimo }
          }
        }),

        // Expired lotes
        prisma.lote.count({
          where: {
            cantidadDisponible: { gt: 0 },
            fechaVencimiento: { lt: today }
          }
        }),

        // Critical expiration lotes
        prisma.lote.count({
          where: {
            cantidadDisponible: { gt: 0 },
            fechaVencimiento: { gte: today, lte: alertaRojaDate }
          }
        }),

        // Warning expiration lotes
        prisma.lote.count({
          where: {
            cantidadDisponible: { gt: 0 },
            fechaVencimiento: { gt: alertaRojaDate, lte: alertaAmarillaDate }
          }
        }),

        // Recent sales for activity feed
        prisma.venta.findMany({
          take: 5,
          orderBy: { fechaVenta: 'desc' },
          include: {
            usuario: { select: { nombre: true } },
            detalleVenta: {
              include: {
                lote: {
                  include: {
                    producto: { select: { nombre: true } }
                  }
                }
              }
            }
          }
        })
      ]);

      const stats = {
        sales: {
          today: {
            total: Number(todaySales._sum.totalAPagar) || 0,
            count: todaySales._count
          },
          month: {
            total: Number(monthSales._sum.totalAPagar) || 0,
            count: monthSales._count
          }
        },
        inventory: {
          totalProducts,
          lowStockCount,
          expirationAlerts: {
            expired: expiredLotes,
            critical: criticalLotes,
            warning: warningLotes
          }
        },
        recentActivity: recentSales
      };

      res.json(stats);
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({ message: 'Error al obtener estadísticas del dashboard' });
    }
  };

  getSalesReport = async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const sales = await prisma.venta.findMany({
        where: {
          fechaVenta: { gte: start, lte: end },
          estado: 'Completada'
        },
        include: {
          usuario: { select: { nombre: true } },
          detalleVenta: {
            include: {
              lote: {
                include: {
                  producto: { select: { nombre: true, presentacion: true } }
                }
              }
            }
          }
        },
        orderBy: { fechaVenta: 'desc' }
      });

      // Group sales by date
      const groupedSales = sales.reduce((acc: any, sale) => {
        const date = sale.fechaVenta.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { total: 0, count: 0, sales: [] };
        }
        acc[date].total += Number(sale.totalAPagar);
        acc[date].count += 1;
        acc[date].sales.push(sale);
        return acc;
      }, {});

      const summary = {
        totalSales: sales.reduce((sum, sale) => sum + Number(sale.totalAPagar), 0),
        totalTransactions: sales.length,
        averageTicket: sales.length > 0 ? sales.reduce((sum, sale) => sum + Number(sale.totalAPagar), 0) / sales.length : 0,
        dailyBreakdown: groupedSales
      };

      res.json(summary);
    } catch (error) {
      console.error('Error getting sales report:', error);
      res.status(500).json({ message: 'Error al obtener reporte de ventas' });
    }
  };

  getInventoryReport = async (req: AuthRequest, res: Response) => {
    try {
      const products = await prisma.producto.findMany({
        where: { activo: true },
        include: {
          lotes: {
            where: { cantidadDisponible: { gt: 0 } },
            orderBy: { fechaVencimiento: 'asc' }
          }
        },
        orderBy: { nombre: 'asc' }
      });

      const inventoryValue = products.reduce((total, product) => {
        const productValue = product.lotes.reduce((sum, lote) => {
          return sum + (Number(lote.precioCompra) * lote.cantidadDisponible);
        }, 0);
        return total + productValue;
      }, 0);

      const summary = {
        totalProducts: products.length,
        totalInventoryValue: inventoryValue,
        totalUnits: products.reduce((sum, product) => sum + product.stockTotal, 0),
        products: products.map(product => ({
          ...product,
          inventoryValue: product.lotes.reduce((sum, lote) => {
            return sum + (Number(lote.precioCompra) * lote.cantidadDisponible);
          }, 0)
        }))
      };

      res.json(summary);
    } catch (error) {
      console.error('Error getting inventory report:', error);
      res.status(500).json({ message: 'Error al obtener reporte de inventario' });
    }
  };

  getExpirationReport = async (req: AuthRequest, res: Response) => {
    try {
      const today = new Date();
      const alertaRojaDias = 180;
      const alertaAmarillaDias = 365;

      const alertaRojaDate = new Date();
      alertaRojaDate.setDate(today.getDate() + alertaRojaDias);

      const alertaAmarillaDate = new Date();
      alertaAmarillaDate.setDate(today.getDate() + alertaAmarillaDias);

      const lotes = await prisma.lote.findMany({
        where: {
          cantidadDisponible: { gt: 0 }
        },
        include: {
          producto: {
            select: { 
              nombre: true, 
              presentacion: true, 
              laboratorio: true,
              requiereRefrigeracion: true,
              esControlado: true 
            }
          }
        },
        orderBy: { fechaVencimiento: 'asc' }
      });

      const categorized = {
        expired: lotes.filter(lote => lote.fechaVencimiento < today),
        critical: lotes.filter(lote => 
          lote.fechaVencimiento >= today && lote.fechaVencimiento <= alertaRojaDate
        ),
        warning: lotes.filter(lote => 
          lote.fechaVencimiento > alertaRojaDate && lote.fechaVencimiento <= alertaAmarillaDate
        ),
        safe: lotes.filter(lote => lote.fechaVencimiento > alertaAmarillaDate)
      };

      const summary = {
        totalLotes: lotes.length,
        expiredCount: categorized.expired.length,
        criticalCount: categorized.critical.length,
        warningCount: categorized.warning.length,
        safeCount: categorized.safe.length,
        expiredValue: categorized.expired.reduce((sum, lote) => 
          sum + (Number(lote.precioCompra) * lote.cantidadDisponible), 0
        ),
        categorized
      };

      res.json(summary);
    } catch (error) {
      console.error('Error getting expiration report:', error);
      res.status(500).json({ message: 'Error al obtener reporte de vencimientos' });
    }
  };
}