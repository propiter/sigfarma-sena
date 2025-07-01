import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, Calendar } from 'lucide-react';

interface InventorySettingsProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
}

export function InventorySettings({ settings, onSettingChange }: InventorySettingsProps) {
  const alertSettings = [
    {
      key: 'alerta_roja_dias',
      label: 'Alerta Roja',
      description: 'Productos próximos a vencer (crítico)',
      color: 'bg-red-500',
      defaultValue: '180'
    },
    {
      key: 'alerta_amarilla_dias',
      label: 'Alerta Amarilla',
      description: 'Productos con vencimiento intermedio',
      color: 'bg-yellow-500',
      defaultValue: '365'
    },
    {
      key: 'alerta_naranja_dias',
      label: 'Alerta Naranja',
      description: 'Productos con vencimiento lejano',
      color: 'bg-orange-500',
      defaultValue: '730'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stock Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Gestión de Stock
          </CardTitle>
          <CardDescription>
            Configuración de niveles de inventario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock-minimo-default">Stock Mínimo por Defecto</Label>
              <Input
                id="stock-minimo-default"
                type="number"
                min="1"
                value={settings.stock_minimo_default?.valor || '5'}
                onChange={(e) => onSettingChange('stock_minimo_default', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="stock-maximo-default">Stock Máximo por Defecto</Label>
              <Input
                id="stock-maximo-default"
                type="number"
                min="1"
                value={settings.stock_maximo_default?.valor || '1000'}
                onChange={(e) => onSettingChange('stock_maximo_default', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-reorder">Reorden Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Generar órdenes de compra automáticamente cuando el stock esté bajo
                </p>
              </div>
              <Switch
                id="auto-reorder"
                checked={settings.reorden_automatico?.valor === 'true'}
                onCheckedChange={(checked) => onSettingChange('reorden_automatico', checked.toString())}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="fefo-enabled">Aplicar FEFO (First Expired, First Out)</Label>
                <p className="text-sm text-muted-foreground">
                  Vender primero los productos que vencen más pronto
                </p>
              </div>
              <Switch
                id="fefo-enabled"
                checked={settings.fefo_habilitado?.valor !== 'false'}
                onCheckedChange={(checked) => onSettingChange('fefo_habilitado', checked.toString())}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expiration Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Alertas de Vencimiento
          </CardTitle>
          <CardDescription>
            Configurar umbrales de tiempo para alertas de vencimiento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {alertSettings.map((alert) => (
            <div key={alert.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${alert.color}`} />
                <Label htmlFor={alert.key}>{alert.label}</Label>
                <Badge variant="outline" className="text-xs">
                  {settings[alert.key]?.valor || alert.defaultValue} días
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {alert.description}
              </p>
              <div className="flex items-center gap-2">
                <Input
                  id={alert.key}
                  type="number"
                  min="1"
                  max="3650"
                  value={settings[alert.key]?.valor || alert.defaultValue}
                  onChange={(e) => onSettingChange(alert.key, e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">días</span>
              </div>
            </div>
          ))}

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Vista Previa de Alertas</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>0 - {settings.alerta_roja_dias?.valor || '180'} días: Crítico</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>{(parseInt(settings.alerta_roja_dias?.valor || '180') + 1)} - {settings.alerta_amarilla_dias?.valor || '365'} días: Advertencia</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>{(parseInt(settings.alerta_amarilla_dias?.valor || '365') + 1)} - {settings.alerta_naranja_dias?.valor || '730'} días: Monitoreo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Más de {settings.alerta_naranja_dias?.valor || '730'} días: Seguro</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lot Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Gestión de Lotes
          </CardTitle>
          <CardDescription>
            Configuración para el manejo de lotes y fechas de vencimiento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="require-lot-number">Requerir Número de Lote</Label>
              <p className="text-sm text-muted-foreground">
                Obligar el ingreso de número de lote en todas las recepciones
              </p>
            </div>
            <Switch
              id="require-lot-number"
              checked={settings.requerir_numero_lote?.valor === 'true'}
              onCheckedChange={(checked) => onSettingChange('requerir_numero_lote', checked.toString())}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allow-expired-sales">Permitir Venta de Productos Vencidos</Label>
              <p className="text-sm text-muted-foreground">
                Permitir la venta de productos que ya han vencido (no recomendado)
              </p>
            </div>
            <Switch
              id="allow-expired-sales"
              checked={settings.permitir_venta_vencidos?.valor === 'true'}
              onCheckedChange={(checked) => onSettingChange('permitir_venta_vencidos', checked.toString())}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-remove-expired">Remover Automáticamente Productos Vencidos</Label>
              <p className="text-sm text-muted-foreground">
                Ocultar automáticamente productos vencidos del inventario disponible
              </p>
            </div>
            <Switch
              id="auto-remove-expired"
              checked={settings.remover_auto_vencidos?.valor === 'true'}
              onCheckedChange={(checked) => onSettingChange('remover_auto_vencidos', checked.toString())}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}