import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  X,
  AlertTriangle,
  User,
  Building,
  Calendar
} from 'lucide-react';

interface ReceptionsListProps {
  onSelectReception: (reception: any) => void;
}

export function ReceptionsList({ onSelectReception }: ReceptionsListProps) {
  const [receptions, setReceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchReceptions();
  }, []);

  const fetchReceptions = async () => {
    try {
      const response = await fetch('/api/inventory/reception', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setReceptions(data.receptions);
      }
    } catch (error) {
      console.error('Error fetching receptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'PendienteAprobacion':
        return (
          <Badge variant="warning" className="bg-orange-100 text-orange-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'Aprobada':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprobada
          </Badge>
        );
      case 'Completada':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completada
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

  const filteredReceptions = receptions.filter(reception => {
    const matchesSearch = 
      reception.proveedor.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reception.usuarioReceptor.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reception.numeroFactura?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reception.estado === statusFilter;
    
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
            <CardTitle>Historial de Recepciones</CardTitle>
            <CardDescription>
              Todas las actas de recepción registradas en el sistema
            </CardDescription>
          </div>
          <Button onClick={fetchReceptions} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por proveedor, usuario o factura..."
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
            <option value="PendienteAprobacion">Pendiente</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Completada">Completada</option>
            <option value="Rechazada">Rechazada</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredReceptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No se encontraron recepciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReceptions.map((reception) => (
              <div
                key={reception.actaId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onSelectReception(reception)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">Acta #{reception.actaId}</h3>
                    {getStatusBadge(reception.estado)}
                    <Badge variant="outline">
                      {reception.tipoRecepcion}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {reception.proveedor.nombre}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {reception.usuarioReceptor.nombre}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDateTime(reception.fechaRecepcion)}
                    </div>
                  </div>

                  {reception.numeroFactura && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Factura: {reception.numeroFactura}
                    </div>
                  )}

                  {reception.usuarioAprobador && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Aprobado por: {reception.usuarioAprobador.nombre} • {formatDateTime(reception.fechaAprobacion)}
                    </div>
                  )}
                </div>

                <div className="text-right ml-4">
                  <div className="text-sm font-medium">
                    {reception.detalleActaRecepcion.length} productos
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {reception.detalleActaRecepcion.reduce((sum: number, detail: any) => 
                      sum + detail.cantidadRecibida, 0
                    )} unidades
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    {formatCurrency(
                      reception.detalleActaRecepcion.reduce((sum: number, detail: any) => 
                        sum + (detail.cantidadRecibida * detail.precioCompraRecibido), 0
                      )
                    )}
                  </div>
                  
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {reception.estado === 'Completada' && (
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}