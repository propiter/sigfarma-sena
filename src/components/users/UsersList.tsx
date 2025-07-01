import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatDateTime } from '@/lib/utils';
import { User } from '@/pages/Users';
import { Eye, Edit, Shield, ShoppingCart, Package, UserX, UserCheck } from 'lucide-react';

interface UsersListProps {
  users: User[];
  currentUser: any;
  onSelectUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onToggleStatus: (userId: number, newStatus: boolean) => void;
}

export function UsersList({ 
  users, 
  currentUser, 
  onSelectUser, 
  onEditUser, 
  onToggleStatus 
}: UsersListProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'administrador': return Shield;
      case 'cajero': return ShoppingCart;
      case 'inventario': return Package;
      default: return Shield;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'administrador': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'cajero': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'inventario': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'administrador': return 'Administrador';
      case 'cajero': return 'Cajero';
      case 'inventario': return 'Inventario';
      default: return role;
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <UserX className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No se encontraron usuarios</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => {
        const RoleIcon = getRoleIcon(user.rol);
        const isCurrentUser = currentUser?.usuarioId === user.usuarioId;
        
        return (
          <div
            key={user.usuarioId}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">{user.nombre}</h3>
                  {isCurrentUser && (
                    <Badge variant="outline" className="text-xs">
                      Tú
                    </Badge>
                  )}
                </div>
                
                <Badge className={`text-xs ${getRoleColor(user.rol)}`}>
                  <RoleIcon className="w-3 h-3 mr-1" />
                  {getRoleLabel(user.rol)}
                </Badge>
                
                <Badge 
                  variant={user.activo ? "default" : "secondary"}
                  className={user.activo ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  {user.activo ? (
                    <>
                      <UserCheck className="w-3 h-3 mr-1" />
                      Activo
                    </>
                  ) : (
                    <>
                      <UserX className="w-3 h-3 mr-1" />
                      Inactivo
                    </>
                  )}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Email:</span> {user.correo}
                </div>
                <div>
                  <span className="font-medium">Creado:</span> {formatDateTime(user.fechaCreacion)}
                </div>
                <div>
                  <span className="font-medium">Último acceso:</span>{' '}
                  {user.ultimoAcceso ? formatDateTime(user.ultimoAcceso) : 'Nunca'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Estado:</span>
                <Switch
                  checked={user.activo}
                  onCheckedChange={(checked) => onToggleStatus(user.usuarioId, checked)}
                  disabled={isCurrentUser}
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectUser(user)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditUser(user)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}