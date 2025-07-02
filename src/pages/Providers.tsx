import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { 
  Building, 
  Plus, 
  Search, 
  Edit, 
  Eye,
  Filter,
  Download,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  FileText,
  Package,
  TrendingUp,
  ShoppingCart
} from 'lucide-react';

interface Provider {
  proveedorId: number;
  nombre: string;
  nit: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  activo: boolean;
  _count: {
    ordenesCompra: number;
    actasRecepcion: number;
  };
}

interface Order {
  ordenId: number;
  numeroOrden: string;
  fechaOrden: string;
  estado: string;
  total: number;
  usuarioCreador: { nombre: string };
  _count: { detalleOrdenCompra: number };
}

export function Providers() {
  const { user } = useAuthStore();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    withOrders: 0,
    withReceptions: 0
  });

  useEffect(() => {
    fetchProviders();
    fetchProviderStats();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/providers', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderStats = async () => {
    try {
      const response = await fetch('/api/providers/stats', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching provider stats:', error);
    }
  };

  const fetchProviderDetails = async (providerId: number) => {
    try {
      const response = await fetch(`/api/providers/${providerId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedProvider(data);
        setOrders(data.ordenesCompra || []);
      }
    } catch (error) {
      console.error('Error fetching provider details:', error);
    }
  };

  const handleCreateProvider = async (formData: any) => {
    try {
      const response = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchProviders();
        await fetchProviderStats();
        setShowCreateForm(false);
        setActiveTab('list');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating provider:', error);
      alert('Error al crear proveedor');
    }
  };

  const filteredProviders = providers.filter(provider =>
    provider.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    provider.nit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    provider.contacto?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (activo: boolean) => {
    return activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getOrderStatusColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Enviada': return 'bg-blue-100 text-blue-800';
      case 'Recibida': return 'bg-purple-100 text-purple-800';
      case 'Completada': return 'bg-green-100 text-green-800';
      case 'Cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Building className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Gestión de Proveedores
            </h1>
            <Badge variant="outline" className="hidden sm:inline-flex">
              SIGFARMA-SENA
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Administra proveedores, órdenes de compra y seguimiento de entregas
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              fetchProviders();
              fetchProviderStats();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          
          {(user?.rol === 'administrador' || user?.rol === 'inventario') && (
            <Button
              onClick={() => {
                setShowCreateForm(true);
                setActiveTab('create');
              }}
              className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proveedor
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proveedores</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} activos
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Órdenes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.withOrders}</div>
            <p className="text-xs text-muted-foreground">
              Proveedores con órdenes
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Recepciones</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.withReceptions}</div>
            <p className="text-xs text-muted-foreground">
              Proveedores con entregas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.total > 0 ? Math.round((stats.withOrders / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Proveedores activos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1">
          <TabsTrigger 
            value="list" 
            className="flex items-center gap-2 py-3 px-4"
          >
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">Lista</span>
          </TabsTrigger>
          <TabsTrigger 
            value="details" 
            className="flex items-center gap-2 py-3 px-4"
            disabled={!selectedProvider}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Detalles</span>
          </TabsTrigger>
          <TabsTrigger 
            value="orders" 
            className="flex items-center gap-2 py-3 px-4"
            disabled={!selectedProvider}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Órdenes</span>
          </TabsTrigger>
          {showCreateForm && (
            <TabsTrigger 
              value="create" 
              className="flex items-center gap-2 py-3 px-4"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Crear</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Lista de Proveedores</CardTitle>
                  <CardDescription>
                    Gestiona la información de todos los proveedores
                  </CardDescription>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar proveedores..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  
                  <Button variant="outline" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredProviders.map((provider) => (
                  <div
                    key={provider.proveedorId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => {
                      fetchProviderDetails(provider.proveedorId);
                      setActiveTab('details');
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-foreground">{provider.nombre}</h3>
                        <Badge className={`text-xs ${getStatusColor(provider.activo)}`}>
                          {provider.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          NIT: {provider.nit || 'No registrado'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {provider.telefono || 'No registrado'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {provider.correo || 'No registrado'}
                        </div>
                      </div>

                      {provider.contacto && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          Contacto: {provider.contacto}
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-sm font-medium">
                        {provider._count.ordenesCompra} órdenes
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {provider._count.actasRecepcion} recepciones
                      </div>
                      
                      <div className="flex gap-1 mt-2">
                        <Button size="sm" variant="outline">
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
          {selectedProvider ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Provider Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Información del Proveedor
                  </CardTitle>
                  <CardDescription>
                    Datos de contacto y detalles comerciales
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{selectedProvider.nombre}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`${getStatusColor(selectedProvider.activo)}`}>
                        {selectedProvider.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {selectedProvider.nit && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">NIT</p>
                          <p className="text-sm text-muted-foreground">{selectedProvider.nit}</p>
                        </div>
                      </div>
                    )}

                    {selectedProvider.contacto && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
                        <Building className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Persona de Contacto</p>
                          <p className="text-sm text-muted-foreground">{selectedProvider.contacto}</p>
                        </div>
                      </div>
                    )}

                    {selectedProvider.telefono && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Teléfono</p>
                          <p className="text-sm text-muted-foreground">{selectedProvider.telefono}</p>
                        </div>
                      </div>
                    )}

                    {selectedProvider.correo && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Correo Electrónico</p>
                          <p className="text-sm text-muted-foreground">{selectedProvider.correo}</p>
                        </div>
                      </div>
                    )}

                    {selectedProvider.direccion && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Dirección</p>
                          <p className="text-sm text-muted-foreground">{selectedProvider.direccion}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas</CardTitle>
                  <CardDescription>
                    Resumen de actividad comercial
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedProvider._count?.ordenesCompra || 0}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">Órdenes de Compra</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedProvider._count?.actasRecepcion || 0}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">Recepciones</div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Button 
                      className="w-full"
                      onClick={() => setActiveTab('orders')}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Ver Órdenes de Compra
                    </Button>
                    
                    {(user?.rol === 'administrador' || user?.rol === 'inventario') && (
                      <Button variant="outline" className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Proveedor
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Selecciona un proveedor para ver sus detalles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {selectedProvider ? (
            <Card>
              <CardHeader>
                <CardTitle>Órdenes de Compra - {selectedProvider.nombre}</CardTitle>
                <CardDescription>
                  Historial de órdenes y seguimiento de entregas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay órdenes de compra registradas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.ordenId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{order.numeroOrden}</h4>
                            <Badge className={`text-xs ${getOrderStatusColor(order.estado)}`}>
                              {order.estado}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Creada por: {order.usuarioCreador.nombre} • {formatDateTime(order.fechaOrden)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {order._count.detalleOrdenCompra} productos
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(order.total)}
                          </div>
                          <Button size="sm" variant="outline" className="mt-1">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Selecciona un proveedor para ver sus órdenes</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {showCreateForm && (
          <TabsContent value="create" className="space-y-4">
            <ProviderForm
              onSubmit={handleCreateProvider}
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

// Provider Form Component
function ProviderForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    nombre: '',
    nit: '',
    contacto: '',
    telefono: '',
    correo: '',
    direccion: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      alert('El nombre del proveedor es requerido');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Crear Nuevo Proveedor
        </CardTitle>
        <CardDescription>
          Registra un nuevo proveedor en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre del Proveedor *</label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Farmacéutica Nacional S.A."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">NIT</label>
              <Input
                value={formData.nit}
                onChange={(e) => setFormData(prev => ({ ...prev, nit: e.target.value }))}
                placeholder="900123456-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Persona de Contacto</label>
              <Input
                value={formData.contacto}
                onChange={(e) => setFormData(prev => ({ ...prev, contacto: e.target.value }))}
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Teléfono</label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="(601) 234-5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Correo Electrónico</label>
              <Input
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value }))}
                placeholder="ventas@proveedor.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Dirección</label>
              <Input
                value={formData.direccion}
                onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                placeholder="Calle 100 #45-67, Bogotá"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              {loading ? 'Creando...' : 'Crear Proveedor'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}