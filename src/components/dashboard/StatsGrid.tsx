import { StatsCard } from './StatsCard';
import { TrendingUp, Calendar, Package, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface StatsGridProps {
  stats: {
    sales: {
      today: { total: number; count: number };
      month: { total: number; count: number };
    };
    inventory: {
      totalProducts: number;
      lowStockCount: number;
      expirationAlerts: {
        expired: number;
        critical: number;
        warning: number;
      };
    };
  };
}

export function StatsGrid({ stats }: StatsGridProps) {
  const navigate = useNavigate();

  const totalAlerts = stats.inventory.expirationAlerts.expired + 
                     stats.inventory.expirationAlerts.critical + 
                     stats.inventory.expirationAlerts.warning;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <StatsCard
        title="Ventas Hoy"
        value={formatCurrency(stats.sales.today.total)}
        subtitle={`${stats.sales.today.count} transacciones`}
        icon={TrendingUp}
        color="green"
        onClick={() => navigate('/reports?tab=sales&period=today')}
      />
      
      <StatsCard
        title="Ventas del Mes"
        value={formatCurrency(stats.sales.month.total)}
        subtitle={`${stats.sales.month.count} transacciones`}
        icon={Calendar}
        color="blue"
        onClick={() => navigate('/reports?tab=sales&period=month')}
      />
      
      <StatsCard
        title="Productos Activos"
        value={stats.inventory.totalProducts}
        subtitle={`${stats.inventory.lowStockCount} con stock bajo`}
        icon={Package}
        color="purple"
        onClick={() => navigate('/products')}
      />
      
      <StatsCard
        title="Alertas"
        value={totalAlerts}
        subtitle="Vencimientos y stock bajo"
        icon={AlertTriangle}
        color="red"
        onClick={() => navigate('/notifications')}
      />
    </div>
  );
}