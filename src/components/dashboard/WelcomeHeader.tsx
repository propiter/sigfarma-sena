import { Badge } from '@/components/ui/badge';
import { Building2, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

export function WelcomeHeader() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

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
            SIGFARMA-SENA
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Bienvenido, <span className="font-medium">{user?.nombre}</span> • {currentDate}
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <Building2 className="w-5 h-5" />
          <span className="font-medium text-sm">SENA</span>
        </div>
      </div>
    </div>
  );
}