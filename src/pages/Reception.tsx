import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { 
  Package, 
  Plus, 
  Search, 
  Truck,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  Eye,
  Edit,
  Calendar,
  User,
  Building
} from 'lucide-react';

interface Provider {
  proveedorId: number;
  nombre: string;
  nit: string;
  contacto: string;
  telefono: string;
}

interface Product {
  productoId: number;
  nombre: string;
  presentacion: string;
  laboratorio: string;
  unidadMedida: {
    nombre: string;
    abreviacion: string;
  };
}

interface ReceptionItem {
  productoId: number;
  producto?: Product;
  numeroLoteRecibido: string;
  fechaVencimientoRecibida: string;
  cantidadRecibida: number;
  precioCompraRecibido: number;
  notas?: string;
  tipoMovimiento: 'Ingreso' | 'Ajuste' | 'Bonificacion' | 'Faltante';
}

interface Reception {
  actaId: number;
  proveedor: { nombre: string };
  usuarioReceptor: { nombre: string };
  numeroFactura: string;
  fechaRecepcion: string;
  estado: string;
  tipoRecepcion: string;
  observaciones: string;
  detalleActaRecepcion: any[];
}

export function Reception() {
  const { user } = useAuthStore();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [numeroFactura, setNumeroFactura] = useState('');
  const [tipoRecepcion, setTipoRecepcion] = useState<'Normal' | 'Urgente' | 'Bonificacion' | 'Devolucion'>('Normal');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<ReceptionItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [providersRes, productsRes, receptionsRes] = await Promise.all([
        fetch('/api/providers', { credentials: 'include' }),
        fetch('/api/products?limit=1000', { credentials: 'include' }),
        fetch('/api/inventory/reception', { credentials: 'include' })
      ]);

      if (providersRes.ok) {
        const data = await providersRes.json();
        setProviders(data);
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products);
      }

      if (receptionsRes.ok) {
        const data = await receptionsRes.json();
        setReceptions(data.receptions);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const addItem = () => {
    if (!selectedProduct) return;

    const newItem: ReceptionItem = {
      productoId: selectedProduct.productoId,
      producto: selectedProduct,
      numeroLoteRecibido: '',
      fechaVencimientoRecibida: '',
      cantidadRecibida: 0,
      precioCompraRecibido: 0,
      tipoMovimiento: 'Ingreso',
      notas: ''
    };

    setItems([...items, newItem]);
    setSelectedProduct(null);
    setSearchQuery('');
  };

  const updateItem = (index: number, field: keyof ReceptionItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateExpirationAlert = (fechaVencimiento: string): string => {
    if (!fechaVencimiento) return 'verde';
    
    const today = new Date();
    const expDate = new Date(fechaVencimiento);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'vencido';
    if (diffDays <= 180) return 'rojo';
    if (diffDays <= 365) return 'amarillo';
    if (diffDays <= 730) return 'naranja'; // 2 años
    return 'verde';
  };

  const getAlertColor = (alert: string) => {
    switch (alert) {
      case 'vencido': return 'bg-red-600 text-white';
      case 'rojo': return 'bg-red-500 text-white';
      case 'amarillo': return 'bg-yellow-500 text-white';
      case 'naranja': return 'bg-orange-500 text-white';
      case 'verde': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const submitReception = async () => {
    if (!selectedProvider || items.length === 0) {
      alert('Selecciona un proveedor y agrega al menos un producto');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/inventory/reception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          proveedorId: selectedProvider,
          numeroFactura,
          tipoRecepcion,
          observaciones,
          items: items.map(item => ({
            productoId: item.productoId,
            numeroLoteRecibido: item.numeroLoteRecibido,
            fechaVencimientoRecibida: item.fechaVencimientoRecibida,
            cantidadRecibida: item.cantidadRecibida,
            precioCompraRecibido: item.precioCompraRecibido,
            tipoMovimiento: item.tipoMovimiento,
            notas: item.notas
          }))
        })
      });

      if (response.ok) {
        alert('Acta de recepción creada exitosamente');
        // Reset form
        setSelectedProvider(null);
        setNumeroFactura('');
        setObservaciones('');
        setItems([]);
        setTipoRecepcion('Normal');
        fetchInitialData();
        setActiveTab('list');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating reception:', error);
      alert('Error al crear la recepción');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.laboratorio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recepción de Mercancía</h1>
          <p className="text-gray-600 mt-1">
            Gestión de ingresos de inventario y actas de recepción
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Package className="w-4 h-4 mr-2" />
            {receptions.length} actas
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Nueva Recepción</TabsTrigger>
          <TabsTrigger value="list">Historial</TabsTrigger>
          <TabsTrigger value="bulk">Ingreso Masivo</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reception Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Información del Acta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="proveedor">Proveedor *</Label>
                      <select
                        id="proveedor"
                        value={selectedProvider || ''}
                        onChange={(e) => setSelectedProvider(Number(e.target.value))}
                        className="w-full p-2 border rounded-md"
                        required
                      >
                        <option value="">Seleccionar proveedor</option>
                        {providers.map(provider => (
                          <option key={provider.proveedorId} value={provider.proveedorId}>
                            {provider.nombre} - {provider.nit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="numeroFactura">Número de Factura</Label>
                      <Input
                        id="numeroFactura"
                        value={numeroFactura}
                        onChange={(e) => setNumeroFactura(e.target.value)}
                        placeholder="F-001234"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipoRecepcion">Tipo de Recepción</Label>
                      <select
                        id="tipoRecepcion"
                        value={tipoRecepcion}
                        onChange={(e) => setTipoRecepcion(e.target.value as any)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Urgente">Urgente</option>
                        <option value="Bonificacion">Bonificación</option>
                        <option value="Devolucion">Devolución</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="fecha">Fecha de Recepción</Label>
                      <Input
                        id="fecha"
                        type="date"
                        value={new Date().toISOString().split('T')[0]}
                        disabled
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <textarea
                      id="observaciones"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      className="w-full p-2 border rounded-md h-20"
                      placeholder="Observaciones generales de la recepción..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Product Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Agregar Productos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        placeholder="Buscar productos por nombre o laboratorio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    </div>

                    {searchQuery && filteredProducts.length > 0 && (
                      <div className="max-h-60 overflow-y-auto border rounded-md">
                        {filteredProducts.slice(0, 10).map(product => (
                          <div
                            key={product.productoId}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <div className="font-medium">{product.nombre}</div>
                            <div className="text-sm text-gray-600">
                              {product.presentacion} - {product.laboratorio}
                            </div>
                            <div className="text-xs text-gray-500">
                              Unidad: {product.unidadMedida.nombre}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedProduct && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{selectedProduct.nombre}</div>
                            <div className="text-sm text-gray-600">{selectedProduct.presentacion}</div>
                          </div>
                          <Button onClick={addItem} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Items List */}
              <Card>
                <CardHeader>
                  <CardTitle>Productos a Recibir ({items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No hay productos agregados</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{item.producto?.nombre}</h4>
                              <p className="text-sm text-gray-600">{item.producto?.presentacion}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs">Número de Lote *</Label>
                              <Input
                                value={item.numeroLoteRecibido}
                                onChange={(e) => updateItem(index, 'numeroLoteRecibido', e.target.value)}
                                placeholder="L001234"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Fecha de Vencimiento *</Label>
                              <Input
                                type="date"
                                value={item.fechaVencimientoRecibida}
                                onChange={(e) => updateItem(index, 'fechaVencimientoRecibida', e.target.value)}
                                className="h-8"
                              />
                              {item.fechaVencimientoRecibida && (
                                <Badge 
                                  className={`text-xs mt-1 ${getAlertColor(calculateExpirationAlert(item.fechaVencimientoRecibida))}`}
                                >
                                  {calculateExpirationAlert(item.fechaVencimientoRecibida).toUpperCase()}
                                </Badge>
                              )}
                            </div>
                            <div>
                              <Label className="text-xs">Cantidad *</Label>
                              <Input
                                type="number"
                                value={item.cantidadRecibida}
                                onChange={(e) => updateItem(index, 'cantidadRecibida', Number(e.target.value))}
                                placeholder="0"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Precio de Compra *</Label>
                              <Input
                                type="number"
                                value={item.precioCompraRecibido}
                                onChange={(e) => updateItem(index, 'precioCompraRecibido', Number(e.target.value))}
                                placeholder="0"
                                className="h-8"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div>
                              <Label className="text-xs">Tipo de Movimiento</Label>
                              <select
                                value={item.tipoMovimiento}
                                onChange={(e) => updateItem(index, 'tipoMovimiento', e.target.value)}
                                className="w-full p-1 border rounded text-sm h-8"
                              >
                                <option value="Ingreso">Ingreso Normal</option>
                                <option value="Bonificacion">Bonificación</option>
                                <option value="Ajuste">Ajuste</option>
                                <option value="Faltante">Faltante</option>
                              </select>
                            </div>
                            <div>
                              <Label className="text-xs">Notas</Label>
                              <Input
                                value={item.notas || ''}
                                onChange={(e) => updateItem(index, 'notas', e.target.value)}
                                placeholder="Observaciones del producto..."
                                className="h-8"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Productos:</span>
                      <span className="font-bold">{items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Unidades:</span>
                      <span className="font-bold">
                        {items.reduce((sum, item) => sum + item.cantidadRecibida, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor Total:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(
                          items.reduce((sum, item) => 
                            sum + (item.cantidadRecibida * item.precioCompraRecibido), 0
                          )
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Alertas de Vencimiento:</h4>
                    <div className="space-y-1 text-sm">
                      {['vencido', 'rojo', 'amarillo', 'naranja', 'verde'].map(alert => {
                        const count = items.filter(item => 
                          calculateExpirationAlert(item.fechaVencimientoRecibida) === alert
                        ).length;
                        if (count === 0) return null;
                        return (
                          <div key={alert} className="flex justify-between">
                            <Badge className={getAlertColor(alert)} variant="secondary">
                              {alert.toUpperCase()}
                            </Badge>
                            <span>{count} productos</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    onClick={submitReception}
                    disabled={loading || !selectedProvider || items.length === 0}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {loading ? (
                      'Procesando...'
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Crear Acta de Recepción
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Recepciones</CardTitle>
              <CardDescription>
                Todas las actas de recepción registradas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {receptions.map((reception) => (
                  <div key={reception.actaId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">Acta #{reception.actaId}</h3>
                        <Badge variant={reception.estado === 'Completada' ? 'default' : 'secondary'}>
                          {reception.estado}
                        </Badge>
                        <Badge variant="outline">
                          {reception.tipoRecepcion}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {reception.proveedor.nombre}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {reception.usuarioReceptor.nombre}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDateTime(reception.fechaRecepcion)}
                        </div>
                      </div>

                      {reception.numeroFactura && (
                        <div className="mt-2 text-xs text-gray-500">
                          Factura: {reception.numeroFactura}
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-sm font-medium">
                        {reception.detalleActaRecepcion.length} productos
                      </div>
                      <div className="text-xs text-gray-500">
                        {reception.detalleActaRecepcion.reduce((sum: number, detail: any) => 
                          sum + detail.cantidadRecibida, 0
                        )} unidades
                      </div>
                      
                      <div className="flex gap-1 mt-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {reception.estado === 'EnProceso' && (
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

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Ingreso Masivo de Inventario
              </CardTitle>
              <CardDescription>
                Herramienta para ingresar múltiples productos de forma rápida
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Próximamente</h3>
                <p className="text-gray-600">
                  Esta funcionalidad permitirá cargar archivos CSV o Excel para ingresos masivos
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}