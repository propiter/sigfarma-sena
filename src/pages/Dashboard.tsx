import { useEffect, useState } from 'react';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { ExpirationAlertsCard } from '@/components/dashboard/ExpirationAlertsCard';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';

interface DashboardStats {
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
  recentActivity: any[];
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/reports/dashboard', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Error al cargar los datos del dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <WelcomeHeader />

      {/* Stats Grid */}
      <StatsGrid stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiration Alerts */}
        <ExpirationAlertsCard alerts={stats.inventory.expirationAlerts} />

        {/* Recent Activity */}
        <RecentActivityCard recentSales={stats.recentActivity} />
      </div>

      {/* Quick Actions */}
      <QuickActionsCard />
    </div>
  );
}