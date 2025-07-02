import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Shield, Thermometer, AlertTriangle } from 'lucide-react';

interface ProductsStatsProps {
  stats: {
    total: number;
    controlled: number;
    refrigerated: number;
    lowStock: number;
  };
}

export function ProductsStats({ stats }: ProductsStatsProps) {
  const statsCards = [
    {
      title: 'Total Productos',
      value: stats.total,
      subtitle: 'Productos registrados',
      icon: Package,
      color: 'blue'
    },
    {
      title: 'Controlados',
      value: stats.controlled,
      subtitle: 'Medicamentos controlados',
      icon: Shield,
      color: 'red'
    },
    {
      title: 'Refrigeración',
      value: stats.refrigerated,
      subtitle: 'Requieren frío',
      icon: Thermometer,
      color: 'blue'
    },
    {
      title: 'Stock Bajo',
      value: stats.lowStock,
      subtitle: 'Necesitan reposición',
      icon: AlertTriangle,
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'border-l-blue-500 text-blue-600 dark:text-blue-400',
      red: 'border-l-red-500 text-red-600 dark:text-red-400',
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