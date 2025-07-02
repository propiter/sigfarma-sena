import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Package, 
  Edit, 
  Thermometer, 
  Shield, 
  Building, 
  Barcode,
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface ProductDetailsProps {
  product: any;
  onEdit: () => void;
  canManageProducts: boolean;
}

export function ProductDetails({ product, onEdit, canManageProducts }: ProductDetailsProps) {
  const getStockStatusColor = (current: number, minimum: number) => {
    if (current === 0) return 'text-red-600 dark:text-red-400';
    if (current <= minimum) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {product.nombre}
              </CardTitle>
              <CardDescription>
                Información completa del producto
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {product.esControlado && (
                <Badge variant="destructive">
                  <Shield className="w-3 h-3 mr-1" />
                  Controlado
                </Badge>
              )}
              {product.requiereRefrigeracion && (
                <Badge variant="secondary">
                  <Thermometer className="w-3 h-3 mr-1" />
                  Refrigeración
                </Badge>
              )}
              {canManageProducts && (
                <Button onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
              <Package className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Presentación</p>
                <p className="text-sm text-muted-foreground">{product.presentacion}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
              <Building className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Laboratorio</p>
                <p className="text-sm text-muted-foreground">{product.laboratorio}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Precio Sugerido</p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(product.precioVentaSugerido)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Stock</p>
                <p className={`text-sm font-bold ${getStockStatusColor(product.stockTotal, product.stockMinimo)}`}>
                  {product.stockTotal} / {product.stockMinimo}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Producto</CardTitle>
            <CardDescription>
              Detalles técnicos y farmacológicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {product.codigoBarras && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Código de Barras</Label>
                  <div className="flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-muted-foreground" />
                    <p className="font-mono text-sm">{product.codigoBarras}</p>
                  </div>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Principio Activo</Label>
                <p className="font-medium">{product.principioActivo}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Concentración</Label>
                <p>{product.concentracion}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Forma Farmacéutica</Label>
                <p>{product.formaFarmaceutica}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Registro Sanitario</Label>
                <p className="font-mono text-sm">{product.registroSanitario}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Aplica IVA</Label>
                <p>{product.aplicaIva ? 'Sí' : 'No'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Stock Mínimo</Label>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{product.stockMinimo}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Stock Máximo</Label>
                <p className="text-lg font-bold">{product.stockMaximo}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {product.esControlado && (
                <Badge variant="destructive">
                  <Shield className="w-3 h-3 mr-1" />
                  Medicamento Controlado
                </Badge>
              )}
              {product.requiereRefrigeracion && (
                <Badge variant="secondary">
                  <Thermometer className="w-3 h-3 mr-1" />
                  Requiere Refrigeración
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stock and Lots */}
        <Card>
          <CardHeader>
            <CardTitle>Stock y Lotes</CardTitle>
            <CardDescription>
              Información de inventario actual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Stock Total</Label>
                <p className="text-2xl font-bold">{product.stockTotal}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                <p className={`text-lg font-bold ${getStockStatusColor(product.stockTotal, product.stockMinimo)}`}>
                  {product.stockTotal === 0 ? 'Sin Stock' : 
                   product.stockTotal <= product.stockMinimo ? 'Stock Bajo' : 'Stock Normal'}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Lotes Disponibles</Label>
              <div className="space-y-2">
                {product.lotes.map((lote: any) => (
                  <div key={lote.loteId} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Lote: {lote.numeroLote}</p>
                        <p className="text-sm text-muted-foreground">
                          Vence: {formatDate(lote.fechaVencimiento)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{lote.cantidadDisponible} unidades</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {formatCurrency(lote.precioVentaLote)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {product.lotes.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay lotes disponibles</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}