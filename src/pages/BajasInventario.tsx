import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { BajasList } from '@/components/inventory/BajasList';
import { BajasApprovalList } from '@/components/inventory/BajasApprovalList';
import { BajaDetails } from '@/components/inventory/BajaDetails';
import { LoteBajaForm } from '@/components/inventory/LoteBajaForm';
import { Trash2, Clock, Eye, Plus } from 'lucide-react';

export function BajasInventario() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('list');
  const [selectedBaja, setSelectedBaja] = useState<any>(null);
  const [selectedLote, setSelectedLote] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user?.rol === 'administrador') {
      fetchPendingCount();
    }
  }, [user]);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/inventory/bajas/pending', {
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

  const handleBajaCreated = () => {
    setActiveTab('list');
    if (user?.rol === 'administrador') {
      fetchPendingCount();
    }
  };

  const handleBajaSelected = (baja: any) => {
    setSelectedBaja(baja);
    setActiveTab('details');
  };

  const handleApprovalProcessed = () => {
    setActiveTab('list');
    fetchPendingCount();
  };

  const handleSubmitBaja = async (data: any) => {
    try {
      const response = await fetch('/api/inventory/bajas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        alert('Solicitud de baja registrada exitosamente');
        setSelectedLote(null);
        setActiveTab('list');
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al registrar la baja');
    }
  };

  const tabs = [
    {
      value: 'list',
      label: 'Historial',
      icon: Trash2,
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
      hidden: !selectedBaja
    },
    {
      value: 'create',
      label: 'Nueva Baja',
      icon: Plus,
      roles: ['administrador', 'inventario'],
      hidden: !selectedLote
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
            Bajas de Inventario
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de bajas de medicamentos y productos farmacéuticos
          </p>
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
                {tab.badge && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <BajasList onSelectBaja={handleBajaSelected} />
        </TabsContent>

        {user?.rol === 'administrador' && (
          <TabsContent value="pending" className="space-y-4">
            <BajasApprovalList 
              onApprovalProcessed={handleApprovalProcessed}
              onSelectBaja={handleBajaSelected}
            />
          </TabsContent>
        )}

        <TabsContent value="details" className="space-y-4">
          {selectedBaja ? (
            <BajaDetails 
              baja={selectedBaja}
              onApprovalProcessed={handleApprovalProcessed}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Selecciona una baja para ver sus detalles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          {selectedLote ? (
            <LoteBajaForm 
              lote={selectedLote}
              onSubmit={handleSubmitBaja}
              onCancel={() => {
                setSelectedLote(null);
                setActiveTab('list');
              }}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Selecciona un lote para dar de baja</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}