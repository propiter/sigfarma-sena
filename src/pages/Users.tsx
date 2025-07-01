import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/lib/utils';
import { UsersList } from '@/components/users/UsersList';
import { UserForm } from '@/components/users/UserForm';
import { UserDetails } from '@/components/users/UserDetails';
import { UserActivity } from '@/components/users/UserActivity';
import { UsersHeader } from '@/components/users/UsersHeader';
import { UsersStats } from '@/components/users/UsersStats';
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  UserPlus,
  Shield,
  Activity
} from 'lucide-react';

export interface User {
  usuarioId: number;
  nombre: string;
  correo: string;
  rol: 'administrador' | 'cajero' | 'inventario';
  activo: boolean;
  fechaCreacion: string;
  ultimoAcceso?: string;
  ventasCount?: number;
  actividadReciente?: any[];
}

export function Users() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    administrators: 0,
    cashiers: 0,
    inventory: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/users/stats', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        await fetchUsers();
        await fetchUserStats();
        setShowCreateForm(false);
        setActiveTab('list');
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const handleUpdateUser = async (userId: number, userData: any) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        await fetchUsers();
        await fetchUserStats();
        setShowEditForm(false);
        setActiveTab('list');
        if (selectedUser?.usuarioId === userId) {
          const updatedUser = users.find(u => u.usuarioId === userId);
          if (updatedUser) {
            setSelectedUser(updatedUser);
          }
        }
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const handleToggleUserStatus = async (userId: number, newStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ activo: newStatus })
      });

      if (response.ok) {
        await fetchUsers();
        await fetchUserStats();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.correo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.rol === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.activo) ||
                         (statusFilter === 'inactive' && !user.activo);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="container-responsive py-6 space-y-6">
      {/* Header */}
      <UsersHeader 
        onCreateUser={() => {
          setShowCreateForm(true);
          setActiveTab('create');
        }}
        onRefresh={() => {
          fetchUsers();
          fetchUserStats();
        }}
      />

      {/* Stats */}
      <UsersStats stats={stats} />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1">
          <TabsTrigger 
            value="list" 
            className="flex items-center gap-2 py-3 px-4"
          >
            <UsersIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Lista de Usuarios</span>
          </TabsTrigger>
          <TabsTrigger 
            value="details" 
            className="flex items-center gap-2 py-3 px-4"
            disabled={!selectedUser}
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Detalles</span>
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="flex items-center gap-2 py-3 px-4"
            disabled={!selectedUser}
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Actividad</span>
          </TabsTrigger>
          {(showCreateForm || showEditForm) && (
            <TabsTrigger 
              value={showCreateForm ? "create" : "edit"} 
              className="flex items-center gap-2 py-3 px-4"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">
                {showCreateForm ? 'Crear Usuario' : 'Editar Usuario'}
              </span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Gestión de Usuarios</CardTitle>
                  <CardDescription>
                    Administra los usuarios del sistema y sus permisos
                  </CardDescription>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuarios..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background text-foreground"
                  >
                    <option value="all">Todos los roles</option>
                    <option value="administrador">Administrador</option>
                    <option value="cajero">Cajero</option>
                    <option value="inventario">Inventario</option>
                  </select>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background text-foreground"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                  
                  <Button variant="outline" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <UsersList
                users={filteredUsers}
                currentUser={currentUser}
                onSelectUser={(user) => {
                  setSelectedUser(user);
                  setActiveTab('details');
                }}
                onEditUser={(user) => {
                  setSelectedUser(user);
                  setShowEditForm(true);
                  setActiveTab('edit');
                }}
                onToggleStatus={handleToggleUserStatus}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedUser ? (
            <UserDetails 
              user={selectedUser}
              onEdit={() => {
                setShowEditForm(true);
                setActiveTab('edit');
              }}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Selecciona un usuario para ver sus detalles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          {selectedUser ? (
            <UserActivity userId={selectedUser.usuarioId} />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Selecciona un usuario para ver su actividad</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {showCreateForm && (
          <TabsContent value="create" className="space-y-4">
            <UserForm
              mode="create"
              onSubmit={handleCreateUser}
              onCancel={() => {
                setShowCreateForm(false);
                setActiveTab('list');
              }}
            />
          </TabsContent>
        )}

        {showEditForm && selectedUser && (
          <TabsContent value="edit" className="space-y-4">
            <UserForm
              mode="edit"
              user={selectedUser}
              onSubmit={(data) => handleUpdateUser(selectedUser.usuarioId, data)}
              onCancel={() => {
                setShowEditForm(false);
                setActiveTab('details');
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}