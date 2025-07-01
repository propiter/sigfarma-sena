import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, TrendingUp, Users, FileText, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function QuickActionsCard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const actions = [
    {
      title: 'Nueva Venta',
      description: 'Procesar venta',
      icon: ShoppingCart,
      color: 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700',
      onClick: () => navigate('/pos'),
      roles: ['administrador', 'cajero']
    },
    {
      title: 'Recibir Mercancía',
      description: 'Ingreso de inventario',
      icon: Package,
      color: 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700',
      onClick: () => navigate('/inventory/reception'),
      roles: ['administrador', 'inventario']
    },
    {
      title: 'Ver Reportes',
      description: 'Analytics y métricas',
      icon: TrendingUp,
      color: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700',
      onClick: () => navigate('/reports'),
      roles: ['administrador', 'cajero', 'inventario']
    },
    {
      title: 'Gestionar Usuarios',
      description: 'Administrar personal',
      icon: Users,
      color: 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700',
      onClick: () => navigate('/users'),
      roles: ['administrador']
    },
    {
      title: 'Productos',
      description: 'Catálogo de medicamentos',
      icon: FileText,
      color: 'bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700',
      onClick: () => navigate('/products'),
      roles: ['administrador', 'inventario']
    },
    {
      title: 'Configuración',
      description: 'Ajustes del sistema',
      icon: Settings,
      color: 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700',
      onClick: () => navigate('/settings'),
      roles: ['administrador']
    }
  ];

  const filteredActions = actions.filter(action => 
    action.roles.includes(user?.rol || '')
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
        <CardDescription>
          Accesos directos a las funciones más utilizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              className={`h-24 flex-col gap-2 ${action.color} text-white`}
              size="lg"
            >
              <action.icon className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs opacity-90">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}