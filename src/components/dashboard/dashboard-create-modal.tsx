'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { useRouter } from 'next/navigation';
import { BookOpen, Calendar, CheckSquare, ListTodo, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDashboardCreateItem } from '@/lib/dashboard/client-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { NewShortcutKbd } from '@/components/dashboard/new-shortcut-kbd';

type Subject = { id: number; name: string; color: string };
type CreateKind = 'assignment' | 'todo' | 'sprint' | 'subject';

const CREATE_OPTIONS: Array<{
  kind: CreateKind;
  label: string;
  description: string;
  icon: typeof CheckSquare;
}> = [
  { kind: 'assignment', label: 'Assignment', description: 'Course work with a subject and due date', icon: CheckSquare },
  { kind: 'todo', label: 'Todo', description: 'Quick task, deadline optional', icon: ListTodo },
  { kind: 'sprint', label: 'Sprint', description: 'A focused study window', icon: Calendar },
  { kind: 'subject', label: 'Subject', description: 'A course or class', icon: BookOpen },
];

type DashboardCreateModalProps = {
  subjects: Subject[];
};

export function DashboardCreateModal({ subjects }: DashboardCreateModalProps) {
  const router = useRouter();
  const { create, creating } = useDashboardCreateItem();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<CreateKind>('assignment');
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<number | null>(subjects[0]?.id ?? null);
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [attemptedSave, setAttemptedSave] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.matches('input, textarea, select, [contenteditable="true"]');
      if (!isTyping && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function reset(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setKind('assignment');
      setTitle('');
      setSubjectId(subjects[0]?.id ?? null);
      setDate('');
      setEndDate('');
      setAttemptedSave(false);
    }
  }

  async function handleSave() {
    setAttemptedSave(true);
    if (!title.trim()) return;
    if (kind === 'assignment' && subjectId == null) return;
    if (kind === 'sprint' && (!date || !endDate)) return;

    try {
      if (kind === 'assignment') {
        await create({ kind: 'assignment', input: { subjectId: subjectId!, title: title.trim(), description: '', dueDate: date } });
      } else if (kind === 'todo') {
        await create({ kind: 'todo', input: { title: title.trim(), dueDate: date, subjectId } });
      } else if (kind === 'sprint') {
        await create({ kind: 'sprint', input: { name: title.trim(), startDate: date, endDate } });
      } else {
        await create({ kind: 'subject', input: { id: null, name: title.trim(), color: '#3b82f6' } });
      }
      reset(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  }

  const canSave = title.trim().length > 0 && (kind !== 'assignment' || subjectId != null) && (kind !== 'sprint' || (date && endDate));
  const primaryDateLabel = kind === 'sprint' ? 'Start' : 'Due';

  return (
    <>
      <Button onClick={() => reset(true)} size="sm">
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        New
        <NewShortcutKbd />
      </Button>

      <DialogPrimitive.Root open={open} onOpenChange={reset}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-150 ease-[var(--ease-out)] data-starting-style:opacity-0 data-ending-style:opacity-0" />
          <DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl ring-1 ring-stone-950/10 transition-[opacity,transform] duration-200 ease-[var(--ease-out)] data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 dark:ring-white/10">
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3.5">
              <div>
                <DialogPrimitive.Title className="text-base font-medium tracking-tight">New</DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-0.5 text-xs text-muted-foreground">
                  Choose what you want to capture.
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-xs" aria-label="Close" />}>
                <X className="h-3.5 w-3.5" />
              </DialogPrimitive.Close>
            </div>

            <form
              className="space-y-4 px-5 py-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave();
              }}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {CREATE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = option.kind === kind;
                  return (
                    <button
                      key={option.kind}
                      type="button"
                      onClick={() => setKind(option.kind)}
                      className={cn(
                        'flex min-h-16 items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-[background-color,border-color,transform] duration-150 ease-[var(--ease-out)] motion-safe:active:scale-[0.98]',
                        active ? 'border-border-hover bg-accent text-foreground' : 'border-border bg-background/50 text-muted-foreground hover:border-border-hover hover:bg-accent/50 hover:text-foreground'
                      )}
                      aria-pressed={active}
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{option.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground/80">{option.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dashboard-create-title" className="text-xs text-muted-foreground">
                    {kind === 'sprint' ? 'Sprint name' : kind === 'subject' ? 'Subject name' : 'Title'}
                  </Label>
                  <Input
                    id="dashboard-create-title"
                    autoFocus
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={kind === 'sprint' ? 'Finals prep' : kind === 'subject' ? 'Linear Algebra' : 'What needs to get done?'}
                    aria-invalid={attemptedSave && !title.trim()}
                  />
                </div>

                {kind !== 'subject' && (
                  <div className={cn('grid gap-2', kind === 'sprint' ? 'sm:grid-cols-2' : 'sm:grid-cols-2')}>
                    {kind !== 'sprint' && (
                      <Select
                        aria-label="Subject"
                        value={subjectId?.toString() ?? ''}
                        onChange={(event) => setSubjectId(event.target.value ? Number(event.target.value) : null)}
                        className="h-9 text-sm"
                      >
                        {kind === 'todo' && <SelectItem value="">No subject</SelectItem>}
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id.toString()}>{subject.name}</SelectItem>
                        ))}
                      </Select>
                    )}
                    <DatePicker
                      value={date}
                      onChange={setDate}
                      placeholder={primaryDateLabel}
                      className="h-9 text-sm"
                      max={kind === 'sprint' ? endDate || undefined : undefined}
                    />
                    {kind === 'sprint' && (
                      <DatePicker
                        value={endDate}
                        onChange={setEndDate}
                        placeholder="End"
                        className="h-9 text-sm"
                        min={date || undefined}
                      />
                    )}
                  </div>
                )}

                {attemptedSave && !canSave && (
                  <p className="text-xs text-destructive">Fill in the required fields to continue.</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <DialogPrimitive.Close render={<Button type="button" variant="ghost" size="sm" />}>
                  Cancel
                </DialogPrimitive.Close>
                <Button type="submit" size="sm" disabled={!canSave} loading={creating}>
                  <Plus className="h-3.5 w-3.5" />
                  Add {CREATE_OPTIONS.find((option) => option.kind === kind)?.label.toLowerCase()}
                </Button>
              </div>
            </form>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
