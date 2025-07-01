import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User } from '@/pages/Users';
import { formatDateTime } from '@/lib/utils';
import { 
  Shield, 
  ShoppingCart, 
  Package, 
  Mail, 
  Calendar, 
  Clock, 
  Edit,
  UserCheck,
  UserX
} from 'lucide-react';

interface UserDetailsProps {
  user: User;
  onEdit: () => void;
}

export function UserDetails({ user, onEdit }: UserDetailsProps) {
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

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'administrador':
        return [
          'Acceso completo al sistema',
          'Gestión de usuarios',
          'Configuración del sistema',
          'Todos los reportes',
          'Gestión de inventario',
          'Punto de venta'
        ];
      case 'cajero':
        return [
          'Punto de venta',
          'Procesamiento de ventas',
          'Consulta de productos',
          'Reportes de ventas',
          'Consulta de inventario'
        ];
      case 'inventario':
        return [
          'Gestión de inventario',
          'Recepción de mercancía',
          'Gestión de productos',
          'Gestión de proveedores',
          'Reportes de inventario',
          'Control de vencimientos'
        ];
      default:
        return [];
    }
  };

  const RoleIcon = getRoleIcon(user.rol);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <RoleIcon className="w-5 h-5" />
              Información del Usuario
            </CardTitle>
            <Button onClick={onEdit} size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
          <CardDescription>
            Detalles básicos y estado del usuario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-foreground">{user.nombre}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${getRoleColor(user.rol)}`}>
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
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Correo Electrónico</p>
                  <p className="text-sm text-muted-foreground">{user.correo}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Fecha de Creación</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(user.fechaCreacion)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Último Acceso</p>
                  <p className="text-sm text-muted-foreground">
                    {user.ultimoAcceso ? formatDateTime(user.ultimoAcceso) : 'Nunca'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions and Role */}
      <Card>
        <CardHeader>
          <CardTitle>Permisos y Rol</CardTitle>
          <CardDescription>
            Funcionalidades disponibles para este usuario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Permisos del Rol: {getRoleLabel(user.rol)}</h4>
            <div className="space-y-2">
              {getRolePermissions(user.rol).map((permission, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-muted-foreground">{permission}</span>
                </div>
              ))}
            </div>
          </div>

          {user.ventasCount !== undefined && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Estadísticas</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {user.ventasCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Ventas Realizadas</div>
                </div>
                <div className="text-center p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {user.actividadReciente?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Actividades Recientes</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}