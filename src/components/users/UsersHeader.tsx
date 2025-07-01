import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, RefreshCw, Download } from 'lucide-react';

interface UsersHeaderProps {
  onCreateUser: () => void;
  onRefresh: () => void;
}

export function UsersHeader({ onCreateUser, onRefresh }: UsersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6 text-orange-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Gestión de Usuarios
          </h1>
          <Badge variant="outline" className="hidden sm:inline-flex">
            SIGFARMA-SENA
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Administra usuarios, roles y permisos del sistema
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onRefresh}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
        
        <Button
          onClick={onCreateUser}
          className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>
    </div>
  );
}