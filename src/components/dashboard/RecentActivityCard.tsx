import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, ShoppingCart, Package, Eye } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Sale {
  ventaId: number;
  fechaVenta: string;
  totalAPagar: number;
  usuario: { nombre: string };
  detalleVenta: any[];
}

interface RecentActivityProps {
  recentSales: Sale[];
}

export function RecentActivityCard({ recentSales }: RecentActivityProps) {
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Actividad Reciente
        </CardTitle>
        <CardDescription>
          Últimas transacciones del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentSales.length ? (
            <>
              {recentSales.map((sale) => (
                <div 
                  key={sale.ventaId} 
                  className="flex items-center justify-between p-3 bg-muted/50 dark:bg-muted/20 rounded-lg hover:bg-muted/70 dark:hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/pos/sales/${sale.ventaId}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        Venta #{sale.ventaId}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sale.usuario.nombre} • {formatDateTime(sale.fechaVenta)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(sale.totalAPagar)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sale.detalleVenta.length} items
                    </div>
                  </div>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/reports?tab=sales')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Todas las Ventas
              </Button>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay actividad reciente</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}