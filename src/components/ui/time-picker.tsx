'use client';

import * as Popover from '@radix-ui/react-popover';
import { ChevronDown, Clock3 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TimePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const HOUR_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => `${index * 5}`.padStart(2, '0'));
const PERIOD_OPTIONS = ['AM', 'PM'] as const;
type Period = (typeof PERIOD_OPTIONS)[number];
type ParsedTime = {
  hour12: string;
  minute: string;
  period: Period;
};
function parseTime(value: string): ParsedTime {
  const [hourValue = '09', minuteValue = '00'] = value.split(':');
  const hour24 = Number(hourValue);
  const minute = MINUTE_OPTIONS.includes(minuteValue) ? minuteValue : '00';

  if (Number.isNaN(hour24)) {
    return { hour12: '9', minute: '00', period: 'AM' as const };
  }

  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = String(hour24 % 12 || 12);

  return { hour12, minute, period };
}

function toTwentyFourHour(hour12: string, minute: string, period: (typeof PERIOD_OPTIONS)[number]) {
  const parsedHour = Number(hour12);
  let hour24 = parsedHour % 12;

  if (period === 'PM') {
    hour24 += 12;
  }

  return `${String(hour24).padStart(2, '0')}:${minute}`;
}

function formatTimeLabel(value: string) {
  if (!value) {
    return '';
  }

  const { hour12, minute, period } = parseTime(value);
  return `${hour12}:${minute} ${period}`;
}

export function TimePicker({
  id,
  value,
  onChange,
  placeholder = 'Choose a time',
  disabled,
  className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const current = useMemo(() => parseTime(value), [value]);
  const hourRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const minuteRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    hourRefs.current[current.hour12]?.scrollIntoView({ block: 'nearest' });
    minuteRefs.current[current.minute]?.scrollIntoView({ block: 'nearest' });
  }, [current.hour12, current.minute, open]);

  function updateTime(next: Partial<ParsedTime>) {
    const hour12 = next.hour12 ?? current.hour12;
    const minute = next.minute ?? current.minute;
    const period = next.period ?? current.period;
    onChange(toTwentyFourHour(hour12, minute, period));
  }

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
            <Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" />
            {value ? <span className="truncate tabular-nums">{formatTimeLabel(value)}</span> : <span className="sr-only">{placeholder}</span>}
          </span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-[17rem] rounded-2xl border border-border bg-background p-3 shadow-lg outline-none"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Time</p>
                <p className="text-2xl font-medium tracking-tight tabular-nums text-foreground">
                  {value ? formatTimeLabel(value) : '--:--'}
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-border bg-accent/60 p-1">
                {PERIOD_OPTIONS.map((period) => {
                  const selected = current.period === period;

                  return (
                    <button
                      key={period}
                      type="button"
                      onClick={() => updateTime({ period })}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
                        selected
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {period}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 rounded-xl border border-border/80 bg-accent/30 p-2">
                <p className="px-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Hour</p>
                <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
                  {HOUR_OPTIONS.map((hour) => {
                    const selected = current.hour12 === hour;

                    return (
                      <button
                        key={hour}
                        ref={(element) => {
                          hourRefs.current[hour] = element;
                        }}
                        type="button"
                        onClick={() => updateTime({ hour12: hour })}
                        className={cn(
                          'w-full rounded-lg px-3 py-2 text-left text-sm tabular-nums transition-all duration-200',
                          selected
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
                        )}
                      >
                        {hour}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-border/80 bg-accent/30 p-2">
                <p className="px-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Minute</p>
                <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
                  {MINUTE_OPTIONS.map((minute) => {
                    const selected = current.minute === minute;

                    return (
                      <button
                        key={minute}
                        ref={(element) => {
                          minuteRefs.current[minute] = element;
                        }}
                        type="button"
                        onClick={() => updateTime({ minute })}
                        className={cn(
                          'w-full rounded-lg px-3 py-2 text-left text-sm tabular-nums transition-all duration-200',
                          selected
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
                        )}
                      >
                        {minute}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {value ? (
              <div className="flex justify-end border-t border-border pt-3">
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
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}