import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDateTime, getExpirationStatus } from '@/lib/utils';
import { 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Users,
  Activity,
  Building2
} from 'lucide-react';

interface DashboardStats {
  sales: {
    today: { total: number; count: number };
    month: { total: number; count: number };
  };
  inventory: {
    totalProducts: number;
    lowStockCount: number;
    expirationAlerts: {
      expired: number;
      critical: number;
      warning: number;
    };
  };
  recentActivity: any[];
}

export function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/reports/dashboard', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const totalAlerts = stats?.inventory.expirationAlerts.expired + 
                     stats?.inventory.expirationAlerts.critical + 
                     stats?.inventory.expirationAlerts.warning || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-gray-600 mt-1">
            Bienvenido, {user?.nombre} • {new Date().toLocaleDateString('es-CO', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-orange-600">
          <Building2 className="w-5 h-5" />
          <span className="font-medium text-sm">SENA</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.sales.today.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.sales.today.count || 0} transacciones
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats?.sales.month.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.sales.month.count || 0} transacciones
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.inventory.totalProducts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.inventory.lowStockCount || 0} con stock bajo
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalAlerts}
            </div>
            <p className="text-xs text-muted-foreground">
              Vencimientos y stock bajo
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiration Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Alertas de Vencimiento
            </CardTitle>
            <CardDescription>
              Estado de los lotes por fecha de vencimiento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <div className="font-medium text-red-900">Productos Vencidos</div>
                  <div className="text-sm text-red-600">Requieren acción inmediata</div>
                </div>
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  {stats?.inventory.expirationAlerts.expired || 0}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div>
                  <div className="font-medium text-orange-900">Crítico (6 meses)</div>
                  <div className="text-sm text-orange-600">Vencen pronto</div>
                </div>
                <Badge variant="warning" className="text-lg px-3 py-1">
                  {stats?.inventory.expirationAlerts.critical || 0}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <div className="font-medium text-yellow-900">Advertencia (1 año)</div>
                  <div className="text-sm text-yellow-600">Monitorear</div>
                </div>
                <Badge variant="warning" className="text-lg px-3 py-1 bg-yellow-500">
                  {stats?.inventory.expirationAlerts.warning || 0}
                </Badge>
              </div>
            </div>

            <Button className="w-full bg-orange-500 hover:bg-orange-600">
              Ver Reporte Detallado
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Últimas transacciones del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity.length ? (
                stats.recentActivity.map((sale: any) => (
                  <div key={sale.ventaId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          Venta #{sale.ventaId}
                        </div>
                        <div className="text-xs text-gray-500">
                          {sale.usuario.nombre} • {formatDateTime(sale.fechaVenta)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        {formatCurrency(sale.totalAPagar)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {sale.detalleVenta.length} items
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay actividad reciente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {(user?.rol === 'administrador' || user?.rol === 'cajero') && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Accesos directos a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                size="lg" 
                className="h-24 flex-col bg-green-500 hover:bg-green-600"
              >
                <ShoppingCart className="w-6 h-6 mb-2" />
                Nueva Venta
              </Button>
              
              {(user?.rol === 'administrador' || user?.rol === 'inventario') && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-24 flex-col border-orange-200 hover:bg-orange-50"
                >
                  <Package className="w-6 h-6 mb-2" />
                  Recibir Mercancía
                </Button>
              )}
              
              <Button 
                size="lg" 
                variant="outline" 
                className="h-24 flex-col border-blue-200 hover:bg-blue-50"
              >
                <TrendingUp className="w-6 h-6 mb-2" />
                Ver Reportes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}