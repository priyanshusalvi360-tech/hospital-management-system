import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null, fmt = 'MMM dd, yyyy') {
  if (!date) return 'N/A';
  return format(new Date(date), fmt);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function getInitials(firstName: string, lastName?: string): string {
  const name = lastName ? `${firstName} ${lastName}` : firstName;
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    ADMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    DISCHARGED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    INACTIVE: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    ON_LEAVE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}