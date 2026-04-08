'use client';

import * as Popover from '@radix-ui/react-popover';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DayPicker, type Matcher } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/app/ui/1/components/button';

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
}

function toDate(value?: string) {
  return value ? parseISO(value) : undefined;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  min,
  max,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => toDate(value), [value]);
  const minDate = useMemo(() => toDate(min), [min]);
  const maxDate = useMemo(() => toDate(max), [max]);
  const disabledDays = useMemo<Matcher[] | undefined>(() => {
    const matchers: Matcher[] = [];

    if (minDate) {
      matchers.push({ before: minDate });
    }

    if (maxDate) {
      matchers.push({ after: maxDate });
    }

    return matchers.length > 0 ? matchers : undefined;
  }, [maxDate, minDate]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3.5 py-2.5 text-left text-sm',
            'transition-[border-color,box-shadow] hover:border-border-hover',
            'data-[state=open]:border-border-hover data-[state=open]:shadow-md',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={cn('truncate', !selected && 'text-muted-foreground')}>
              {selected ? format(selected, 'EEE, MMM d') : placeholder}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-[18.5rem] rounded-2xl border border-border bg-background p-3 shadow-lg outline-none"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date) => {
              onChange(date ? format(date, 'yyyy-MM-dd') : '');
              setOpen(false);
            }}
            disabled={disabledDays}
            showOutsideDays
            className="text-sm"
            classNames={{
              months: 'flex flex-col',
              month: 'space-y-4',
              month_caption: 'relative flex items-center justify-center px-8 pt-1 pb-1',
              caption_label: 'text-sm font-medium text-foreground',
              nav: 'absolute inset-x-0 top-1 flex items-center justify-between px-1',
              button_previous:
                'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
              button_next:
                'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
              chevron: 'h-4 w-4 fill-none stroke-current stroke-2',
              month_grid: 'w-full border-collapse',
              weekdays: 'flex',
              weekday:
                'w-9 text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-foreground',
              week: 'mt-1 flex w-full',
              day: 'h-9 w-9 rounded-md p-0 font-normal text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
              selected:
                'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
              today: 'bg-accent text-accent-foreground',
              outside: 'text-muted-foreground opacity-40',
              disabled: 'text-muted-foreground opacity-30',
              hidden: 'invisible',
            }}
          />

          {value ? (
            <div className="mt-3 flex justify-end border-t border-border pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            </div>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
