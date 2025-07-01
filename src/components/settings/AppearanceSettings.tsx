import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { Palette, Monitor, Sun, Moon, Smartphone } from 'lucide-react';

interface AppearanceSettingsProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
}

export function AppearanceSettings({ settings, onSettingChange }: AppearanceSettingsProps) {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Oscuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor }
  ];

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Tema y Apariencia
          </CardTitle>
          <CardDescription>
            Personaliza la apariencia de la interfaz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium">Tema de Color</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Selecciona el tema de color para la aplicación
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themes.map((themeOption) => {
                const Icon = themeOption.icon;
                return (
                  <Button
                    key={themeOption.value}
                    variant={theme === themeOption.value ? "default" : "outline"}
                    className="h-20 flex-col gap-2"
                    onClick={() => setTheme(themeOption.value as any)}
                  >
                    <Icon className="w-6 h-6" />
                    <span>{themeOption.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="compact-mode">Modo Compacto</Label>
              <p className="text-sm text-muted-foreground">
                Reduce el espaciado para mostrar más información en pantalla
              </p>
            </div>
            <Switch
              id="compact-mode"
              checked={settings.modo_compacto?.valor === 'true'}
              onCheckedChange={(checked) => onSettingChange('modo_compacto', checked.toString())}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="animations">Animaciones</Label>
              <p className="text-sm text-muted-foreground">
                Habilitar transiciones y animaciones en la interfaz
              </p>
            </div>
            <Switch
              id="animations"
              checked={settings.animaciones_habilitadas?.valor !== 'false'}
              onCheckedChange={(checked) => onSettingChange('animaciones_habilitadas', checked.toString())}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Configuración de Pantalla
          </CardTitle>
          <CardDescription>
            Ajustes para diferentes tipos de dispositivos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sidebar-behavior">Comportamiento del Sidebar</Label>
            <Select
              value={settings.sidebar_comportamiento?.valor || 'auto'}
              onValueChange={(value) => onSettingChange('sidebar_comportamiento', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar comportamiento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automático (según pantalla)</SelectItem>
                <SelectItem value="always-open">Siempre abierto</SelectItem>
                <SelectItem value="always-collapsed">Siempre colapsado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="table-density">Densidad de Tablas</Label>
            <Select
              value={settings.densidad_tablas?.valor || 'normal'}
              onValueChange={(value) => onSettingChange('densidad_tablas', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar densidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compacta</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="comfortable">Cómoda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-tooltips">Mostrar Tooltips</Label>
              <p className="text-sm text-muted-foreground">
                Mostrar información adicional al pasar el cursor sobre elementos
              </p>
            </div>
            <Switch
              id="show-tooltips"
              checked={settings.mostrar_tooltips?.valor !== 'false'}
              onCheckedChange={(checked) => onSettingChange('mostrar_tooltips', checked.toString())}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mobile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Configuración Móvil
          </CardTitle>
          <CardDescription>
            Ajustes específicos para dispositivos móviles y tablets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="mobile-gestures">Gestos Táctiles</Label>
              <p className="text-sm text-muted-foreground">
                Habilitar gestos de deslizamiento en dispositivos táctiles
              </p>
            </div>
            <Switch
              id="mobile-gestures"
              checked={settings.gestos_tactiles?.valor === 'true'}
              onCheckedChange={(checked) => onSettingChange('gestos_tactiles', checked.toString())}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="large-buttons">Botones Grandes</Label>
              <p className="text-sm text-muted-foreground">
                Usar botones más grandes para facilitar el uso táctil
              </p>
            </div>
            <Switch
              id="large-buttons"
              checked={settings.botones_grandes?.valor === 'true'}
              onCheckedChange={(checked) => onSettingChange('botones_grandes', checked.toString())}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}