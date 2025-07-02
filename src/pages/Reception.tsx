import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { ReceptionForm } from '@/components/reception/ReceptionForm';
import { ReceptionsList } from '@/components/reception/ReceptionsList';
import { ReceptionDetails } from '@/components/reception/ReceptionDetails';
import { PendingApprovals } from '@/components/reception/PendingApprovals';
import { 
  Package, 
  Plus, 
  Search, 
  Truck,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  Eye,
  Edit,
  Calendar,
  User,
  Building,
  Clock
} from 'lucide-react';

export function Reception() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('list');
  const [selectedReception, setSelectedReception] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user?.rol === 'administrador') {
      fetchPendingCount();
    }
  }, [user]);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/inventory/reception/pending-approvals', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  const handleReceptionCreated = () => {
    setActiveTab('list');
    if (user?.rol === 'administrador') {
      fetchPendingCount();
    }
  };

  const handleReceptionSelected = (reception: any) => {
    setSelectedReception(reception);
    setActiveTab('details');
  };

  const handleApprovalProcessed = () => {
    setActiveTab('list');
    fetchPendingCount();
  };

  const tabs = [
    {
      value: 'list',
      label: 'Historial',
      icon: FileText,
      roles: ['administrador', 'inventario']
    },
    {
      value: 'create',
      label: 'Nueva Recepción',
      icon: Plus,
      roles: ['administrador', 'inventario']
    },
    {
      value: 'pending',
      label: `Pendientes (${pendingCount})`,
      icon: Clock,
      roles: ['administrador'],
      badge: pendingCount > 0
    },
    {
      value: 'details',
      label: 'Detalles',
      icon: Eye,
      roles: ['administrador', 'inventario'],
      hidden: !selectedReception
    }
  ].filter(tab => 
    tab.roles.includes(user?.rol || '') && !tab.hidden
  );

  return (
    <div className="container-responsive py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Recepción de Mercancía
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de ingresos de inventario con flujo de aprobación
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Package className="w-4 h-4 mr-2" />
            Sistema de Aprobación
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 py-3 px-4 relative"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <ReceptionsList onSelectReception={handleReceptionSelected} />
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <ReceptionForm onReceptionCreated={handleReceptionCreated} />
        </TabsContent>

        {user?.rol === 'administrador' && (
          <TabsContent value="pending" className="space-y-4">
            <PendingApprovals 
              onApprovalProcessed={handleApprovalProcessed}
              onSelectReception={handleReceptionSelected}
            />
          </TabsContent>
        )}

        <TabsContent value="details" className="space-y-4">
          {selectedReception ? (
            <ReceptionDetails 
              reception={selectedReception}
              onApprovalProcessed={handleApprovalProcessed}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Selecciona una recepción para ver sus detalles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}