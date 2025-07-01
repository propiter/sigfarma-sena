import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate, getExpirationStatus, calculateDaysUntilExpiration } from '@/lib/utils';
import { 
  Package, 
  Plus, 
  AlertTriangle, 
  Calendar,
  TrendingDown,
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface Product {
  productoId: number;
  nombre: string;
  presentacion: string;
  laboratorio: string;
  stockTotal: number;
  stockMinimo: number;
  precioVentaSugerido: number;
  activo: boolean;
  lotes: Array<{
    loteId: number;
    numeroLote: string;
    fechaVencimiento: string;
    cantidadDisponible: number;
    precioVentaLote: number;
  }>;
}

interface ExpiringLotes {
  expired: any[];
  critical: any[];
  warning: any[];
}

export function Inventory() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [expiringLotes, setExpiringLotes] = useState<ExpiringLotes>({ expired: [], critical: [], warning: [] });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const [productsRes, expiringRes, lowStockRes] = await Promise.all([
        fetch('/api/products?limit=100', { credentials: 'include' }),
        fetch('/api/inventory/lotes/expiring', { credentials: 'include' }),
        fetch('/api/inventory/products/low-stock', { credentials: 'include' })
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products);
      }

      if (expiringRes.ok) {
        const data = await expiringRes.json();
        setExpiringLotes(data);
      }

      if (lowStockRes.ok) {
        const data = await lowStockRes.json();
        setLowStockProducts(data);
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.laboratorio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatusColor = (current: number, minimum: number) => {
    if (current === 0) return 'text-red-600 bg-red-50';
    if (current <= minimum) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getExpirationStatusColor = (status: string) => {
    switch (status) {
      case 'expired': return 'text-red-600 bg-red-50';
      case 'critical': return 'text-orange-600 bg-orange-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
          <p className="text-gray-600 mt-1">
            Control integral de medicamentos y productos farmacéuticos
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={fetchInventoryData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          {(user?.rol === 'administrador' || user?.rol === 'inventario') && (
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Recibir Mercancía
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              Productos activos en inventario
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Productos bajo mínimo
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos a Vencer</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {expiringLotes.critical.length + expiringLotes.warning.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Lotes en alerta
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(
                products.reduce((sum, product) => 
                  sum + (product.stockTotal * product.precioVentaSugerido), 0
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total estimado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="expiring">Vencimientos</TabsTrigger>
          <TabsTrigger value="low-stock">Stock Bajo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                      {expiringLotes.expired.length}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <div className="font-medium text-orange-900">Crítico (≤ 6 meses)</div>
                      <div className="text-sm text-orange-600">Vencen pronto</div>
                    </div>
                    <Badge variant="warning" className="text-lg px-3 py-1">
                      {expiringLotes.critical.length}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <div className="font-medium text-yellow-900">Advertencia (7-12 meses)</div>
                      <div className="text-sm text-yellow-600">Monitorear</div>
                    </div>
                    <Badge variant="warning" className="text-lg px-3 py-1 bg-yellow-500">
                      {expiringLotes.warning.length}
                    </Badge>
                  </div>
                </div>

                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={() => setActiveTab('expiring')}
                >
                  Ver Detalles
                </Button>
              </CardContent>
            </Card>

            {/* Low Stock Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  Productos con Stock Bajo
                </CardTitle>
                <CardDescription>
                  Productos que requieren reabastecimiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <div key={product.productoId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{product.nombre}</div>
                        <div className="text-xs text-gray-500">{product.presentacion}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-red-600">
                          {product.stockTotal} / {product.stockMinimo}
                        </div>
                        <div className="text-xs text-gray-500">Actual / Mínimo</div>
                      </div>
                    </div>
                  ))}
                  
                  {lowStockProducts.length > 5 && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('low-stock')}
                    >
                      Ver todos ({lowStockProducts.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Catálogo de Productos</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar productos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <div key={product.productoId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{product.nombre}</h3>
                        <Badge 
                          className={getStockStatusColor(product.stockTotal, product.stockMinimo)}
                        >
                          Stock: {product.stockTotal}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{product.presentacion}</p>
                      <p className="text-xs text-gray-500">{product.laboratorio}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        {formatCurrency(product.precioVentaSugerido)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.lotes.length} lote(s)
                      </div>
                      {product.lotes[0] && (
                        <div className="text-xs text-gray-400">
                          Próximo vence: {formatDate(product.lotes[0].fechaVencimiento)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Reporte de Vencimientos
              </CardTitle>
              <CardDescription>
                Lotes organizados por estado de vencimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="critical">
                <TabsList>
                  <TabsTrigger value="expired" className="text-red-600">
                    Vencidos ({expiringLotes.expired.length})
                  </TabsTrigger>
                  <TabsTrigger value="critical" className="text-orange-600">
                    Críticos ({expiringLotes.critical.length})
                  </TabsTrigger>
                  <TabsTrigger value="warning" className="text-yellow-600">
                    Advertencia ({expiringLotes.warning.length})
                  </TabsTrigger>
                </TabsList>

                {['expired', 'critical', 'warning'].map((status) => (
                  <TabsContent key={status} value={status} className="space-y-3">
                    {expiringLotes[status as keyof ExpiringLotes].map((lote: any) => (
                      <div key={lote.loteId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{lote.producto.nombre}</h4>
                          <p className="text-sm text-gray-600">Lote: {lote.numeroLote}</p>
                          <p className="text-xs text-gray-500">{lote.producto.presentacion}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium px-2 py-1 rounded ${getExpirationStatusColor(getExpirationStatus(lote.fechaVencimiento))}`}>
                            {formatDate(lote.fechaVencimiento)}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {calculateDaysUntilExpiration(lote.fechaVencimiento)} días
                          </div>
                          <div className="text-sm text-gray-500">
                            Cantidad: {lote.cantidadDisponible}
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Productos con Stock Bajo
              </CardTitle>
              <CardDescription>
                Productos que han alcanzado o están por debajo del stock mínimo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div key={product.productoId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{product.nombre}</h4>
                      <p className="text-sm text-gray-600">{product.presentacion}</p>
                      <p className="text-xs text-gray-500">{product.laboratorio}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">
                          {product.stockTotal} / {product.stockMinimo}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Actual / Mínimo
                      </div>
                      <Button size="sm" className="mt-2 bg-orange-500 hover:bg-orange-600">
                        Generar Orden
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}