import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ExpirationAlertsProps {
  alerts: {
    expired: number;
    critical: number;
    warning: number;
  };
}

export function ExpirationAlertsCard({ alerts }: ExpirationAlertsProps) {
  const navigate = useNavigate();

  const alertItems = [
    {
      title: 'Productos Vencidos',
      description: 'Requieren acción inmediata',
      count: alerts.expired,
      variant: 'destructive' as const,
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-900 dark:text-red-100'
    },
    {
      title: 'Crítico (≤ 6 meses)',
      description: 'Vencen pronto',
      count: alerts.critical,
      variant: 'warning' as const,
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      textColor: 'text-orange-900 dark:text-orange-100'
    },
    {
      title: 'Advertencia (7-12 meses)',
      description: 'Monitorear',
      count: alerts.warning,
      variant: 'secondary' as const,
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-900 dark:text-yellow-100'
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Alertas de Vencimiento
        </CardTitle>
        <CardDescription>
          Estado de los lotes por fecha de vencimiento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {alertItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${item.bgColor} ${item.borderColor}`}
            >
              <div>
                <div className={`font-medium ${item.textColor}`}>
                  {item.title}
                </div>
                <div className={`text-sm opacity-80 ${item.textColor}`}>
                  {item.description}
                </div>
              </div>
              <Badge variant={item.variant} className="text-lg px-3 py-1">
                {item.count}
              </Badge>
            </div>
          ))}
        </div>

        <Button 
          className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
          onClick={() => navigate('/inventory?tab=expiring')}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Ver Reporte Detallado
        </Button>
      </CardContent>
    </Card>
  );
}