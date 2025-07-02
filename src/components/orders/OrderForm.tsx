import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  X, 
  Save, 
  Building, 
  Package, 
  Calculator
} from 'lucide-react';

interface Provider {
  proveedorId: number;
  nombre: string;
  nit: string;
  contacto: string;
}

interface Product {
  productoId: number;
  nombre: string;
  presentacion: string;
  laboratorio: string;
  precioVentaSugerido: number;
  stockTotal: number;
  stockMinimo: number;
}

interface OrderItem {
  productoId: number;
  producto?: Product;
  cantidadSolicitada: number;
  precioUnitario: number;
  notas?: string;
}

interface OrderFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function OrderForm({ onSubmit, onCancel }: OrderFormProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [fechaEntregaEsperada, setFechaEntregaEsperada] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [providersRes, productsRes] = await Promise.all([
        fetch('/api/providers', { credentials: 'include' }),
        fetch('/api/products?limit=1000', { credentials: 'include' })
      ]);

      if (providersRes.ok) {
        const data = await providersRes.json();
        setProviders(data.providers);
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const addItem = () => {
    if (!selectedProduct) return;

    const estimatedPrice = Number(selectedProduct.precioVentaSugerido) * 0.7; // 70% del precio de venta

    const newItem: OrderItem = {
      productoId: selectedProduct.productoId,
      producto: selectedProduct,
      cantidadSolicitada: Math.max(selectedProduct.stockMaximo - selectedProduct.stockTotal, selectedProduct.stockMinimo),
      precioUnitario: estimatedPrice,
      notas: ''
    };

    setItems([...items, newItem]);
    setSelectedProduct(null);
    setSearchQuery('');
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.cantidadSolicitada * item.precioUnitario), 0);
    const impuestos = subtotal * 0.19; // 19% IVA
    const total = subtotal + impuestos;
    return { subtotal, impuestos, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProvider || items.length === 0) {
      alert('Selecciona un proveedor y agrega al menos un producto');
      return;
    }

    const invalidItems = items.filter(item => 
      item.cantidadSolicitada <= 0 || item.precioUnitario <= 0
    );

    if (invalidItems.length > 0) {
      alert('Completa todos los campos requeridos de los productos');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        proveedorId: selectedProvider,
        fechaEntregaEsperada: fechaEntregaEsperada || null,
        observaciones,
        items: items.map(item => ({
          productoId: item.productoId,
          cantidadSolicitada: item.cantidadSolicitada,
          precioUnitario: item.precioUnitario,
          notas: item.notas
        }))
      });
    } catch (error: any) {
      alert(error.message || 'Error al crear la orden');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.laboratorio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { subtotal, impuestos, total } = calculateTotals();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Order Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nueva Orden de Compra
            </CardTitle>
            <CardDescription>
              Crea una nueva orden de compra para un proveedor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proveedor">Proveedor *</Label>
                <select
                  id="proveedor"
                  value={selectedProvider || ''}
                  onChange={(e) => setSelectedProvider(Number(e.target.value))}
                  className="w-full p-2 border rounded-md bg-background text-foreground"
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
                <Label htmlFor="fechaEntrega">Fecha de Entrega Esperada</Label>
                <Input
                  id="fechaEntrega"
                  type="date"
                  value={fechaEntregaEsperada}
                  onChange={(e) => setFechaEntregaEsperada(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <textarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full p-2 border rounded-md h-20 bg-background text-foreground"
                placeholder="Observaciones sobre la orden..."
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
                        Stock: {product.stockTotal} / Mínimo: {product.stockMinimo}
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
                      <div className="text-xs text-muted-foreground">
                        Stock actual: {selectedProduct.stockTotal} | Mínimo: {selectedProduct.stockMinimo}
                      </div>
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
            <CardTitle>Productos en la Orden ({items.length})</CardTitle>
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Cantidad Solicitada *</Label>
                        <Input
                          type="number"
                          value={item.cantidadSolicitada}
                          onChange={(e) => updateItem(index, 'cantidadSolicitada', Number(e.target.value))}
                          placeholder="0"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Precio Unitario *</Label>
                        <Input
                          type="number"
                          value={item.precioUnitario}
                          onChange={(e) => updateItem(index, 'precioUnitario', Number(e.target.value))}
                          placeholder="0"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Total Línea</Label>
                        <div className="h-8 flex items-center text-sm font-medium text-green-600">
                          {formatCurrency(item.cantidadSolicitada * item.precioUnitario)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Label className="text-xs">Notas</Label>
                      <Input
                        value={item.notas || ''}
                        onChange={(e) => updateItem(index, 'notas', e.target.value)}
                        placeholder="Observaciones del producto..."
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
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Resumen de la Orden
            </CardTitle>
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
                  {items.reduce((sum, item) => sum + item.cantidadSolicitada, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA (19%):</span>
                <span className="font-bold">{formatCurrency(impuestos)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedProvider || items.length === 0}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {loading ? (
                'Creando...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Orden de Compra
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </CardContent>
        </Card>

        {/* Provider Info */}
        {selectedProvider && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Información del Proveedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {providers.find(p => p.proveedorId === selectedProvider) && (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Nombre:</span>{' '}
                    {providers.find(p => p.proveedorId === selectedProvider)?.nombre}
                  </div>
                  <div>
                    <span className="font-medium">NIT:</span>{' '}
                    {providers.find(p => p.proveedorId === selectedProvider)?.nit}
                  </div>
                  <div>
                    <span className="font-medium">Contacto:</span>{' '}
                    {providers.find(p => p.proveedorId === selectedProvider)?.contacto}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}