import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';
import { showSuccessMessage, showErrorMessage, showWarningMessage } from '@/lib/notifications';

import { 
  Package, 
  Plus, 
  Search, 
  X,
  Save,
  AlertTriangle,
  FileText,
  User
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
  registroInvima: string;
  fechaVencimientoRecibida: string;
  cantidadRecibida: number;
  precioCompraRecibido: number;
  notas?: string;
  tipoMovimiento: 'Ingreso' | 'Ajuste' | 'Bonificacion' | 'Faltante';
}

interface ReceptionFormProps {
  onReceptionCreated: () => void;
}

export function ReceptionForm({ onReceptionCreated }: ReceptionFormProps) {
  const { user } = useAuthStore();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [numeroFactura, setNumeroFactura] = useState('');
  const [tipoRecepcion, setTipoRecepcion] = useState<'Normal' | 'Urgente' | 'Bonificacion' | 'Devolucion'>('Normal');
  const [observacionesReceptor, setObservacionesReceptor] = useState('');
  const [items, setItems] = useState<ReceptionItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [providersRes, productsRes] = await Promise.all([
        fetch('/api/providers?simple=true', { credentials: 'include' }),
        fetch('/api/products?limit=1000', { credentials: 'include' })
      ]);

      if (providersRes.ok) {
        const data = await providersRes.json();
        // Ensure data is an array
        if (Array.isArray(data)) {
          setProviders(data);
        } else {
          console.error('Expected array of providers but got:', data);
          setProviders([]);
        }
      } else {
        console.error('Failed to fetch providers:', providersRes.statusText);
        setProviders([]);
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      } else {
        console.error('Failed to fetch products:', productsRes.statusText);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setProviders([]);
      setProducts([]);
    }
  };

  const addItem = () => {
    if (!selectedProduct) return;

    const newItem: ReceptionItem = {
      productoId: selectedProduct.productoId,
      producto: selectedProduct,
      numeroLoteRecibido: '',
      registroInvima: '',
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
    if (diffDays <= 730) return 'naranja';
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
      showWarningMessage('Selecciona un proveedor y agrega al menos un producto');
      return;
    }

    // Validar que todos los items tengan datos completos
    const invalidItems = items.filter(item => 
      !item.numeroLoteRecibido || 
      !item.fechaVencimientoRecibida || 
      item.cantidadRecibida <= 0 || 
      item.precioCompraRecibido <= 0
    );

    if (invalidItems.length > 0) {
      showWarningMessage('Completa todos los campos requeridos de los productos');
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
          observacionesReceptor,
          items: items.map(item => ({
            productoId: item.productoId,
            numeroLoteRecibido: item.numeroLoteRecibido,
            registroInvima: item.registroInvima,
            fechaVencimientoRecibida: item.fechaVencimientoRecibida,
            cantidadRecibida: item.cantidadRecibida,
            precioCompraRecibido: item.precioCompraRecibido,
            tipoMovimiento: item.tipoMovimiento,
            notas: item.notas
          }))
        })
      });

      if (response.ok) {
        showSuccessMessage('Acta de recepción creada exitosamente. Pendiente de aprobación por un administrador.');
        // Reset form
        setSelectedProvider(null);
        setNumeroFactura('');
        setObservacionesReceptor('');
        setItems([]);
        setTipoRecepcion('Normal');
        onReceptionCreated();
      } else {
        const error = await response.json();
        showErrorMessage(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating reception:', error);
      showErrorMessage('Error al crear la recepción');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.laboratorio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Reception Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Nueva Acta de Recepción
            </CardTitle>
            <CardDescription>
              Registra la recepción de mercancía. Requiere aprobación administrativa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proveedor">Proveedor *</Label>
                <select
                  id="proveedor"
                  value={selectedProvider || ''}
                  onChange={(e) => setSelectedProvider(Number(e.target.value) || null)}
                  className="w-full p-2 border rounded-md bg-background text-foreground"
                  required
                >
                  <option value="">Seleccionar proveedor</option>
                  {Array.isArray(providers) && providers.map(provider => (
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
                  className="w-full p-2 border rounded-md bg-background text-foreground"
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
              <Label htmlFor="observacionesReceptor">Observaciones del Receptor</Label>
              <textarea
                id="observacionesReceptor"
                value={observacionesReceptor}
                onChange={(e) => setObservacionesReceptor(e.target.value)}
                className="w-full p-2 border rounded-md h-20 bg-background text-foreground"
                placeholder="Observaciones sobre la recepción, estado de los productos, etc..."
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
                      className="p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="font-medium">{product.nombre}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.presentacion} - {product.laboratorio}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Unidad: {product.unidadMedida.nombre}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedProduct && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{selectedProduct.nombre}</div>
                      <div className="text-sm text-muted-foreground">{selectedProduct.presentacion}</div>
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
              <div className="text-center py-8 text-muted-foreground">
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
                        <p className="text-sm text-muted-foreground">{item.producto?.presentacion}</p>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                        <Label className="text-xs">Registro INVIMA</Label>
                        <Input
                          value={item.registroInvima}
                          onChange={(e) => updateItem(index, 'registroInvima', e.target.value)}
                          placeholder="INVIMA 2023M-0001234"
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
                      <div>
                        <Label className="text-xs">Tipo de Movimiento</Label>
                        <select
                          value={item.tipoMovimiento}
                          onChange={(e) => updateItem(index, 'tipoMovimiento', e.target.value)}
                          className="w-full p-1 border rounded text-sm h-8 bg-background text-foreground"
                        >
                          <option value="Ingreso">Ingreso Normal</option>
                          <option value="Bonificacion">Bonificación</option>
                          <option value="Ajuste">Ajuste</option>
                          <option value="Faltante">Faltante</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Label className="text-xs">Notas del Producto</Label>
                      <Input
                        value={item.notas || ''}
                        onChange={(e) => updateItem(index, 'notas', e.target.value)}
                        placeholder="Observaciones específicas del producto..."
                        className="h-8"
                      />
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
            <CardTitle>Resumen de Recepción</CardTitle>
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

            <div className="border-t pt-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">Proceso de Aprobación</span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Esta acta será enviada para aprobación administrativa antes de ser cargada al inventario.
                </p>
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
                  Enviar para Aprobación
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información del Receptor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Nombre:</span> {user?.nombre}
              </div>
              <div>
                <span className="font-medium">Correo:</span> {user?.correo}
              </div>
              <div>
                <span className="font-medium">Rol:</span> {user?.rol}
              </div>
              <div>
                <span className="font-medium">Fecha:</span> {new Date().toLocaleDateString('es-CO')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}