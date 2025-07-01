import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Globe, DollarSign } from 'lucide-react';

interface GeneralSettingsProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
}

export function GeneralSettings({ settings, onSettingChange }: GeneralSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Información de la Empresa
          </CardTitle>
          <CardDescription>
            Configuración básica de la farmacia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company-name">Nombre de la Farmacia</Label>
              <Input
                id="company-name"
                value={settings.nombre_farmacia?.valor || ''}
                onChange={(e) => onSettingChange('nombre_farmacia', e.target.value)}
                placeholder="Farmacia SENA"
              />
            </div>
            <div>
              <Label htmlFor="company-nit">NIT</Label>
              <Input
                id="company-nit"
                value={settings.nit_farmacia?.valor || ''}
                onChange={(e) => onSettingChange('nit_farmacia', e.target.value)}
                placeholder="900123456-1"
              />
            </div>
            <div>
              <Label htmlFor="company-address">Dirección</Label>
              <Input
                id="company-address"
                value={settings.direccion_farmacia?.valor || ''}
                onChange={(e) => onSettingChange('direccion_farmacia', e.target.value)}
                placeholder="Calle 123 #45-67"
              />
            </div>
            <div>
              <Label htmlFor="company-phone">Teléfono</Label>
              <Input
                id="company-phone"
                value={settings.telefono_farmacia?.valor || ''}
                onChange={(e) => onSettingChange('telefono_farmacia', e.target.value)}
                placeholder="(601) 234-5678"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Configuración Regional
          </CardTitle>
          <CardDescription>
            Moneda, idioma y formato de fecha
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="currency">Moneda</Label>
              <Select
                value={settings.moneda?.valor || 'COP'}
                onValueChange={(value) => onSettingChange('moneda', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COP">Peso Colombiano (COP)</SelectItem>
                  <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">Zona Horaria</Label>
              <Select
                value={settings.zona_horaria?.valor || 'America/Bogota'}
                onValueChange={(value) => onSettingChange('zona_horaria', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar zona horaria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                  <SelectItem value="America/Caracas">Caracas (GMT-4)</SelectItem>
                  <SelectItem value="America/Lima">Lima (GMT-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-format">Formato de Fecha</Label>
              <Select
                value={settings.formato_fecha?.valor || 'DD/MM/YYYY'}
                onValueChange={(value) => onSettingChange('formato_fecha', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Formato de fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Configuración de Impuestos
          </CardTitle>
          <CardDescription>
            IVA y otros impuestos aplicables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="iva-percentage">Porcentaje de IVA (%)</Label>
              <Input
                id="iva-percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.iva_porcentaje?.valor || '19'}
                onChange={(e) => onSettingChange('iva_porcentaje', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="margin-default">Margen de Ganancia por Defecto (%)</Label>
              <Input
                id="margin-default"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.margen_ganancia_default?.valor || '30'}
                onChange={(e) => onSettingChange('margen_ganancia_default', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-calculate-iva">Calcular IVA Automáticamente</Label>
              <p className="text-sm text-muted-foreground">
                Aplicar IVA automáticamente en las ventas
              </p>
            </div>
            <Switch
              id="auto-calculate-iva"
              checked={settings.auto_calcular_iva?.valor === 'true'}
              onCheckedChange={(checked) => onSettingChange('auto_calcular_iva', checked.toString())}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}