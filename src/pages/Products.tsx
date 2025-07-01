import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Eye,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  Thermometer,
  Shield
} from 'lucide-react';

interface Product {
  productoId: number;
  codigoBarras: string;
  nombre: string;
  principioActivo: string;
  concentracion: string;
  formaFarmaceutica: string;
  presentacion: string;
  laboratorio: string;
  registroSanitario: string;
  requiereRefrigeracion: boolean;
  esControlado: boolean;
  stockTotal: number;
  stockMinimo: number;
  precioVentaSugerido: number;
  aplicaIva: boolean;
  activo: boolean;
  fechaCreacion: string;
  lotes: Array<{
    loteId: number;
    numeroLote: string;
    fechaVencimiento: string;
    cantidadDisponible: number;
    precioVentaLote: number;
  }>;
}

export function Products() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products?limit=100', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.codigoBarras?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.principioActivo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.laboratorio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatusColor = (current: number, minimum: number) => {
    if (current === 0) return 'bg-red-100 text-red-800';
    if (current <= minimum) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockStatusText = (current: number, minimum: number) => {
    if (current === 0) return 'Sin Stock';
    if (current <= minimum) return 'Stock Bajo';
    return 'Stock Normal';
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
          <p className="text-gray-600 mt-1">
            Catálogo completo de medicamentos y productos farmacéuticos
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={fetchProducts} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          {(user?.rol === 'administrador' || user?.rol === 'inventario') && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              Productos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Controlados</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {products.filter(p => p.esControlado).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Medicamentos controlados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refrigeración</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {products.filter(p => p.requiereRefrigeracion).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren frío
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {products.filter(p => p.stockTotal <= p.stockMinimo).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Necesitan reposición
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Lista de Productos</TabsTrigger>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          {showCreateForm && <TabsTrigger value="create">Crear Producto</TabsTrigger>}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
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
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{product.nombre}</h3>
                        {product.esControlado && (
                          <Badge variant="destructive" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Controlado
                          </Badge>
                        )}
                        {product.requiereRefrigeracion && (
                          <Badge variant="secondary" className="text-xs">
                            <Thermometer className="w-3 h-3 mr-1" />
                            Refrigeración
                          </Badge>
                        )}
                        <Badge 
                          className={`text-xs ${getStockStatusColor(product.stockTotal, product.stockMinimo)}`}
                        >
                          {getStockStatusText(product.stockTotal, product.stockMinimo)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Presentación:</span>
                          <br />
                          {product.presentacion}
                        </div>
                        <div>
                          <span className="font-medium">Laboratorio:</span>
                          <br />
                          {product.laboratorio}
                        </div>
                        <div>
                          <span className="font-medium">Principio Activo:</span>
                          <br />
                          {product.principioActivo}
                        </div>
                        <div>
                          <span className="font-medium">Concentración:</span>
                          <br />
                          {product.concentracion}
                        </div>
                      </div>

                      {product.codigoBarras && (
                        <div className="mt-2 text-xs text-gray-500">
                          Código: {product.codigoBarras}
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <div className="font-bold text-green-600 text-lg">
                        {formatCurrency(product.precioVentaSugerido)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Stock: {product.stockTotal} / Min: {product.stockMinimo}
                      </div>
                      <div className="text-xs text-gray-400">
                        {product.lotes.length} lote(s) disponible(s)
                      </div>
                      
                      <div className="flex gap-1 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProduct(product);
                            setActiveTab('details');
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(user?.rol === 'administrador' || user?.rol === 'inventario') && (
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedProduct ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Información del Producto</CardTitle>
                  <CardDescription>
                    Detalles completos del medicamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Nombre</Label>
                      <p className="font-medium">{selectedProduct.nombre}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Código de Barras</Label>
                      <p className="font-mono text-sm">{selectedProduct.codigoBarras || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Principio Activo</Label>
                      <p>{selectedProduct.principioActivo}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Concentración</Label>
                      <p>{selectedProduct.concentracion}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Forma Farmacéutica</Label>
                      <p>{selectedProduct.formaFarmaceutica}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Presentación</Label>
                      <p>{selectedProduct.presentacion}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Laboratorio</Label>
                      <p>{selectedProduct.laboratorio}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Registro Sanitario</Label>
                      <p className="font-mono text-sm">{selectedProduct.registroSanitario}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Precio Sugerido</Label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(selectedProduct.precioVentaSugerido)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Aplica IVA</Label>
                      <p>{selectedProduct.aplicaIva ? 'Sí' : 'No'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {selectedProduct.esControlado && (
                      <Badge variant="destructive">
                        <Shield className="w-3 h-3 mr-1" />
                        Medicamento Controlado
                      </Badge>
                    )}
                    {selectedProduct.requiereRefrigeracion && (
                      <Badge variant="secondary">
                        <Thermometer className="w-3 h-3 mr-1" />
                        Requiere Refrigeración
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stock and Lots */}
              <Card>
                <CardHeader>
                  <CardTitle>Stock y Lotes</CardTitle>
                  <CardDescription>
                    Información de inventario actual
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Stock Total</Label>
                      <p className="text-2xl font-bold">{selectedProduct.stockTotal}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Stock Mínimo</Label>
                      <p className="text-2xl font-bold text-orange-600">{selectedProduct.stockMinimo}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2 block">Lotes Disponibles</Label>
                    <div className="space-y-2">
                      {selectedProduct.lotes.map((lote) => (
                        <div key={lote.loteId} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Lote: {lote.numeroLote}</p>
                              <p className="text-sm text-gray-600">
                                Vence: {formatDate(lote.fechaVencimiento)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{lote.cantidadDisponible} unidades</p>
                              <p className="text-sm text-green-600">
                                {formatCurrency(lote.precioVentaLote)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {selectedProduct.lotes.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No hay lotes disponibles</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-gray-500">Selecciona un producto para ver sus detalles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {showCreateForm && (
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Crear Nuevo Producto</CardTitle>
                <CardDescription>
                  Registra un nuevo medicamento en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre del Producto *</Label>
                    <Input id="nombre" placeholder="Ej: Acetaminofén 500mg" />
                  </div>
                  <div>
                    <Label htmlFor="codigoBarras">Código de Barras</Label>
                    <Input id="codigoBarras" placeholder="7702132001234" />
                  </div>
                  <div>
                    <Label htmlFor="principioActivo">Principio Activo</Label>
                    <Input id="principioActivo" placeholder="Acetaminofén" />
                  </div>
                  <div>
                    <Label htmlFor="concentracion">Concentración</Label>
                    <Input id="concentracion" placeholder="500mg" />
                  </div>
                  <div>
                    <Label htmlFor="formaFarmaceutica">Forma Farmacéutica</Label>
                    <Input id="formaFarmaceutica" placeholder="Tableta" />
                  </div>
                  <div>
                    <Label htmlFor="presentacion">Presentación *</Label>
                    <Input id="presentacion" placeholder="Caja x 20 tabletas" />
                  </div>
                  <div>
                    <Label htmlFor="laboratorio">Laboratorio</Label>
                    <Input id="laboratorio" placeholder="Genfar" />
                  </div>
                  <div>
                    <Label htmlFor="registroSanitario">Registro Sanitario</Label>
                    <Input id="registroSanitario" placeholder="INVIMA 2023M-0001234" />
                  </div>
                  <div>
                    <Label htmlFor="precioVenta">Precio de Venta Sugerido *</Label>
                    <Input id="precioVenta" type="number" placeholder="3500" />
                  </div>
                  <div>
                    <Label htmlFor="stockMinimo">Stock Mínimo *</Label>
                    <Input id="stockMinimo" type="number" placeholder="50" />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Crear Producto
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateForm(false);
                      setActiveTab('list');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}