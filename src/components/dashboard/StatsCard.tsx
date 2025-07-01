import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  onClick?: () => void;
  className?: string;
}

const colorVariants = {
  blue: 'border-l-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20',
  green: 'border-l-green-500 hover:bg-green-50 dark:hover:bg-green-950/20',
  orange: 'border-l-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20',
  red: 'border-l-red-500 hover:bg-red-50 dark:hover:bg-red-950/20',
  purple: 'border-l-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20'
};

const iconColorVariants = {
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  orange: 'text-orange-600 dark:text-orange-400',
  red: 'text-red-600 dark:text-red-400',
  purple: 'text-purple-600 dark:text-purple-400'
};

const valueColorVariants = {
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  orange: 'text-orange-600 dark:text-orange-400',
  red: 'text-red-600 dark:text-red-400',
  purple: 'text-purple-600 dark:text-purple-400'
};

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = 'blue',
  onClick,
  className 
}: StatsCardProps) {
  return (
    <Card 
      className={cn(
        'border-l-4 transition-all duration-200 cursor-pointer',
        colorVariants[color],
        onClick && 'hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn('h-4 w-4', iconColorVariants[color])} />
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold', valueColorVariants[color])}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">vs mes anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}