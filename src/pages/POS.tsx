import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { showSuccessMessage, showErrorMessage, showWarningMessage } from '@/lib/notifications';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface Product {
  productoId: number;
  nombre: string;
  presentacion: string;
  laboratorio: string;
  stockTotal: number;
  precioVentaSugerido: number;
  esControlado: boolean;
  requiereRefrigeracion: boolean;
  lotes: Array<{
    loteId: number;
    numeroLote: string;
    fechaVencimiento: string;
    cantidadDisponible: number;
    precioVentaLote: number;
  }>;
}

interface CartItem {
  productoId: number;
  nombre: string;
  presentacion: string;
  cantidad: number;
  precioUnitario: number;
  stockDisponible: number;
  esControlado: boolean;
  requiereRefrigeracion: boolean;
}

export function POS() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [amountReceived, setAmountReceived] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await fetch(`/api/products/search/${encodeURIComponent(searchQuery)}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const products = await response.json();
          setSearchResults(products);
        }
      } catch (error) {
        console.error('Error searching products:', error);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productoId === product.productoId);
    
    if (existingItem) {
      updateQuantity(product.productoId, existingItem.cantidad + 1);
    } else {
      const newItem: CartItem = {
        productoId: product.productoId,
        nombre: product.nombre,
        presentacion: product.presentacion,
        cantidad: 1,
        precioUnitario: product.lotes[0]?.precioVentaLote || product.precioVentaSugerido,
        stockDisponible: product.stockTotal,
        esControlado: product.esControlado,
        requiereRefrigeracion: product.requiereRefrigeracion
      };
      setCart([...cart, newItem]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateQuantity = (productoId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productoId);
      return;
    }

    setCart(cart.map(item => 
      item.productoId === productoId 
        ? { ...item, cantidad: Math.min(newQuantity, item.stockDisponible) }
        : item
    ));
  };

  const removeFromCart = (productoId: number) => {
    setCart(cart.filter(item => item.productoId !== productoId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
    const iva = subtotal * 0.19; // 19% IVA
    const total = subtotal + iva;
    
    return { subtotal, iva, total };
  };

  const processSale = async () => {
    if (cart.length === 0) return;

    setProcessingPayment(true);
    try {
      const items = cart.map(item => ({
        productoId: item.productoId,
        cantidad: item.cantidad
      }));

      const response = await fetch('/api/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items,
          metodoPago: paymentMethod,
          descuentoTotal: 0
        })
      });

      if (response.ok) {
        const sale = await response.json();
        // Reset cart and show success
        setCart([]);
        setShowPayment(false);
        setAmountReceived('');
        showSuccessMessage(`Venta #${sale.ventaId} completada exitosamente`);
      } else {
        const error = await response.json();
        showErrorMessage(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      showErrorMessage('Error al procesar la venta');
    } finally {
      setProcessingPayment(false);
    }
  };

  const { subtotal, iva, total } = calculateTotals();
  const change = amountReceived ? Math.max(0, Number(amountReceived) - total) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Punto de Venta</h1>
          <p className="text-gray-600 mt-1">
            Cajero: {user?.nombre} • {new Date().toLocaleDateString('es-CO')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <ShoppingCart className="w-4 h-4 mr-2" />
            {cart.length} productos
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Buscar Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Input
                  placeholder="Buscar por nombre, código de barras o principio activo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-lg h-12"
                  autoFocus
                />
                <Search className="absolute right-3 top-3 w-6 h-6 text-gray-400" />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div
                      key={product.productoId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{product.nombre}</h3>
                          {product.esControlado && (
                            <Badge variant="destructive" className="text-xs">Controlado</Badge>
                          )}
                          {product.requiereRefrigeracion && (
                            <Badge variant="secondary" className="text-xs">Refrigeración</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{product.presentacion}</p>
                        <p className="text-xs text-gray-500">{product.laboratorio}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {formatCurrency(product.lotes[0]?.precioVentaLote || product.precioVentaSugerido)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Stock: {product.stockTotal}
                        </div>
                        {product.lotes[0] && (
                          <div className="text-xs text-gray-400">
                            Vence: {formatDate(product.lotes[0].fechaVencimiento)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle>Productos en Venta</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay productos agregados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.productoId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.nombre}</h4>
                          {item.esControlado && (
                            <Badge variant="destructive" className="text-xs">Controlado</Badge>
                          )}
                          {item.requiereRefrigeracion && (
                            <Badge variant="secondary" className="text-xs">Refrigeración</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{item.presentacion}</p>
                        <p className="text-sm font-medium text-green-600">
                          {formatCurrency(item.precioUnitario)} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}
                          className="h-8 w-8"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.cantidad}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}
                          disabled={item.cantidad >= item.stockDisponible}
                          className="h-8 w-8"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.productoId)}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Venta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA (19%):</span>
                  <span>{formatCurrency(iva)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {!showPayment ? (
                <Button
                  onClick={() => setShowPayment(true)}
                  disabled={cart.length === 0}
                  className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Procesar Pago
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Método de Pago</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>

                  {paymentMethod === 'efectivo' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Dinero Recibido</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="text-lg"
                      />
                      {amountReceived && Number(amountReceived) >= total && (
                        <div className="mt-2 p-2 bg-green-50 rounded-md">
                          <div className="flex justify-between text-sm">
                            <span>Cambio:</span>
                            <span className="font-bold text-green-600">
                              {formatCurrency(change)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowPayment(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={processSale}
                      disabled={
                        processingPayment ||
                        (paymentMethod === 'efectivo' && Number(amountReceived) < total)
                      }
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {processingPayment ? (
                        'Procesando...'
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="w-4 h-4 mr-2" />
                Consultar Precio
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Package className="w-4 h-4 mr-2" />
                Verificar Stock
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Reportar Problema
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}