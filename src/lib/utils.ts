import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export type DueStatus = 'overdue' | 'today' | 'this-week' | 'later' | null;

export function getDueStatus(dueDate: Date | string | null): DueStatus {
  if (!dueDate) return null;

  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 7) return 'this-week';
  return 'later';
}

function startOfDay(date: Date | string) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatRelativeDate(dueDate: Date | string | null): {
  label: string;
  status: DueStatus;
  fullLabel: string;
} {
  if (!dueDate) {
    return { label: 'No due date', status: null, fullLabel: 'No due date' };
  }

  const due = startOfDay(dueDate);
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const fullLabel = due.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: due.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });

  if (due.getTime() === today.getTime()) {
    return { label: 'Today', status: 'today', fullLabel };
  }

  if (due.getTime() === tomorrow.getTime()) {
    return { label: 'Tomorrow', status: 'this-week', fullLabel };
  }

  if (due.getTime() === yesterday.getTime()) {
    return { label: 'Yesterday', status: 'overdue', fullLabel };
  }

  if (due.getTime() < today.getTime()) {
    const days = Math.round((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return {
      label: days <= 7 ? `${days}d overdue` : due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      status: 'overdue',
      fullLabel,
    };
  }

  const futureDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (futureDays <= 7) {
    return { label: `In ${futureDays}d`, status: 'this-week', fullLabel };
  }

  return {
    label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    status: 'later',
    fullLabel,
  };
}

const STATUS_LABELS: Record<string, string> = {
  TODO: 'Todo',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  ACTIVE: 'Active',
  UPCOMING: 'Upcoming',
  SCHEDULED: 'Scheduled',
};

export function formatStatus(status: string): string {
  const key = status.toUpperCase();
  return STATUS_LABELS[key] ?? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, ' ');
}

export function getContrastColor(hexColor: string): '#ffffff' | '#0c0a09' {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#0c0a09' : '#ffffff';
}