'use client';

import { Check } from 'lucide-react';
import { assignmentStatusLabel, type AssignmentStatus } from '@/lib/assignment-lifecycle';
import { cn } from '@/lib/utils';

type StatusDotProps = {
  status: AssignmentStatus;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: 'h-2.5 w-2.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const iconSizeClasses = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

export function StatusDot({
  status,
  size = 'md',
  interactive = false,
  className,
}: StatusDotProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out)]',
        sizeClasses[size],
        status === 'TODO' && 'border-foreground/80 bg-transparent text-transparent',
        status === 'IN_PROGRESS' && 'border-warning/90 bg-transparent text-warning',
        status === 'COMPLETED' && 'border-success bg-success text-success-foreground',
        interactive && 'status-dot-interactive motion-safe:active:scale-90',
        className
      )}
      aria-hidden="true"
      title={assignmentStatusLabel(status)}
    >
      {status === 'IN_PROGRESS' && (
        <span className={cn('rounded-full bg-current', size === 'lg' ? 'h-2 w-2' : size === 'md' ? 'h-1.5 w-1.5' : 'h-1 w-1')} />
      )}
      {status === 'COMPLETED' && <Check className={iconSizeClasses[size]} strokeWidth={3} />}
    </span>
  );
}
