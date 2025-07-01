import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Save, RefreshCw } from 'lucide-react';

interface SettingsHeaderProps {
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function SettingsHeader({ hasChanges, isSaving, onSave, onReset }: SettingsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-orange-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Configuración del Sistema
          </h1>
          <Badge variant="outline" className="hidden sm:inline-flex">
            SIGFARMA-SENA
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Personaliza y configura el comportamiento del sistema
        </p>
      </div>
      
      {hasChanges && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onReset}
            disabled={isSaving}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restablecer
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}