import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { 
  Trash2, 
  Search, 
  Filter, 
  Eye, 
  RefreshCw,
  CheckCircle,
  Clock,
  X,
  User,
  Calendar,
  Package
} from 'lucide-react';

interface BajasListProps {
  onSelectBaja: (baja: any) => void;
}

export function BajasList({ onSelectBaja }: BajasListProps) {
  const [bajas, setBajas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchBajas();
  }, []);

  const fetchBajas = async () => {
    try {
      const response = await fetch('/api/inventory/bajas', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setBajas(data.bajas);
      }
    } catch (error) {
      console.error('Error fetching bajas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return (
          <Badge variant="warning" className="bg-orange-100 text-orange-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'Aprobada':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprobada
          </Badge>
        );
      case 'Rechazada':
        return (
          <Badge variant="destructive">
            <X className="w-3 h-3 mr-1" />
            Rechazada
          </Badge>
        );
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const getMotivoText = (motivo: string) => {
    switch (motivo) {
      case 'vencimiento': return 'Vencimiento';
      case 'deterioro': return 'Deterioro/Daño';
      case 'error_ingreso': return 'Error de ingreso';
      case 'devolucion_proveedor': return 'Devolución a proveedor';
      case 'retiro_mercado': return 'Retiro del mercado';
      default: return 'Otro';
    }
  };

  const filteredBajas = bajas.filter(baja => {
    const matchesSearch = 
      baja.lote.producto.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      baja.lote.numeroLote.toLowerCase().includes(searchQuery.toLowerCase()) ||
      baja.usuario.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || baja.estado === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Historial de Bajas</CardTitle>
            <CardDescription>
              Registro de medicamentos dados de baja
            </CardDescription>
          </div>
          <Button onClick={fetchBajas} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por producto, lote o usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background text-foreground"
          >
            <option value="all">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Rechazada">Rechazada</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredBajas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trash2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No se encontraron registros de bajas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBajas.map((baja) => (
              <div
                key={baja.bajaId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onSelectBaja(baja)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">Baja #{baja.bajaId}</h3>
                    {getStatusBadge(baja.estado)}
                    <Badge variant="outline">
                      {getMotivoText(baja.motivo)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {baja.lote.producto.nombre}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {baja.usuario.nombre}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDateTime(baja.fechaSolicitud)}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    Lote: {baja.lote.numeroLote} - Cantidad: {baja.cantidad} unidades
                  </div>

                  {baja.usuarioAprobador && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {baja.estado === 'Aprobada' ? 'Aprobado' : 'Rechazado'} por: {baja.usuarioAprobador.nombre} • {formatDateTime(baja.fechaAprobacion)}
                    </div>
                  )}
                </div>

                <div className="text-right ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBaja(baja);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}