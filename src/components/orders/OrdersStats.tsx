import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Clock, Truck, Package, CheckCircle } from 'lucide-react';

interface OrdersStatsProps {
  stats: {
    total: number;
    pending: number;
    sent: number;
    received: number;
    completed: number;
  };
}

export function OrdersStats({ stats }: OrdersStatsProps) {
  const statsCards = [
    {
      title: 'Total Órdenes',
      value: stats.total,
      subtitle: 'Órdenes registradas',
      icon: ShoppingCart,
      color: 'blue'
    },
    {
      title: 'Pendientes',
      value: stats.pending,
      subtitle: 'Por procesar',
      icon: Clock,
      color: 'yellow'
    },
    {
      title: 'Enviadas',
      value: stats.sent,
      subtitle: 'En tránsito',
      icon: Truck,
      color: 'blue'
    },
    {
      title: 'Recibidas',
      value: stats.received,
      subtitle: 'Por procesar',
      icon: Package,
      color: 'purple'
    },
    {
      title: 'Completadas',
      value: stats.completed,
      subtitle: 'Finalizadas',
      icon: CheckCircle,
      color: 'green'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'border-l-blue-500 text-blue-600 dark:text-blue-400',
      yellow: 'border-l-yellow-500 text-yellow-600 dark:text-yellow-400',
      purple: 'border-l-purple-500 text-purple-600 dark:text-purple-400',
      green: 'border-l-green-500 text-green-600 dark:text-green-400'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        const colorClasses = getColorClasses(stat.color);
        
        return (
          <Card key={index} className={`border-l-4 ${colorClasses.split(' ')[0]}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 text-muted-foreground`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${colorClasses.split(' ').slice(1).join(' ')}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}