import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  FileText, 
  Download,
  Filter,
  RefreshCw,
  DollarSign,
  Package,
  AlertTriangle,
  Users
} from 'lucide-react';

interface SalesReport {
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
  dailyBreakdown: Record<string, any>;
}

interface InventoryReport {
  totalProducts: number;
  totalInventoryValue: number;
  totalUnits: number;
  products: any[];
}

interface ExpirationReport {
  totalLotes: number;
  expiredCount: number;
  criticalCount: number;
  warningCount: number;
  safeCount: number;
  expiredValue: number;
  categorized: {
    expired: any[];
    critical: any[];
    warning: any[];
    safe: any[];
  };
}

const COLORS = ['#FF6B35', '#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

export function Reports() {
  const { user } = useAuthStore();
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  const [expirationReport, setExpirationReport] = useState<ExpirationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [salesRes, inventoryRes, expirationRes] = await Promise.all([
        fetch(`/api/reports/sales?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
          credentials: 'include'
        }),
        fetch('/api/reports/inventory', { credentials: 'include' }),
        fetch('/api/reports/expirations', { credentials: 'include' })
      ]);

      if (salesRes.ok) {
        const data = await salesRes.json();
        setSalesReport(data);
      }

      if (inventoryRes.ok) {
        const data = await inventoryRes.json();
        setInventoryReport(data);
      }

      if (expirationRes.ok) {
        const data = await expirationRes.json();
        setExpirationReport(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareSalesChartData = () => {
    if (!salesReport?.dailyBreakdown) return [];
    
    return Object.entries(salesReport.dailyBreakdown).map(([date, data]: [string, any]) => ({
      date: new Date(date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }),
      ventas: data.total,
      transacciones: data.count
    }));
  };

  const prepareExpirationChartData = () => {
    if (!expirationReport) return [];
    
    return [
      { name: 'Vencidos', value: expirationReport.expiredCount, color: '#EF4444' },
      { name: 'Críticos', value: expirationReport.criticalCount, color: '#F59E0B' },
      { name: 'Advertencia', value: expirationReport.warningCount, color: '#FCD34D' },
      { name: 'Seguros', value: expirationReport.safeCount, color: '#10B981' }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
          <p className="text-gray-600 mt-1">
            Información detallada sobre ventas, inventario y operaciones
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-40"
            />
            <span className="text-gray-500">a</span>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-40"
            />
          </div>
          <Button onClick={fetchReports} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(salesReport?.totalSales || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {salesReport?.totalTransactions || 0} transacciones
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(salesReport?.averageTicket || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Por transacción
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(inventoryReport?.totalInventoryValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {inventoryReport?.totalProducts || 0} productos
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(expirationReport?.expiredCount || 0) + (expirationReport?.criticalCount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Vencimientos críticos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Reports */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="expirations">Vencimientos</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Ventas</CardTitle>
                <CardDescription>
                  Ventas diarias en el período seleccionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prepareSalesChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'ventas' ? formatCurrency(Number(value)) : value,
                        name === 'ventas' ? 'Ventas' : 'Transacciones'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ventas" 
                      stroke="#FF6B35" 
                      strokeWidth={2}
                      dot={{ fill: '#FF6B35' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Transactions Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Número de Transacciones</CardTitle>
                <CardDescription>
                  Cantidad de ventas por día
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prepareSalesChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="transacciones" fill="#4F46E5" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Sales Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Ventas</CardTitle>
              <CardDescription>
                Métricas clave del período seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(salesReport?.totalSales || 0)}
                  </div>
                  <div className="text-sm text-green-700">Ventas Totales</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {salesReport?.totalTransactions || 0}
                  </div>
                  <div className="text-sm text-blue-700">Transacciones</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(salesReport?.averageTicket || 0)}
                  </div>
                  <div className="text-sm text-purple-700">Ticket Promedio</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inventory Value */}
            <Card>
              <CardHeader>
                <CardTitle>Valor del Inventario</CardTitle>
                <CardDescription>
                  Distribución del valor por productos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {formatCurrency(inventoryReport?.totalInventoryValue || 0)}
                    </div>
                    <div className="text-sm text-gray-500">Valor Total del Inventario</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">
                        {inventoryReport?.totalProducts || 0}
                      </div>
                      <div className="text-sm text-blue-700">Productos</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">
                        {inventoryReport?.totalUnits || 0}
                      </div>
                      <div className="text-sm text-green-700">Unidades</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Productos de Mayor Valor</CardTitle>
                <CardDescription>
                  Top 10 productos por valor en inventario
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventoryReport?.products
                    .sort((a, b) => b.inventoryValue - a.inventoryValue)
                    .slice(0, 10)
                    .map((product, index) => (
                      <div key={product.productoId} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{product.nombre}</div>
                            <div className="text-xs text-gray-500">{product.presentacion}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">
                            {formatCurrency(product.inventoryValue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.stockTotal} unidades
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expirations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expiration Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de Vencimientos</CardTitle>
                <CardDescription>
                  Distribución de lotes por estado de vencimiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prepareExpirationChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareExpirationChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expiration Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Vencimientos</CardTitle>
                <CardDescription>
                  Métricas de control de fechas de vencimiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {expirationReport?.expiredCount || 0}
                      </div>
                      <div className="text-sm text-red-700">Vencidos</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {expirationReport?.criticalCount || 0}
                      </div>
                      <div className="text-sm text-orange-700">Críticos</div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-lg text-center">
                    <div className="text-xl font-bold text-yellow-600">
                      {expirationReport?.warningCount || 0}
                    </div>
                    <div className="text-sm text-yellow-700">En Advertencia</div>
                  </div>

                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(expirationReport?.expiredValue || 0)}
                    </div>
                    <div className="text-sm text-red-700">Valor de Productos Vencidos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Items */}
          <Card>
            <CardHeader>
              <CardTitle>Lotes Críticos</CardTitle>
              <CardDescription>
                Productos que requieren atención inmediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expirationReport?.categorized.critical.slice(0, 10).map((lote: any) => (
                  <div key={lote.loteId} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                    <div>
                      <div className="font-medium">{lote.producto.nombre}</div>
                      <div className="text-sm text-gray-600">Lote: {lote.numeroLote}</div>
                      <div className="text-xs text-gray-500">{lote.producto.presentacion}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="warning" className="mb-1">
                        {formatDate(lote.fechaVencimiento)}
                      </Badge>
                      <div className="text-sm text-gray-600">
                        {lote.cantidadDisponible} unidades
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
                <CardDescription>
                  Indicadores clave de la farmacia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Rotación de Inventario</span>
                    <span className="text-blue-600 font-bold">2.3x</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Margen Promedio</span>
                    <span className="text-green-600 font-bold">28.5%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium">Productos Activos</span>
                    <span className="text-purple-600 font-bold">{inventoryReport?.totalProducts || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">Eficiencia de Stock</span>
                    <span className="text-orange-600 font-bold">92.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recomendaciones</CardTitle>
                <CardDescription>
                  Sugerencias para optimizar operaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border-l-4 border-l-red-500 bg-red-50">
                    <div className="font-medium text-red-800">Acción Urgente</div>
                    <div className="text-sm text-red-600">
                      {expirationReport?.expiredCount || 0} productos vencidos requieren disposición inmediata
                    </div>
                  </div>
                  <div className="p-3 border-l-4 border-l-orange-500 bg-orange-50">
                    <div className="font-medium text-orange-800">Reabastecimiento</div>
                    <div className="text-sm text-orange-600">
                      Revisar stock de productos con alta rotación
                    </div>
                  </div>
                  <div className="p-3 border-l-4 border-l-blue-500 bg-blue-50">
                    <div className="font-medium text-blue-800">Optimización</div>
                    <div className="text-sm text-blue-600">
                      Considerar ajustar precios de productos de baja rotación
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}