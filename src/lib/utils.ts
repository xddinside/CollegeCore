import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  UPCOMING: 'Upcoming',
  SCHEDULED: 'Scheduled',
};

export function formatStatus(status: string): string {
  const key = status.toUpperCase();
  return (
    STATUS_LABELS[key] ??
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, ' ')
  );
}

export function getContrastColor(hexColor: string): '#ffffff' | '#0c0a09' {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#0c0a09' : '#ffffff';
}
