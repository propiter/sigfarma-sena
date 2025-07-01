import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function calculateDaysUntilExpiration(expirationDate: Date | string): number {
  const today = new Date();
  const expDate = new Date(expirationDate);
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpirationStatus(expirationDate: Date | string): 'expired' | 'critical' | 'warning' | 'safe' {
  const days = calculateDaysUntilExpiration(expirationDate);
  
  if (days < 0) return 'expired';
  if (days <= 180) return 'critical';
  if (days <= 365) return 'warning';
  return 'safe';
}

export function getExpirationStatusColor(status: string): string {
  switch (status) {
    case 'expired': return 'text-red-600 bg-red-50';
    case 'critical': return 'text-red-600 bg-red-50';
    case 'warning': return 'text-yellow-600 bg-yellow-50';
    case 'safe': return 'text-green-600 bg-green-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}