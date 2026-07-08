'use client';

import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DayPicker, type Matcher } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover';

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            disabled={disabled}
            variant="outline"
            className={cn(
              'h-11 w-full justify-between border-transparent bg-input px-3.5 py-2.5 text-left text-sm font-normal ring-1 ring-white/10 focus-visible:ring-[3px] focus-visible:ring-ring/28 sm:h-10',
              className
            )}
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? format(selected, 'EEE, MMM d') : placeholder}
          </span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-[var(--ease-out)]', open && 'rotate-180')} />
      </PopoverTrigger>

      <PopoverPopup
        align="start"
        sideOffset={8}
        className="w-[18.5rem] max-w-[calc(100vw-2rem)] rounded-2xl p-3"
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
          className="date-picker-calendar [--cell-size:--spacing(9)] text-sm"
          classNames={{
            months: 'flex flex-col',
            month: 'space-y-4',
            month_caption: 'relative flex items-center justify-center px-8 pt-1 pb-1',
            caption_label: 'text-sm font-medium text-foreground',
            nav: 'absolute inset-x-0 top-1 flex items-center justify-between px-1',
            button_previous:
              'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            button_next:
              'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            chevron: 'h-4 w-4 fill-none stroke-current stroke-2',
            month_grid: 'w-full table-fixed border-separate border-spacing-0',
            weekdays: 'table-row',
            weekday:
              'h-8 w-(--cell-size) text-center align-middle text-[0.7rem] font-medium uppercase tracking-[0.08em] text-muted-foreground',
            week: 'table-row',
            day: 'rdp-day h-(--cell-size) w-(--cell-size) p-0 text-center align-middle text-foreground',
            day_button:
              'rdp-day_button mx-auto flex size-(--cell-size) items-center justify-center rounded-lg text-sm tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none',
            selected:
              'rdp-selected [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
            today: '[&>button]:font-medium [&>button]:ring-1 [&>button]:ring-white/10',
            outside: '[&>button]:text-muted-foreground [&>button]:opacity-40',
            disabled: '[&>button]:text-muted-foreground [&>button]:opacity-30',
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
      </PopoverPopup>
    </Popover>
  );
}
