import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Search, 
  Eye, 
  Edit, 
  Package, 
  Thermometer, 
  Shield, 
  AlertTriangle,
  Building,
  Barcode
} from 'lucide-react';

interface Product {
  productoId: number;
  codigoBarras: string;
  nombre: string;
  principioActivo: string;
  presentacion: string;
  laboratorio: string;
  requiereRefrigeracion: boolean;
  esControlado: boolean;
  stockTotal: number;
  stockMinimo: number;
  precioVentaSugerido: number;
  activo: boolean;
  lotes: Array<{
    loteId: number;
    numeroLote: string;
    fechaVencimiento: string;
    cantidadDisponible: number;
    precioVentaLote: number;
  }>;
}

interface ProductsListProps {
  products: Product[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  canManageProducts: boolean;
}

export function ProductsList({
  products,
  searchQuery,
  onSearchChange,
  onSelectProduct,
  onEditProduct,
  canManageProducts
}: ProductsListProps) {
  const getStockStatusColor = (current: number, minimum: number) => {
    if (current === 0) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    if (current <= minimum) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  };

  const getStockStatusText = (current: number, minimum: number) => {
    if (current === 0) return 'Sin Stock';
    if (current <= minimum) return 'Stock Bajo';
    return 'Stock Normal';
  };

  const filteredProducts = products.filter(product =>
    product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.codigoBarras?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.principioActivo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.laboratorio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Catálogo de Productos</CardTitle>
            <CardDescription>
              Gestiona el catálogo completo de medicamentos
            </CardDescription>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No se encontraron productos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <div
                key={product.productoId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => onSelectProduct(product)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-foreground">{product.nombre}</h3>
                    {product.esControlado && (
                      <Badge variant="destructive" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Controlado
                      </Badge>
                    )}
                    {product.requiereRefrigeracion && (
                      <Badge variant="secondary" className="text-xs">
                        <Thermometer className="w-3 h-3 mr-1" />
                        Refrigeración
                      </Badge>
                    )}
                    <Badge 
                      className={`text-xs ${getStockStatusColor(product.stockTotal, product.stockMinimo)}`}
                    >
                      {getStockStatusText(product.stockTotal, product.stockMinimo)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {product.presentacion}
                    </div>
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {product.laboratorio}
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {product.principioActivo}
                    </div>
                    {product.codigoBarras && (
                      <div className="flex items-center gap-1">
                        <Barcode className="w-4 h-4" />
                        {product.codigoBarras}
                      </div>
                    )}
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    Stock: {product.stockTotal} / Mínimo: {product.stockMinimo} • {product.lotes.length} lote(s)
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className="font-bold text-green-600 dark:text-green-400 text-lg">
                    {formatCurrency(product.precioVentaSugerido)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Precio sugerido
                  </div>
                  {product.lotes[0] && (
                    <div className="text-xs text-muted-foreground">
                      Próximo vence: {formatDate(product.lotes[0].fechaVencimiento)}
                    </div>
                  )}
                  
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {canManageProducts && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProduct(product);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}