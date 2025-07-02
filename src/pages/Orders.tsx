import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { OrdersHeader } from '@/components/orders/OrdersHeader';
import { OrdersStats } from '@/components/orders/OrdersStats';
import { OrdersList } from '@/components/orders/OrdersList';
import { OrderDetails } from '@/components/orders/OrderDetails';
import { OrderForm } from '@/components/orders/OrderForm';
import { ShoppingCart, Plus, Eye } from 'lucide-react';

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

  const canManageOrders = user?.rol === 'administrador' || user?.rol === 'inventario';

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

  const handleCreateOrder = async (orderData: any) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        await fetchOrders();
        await fetchOrderStats();
        setShowCreateForm(false);
        setActiveTab('list');
        alert('Orden de compra creada exitosamente');
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear la orden');
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

  const handleRefresh = () => {
    fetchOrders();
    fetchOrderStats();
  };

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
      <OrdersHeader
        onCreateOrder={() => {
          setShowCreateForm(true);
          setActiveTab('create');
        }}
        onRefresh={handleRefresh}
        onGenerateAutoOrders={handleGenerateAutoOrders}
        canManageOrders={canManageOrders}
      />

      {/* Stats */}
      <OrdersStats stats={stats} />

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
          <OrdersList
            orders={orders}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onSearchChange={setSearchQuery}
            onStatusFilterChange={setStatusFilter}
            onSelectOrder={(order) => {
              fetchOrderDetails(order.ordenId);
              setActiveTab('details');
            }}
            onCreateReception={handleCreateReceptionFromOrder}
            canManageOrders={canManageOrders}
          />
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
              canManageOrders={canManageOrders}
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
            <OrderForm
              onSubmit={handleCreateOrder}
              onCancel={() => {
                setShowCreateForm(false);
                setActiveTab('list');
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}