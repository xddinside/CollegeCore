import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => {
    const orientationStyles = {
      horizontal: 'h-[1px] w-full',
      vertical: 'h-full w-[1px]',
    };

    return (
      <div
        ref={ref}
        className={cn('shrink-0 bg-border', orientationStyles[orientation], className)}
        {...props}
      />
    );
  }
);
Separator.displayName = 'Separator';
