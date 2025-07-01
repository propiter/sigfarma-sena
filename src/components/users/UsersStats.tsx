import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Shield, ShoppingCart, Package } from 'lucide-react';

interface UsersStatsProps {
  stats: {
    total: number;
    active: number;
    administrators: number;
    cashiers: number;
    inventory: number;
  };
}

export function UsersStats({ stats }: UsersStatsProps) {
  const statsCards = [
    {
      title: 'Total Usuarios',
      value: stats.total,
      subtitle: `${stats.active} activos`,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Administradores',
      value: stats.administrators,
      subtitle: 'Control total',
      icon: Shield,
      color: 'purple'
    },
    {
      title: 'Cajeros',
      value: stats.cashiers,
      subtitle: 'Punto de venta',
      icon: ShoppingCart,
      color: 'green'
    },
    {
      title: 'Inventario',
      value: stats.inventory,
      subtitle: 'Gestión de stock',
      icon: Package,
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'border-l-blue-500 text-blue-600 dark:text-blue-400',
      purple: 'border-l-purple-500 text-purple-600 dark:text-purple-400',
      green: 'border-l-green-500 text-green-600 dark:text-green-400',
      orange: 'border-l-orange-500 text-orange-600 dark:text-orange-400'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        const colorClasses = getColorClasses(stat.color);
        
        return (
          <Card key={index} className={`border-l-4 ${colorClasses.split(' ')[0]}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${colorClasses.split(' ').slice(1).join(' ')}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${colorClasses.split(' ').slice(1).join(' ')}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}