import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Plus, RefreshCw, Download } from 'lucide-react';

interface ProductsHeaderProps {
  onCreateProduct: () => void;
  onRefresh: () => void;
  canManageProducts: boolean;
}

export function ProductsHeader({ onCreateProduct, onRefresh, canManageProducts }: ProductsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Package className="w-6 h-6 text-orange-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Gestión de Productos
          </h1>
          
        </div>
        <p className="text-muted-foreground">
          Catálogo completo de medicamentos y productos farmacéuticos
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>

        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
        
        {canManageProducts && (
          <Button
            onClick={onCreateProduct}
            className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        )}
      </div>
    </div>
  );
}