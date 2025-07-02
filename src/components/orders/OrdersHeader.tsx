import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, RefreshCw, Zap } from 'lucide-react';

interface OrdersHeaderProps {
  onCreateOrder: () => void;
  onRefresh: () => void;
  onGenerateAutoOrders: () => void;
  canManageOrders: boolean;
}

export function OrdersHeader({ 
  onCreateOrder, 
  onRefresh, 
  onGenerateAutoOrders, 
  canManageOrders 
}: OrdersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCart className="w-6 h-6 text-orange-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Órdenes de Compra
          </h1>
          <Badge variant="outline" className="hidden sm:inline-flex">
            SIGFARMA-SENA
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Gestiona órdenes de compra y seguimiento de entregas
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>

        {canManageOrders && (
          <>
            <Button
              onClick={onGenerateAutoOrders}
              variant="outline"
              className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30"
            >
              <Zap className="w-4 h-4 mr-2" />
              Auto-Generar
            </Button>
            
            <Button
              onClick={onCreateOrder}
              className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Orden
            </Button>
          </>
        )}
      </div>
    </div>
  );
}