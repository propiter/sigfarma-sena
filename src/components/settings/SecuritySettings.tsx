import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Shield, Key, Clock, AlertTriangle } from 'lucide-react';

interface SecuritySettingsProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
}

export function SecuritySettings({ settings, onSettingChange }: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      {/* Authentication Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Autenticación
          </CardTitle>
          <CardDescription>
            Configuración de seguridad de acceso al sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="session-timeout">Tiempo de Sesión (minutos)</Label>
            <Input
              id="session-timeout"
              type="number"
              min="5"
              max="480"
              value={settings.tiempo_sesion?.valor || '60'}
              onChange={(e) => onSettingChange('tiempo_sesion', e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Tiempo antes de cerrar sesión automáticamente por inactividad
            </p>
          </div>

          <div>
            <Label htmlFor="max-login-attempts">Intentos Máximos de Login</Label>
            <Input
              id="max-login-attempts"
              type="number"
              min="3"
              max="10"
              value={settings.intentos_maximos_login?.valor || '5'}
              onChange={(e) => onSettingChange('intentos_maximos_login', e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="require-strong-passwords">Requerir Contraseñas Seguras</Label>
              <p className="text-sm text-muted-foreground">
                Exigir contraseñas con mayúsculas, números y símbolos
              </p>
            </div>
            <Switch
              id="require-strong-passwords"
              checked={settings.contrasenas_seguras?.valor === 'true'}
              onCheckedChange={(checked) => onSettingChange('contrasenas_seguras', checked.toString())}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="two-factor-auth">Autenticación de Dos Factores</Label>
              <p className="text-sm text-muted-foreground">
                Requerir verificación adicional para administradores
              </p>
            </div>
            <Switch
              id="two-factor-auth"
              checked={settings.autenticacion_2fa?.valor === 'true'}
              onCheckedChange={(checked) => onSettingChange('autenticacion_2fa', checked.toString())}
            />
          </div>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Control de Acceso
          </CardTitle>
          <CardDescription>
            Permisos y restricciones por rol de usuario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="audit-trail">Registro de Auditoría</Label>
              <p className="text-sm text-muted-foreground">
                Registrar todas las acciones críticas del sistema
              </p>
            </div>
            <Switch
              id="audit-trail"
              checked={settings.registro_auditoria?.valor !== 'false'}
              onCheckedChange={(checked) => onSettingChange('registro_auditoria', checked.toString())}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="restrict-ip">Restricción por IP</Label>
              <p className="text-sm text-muted-foreground">
                Limitar acceso desde direcciones IP específicas
              </p>
            </div>
            <Switch
              id="restrict-ip"
              checked={settings.restriccion_ip?.valor === 'true'}
              onCheckedChange={(checked) => onSettingChange('restriccion_ip', checked.toString())}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="require-approval">Requerir Aprobación para Cambios Críticos</Label>
              <p className="text-sm text-muted-foreground">
                Solicitar aprobación de administrador para acciones sensibles
              </p>
            </div>
            <Switch
              id="require-approval"
              checked={settings.requerir_aprobacion?.valor === 'true'}
              onCheckedChange={(checked) => onSettingChange('requerir_aprobacion', checked.toString())}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Protection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Protección de Datos
          </CardTitle>
          <CardDescription>
            Configuración de respaldos y retención de datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="backup-frequency">Frecuencia de Respaldos</Label>
            <Select
              value={settings.frecuencia_respaldos?.valor || 'daily'}
              onValueChange={(value) => onSettingChange('frecuencia_respaldos', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar frecuencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Cada hora</SelectItem>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="data-retention">Retención de Datos (días)</Label>
            <Input
              id="data-retention"
              type="number"
              min="30"
              max="3650"
              value={settings.retencion_datos?.valor || '365'}
              onChange={(e) => onSettingChange('retencion_datos', e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Tiempo que se conservan los registros de auditoría
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="encrypt-sensitive-data">Encriptar Datos Sensibles</Label>
              <p className="text-sm text-muted-foreground">
                Encriptar información crítica en la base de datos
              </p>
            </div>
            <Switch
              id="encrypt-sensitive-data"
              checked={settings.encriptar_datos?.valor !== 'false'}
              onCheckedChange={(checked) => onSettingChange('encriptar_datos', checked.toString())}
            />
          </div>

          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full">
              <Clock className="w-4 h-4 mr-2" />
              Crear Respaldo Manual
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}