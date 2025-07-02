import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Eye,
  RefreshCw,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  X,
  Truck,
  FileText,
  Zap,
  Building
} from 'lucide-react';

interface Order {
  ordenId: number;
  numeroOrden: string;
  fechaOrden: string;
  fechaEntregaEsperada: string;
  estado: string;
  subtotal: number;
  impuestos: number;
  total: number;
  observaciones: string;
  proveedor: { nombre: string };
  usuarioCreador: { nombre: string };
  _count: { detalleOrdenCompra: number };
}

export function Orders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    sent: 0,
    received: 0,
    completed: 0
  });

  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const response = await fetch('/api/orders/stats', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handleGenerateAutoOrders = async () => {
    try {
      const response = await fetch('/api/orders/auto-generate', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchOrders();
        fetchOrderStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error generating auto orders:', error);
      alert('Error al generar órdenes automáticas');
    }
  };

  const handleCreateReceptionFromOrder = async (orderId: number) => {
    const numeroFactura = prompt('Número de factura (opcional):');
    const observaciones = prompt('Observaciones de la recepción:');
    
    if (observaciones === null) return; // User cancelled

    try {
      const response = await fetch(`/api/orders/${orderId}/create-reception`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ numeroFactura, observacionesReceptor: observaciones })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchOrders();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating reception from order:', error);
      alert('Error al crear acta de recepción');
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Enviada': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Recibida': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Completada': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Cancelada': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return Clock;
      case 'Enviada': return Truck;
      case 'Recibida': return Package;
      case 'Completada': return CheckCircle;
      case 'Cancelada': return X;
      default: return Clock;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.numeroOrden.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.proveedor.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.estado === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="container-responsive py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Órdenes de Compra
            </h1>
            <Badge variant="outline" className="hidden sm:inline-flex">
              SIGFARMA-SENA
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Gestiona órdenes de compra y seguimiento de entregas
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              fetchOrders();
              fetchOrderStats();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>

          {(user?.rol === 'administrador' || user?.rol === 'inventario') && (
            <>
              <Button
                onClick={handleGenerateAutoOrders}
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30"
              >
                <Zap className="w-4 h-4 mr-2" />
                Auto-Generar
              </Button>
              
              <Button
                onClick={() => {
                  setShowCreateForm(true);
                  setActiveTab('create');
                }}
                className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Orden
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Órdenes registradas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Por procesar</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">En tránsito</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibidas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.received}</div>
            <p className="text-xs text-muted-foreground">Por procesar</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Finalizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 h-auto p-1">
          <TabsTrigger 
            value="list" 
            className="flex items-center gap-2 py-3 px-4"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Lista de Órdenes</span>
          </TabsTrigger>
          <TabsTrigger 
            value="details" 
            className="flex items-center gap-2 py-3 px-4"
            disabled={!selectedOrder}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Detalles</span>
          </TabsTrigger>
          {showCreateForm && (
            <TabsTrigger 
              value="create" 
              className="flex items-center gap-2 py-3 px-4"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Crear Orden</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Lista de Órdenes de Compra</CardTitle>
                  <CardDescription>
                    Gestiona y da seguimiento a todas las órdenes
                  </CardDescription>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar órdenes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background text-foreground"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Enviada">Enviada</option>
                    <option value="Recibida">Recibida</option>
                    <option value="Completada">Completada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No se encontraron órdenes de compra</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => {
                    const StatusIcon = getStatusIcon(order.estado);
                    
                    return (
                      <div
                        key={order.ordenId}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => {
                          fetchOrderDetails(order.ordenId);
                          setActiveTab('details');
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-foreground">{order.numeroOrden}</h3>
                            <Badge className={`text-xs ${getStatusColor(order.estado)}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {order.estado}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              {order.proveedor.nombre}
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {order._count.detalleOrdenCompra} productos
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDateTime(order.fechaOrden)}
                            </div>
                          </div>

                          <div className="mt-1 text-xs text-muted-foreground">
                            Creada por: {order.usuarioCreador.nombre}
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <div className="font-bold text-green-600 dark:text-green-400 text-lg">
                            {formatCurrency(order.total)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Subtotal: {formatCurrency(order.subtotal)}
                          </div>
                          
                          <div className="flex gap-1 mt-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {order.estado === 'Recibida' && (user?.rol === 'administrador' || user?.rol === 'inventario') && (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateReceptionFromOrder(order.ordenId);
                                }}
                              >
                                <Package className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedOrder ? (
            <OrderDetails 
              order={selectedOrder} 
              onCreateReception={handleCreateReceptionFromOrder}
              onRefresh={() => {
                fetchOrderDetails(selectedOrder.ordenId);
                fetchOrders();
              }}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Selecciona una orden para ver sus detalles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {showCreateForm && (
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardContent className="text-center py-8">
                <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Formulario de creación de órdenes en desarrollo</p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// Order Details Component
function OrderDetails({ order, onCreateReception, onRefresh }: { 
  order: any; 
  onCreateReception: (orderId: number) => void;
  onRefresh: () => void;
}) {
  const { user } = useAuthStore();
  const StatusIcon = getStatusIcon(order.estado);

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Enviada': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Recibida': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Completada': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Cancelada': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return Clock;
      case 'Enviada': return Truck;
      case 'Recibida': return Package;
      case 'Completada': return CheckCircle;
      case 'Cancelada': return X;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Orden de Compra {order.numeroOrden}
              </CardTitle>
              <CardDescription>
                Detalles completos de la orden de compra
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(order.estado)}`}>
                <StatusIcon className="w-4 h-4 mr-2" />
                {order.estado}
              </Badge>
              
              {order.estado === 'Recibida' && (user?.rol === 'administrador' || user?.rol === 'inventario') && (
                <Button
                  onClick={() => onCreateReception(order.ordenId)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Crear Acta de Recepción
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
              <Building className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Proveedor</p>
                <p className="text-sm text-muted-foreground">{order.proveedor.nombre}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Creada por</p>
                <p className="text-sm text-muted-foreground">{order.usuarioCreador.nombre}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Fecha de Orden</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(order.fechaOrden)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(order.total)}</p>
              </div>
            </div>
          </div>

          {order.fechaEntregaEsperada && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Fecha de Entrega Esperada: {formatDateTime(order.fechaEntregaEsperada)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle>Productos Solicitados</CardTitle>
          <CardDescription>
            Detalle de todos los productos incluidos en esta orden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.detalleOrdenCompra.map((detail: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{detail.producto.nombre}</h4>
                    <p className="text-sm text-muted-foreground">{detail.producto.presentacion}</p>
                    <p className="text-xs text-muted-foreground">{detail.producto.laboratorio}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Cantidad Solicitada:</span>
                    <br />
                    {detail.cantidadSolicitada} unidades
                  </div>
                  <div>
                    <span className="font-medium">Cantidad Recibida:</span>
                    <br />
                    {detail.cantidadRecibida} unidades
                  </div>
                  <div>
                    <span className="font-medium">Precio Unitario:</span>
                    <br />
                    {formatCurrency(detail.precioUnitario)}
                  </div>
                  <div>
                    <span className="font-medium">Total Línea:</span>
                    <br />
                    <span className="text-green-600 dark:text-green-400 font-bold">
                      {formatCurrency(detail.totalLinea)}
                    </span>
                  </div>
                </div>

                {detail.notas && (
                  <div className="mt-2 p-2 bg-muted/50 dark:bg-muted/20 rounded text-sm">
                    <span className="font-medium">Notas:</span> {detail.notas}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-muted/50 dark:bg-muted/20 rounded-lg">
            <h4 className="font-medium mb-2">Resumen de la Orden</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Subtotal:</span>
                <br />
                {formatCurrency(order.subtotal)}
              </div>
              <div>
                <span className="font-medium">Impuestos (19%):</span>
                <br />
                {formatCurrency(order.impuestos)}
              </div>
              <div>
                <span className="font-medium">Total:</span>
                <br />
                <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observations */}
      {order.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle>Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {order.observaciones}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Receptions */}
      {order.actasRecepcion && order.actasRecepcion.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Actas de Recepción Relacionadas</CardTitle>
            <CardDescription>
              Recepciones generadas a partir de esta orden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.actasRecepcion.map((acta: any) => (
                <div key={acta.actaId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Acta #{acta.actaId}</h4>
                    <p className="text-sm text-muted-foreground">
                      Recibida por: {acta.usuarioReceptor.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {acta._count.detalleActaRecepcion} productos
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}