import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'ghost';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-secondary text-secondary-foreground',
      secondary: 'bg-accent text-accent-foreground',
      outline: 'border border-input text-foreground',
      destructive: 'bg-destructive/10 text-destructive',
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
      ghost: 'text-muted-foreground',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-normal transition-colors',
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';