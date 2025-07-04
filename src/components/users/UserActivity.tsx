import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { Activity, RefreshCw, Calendar, User, FileText } from 'lucide-react';

interface UserActivityProps {
  userId: number;
}

interface ActivityItem {
  historialId: number;
  accion: string;
  detalles: any;
  fechaCambio: string;
}

export function UserActivity({ userId }: UserActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserActivity();
  }, [userId]);

  const fetchUserActivity = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/activity`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action: string) => {
    if (action.includes('sesión')) return User;
    if (action.includes('venta') || action.includes('Venta')) return FileText;
    if (action.includes('producto') || action.includes('Producto')) return Activity;
    return Activity;
  };

  const getActivityColor = (action: string) => {
    if (action.includes('sesión')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    if (action.includes('venta') || action.includes('Venta')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (action.includes('error') || action.includes('Error')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const renderDetalles = (detalles: any) => {
    return (
      <div className="mt-2 p-3 bg-muted/20 dark:bg-muted/10 rounded-md max-h-60 overflow-auto scrollbar-thin">
        <h5 className="font-semibold text-sm mb-1 text-foreground">Detalles:</h5>
        <div className="grid gap-1 text-xs text-muted-foreground">
          {Object.entries(detalles).map(([key, value]) => (
            <div key={key} className="flex flex-col sm:flex-row gap-1 sm:gap-2 break-words">
              <span className="font-medium capitalize text-foreground sm:min-w-[120px]">{key}:</span>
              <span className="break-all">
                {typeof value === 'object' && value !== null
                  ? JSON.stringify(value)
                  : String(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="max-w-full">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Historial de Actividad
            </CardTitle>
            <CardDescription>
              Registro de acciones realizadas por el usuario
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUserActivity}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay actividad registrada para este usuario</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.accion);
              return (
                <div
                  key={activity.historialId}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
                >
                  <div className="w-8 h-8 bg-muted/50 dark:bg-muted/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <ActivityIcon className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h4 className="font-medium text-sm">{activity.accion}</h4>
                      <Badge className={`text-xs ${getActivityColor(activity.accion)}`}>
                        {activity.accion.includes('sesión') ? 'Autenticación' :
                          activity.accion.includes('venta') ? 'Venta' :
                          activity.accion.includes('producto') ? 'Inventario' : 'Sistema'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDateTime(activity.fechaCambio)}
                    </div>

                    {activity.detalles && Object.keys(activity.detalles).length > 0 && (
                      renderDetalles(activity.detalles)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
