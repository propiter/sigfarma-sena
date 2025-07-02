import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { showSuccessMessage, showErrorMessage, showWarningMessage } from '@/lib/notifications';

import { 
  FileText, 
  CheckCircle, 
  X, 
  Download,
  User,
  Building,
  Calendar,
  Package,
  AlertTriangle,
  Clock,
  Shield
} from 'lucide-react';

interface ReceptionDetailsProps {
  reception: any;
  onApprovalProcessed: () => void;
}

export function ReceptionDetails({ reception, onApprovalProcessed }: ReceptionDetailsProps) {
  const { user } = useAuthStore();

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'PendienteAprobacion':
        return (
          <Badge variant="warning" className="bg-orange-100 text-orange-800">
            <Clock className="w-4 h-4 mr-2" />
            Pendiente de Aprobación
          </Badge>
        );
      case 'Aprobada':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            <CheckCircle className="w-4 h-4 mr-2" />
            Aprobada
          </Badge>
        );
      case 'Completada':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-2" />
            Completada
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
      const response = await fetch(`/api/inventory/reception/${reception.actaId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ observacionesAprobador: observaciones })
      });

      if (response.ok) {
        showSuccessMessage('Acta aprobada y procesada exitosamente');
        onApprovalProcessed();
      } else {
        const error = await response.json();
        showErrorMessage(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error approving reception:', error);
      showErrorMessage('Error al aprobar la recepción');
    }
  };

  const handleReject = async () => {
    const motivo = prompt('Motivo del rechazo:');
    if (!motivo) return;

    const observaciones = prompt('Observaciones adicionales (opcional):');
    if (observaciones === null) return;

    try {
      const response = await fetch(`/api/inventory/reception/${reception.actaId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          motivo,
          observacionesAprobador: observaciones 
        })
      });

      if (response.ok) {
        showSuccessMessage('Acta rechazada exitosamente');
        onApprovalProcessed();
      } else {
        const error = await response.json();
        showErrorMessage(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error rejecting reception:', error);
      showErrorMessage('Error al rechazar la recepción');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch(`/api/inventory/reception/${reception.actaId}/export-pdf`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        // Aquí iría la lógica de descarga del PDF
        showSuccessMessage('Funcionalidad de exportación PDF en desarrollo');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
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
                <FileText className="w-5 h-5" />
                Acta de Recepción #{reception.actaId}
              </CardTitle>
              <CardDescription>
                Detalles completos de la recepción de mercancía
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(reception.estado)}
              {reception.estado === 'Completada' && (
                <Button onClick={handleExportPDF} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Building className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Proveedor</p>
                <p className="text-sm text-muted-foreground">{reception.proveedor.nombre}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Receptor</p>
                <p className="text-sm text-muted-foreground">{reception.usuarioReceptor.nombre}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Fecha Recepción</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(reception.fechaRecepcion)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Package className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Tipo</p>
                <p className="text-sm text-muted-foreground">{reception.tipoRecepcion}</p>
              </div>
            </div>
          </div>

          {reception.numeroFactura && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Número de Factura: {reception.numeroFactura}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Section */}
      {reception.estado === 'PendienteAprobacion' && user?.rol === 'administrador' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              Aprobación Administrativa
            </CardTitle>
            <CardDescription>
              Esta acta requiere aprobación antes de ser cargada al inventario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprobar y Cargar al Inventario
              </Button>
              
              <Button
                onClick={handleReject}
                variant="destructive"
              >
                <X className="w-4 h-4 mr-2" />
                Rechazar Acta
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Info */}
      {reception.usuarioAprobador && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Información de Aprobación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Aprobado por:</p>
                <p className="text-sm text-muted-foreground">{reception.usuarioAprobador.nombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Fecha de Aprobación:</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(reception.fechaAprobacion)}</p>
              </div>
            </div>
            
            {reception.observacionesAprobador && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                  Observaciones del Aprobador:
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {reception.observacionesAprobador}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Products Details */}
      <Card>
        <CardHeader>
          <CardTitle>Productos Recibidos</CardTitle>
          <CardDescription>
            Detalle de todos los productos incluidos en esta recepción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reception.detalleActaRecepcion.map((detail: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{detail.producto.nombre}</h4>
                    <p className="text-sm text-muted-foreground">{detail.producto.presentacion}</p>
                    <p className="text-xs text-muted-foreground">{detail.producto.laboratorio}</p>
                  </div>
                  <Badge variant="outline">
                    {detail.tipoMovimiento}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Lote:</span>
                    <br />
                    {detail.numeroLoteRecibido}
                  </div>
                  <div>
                    <span className="font-medium">Vencimiento:</span>
                    <br />
                    {formatDateTime(detail.fechaVencimientoRecibida)}
                  </div>
                  <div>
                    <span className="font-medium">Cantidad:</span>
                    <br />
                    {detail.cantidadRecibida} unidades
                  </div>
                  <div>
                    <span className="font-medium">Precio Compra:</span>
                    <br />
                    {formatCurrency(detail.precioCompraRecibido)}
                  </div>
                </div>

                {detail.registroInvima && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Registro INVIMA:</span> {detail.registroInvima}
                  </div>
                )}

                {detail.notas && (
                  <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                    <span className="font-medium">Notas:</span> {detail.notas}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Resumen de Recepción</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Productos:</span>
                <br />
                {reception.detalleActaRecepcion.length}
              </div>
              <div>
                <span className="font-medium">Total Unidades:</span>
                <br />
                {reception.detalleActaRecepcion.reduce((sum: number, detail: any) => 
                  sum + detail.cantidadRecibida, 0
                )}
              </div>
              <div>
                <span className="font-medium">Valor Total:</span>
                <br />
                <span className="text-green-600 font-bold">
                  {formatCurrency(
                    reception.detalleActaRecepcion.reduce((sum: number, detail: any) => 
                      sum + (detail.cantidadRecibida * detail.precioCompraRecibido), 0
                    )
                  )}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observations */}
      {reception.observacionesReceptor && (
        <Card>
          <CardHeader>
            <CardTitle>Observaciones del Receptor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {reception.observacionesReceptor}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}