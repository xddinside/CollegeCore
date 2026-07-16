import type React from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, ListTodo, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { datePillClasses, formatDayPill, type FocusGroup, type FocusItem } from '@/lib/dashboard/focus-feed';
import { DashboardCreateModal } from '@/components/dashboard/dashboard-create-modal';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

type Subject = { id: number; name: string; color: string };

type FocusFeedProps = {
  groups: FocusGroup[];
  items: FocusItem[];
  today: Date;
  subjects: Subject[];
};

export function FocusFeed({ groups, items, today, subjects }: FocusFeedProps) {
  return (
    <div className="mt-7">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Up Next</h2>
          {items.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground ring-1 ring-inset ring-border">
              {items.length}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/assignments"
          className="inline-flex items-center gap-1 -mr-2 rounded-md px-2 py-1 text-xs text-muted-foreground transition-[color,background-color] duration-150 ease-[var(--ease-out)] hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>Nothing scheduled</EmptyTitle>
            <EmptyDescription>Capture an assignment, todo, or sprint to start shaping your week.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <DashboardCreateModal subjects={subjects} />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const { label, items: groupItems, tone } = group;
            if (groupItems.length === 0) return null;
            const isOverdueGroup = label === 'Overdue';
            return (
              <section key={label} className="space-y-2">
                <div className="flex items-center gap-2.5 px-1">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] tabular-nums',
                      tone.pill
                    )}
                  >
                    <span className={cn('h-1 w-1 rounded-full', tone.dot)} aria-hidden="true" />
                    {label}
                    <span aria-hidden="true" className="opacity-50">
                      ·
                    </span>
                    <span className="opacity-70">{groupItems.length}</span>
                  </span>
                  <div className="h-px flex-1 bg-border/30" />
                </div>
                <div className="overflow-hidden rounded-xl border border-border">
                  <ul className="divide-y divide-border/50">
                    {groupItems.map((item, i) => (
                      <li
                        key={item.id}
                        className="row-enter"
                        style={{ '--row-enter-delay': `${i * 30}ms` } as React.CSSProperties}
                      >
                        {item.kind === 'assignment' ? (
                          <Link
                            href={item.href}
                            className="group/row relative flex items-center gap-3 rounded-md px-3 py-3 transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-muted focus-visible:bg-muted focus-visible:outline-none motion-safe:active:scale-[0.998]"
                          >
                            <span
                              aria-hidden="true"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                              style={{
                                backgroundColor: `color-mix(in oklab, ${item.subjectColor} 16%, transparent)`,
                              }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: item.subjectColor }}
                              />
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground/80">
                                {item.subjectName}
                              </span>
                            </div>
                            {!isOverdueGroup && (
                              <span
                                className={cn(
                                  'inline-flex h-6 min-w-[3.25rem] items-center justify-center rounded-md px-2 text-[11px] font-medium tabular-nums',
                                  datePillClasses(item.dueStatus)
                                )}
                              >
                                {formatDayPill(item.dueDate, today)}
                              </span>
                            )}
                          </Link>
                        ) : item.kind === 'todo' ? (
                          <Link
                            href={item.href}
                            className="group/row relative flex items-center gap-3 rounded-md px-3 py-3 transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-muted focus-visible:bg-muted focus-visible:outline-none motion-safe:active:scale-[0.998]"
                          >
                            {item.subjectColor ? (
                              <span
                                aria-hidden="true"
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                style={{
                                  backgroundColor: `color-mix(in oklab, ${item.subjectColor} 16%, transparent)`,
                                }}
                              >
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: item.subjectColor }}
                                />
                              </span>
                            ) : (
                              <span
                                aria-hidden="true"
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted ring-1 ring-inset ring-border"
                              >
                                <ListTodo className="h-3.5 w-3.5 text-muted-foreground" />
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
                              {item.subjectName && (
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground/80">
                                  {item.subjectName}
                                </span>
                              )}
                            </div>
                            {!isOverdueGroup && (
                              <span
                                className={cn(
                                  'inline-flex h-6 min-w-[3.25rem] items-center justify-center rounded-md px-2 text-[11px] font-medium tabular-nums',
                                  datePillClasses(item.dueStatus)
                                )}
                              >
                                {formatDayPill(item.dueDate, today)}
                              </span>
                            )}
                          </Link>
                        ) : (
                          <Link
                            href={item.href}
                            className="group/row relative flex items-center gap-3 rounded-md px-3 py-3 transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-muted focus-visible:bg-muted focus-visible:outline-none motion-safe:active:scale-[0.998]"
                          >
                            <span
                              aria-hidden="true"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted ring-1 ring-inset ring-border"
                            >
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
                                {item.isActive && (
                                  <span
                                    className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-success"
                                    aria-label="Active sprint"
                                  />
                                )}
                              </div>
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground/80">
                                {item.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                                {item.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <span
                              className={cn(
                                'inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium',
                                item.isActive
                                  ? 'bg-success/12 text-success'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              {item.isActive ? 'In progress' : 'Scheduled'}
                            </span>
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
