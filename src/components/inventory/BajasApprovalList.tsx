import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { 
  Trash2, 
  CheckCircle, 
  X, 
  Eye, 
  User,
  Calendar,
  Package,
  AlertTriangle
} from 'lucide-react';

interface BajasApprovalListProps {
  onApprovalProcessed: () => void;
  onSelectBaja: (baja: any) => void;
}

export function BajasApprovalList({ onApprovalProcessed, onSelectBaja }: BajasApprovalListProps) {
  const [pendingBajas, setPendingBajas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingBajas();
  }, []);

  const fetchPendingBajas = async () => {
    try {
      const response = await fetch('/api/inventory/bajas/pending', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPendingBajas(data);
      }
    } catch (error) {
      console.error('Error fetching pending bajas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bajaId: number) => {
    const observaciones = prompt('Observaciones del aprobador (opcional):');
    if (observaciones === null) return; // User cancelled

    try {
      const response = await fetch(`/api/inventory/bajas/${bajaId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ observacionesAprobador: observaciones })
      });

      if (response.ok) {
        alert('Baja aprobada y procesada exitosamente');
        fetchPendingBajas();
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

  const handleReject = async (bajaId: number) => {
    const motivo = prompt('Motivo del rechazo:');
    if (!motivo) return;

    const observaciones = prompt('Observaciones adicionales (opcional):');
    if (observaciones === null) return; // User cancelled

    try {
      const response = await fetch(`/api/inventory/bajas/${bajaId}/reject`, {
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
        fetchPendingBajas();
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
          <Trash2 className="w-5 h-5 text-red-500" />
          Bajas Pendientes de Aprobación
        </CardTitle>
        <CardDescription>
          Solicitudes de baja de medicamentos que requieren autorización
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingBajas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50 text-green-500" />
            <p>No hay bajas pendientes de aprobación</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingBajas.map((baja) => (
              <div key={baja.bajaId} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">Baja #{baja.bajaId}</h3>
                      <Badge variant="warning" className="bg-orange-100 text-orange-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Pendiente
                      </Badge>
                      <Badge variant="outline">
                        {baja.motivo === 'vencimiento' ? 'Vencimiento' :
                         baja.motivo === 'deterioro' ? 'Deterioro/Daño' :
                         baja.motivo === 'error_ingreso' ? 'Error de ingreso' :
                         baja.motivo === 'devolucion_proveedor' ? 'Devolución a proveedor' :
                         baja.motivo === 'retiro_mercado' ? 'Retiro del mercado' : 'Otro'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {baja.usuario.nombre}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateTime(baja.fechaSolicitud)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {baja.cantidad} unidades
                      </div>
                    </div>

                    <div className="text-sm">
                      <span className="font-medium">Producto:</span> {baja.lote.producto.nombre}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Lote:</span> {baja.lote.numeroLote} - Vence: {formatDateTime(baja.lote.fechaVencimiento)}
                    </div>

                    {baja.observaciones && (
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Observaciones:
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          {baja.observaciones}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectBaja(baja)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => handleApprove(baja.bajaId)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(baja.bajaId)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
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