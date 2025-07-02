import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { 
  ShoppingCart, 
  Building, 
  FileText, 
  Clock, 
  TrendingUp, 
  Package, 
  Eye,
  CheckCircle,
  Truck,
  X
} from 'lucide-react';

interface OrderDetailsProps {
  order: any;
  onCreateReception: (orderId: number) => void;
  onRefresh: () => void;
  canManageOrders: boolean;
}

export function OrderDetails({ order, onCreateReception, onRefresh, canManageOrders }: OrderDetailsProps) {
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Enviada': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Recibida': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Completada': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Cancelada': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return Clock;
      case 'Enviada': return Truck;
      case 'Recibida': return Package;
      case 'Completada': return CheckCircle;
      case 'Cancelada': return X;
      default: return Clock;
    }
  };

  const StatusIcon = getStatusIcon(order.estado);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Orden de Compra {order.numeroOrden}
              </CardTitle>
              <CardDescription>
                Detalles completos de la orden de compra
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(order.estado)}`}>
                <StatusIcon className="w-4 h-4 mr-2" />
                {order.estado}
              </Badge>
              
              {order.estado === 'Recibida' && canManageOrders && (
                <Button
                  onClick={() => onCreateReception(order.ordenId)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Crear Acta de Recepción
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
              <Building className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Proveedor</p>
                <p className="text-sm text-muted-foreground">{order.proveedor.nombre}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Creada por</p>
                <p className="text-sm text-muted-foreground">{order.usuarioCreador.nombre}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Fecha de Orden</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(order.fechaOrden)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(order.total)}</p>
              </div>
            </div>
          </div>

          {order.fechaEntregaEsperada && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Fecha de Entrega Esperada: {formatDateTime(order.fechaEntregaEsperada)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle>Productos Solicitados</CardTitle>
          <CardDescription>
            Detalle de todos los productos incluidos en esta orden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.detalleOrdenCompra.map((detail: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{detail.producto.nombre}</h4>
                    <p className="text-sm text-muted-foreground">{detail.producto.presentacion}</p>
                    <p className="text-xs text-muted-foreground">{detail.producto.laboratorio}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Cantidad Solicitada:</span>
                    <br />
                    {detail.cantidadSolicitada} unidades
                  </div>
                  <div>
                    <span className="font-medium">Cantidad Recibida:</span>
                    <br />
                    {detail.cantidadRecibida} unidades
                  </div>
                  <div>
                    <span className="font-medium">Precio Unitario:</span>
                    <br />
                    {formatCurrency(detail.precioUnitario)}
                  </div>
                  <div>
                    <span className="font-medium">Total Línea:</span>
                    <br />
                    <span className="text-green-600 dark:text-green-400 font-bold">
                      {formatCurrency(detail.totalLinea)}
                    </span>
                  </div>
                </div>

                {detail.notas && (
                  <div className="mt-2 p-2 bg-muted/50 dark:bg-muted/20 rounded text-sm">
                    <span className="font-medium">Notas:</span> {detail.notas}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-muted/50 dark:bg-muted/20 rounded-lg">
            <h4 className="font-medium mb-2">Resumen de la Orden</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Subtotal:</span>
                <br />
                {formatCurrency(order.subtotal)}
              </div>
              <div>
                <span className="font-medium">Impuestos (19%):</span>
                <br />
                {formatCurrency(order.impuestos)}
              </div>
              <div>
                <span className="font-medium">Total:</span>
                <br />
                <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observations */}
      {order.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle>Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {order.observaciones}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Receptions */}
      {order.actasRecepcion && order.actasRecepcion.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Actas de Recepción Relacionadas</CardTitle>
            <CardDescription>
              Recepciones generadas a partir de esta orden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.actasRecepcion.map((acta: any) => (
                <div key={acta.actaId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Acta #{acta.actaId}</h4>
                    <p className="text-sm text-muted-foreground">
                      Recibida por: {acta.usuarioReceptor.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {acta._count.detalleActaRecepcion} productos
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}