import { Badge } from '@/components/ui/badge';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';

export function WelcomeHeader() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettingsStore();

  const farmaciaName = settings?.nombre_farmacia?.valor || 'SENA';

  const currentDate = new Date().toLocaleDateString('es-CO', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Panel de Control
          </h1>
          <Badge variant="outline" className="hidden sm:inline-flex">
           {farmaciaName}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Bienvenido, <span className="font-medium">{user?.nombre}</span> • {currentDate}
        </p>
      </div>
      
        <div className="flex items-center gap-2">
          <img 
            src="/logos/logo.png" 
            alt="Logo" 
            className="h-8 w-auto" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/logos/icon.png';
            }}
          />
          {farmaciaName && (
            <span className="font-medium text-sm text-orange-600 dark:text-orange-400">
              {farmaciaName}
            </span>
          )}
        </div>
      </div>
  );
}