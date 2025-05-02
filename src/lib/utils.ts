import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind's class merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency with proper locale and formatting
 */
export function formatCurrency(amount: number | string, currency = 'USD', locale = 'en-US') {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(numAmount);
}

/**
 * Generate a random ID for temporary usage
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Gets initials from a name (first letter of first and last name)
 */
export function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
