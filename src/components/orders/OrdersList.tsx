import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { 
  Search, 
  Eye, 
  Package, 
  Clock, 
  Truck, 
  CheckCircle, 
  X, 
  Building, 
  FileText,
  ShoppingCart
} from 'lucide-react';

interface Order {
  ordenId: number;
  numeroOrden: string;
  fechaOrden: string;
  estado: string;
  subtotal: number;
  total: number;
  proveedor: { nombre: string };
  usuarioCreador: { nombre: string };
  _count: { detalleOrdenCompra: number };
}

interface OrdersListProps {
  orders: Order[];
  searchQuery: string;
  statusFilter: string;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onSelectOrder: (order: Order) => void;
  onCreateReception: (orderId: number) => void;
  canManageOrders: boolean;
}

export function OrdersList({
  orders,
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onSelectOrder,
  onCreateReception,
  canManageOrders
}: OrdersListProps) {
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

  return (
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
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
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
                  onClick={() => onSelectOrder(order)}
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
                      
                      {order.estado === 'Recibida' && canManageOrders && (
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateReception(order.ordenId);
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
  );
}