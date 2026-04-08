import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles - more minimal
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-normal transition-colors',
          'disabled:pointer-events-none disabled:opacity-50',
          
          // Variants - softer
          variant === 'default' && [
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90',
          ],
          variant === 'secondary' && [
            'bg-secondary text-secondary-foreground',
            'hover:bg-secondary/80',
          ],
          variant === 'outline' && [
            'border border-input bg-background',
            'hover:bg-accent hover:text-accent-foreground',
          ],
          variant === 'ghost' && [
            'hover:bg-accent hover:text-accent-foreground',
          ],
          variant === 'destructive' && [
            'bg-destructive text-destructive-foreground',
            'hover:bg-destructive/90',
          ],
          
          // Sizes
          size === 'default' && 'h-9 px-4 text-sm',
          size === 'sm' && 'h-8 px-3 text-xs',
          size === 'lg' && 'h-10 px-6 text-sm',
          size === 'icon' && 'h-9 w-9',
          
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
