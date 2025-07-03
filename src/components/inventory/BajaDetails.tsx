import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { 
  Trash2, 
  CheckCircle, 
  X, 
  Download,
  User,
  Calendar,
  Package,
  AlertTriangle,
  Clock,
  Shield
} from 'lucide-react';

interface BajaDetailsProps {
  baja: any;
  onApprovalProcessed: () => void;
}

export function BajaDetails({ baja, onApprovalProcessed }: BajaDetailsProps) {
  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return (
          <Badge variant="warning" className="bg-orange-100 text-orange-800">
            <Clock className="w-4 h-4 mr-2" />
            Pendiente de Aprobación
          </Badge>
        );
      case 'Aprobada':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-2" />
            Aprobada
          </Badge>
        );
      case 'Rechazada':
        return (
          <Badge variant="destructive">
            <X className="w-4 h-4 mr-2" />
            Rechazada
          </Badge>
        );
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const handleApprove = async () => {
    const observaciones = prompt('Observaciones del aprobador (opcional):');
    if (observaciones === null) return;

    try {
      const response = await fetch(`/api/inventory/bajas/${baja.bajaId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ observacionesAprobador: observaciones })
      });

      if (response.ok) {
        alert('Baja aprobada y procesada exitosamente');
        onApprovalProcessed();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error approving baja:', error);
      alert('Error al aprobar la baja');
    }
  };

  const handleReject = async () => {
    const motivo = prompt('Motivo del rechazo:');
    if (!motivo) return;

    const observaciones = prompt('Observaciones adicionales (opcional):');
    if (observaciones === null) return;

    try {
      const response = await fetch(`/api/inventory/bajas/${baja.bajaId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          motivo,
          observacionesAprobador: observaciones 
        })
      });

      if (response.ok) {
        alert('Baja rechazada exitosamente');
        onApprovalProcessed();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error rejecting baja:', error);
      alert('Error al rechazar la baja');
    }
  };

  const getMotivoText = (motivo: string) => {
    switch (motivo) {
      case 'vencimiento': return 'Vencimiento';
      case 'deterioro': return 'Deterioro/Daño';
      case 'error_ingreso': return 'Error de ingreso';
      case 'devolucion_proveedor': return 'Devolución a proveedor';
      case 'retiro_mercado': return 'Retiro del mercado';
      default: return 'Otro';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Baja de Inventario #{baja.bajaId}
              </CardTitle>
              <CardDescription>
                Detalles completos de la baja de medicamentos
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(baja.estado)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Solicitante</p>
                <p className="text-sm text-muted-foreground">{baja.usuario.nombre}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Fecha Solicitud</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(baja.fechaSolicitud)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Package className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Cantidad</p>
                <p className="text-sm text-muted-foreground">{baja.cantidad} unidades</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Motivo</p>
                <p className="text-sm text-muted-foreground">{getMotivoText(baja.motivo)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Section */}
      {baja.estado === 'Pendiente' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              Aprobación Administrativa
            </CardTitle>
            <CardDescription>
              Esta baja requiere aprobación antes de ser procesada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprobar Baja
              </Button>
              
              <Button
                onClick={handleReject}
                variant="destructive"
              >
                <X className="w-4 h-4 mr-2" />
                Rechazar Baja
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Info */}
      {baja.usuarioAprobador && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {baja.estado === 'Aprobada' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <X className="w-5 h-5 text-red-500" />
              )}
              Información de {baja.estado === 'Aprobada' ? 'Aprobación' : 'Rechazo'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">{baja.estado === 'Aprobada' ? 'Aprobado' : 'Rechazado'} por:</p>
                <p className="text-sm text-muted-foreground">{baja.usuarioAprobador.nombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Fecha de {baja.estado === 'Aprobada' ? 'Aprobación' : 'Rechazo'}:</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(baja.fechaAprobacion)}</p>
              </div>
            </div>
            
            {baja.observacionesAprobador && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Observaciones del {baja.estado === 'Aprobada' ? 'Aprobador' : 'Revisor'}:
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {baja.observacionesAprobador}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Product Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Producto</CardTitle>
          <CardDescription>
            Información del producto y lote dado de baja
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium">{baja.lote.producto.nombre}</h4>
                <p className="text-sm text-muted-foreground">{baja.lote.producto.presentacion}</p>
                <p className="text-xs text-muted-foreground">{baja.lote.producto.laboratorio}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Lote:</span>
                <br />
                {baja.lote.numeroLote}
              </div>
              <div>
                <span className="font-medium">Vencimiento:</span>
                <br />
                {formatDateTime(baja.lote.fechaVencimiento)}
              </div>
              <div>
                <span className="font-medium">Cantidad Original:</span>
                <br />
                {baja.lote.cantidadInicial} unidades
              </div>
              <div>
                <span className="font-medium">Cantidad Dada de Baja:</span>
                <br />
                {baja.cantidad} unidades
              </div>
            </div>

            {baja.observaciones && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Observaciones del Solicitante:</p>
                <p className="text-sm text-muted-foreground">{baja.observaciones}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}