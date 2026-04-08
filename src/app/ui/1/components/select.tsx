import { cn } from '@/lib/utils';
import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'flex h-11 w-full appearance-none rounded-lg border border-input',
            'bg-background px-3.5 py-2.5 pr-10 text-sm ring-offset-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            'transition-[border-color,box-shadow] hover:border-border-hover',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    );
  }
);
Select.displayName = 'Select';

export const SelectItem = ({
  value,
  children,
  disabled,
}: {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <option value={value} disabled={disabled}>
    {children}
  </option>
);
