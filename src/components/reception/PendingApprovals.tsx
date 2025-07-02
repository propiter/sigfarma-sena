import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { showSuccessMessage, showErrorMessage } from '@/lib/notifications';

import { 
  Clock, 
  CheckCircle, 
  X, 
  Eye,
  User,
  Building,
  Calendar
} from 'lucide-react';

interface PendingApprovalsProps {
  onApprovalProcessed: () => void;
  onSelectReception: (reception: any) => void;
}

export function PendingApprovals({ onApprovalProcessed, onSelectReception }: PendingApprovalsProps) {
  const [pendingReceptions, setPendingReceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch('/api/inventory/reception/pending-approvals', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPendingReceptions(data);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (actaId: number) => {
    const observaciones = prompt('Observaciones del aprobador (opcional):');
    if (observaciones === null) return; // User cancelled

    try {
      const response = await fetch(`/api/inventory/reception/${actaId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ observacionesAprobador: observaciones })
      });

      if (response.ok) {
        showSuccessMessage('Acta aprobada y procesada exitosamente');
        fetchPendingApprovals();
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

  const handleReject = async (actaId: number) => {
    const motivo = prompt('Motivo del rechazo:');
    if (!motivo) return;

    const observaciones = prompt('Observaciones adicionales (opcional):');
    if (observaciones === null) return; // User cancelled

    try {
      const response = await fetch(`/api/inventory/reception/${actaId}/reject`, {
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
        fetchPendingApprovals();
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-500" />
          Actas Pendientes de Aprobación
        </CardTitle>
        <CardDescription>
          Recepciones que requieren autorización administrativa para cargar al inventario
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingReceptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50 text-green-500" />
            <p>No hay actas pendientes de aprobación</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingReceptions.map((reception) => (
              <div key={reception.actaId} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">Acta #{reception.actaId}</h3>
                      <Badge variant="warning" className="bg-orange-100 text-orange-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Pendiente
                      </Badge>
                      <Badge variant="outline">
                        {reception.tipoRecepcion}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {reception.proveedor.nombre}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {reception.usuarioReceptor.nombre}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateTime(reception.fechaRecepcion)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Productos:</span> {reception.detalleActaRecepcion.length}
                      </div>
                      <div>
                        <span className="font-medium">Total Unidades:</span>{' '}
                        {reception.detalleActaRecepcion.reduce((sum: number, detail: any) => 
                          sum + detail.cantidadRecibida, 0
                        )}
                      </div>
                      <div>
                        <span className="font-medium">Valor Total:</span>{' '}
                        {formatCurrency(
                          reception.detalleActaRecepcion.reduce((sum: number, detail: any) => 
                            sum + (detail.cantidadRecibida * detail.precioCompraRecibido), 0
                          )
                        )}
                      </div>
                      {reception.numeroFactura && (
                        <div>
                          <span className="font-medium">Factura:</span> {reception.numeroFactura}
                        </div>
                      )}
                    </div>

                    {reception.observacionesReceptor && (
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Observaciones del Receptor:
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          {reception.observacionesReceptor}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectReception(reception)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => handleApprove(reception.actaId)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(reception.actaId)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Products Preview */}
                <div className="border-t pt-3">
                  <div className="text-sm font-medium mb-2">Productos a Recibir:</div>
                  <div className="space-y-1">
                    {reception.detalleActaRecepcion.slice(0, 3).map((detail: any, index: number) => (
                      <div key={index} className="text-sm text-muted-foreground flex justify-between">
                        <span>{detail.producto.nombre}</span>
                        <span>{detail.cantidadRecibida} unidades</span>
                      </div>
                    ))}
                    {reception.detalleActaRecepcion.length > 3 && (
                      <div className="text-sm text-muted-foreground">
                        ... y {reception.detalleActaRecepcion.length - 3} productos más
                      </div>
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