import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { 
  Package, 
  Save, 
  X, 
  AlertTriangle,
  Calendar,
  Trash2
} from 'lucide-react';

interface LoteBajaFormProps {
  lote: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function LoteBajaForm({ lote, onSubmit, onCancel }: LoteBajaFormProps) {
  const [formData, setFormData] = useState({
    cantidad: lote.cantidadDisponible,
    motivo: '',
    observaciones: '',
    requiereAprobacion: true
  });
  const [loading, setLoading] = useState(false);

  const motivoOptions = [
    { value: 'vencimiento', label: 'Vencimiento' },
    { value: 'deterioro', label: 'Deterioro/Daño' },
    { value: 'error_ingreso', label: 'Error de ingreso' },
    { value: 'devolucion_proveedor', label: 'Devolución a proveedor' },
    { value: 'retiro_mercado', label: 'Retiro del mercado' },
    { value: 'otro', label: 'Otro' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.motivo) {
      alert('El motivo de baja es requerido');
      return;
    }

    if (formData.cantidad <= 0 || formData.cantidad > lote.cantidadDisponible) {
      alert(`La cantidad debe ser mayor a 0 y menor o igual a ${lote.cantidadDisponible}`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        loteId: lote.loteId,
        ...formData
      });
    } catch (error: any) {
      alert(error.message || 'Error al procesar la baja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-500" />
          Dar de Baja Lote
        </CardTitle>
        <CardDescription>
          Registrar baja de medicamentos del inventario
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del lote */}
          <div className="p-4 bg-muted/50 dark:bg-muted/20 rounded-lg">
            <h3 className="font-medium mb-3">Información del Lote</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Producto</Label>
                <p className="font-medium">{lote.producto.nombre}</p>
                <p className="text-sm text-muted-foreground">{lote.producto.presentacion}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Lote</Label>
                <p className="font-medium">{lote.numeroLote}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Vence: {formatDate(lote.fechaVencimiento)}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Cantidad Disponible</Label>
                <p className="font-medium">{lote.cantidadDisponible} unidades</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Estado</Label>
                <Badge className={
                  lote.alertaVencimiento === 'Vencido' ? 'bg-red-500 text-white' :
                  lote.alertaVencimiento === 'Rojo' ? 'bg-red-500 text-white' :
                  lote.alertaVencimiento === 'Amarillo' ? 'bg-yellow-500 text-white' :
                  lote.alertaVencimiento === 'Naranja' ? 'bg-orange-500 text-white' :
                  'bg-green-500 text-white'
                }>
                  {lote.alertaVencimiento}
                </Badge>
              </div>
            </div>
          </div>

          {/* Formulario de baja */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="cantidad">Cantidad a dar de baja *</Label>
              <Input
                id="cantidad"
                type="number"
                min={1}
                max={lote.cantidadDisponible}
                value={formData.cantidad}
                onChange={(e) => setFormData({...formData, cantidad: parseInt(e.target.value) || 0})}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Máximo disponible: {lote.cantidadDisponible} unidades
              </p>
            </div>

            <div>
              <Label htmlFor="motivo">Motivo de la baja *</Label>
              <select
                id="motivo"
                value={formData.motivo}
                onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                className="w-full p-2 border rounded-md bg-background text-foreground"
                required
              >
                <option value="">Seleccionar motivo</option>
                {motivoOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                className="w-full p-2 border rounded-md h-20 bg-background text-foreground"
                placeholder="Detalles adicionales sobre la baja..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiereAprobacion"
                checked={formData.requiereAprobacion}
                onChange={(e) => setFormData({...formData, requiereAprobacion: e.target.checked})}
                className="rounded border-gray-300"
              />
              <Label htmlFor="requiereAprobacion">
                Requiere aprobación de administrador
              </Label>
            </div>

            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-900 dark:text-yellow-100">Importante</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Esta acción {formData.requiereAprobacion ? 'requerirá aprobación administrativa antes de' : 'reducirá inmediatamente'} el inventario disponible. {formData.requiereAprobacion ? 'El administrador deberá aprobar esta solicitud.' : 'Esta acción no se puede deshacer.'}
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {loading ? (
                'Procesando...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Registrar Baja
                </>
              )}
            </Button>
            
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}