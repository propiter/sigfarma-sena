import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Menu, 
  X,
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  Settings,
  LogOut,
  Activity,
  Bell,
  Sun,
  Moon
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['administrador', 'cajero', 'inventario'] },
  { name: 'Punto de Venta', href: '/pos', icon: ShoppingCart, roles: ['administrador', 'cajero'] },
  { name: 'Inventario', href: '/inventory', icon: Package, roles: ['administrador', 'inventario'] },
  { name: 'Productos', href: '/products', icon: Activity, roles: ['administrador', 'inventario'] },
  { name: 'Reportes', href: '/reports', icon: FileText, roles: ['administrador', 'cajero', 'inventario'] },
  { name: 'Notificaciones', href: '/notifications', icon: Bell, roles: ['administrador', 'cajero', 'inventario'] },
  { name: 'Usuarios', href: '/users', icon: Users, roles: ['administrador'] },
  { name: 'Configuración', href: '/settings', icon: Settings, roles: ['administrador'] },
];

export function Layout() {
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      checkAuth();
    }
  }, [isAuthenticated, checkAuth]);

  useEffect(() => {
    // Fetch notification count
    fetchNotificationCount();
  }, []);

  const fetchNotificationCount = async () => {
    try {
      const response = await fetch('/api/notifications/count', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

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

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user.rol)
  );

  return (
    <div className="min-h-screen bg-background theme-transition">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-lg transform transition-transform duration-300 ease-in-out theme-transition
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">SIGFARMA</div>
                <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">SENA</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-border">
            <div className="text-sm font-medium text-foreground">{user.nombre}</div>
            <div className="text-xs text-muted-foreground">{user.correo}</div>
            <Badge variant="secondary" className="mt-2 text-xs">
              {user.rol.charAt(0).toUpperCase() + user.rol.slice(1)}
            </Badge>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href || 
                              location.pathname.startsWith(item.href + '/');
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 theme-transition
                    ${isActive 
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 border-r-2 border-orange-500' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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

          {/* Theme Toggle & Logout */}
          <div className="p-4 border-t border-border space-y-2">
            <Button
              onClick={toggleTheme}
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 mr-3" />
              ) : (
                <Moon className="w-5 h-5 mr-3" />
              )}
              {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            </Button>
            
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

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 bg-card border-b border-border theme-transition">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hidden sm:flex"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">{user.nombre}</div>
              <div className="text-xs text-muted-foreground">
                {user.rol.charAt(0).toUpperCase() + user.rol.slice(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Page content with responsive container */}
        <main className="min-h-[calc(100vh-4rem)] bg-background theme-transition">
          <div className="w-full max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}