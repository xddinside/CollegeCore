'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Check, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ASSIGNMENT_STATUSES, assignmentStatusLabel } from '@/lib/assignment-lifecycle';
import { describeDueDate } from '@/lib/academic-day';
import type { Assignment } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover';
import { StatusDot } from '@/components/dashboard/status-dot';
import { Textarea } from '@/components/ui/textarea';



type AssignmentDetailDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment | null;
  onStatusChange: (status: Assignment['status']) => void;
  onDescriptionChange: (description: string | null) => void;
  onDelete: () => void;
};

export function AssignmentDetailDrawer({
  open,
  onOpenChange,
  assignment,
  onStatusChange,
  onDescriptionChange,
  onDelete,
}: AssignmentDetailDrawerProps) {
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editingDescription) {
      requestAnimationFrame(() => descriptionRef.current?.focus());
    }
  }, [editingDescription]);

  if (!assignment) return null;
  const due = describeDueDate(assignment.dueDate, new Date());
  const isCompleted = assignment.status === 'COMPLETED';
  const nextStatus = ASSIGNMENT_STATUSES[(ASSIGNMENT_STATUSES.indexOf(assignment.status) + 1) % ASSIGNMENT_STATUSES.length];

  function saveDescription() {
    const next = descriptionDraft.trim() || null;
    setEditingDescription(false);
    if (next !== (assignment?.description ?? null)) {
      onDescriptionChange(next);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 transition-opacity duration-150 ease-[var(--ease-out)] data-starting-style:opacity-0 data-ending-style:opacity-0" />
        <DialogPrimitive.Popup
          className={cn(
            'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-popover text-popover-foreground shadow-2xl ring-1 ring-stone-950/10 transition-transform duration-300 ease-[var(--ease-drawer)] data-starting-style:translate-x-full data-ending-style:translate-x-full dark:ring-white/10',
            'sm:max-w-lg'
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span className="text-[11px] font-medium uppercase tracking-wider">Assignment</span>
              <span className="text-[11px] text-muted-foreground/40">·</span>
              <span className="text-xs">{assignment.subjectName}</span>
            </div>
            <DialogPrimitive.Close
              render={<Button variant="ghost" size="icon-xs" aria-label="Close detail" />}
            >
              <X className="h-3.5 w-3.5" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => onStatusChange(nextStatus)}
                className="mt-0.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
                aria-label={`Change status from ${assignmentStatusLabel(assignment.status)} to ${assignmentStatusLabel(nextStatus)}`}
              >
                <StatusDot status={assignment.status} size="lg" interactive />
              </button>
              <DialogPrimitive.Title
                className={cn(
                  'text-lg font-semibold leading-snug tracking-tight',
                  isCompleted && 'text-muted-foreground line-through'
                )}
              >
                {assignment.title}
              </DialogPrimitive.Title>
            </div>

            <div className="mt-6 space-y-4">
              <DetailField label="Status">
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs font-normal"
                      />
                    }
                  >
                    <StatusDot status={assignment.status} size="sm" />
                    {assignmentStatusLabel(assignment.status)}
                  </PopoverTrigger>
                  <PopoverPopup
                    align="start"
                    sideOffset={4}
                    className="w-44"
                    viewportClassName="p-1 py-1 [--viewport-inline-padding:--spacing(0.5)]"
                  >
                    {ASSIGNMENT_STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onStatusChange(s)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-accent',
                          assignment.status === s && 'bg-accent/50 text-foreground'
                        )}
                      >
                        <StatusDot status={s} size="sm" />
                        {assignmentStatusLabel(s)}
                        {assignment.status === s && <Check className="ml-auto h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                    ))}
                  </PopoverPopup>
                </Popover>
              </DetailField>

              <DetailField label="Due">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      'text-sm tabular-nums',
                      due.status === 'overdue' && !isCompleted ? 'font-medium text-destructive' :
                        due.status === 'today' && !isCompleted ? 'font-medium text-warning' :
                          'text-foreground/90'
                    )}
                  >
                    {due.label}
                  </span>
                  <span className="text-xs text-muted-foreground/70">· {due.fullLabel}</span>
                </div>
              </DetailField>
            </div>

            <div className="mt-6">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Description</div>
              {editingDescription ? (
                <div className="mt-1.5 space-y-2">
                  <Textarea
                    ref={descriptionRef}
                    value={descriptionDraft}
                    onChange={(event) => setDescriptionDraft(event.target.value)}
                    onBlur={saveDescription}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                        event.preventDefault();
                        saveDescription();
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        setDescriptionDraft(assignment.description ?? '');
                        setEditingDescription(false);
                      }
                    }}
                    rows={4}
                    placeholder="Add details, links, or rubric notes..."
                    className="text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground/60">Saved on blur. Esc cancels.</p>
                </div>
              ) : assignment.description ? (
                <button
                  type="button"
                  onClick={() => {
                    setDescriptionDraft(assignment.description ?? '');
                    setEditingDescription(true);
                  }}
                  className="mt-1.5 block w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{assignment.description}</p>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDescriptionDraft('');
                    setEditingDescription(true);
                  }}
                  className="mt-1.5 -mx-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground/80"
                >
                  Add a description…
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              {due.status === 'overdue' && !isCompleted && <Badge variant="error" className="h-5 px-1.5 text-[10px]">Overdue</Badge>}
              {due.status === 'today' && !isCompleted && <Badge variant="warning" className="h-5 px-1.5 text-[10px]">Due today</Badge>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function DetailField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{label}</div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
