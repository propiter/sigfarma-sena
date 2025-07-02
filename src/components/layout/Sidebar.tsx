import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  Settings,
  LogOut,
  Activity,
  Bell,
  Truck,
  Building,
  X
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['administrador', 'cajero', 'inventario'] },
  { name: 'Punto de Venta', href: '/pos', icon: ShoppingCart, roles: ['administrador', 'cajero'] },
  { name: 'Inventario', href: '/inventory', icon: Package, roles: ['administrador', 'inventario'] },
  { name: 'Productos', href: '/products', icon: Activity, roles: ['administrador', 'inventario'] },
  { name: 'Proveedores', href: '/providers', icon: Building, roles: ['administrador', 'inventario'] },
  { name: 'Órdenes de Compra', href: '/orders', icon: Truck, roles: ['administrador', 'inventario'] },
  { name: 'Recepciones', href: '/reception', icon: Activity, roles: ['administrador', 'inventario'] },
  { name: 'Reportes', href: '/reports', icon: FileText, roles: ['administrador', 'cajero', 'inventario'] },
  { name: 'Notificaciones', href: '/notifications', icon: Bell, roles: ['administrador', 'cajero', 'inventario'] },
  { name: 'Usuarios', href: '/users', icon: Users, roles: ['administrador'] },
  { name: 'Configuración', href: '/settings', icon: Settings, roles: ['administrador'] },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications] = useState(0); // TODO: Connect to notifications store

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      navigate('/login');
    }
  };

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.rol || '')
  );

  const farmaciaName = settings?.nombre_farmacia?.valor || 'SIGFARMA';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0 lg:flex-shrink-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <img 
                src="logos/logo.png" 
                alt="Logo" 
                className="h-8 w-auto"
              />
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {farmaciaName}
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">SENA</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{user?.nombre}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{user?.correo}</div>
            <Badge variant="secondary" className="mt-2 text-xs">
              {user?.rol?.charAt(0).toUpperCase() + user?.rol?.slice(1)}
            </Badge>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href || 
                              location.pathname.startsWith(item.href + '/');
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 border-r-2 border-orange-500' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.name === 'Notificaciones' && notifications > 0 && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5">
                      {notifications > 99 ? '99+' : notifications}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}