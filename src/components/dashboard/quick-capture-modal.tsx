'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { ArrowRight, Check, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';

type Subject = { id: number; name: string; color: string };

type QuickCaptureInput = {
  title: string;
  dueDate: string;
  subjectId: number | null;
  createMore: boolean;
};

type QuickCaptureModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  onSave: (input: QuickCaptureInput) => void;
  saving?: boolean;
  title?: string;
  description?: string;
  subjectLabel?: string;
  dateLabel?: string;
  saveLabel?: string;
  placeholder?: string;
  subjectOptional?: boolean;
};

export function QuickCaptureModal({
  open,
  onOpenChange,
  subjects,
  onSave,
  saving,
  title = 'New assignment',
  description = 'Capture it now. Fill in the rest later.',
  subjectLabel = 'Subject',
  dateLabel = 'Due',
  saveLabel = 'Add assignment',
  placeholder = 'What needs to get done?',
  subjectOptional = false,
}: QuickCaptureModalProps) {
  const defaultSubjectId = subjectOptional ? null : subjects[0]?.id ?? null;
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<number | null>(defaultSubjectId);
  const [newDueDate, setNewDueDate] = useState('');
  const [createMore, setCreateMore] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleOpenChange(next: boolean) {
    if (next) {
      setNewTitle('');
      setNewSubjectId(defaultSubjectId);
      setNewDueDate('');
      setCreateMore(false);
    }
    onOpenChange(next);
  }

  function handleSave() {
    const title = newTitle.trim();
    if (!title) return;
    if (!subjectOptional && newSubjectId == null) return;
    onSave({ title, dueDate: newDueDate, subjectId: newSubjectId, createMore });
    if (createMore) {
      setNewTitle('');
      setNewDueDate('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  const canSave = newTitle.trim().length > 0 && (subjectOptional || newSubjectId != null);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-150 ease-[var(--ease-out)] data-starting-style:opacity-0 data-ending-style:opacity-0" />
        <DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl ring-1 ring-stone-950/10 transition-[opacity,transform] duration-200 ease-[var(--ease-out)] data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 dark:ring-white/10">
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3.5">
            <div>
              <DialogPrimitive.Title className="text-base font-medium tracking-tight">{title}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-0.5 text-xs text-muted-foreground">{description}</DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              render={<Button variant="ghost" size="icon-xs" aria-label="Close" />}
            >
              <X className="h-3.5 w-3.5" />
            </DialogPrimitive.Close>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-3 px-5 py-4"
          >
            <Input
              ref={inputRef}
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={placeholder}
              className="h-10 text-sm"
            />

            <div className="grid grid-cols-2 gap-2">
              <Select
                value={newSubjectId?.toString() ?? ''}
                onChange={(e) => setNewSubjectId(e.target.value ? Number(e.target.value) : null)}
                aria-label={subjectLabel}
                className="h-9 text-sm"
              >
                {subjectOptional && <SelectItem value="">No subject</SelectItem>}
                {subjects.length === 0 && !subjectOptional ? (
                  <SelectItem value="">No subjects yet</SelectItem>
                ) : (
                  subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))
                )}
              </Select>
              <DatePicker
                value={newDueDate}
                onChange={setNewDueDate}
                placeholder={dateLabel}
                className="h-9 text-sm"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setCreateMore((v) => !v)}
                  className={cn(
                    'flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-border transition-colors',
                    createMore ? 'border-primary bg-primary text-primary-foreground' : 'bg-background'
                  )}
                  aria-pressed={createMore}
                  aria-label="Toggle create more"
                >
                  {createMore && <Check className="h-2.5 w-2.5" />}
                </button>
                Create more
              </label>

              <div className="flex items-center gap-2">
                <DialogPrimitive.Close render={<Button type="button" variant="ghost" size="sm" />}>
                  Cancel
                </DialogPrimitive.Close>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canSave}
                  loading={saving}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {saveLabel}
                  <ArrowRight className="h-3 w-3 opacity-50" />
                </Button>
              </div>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
