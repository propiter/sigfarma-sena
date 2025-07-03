import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { formatDateTime } from '@/lib/utils';
import { 
  Bell, 
  AlertTriangle, 
  Package, 
  Calendar,
  TrendingDown,
  CheckCircle,
  X,
  Eye,
  Settings,
  Filter,
  Trash2,
  Clock
} from 'lucide-react';
import { showSuccessMessage, showErrorMessage } from '@/lib/notifications';

export function Notifications() {
  const { user } = useAuthStore();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    dismissNotification 
  } = useNotificationStore();
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showErrorMessage('Error al marcar notificación como leída');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      showSuccessMessage('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      showErrorMessage('Error al marcar todas las notificaciones como leídas');
    }
  };

  const handleDismissNotification = async (notificationId: number) => {
    try {
      await dismissNotification(notificationId);
      showSuccessMessage('Notificación descartada');
    } catch (error) {
      console.error('Error dismissing notification:', error);
      showErrorMessage('Error al descartar notificación');
    }
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'StockBajo':
      case 'StockCritico':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'VencimientoCercano':
      case 'ProductoVencido':
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case 'ReabastecimientoSugerido':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'ActaPendienteAprobacion':
        return <Clock className="w-5 h-5 text-purple-500" />;
      case 'BajaPendienteAprobacion':
        return <Trash2 className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'Critica': return 'bg-red-500 text-white';
      case 'Alta': return 'bg-orange-500 text-white';
      case 'Media': return 'bg-yellow-500 text-white';
      case 'Baja': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.fechaVisto;
    if (filter === 'high') return notification.prioridad === 'Alta' || notification.prioridad === 'Critica';
    return true;
  });

  const highPriorityCount = notifications.filter(n => 
    (n.prioridad === 'Alta' || n.prioridad === 'Critica') && !n.fechaVisto
  ).length;

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Centro de Notificaciones</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Alertas y notificaciones del sistema de inventario
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Bell className="w-4 h-4 mr-2" />
            {unreadCount} sin leer
          </Badge>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {notifications.filter(n => n.prioridad === 'Critica' && !n.fechaVisto).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención inmediata
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridad</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {notifications.filter(n => n.prioridad === 'Alta' && !n.fechaVisto).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Stock bajo y vencimientos
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activas</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {notifications.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Notificaciones activas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leídas Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {notifications.filter(n => 
                n.fechaVisto && 
                new Date(n.fechaVisto).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Procesadas hoy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">
              Todas ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Sin Leer ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="high">
              Alta Prioridad ({highPriorityCount})
            </TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        <TabsContent value={filter} className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay notificaciones para mostrar</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <div 
                      key={notification.notificacionId} 
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        !notification.fechaVisto ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getNotificationIcon(notification.tipoNotificacion)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getPriorityColor(notification.prioridad)}>
                                {notification.prioridad}
                              </Badge>
                              <Badge variant="outline">
                                {notification.tipoNotificacion.replace(/([A-Z])/g, ' $1').trim()}
                              </Badge>
                              {!notification.fechaVisto && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                  Nuevo
                                </Badge>
                              )}
                            </div>
                            
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {notification.producto.nombre}
                            </h3>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              {notification.mensaje}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>{notification.producto.presentacion}</span>
                              <span>Stock: {notification.producto.stockTotal}</span>
                              <span>Mínimo: {notification.producto.stockMinimo}</span>
                              <span>{formatDateTime(notification.fechaCreacion)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {!notification.fechaVisto && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsRead(notification.notificacionId)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismissNotification(notification.notificacionId);
                            }}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}