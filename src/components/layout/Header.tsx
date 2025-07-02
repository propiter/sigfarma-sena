import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/hooks/useTheme';
import { 
  Menu, 
  Bell, 
  Sun, 
  Moon, 
  Building2,
  User
} from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const { theme, toggleTheme } = useTheme();

  const farmaciaName = settings?.nombre_farmacia?.valor || 'SIGFARMA';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        {/* Mobile logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex items-center justify-center w-6 h-6 bg-orange-500 rounded">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm">
            {farmaciaName}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5"
          >
            3
          </Badge>
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* User info */}
        <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full">
            <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.nombre}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user?.rol?.charAt(0).toUpperCase() + user?.rol?.slice(1)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}