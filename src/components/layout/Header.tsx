import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  Sun, 
  Moon, 
  Building2,
  User,
  Package,
  AlertTriangle,
  Clock,
  Trash2,
  CheckCircle,
  X
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const farmaciaName = settings?.nombre_farmacia?.valor || 'SIGFARMA';

  useEffect(() => {
    fetchNotifications();
    
    // Configurar intervalo para actualizar notificaciones cada 2 minutos
    const interval = setInterval(fetchNotifications, 120000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Cerrar el panel de notificaciones al hacer clic fuera de él
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?unread=true&limit=10', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      // Actualizar localmente
      setNotifications(notifications.map(n => 
        n.notificacionId === notificationId 
          ? { ...n, fechaVisto: new Date().toISOString() }
          : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        credentials: 'include'
      });
      
      // Actualizar localmente
      setNotifications(notifications.map(n => ({ ...n, fechaVisto: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const dismissNotification = async (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      // Actualizar localmente
      setNotifications(notifications.filter(n => n.notificacionId !== notificationId));
      if (!notifications.find(n => n.notificacionId === notificationId)?.fechaVisto) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Marcar como leída
    if (!notification.fechaVisto) {
      markAsRead(notification.notificacionId);
    }
    
    // Navegar según el tipo de notificación
    if (notification.tipoNotificacion === 'StockBajo' || notification.tipoNotificacion === 'StockCritico') {
      navigate(`/products?id=${notification.producto.productoId}`);
    } else if (notification.tipoNotificacion === 'VencimientoCercano' || notification.tipoNotificacion === 'ProductoVencido') {
      navigate('/inventory?tab=expiring');
    } else if (notification.tipoNotificacion === 'ActaPendienteAprobacion') {
      navigate('/reception?tab=pending');
    } else if (notification.tipoNotificacion === 'BajaPendienteAprobacion') {
      navigate('/bajas-inventario?tab=pending');
    } else {
      navigate('/notifications');
    }
    
    setShowNotifications(false);
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'StockBajo':
      case 'StockCritico':
      case 'ReabastecimientoSugerido':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'VencimientoCercano':
      case 'ProductoVencido':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'ActaPendienteAprobacion':
        return <Clock className="w-4 h-4 text-purple-500" />;
      case 'BajaPendienteAprobacion':
        return <Trash2 className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        {/* Mobile logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex items-center justify-center w-6 h-6 bg-orange-500 rounded">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm">
            {farmaciaName}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div 
              ref={notificationsRef}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
            >
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium">Notificaciones</h3>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Marcar todas como leídas
                  </Button>
                )}
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay notificaciones</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.notificacionId}
                      className={`p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                        !notification.fechaVisto ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.tipoNotificacion)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <Badge className={
                              notification.prioridad === 'Critica' ? 'bg-red-500 text-white' :
                              notification.prioridad === 'Alta' ? 'bg-orange-500 text-white' :
                              notification.prioridad === 'Media' ? 'bg-yellow-500 text-white' :
                              'bg-blue-500 text-white'
                            }>
                              {notification.prioridad}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-gray-500"
                              onClick={(e) => dismissNotification(notification.notificacionId, e)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm font-medium mt-1 line-clamp-2">
                            {notification.mensaje}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDateTime(notification.fechaCreacion)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => {
                    navigate('/notifications');
                    setShowNotifications(false);
                  }}
                >
                  Ver todas las notificaciones
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* User info */}
        <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full">
            <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.nombre}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user?.rol?.charAt(0).toUpperCase() + user?.rol?.slice(1)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}