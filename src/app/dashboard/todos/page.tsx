'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ListTodo, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import { describeDueDate } from '@/lib/academic-day';
import { useTodosDashboard } from '@/lib/dashboard/client-data';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogActions,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover';
import { QuickCaptureModal } from '@/components/dashboard/quick-capture-modal';
import { TodoRowSkeleton } from '@/components/dashboard/row-skeletons';
import { NewShortcutKbd } from '@/components/dashboard/new-shortcut-kbd';

export default function TodosPage() {
  const {
    data,
    loading,
    error,
    createTodo,
    creatingTodo,
    setTodoCompleted,
    settingTodoCompleted,
    deleteTodo,
    deletingTodo,
  } = useTodosDashboard();
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [quickCaptureKey, setQuickCaptureKey] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'done'>('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const openQuickCapture = useCallback(() => {
    setQuickCaptureKey((key) => key + 1);
    setQuickCaptureOpen(true);
  }, []);

  const todos = useMemo(() => data?.todos ?? [], [data?.todos]);
  const subjects = useMemo(() => data?.subjects ?? [], [data?.subjects]);
  const completedCount = useMemo(() => todos.filter((t) => t.isCompleted).length, [todos]);
  const todoToDelete = todos.find((t) => t.id === deleteId);

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (statusFilter === 'open' && todo.isCompleted) return false;
      if (statusFilter === 'done' && !todo.isCompleted) return false;
      if (search && !todo.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [todos, statusFilter, search]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.matches('input, textarea, select, [contenteditable="true"]');
      if (!isTyping && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        openQuickCapture();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openQuickCapture]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="h-6 w-20 animate-skeleton rounded-md" />
            <div className="mt-2 h-4 w-36 animate-skeleton rounded-md" />
          </div>
          <div className="h-8 w-24 animate-skeleton rounded-md" />
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <TodoRowSkeleton key={i} delay={i * 60} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">Unable to load todos</p>
        <p className="mt-1 text-xs text-muted-foreground">Refresh the page and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Todos</h1>
          <p className="mt-1 text-sm text-muted-foreground/80">
            {completedCount} of {todos.length} completed
          </p>
        </div>
        <Button onClick={openQuickCapture} size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New
          <NewShortcutKbd />
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search todos..." inputClassName="pl-8 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          {(['all', 'open', 'done'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={cn(
                'rounded-sm px-2.5 py-1 text-xs font-medium transition-colors',
                statusFilter === value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {value === 'all' ? 'All' : value === 'open' ? 'Open' : 'Done'}
            </button>
          ))}
        </div>
      </div>

      {filteredTodos.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><ListTodo className="h-5 w-5 text-muted-foreground" /></EmptyMedia>
            <EmptyTitle>{statusFilter === 'done' ? 'No completed todos' : 'No todos'}</EmptyTitle>
            <EmptyDescription>
              {statusFilter === 'done' ? 'Mark a todo as done to see it here.' : 'Capture your first task in seconds.'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={openQuickCapture} size="sm">
              <Plus className="h-3.5 w-3.5" />
              New todo
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {filteredTodos.map((todo, index) => {
            const due = describeDueDate(todo.dueDate, new Date());
            const delay = Math.min(index, 8) * 30;
            return (
              <div
                key={todo.id}
                className={cn(
                  'row-enter group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent/50',
                  todo.isCompleted && 'opacity-60'
                )}
                style={{ ['--row-enter-delay' as string]: `${delay}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setTodoCompleted({ id: todo.id, isCompleted: !todo.isCompleted })}
                  disabled={todo.isPending || settingTodoCompleted}
                  className={cn(
                    'todo-checkbox-interactive flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-[transform,background-color,border-color] duration-150 ease-[var(--ease-out)] motion-safe:active:scale-90',
                    todo.isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background'
                  )}
                  aria-label={`Toggle ${todo.title}`}
                >
                  <svg
                    className={cn(
                      'h-3 w-3 transition-[opacity,transform] duration-150 ease-[var(--ease-out)]',
                      todo.isCompleted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {todo.subjectColor && <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: todo.subjectColor }} />}
                    <span className={cn('min-w-0 truncate text-sm', todo.isCompleted ? 'text-muted-foreground line-through' : 'font-medium')}>
                      {todo.title}
                    </span>
                  </div>
                  {(todo.subjectName || todo.dueDate) && (
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground/80">
                      {todo.subjectName && <span>{todo.subjectName}</span>}
                      {todo.subjectName && todo.dueDate && <span>·</span>}
                      {todo.dueDate && (
                        <span
                          className={cn(
                            'tabular-nums',
                            due.status === 'overdue' && !todo.isCompleted && 'font-medium text-destructive',
                            due.status === 'today' && !todo.isCompleted && 'font-medium text-warning'
                          )}
                          title={due.fullLabel}
                        >
                          {due.label}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Open actions for ${todo.title}`}
                        className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                        disabled={todo.isPending}
                      />
                    }
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </PopoverTrigger>
                  <PopoverPopup
                    align="end"
                    sideOffset={4}
                    className="w-44"
                    viewportClassName="p-1 py-1 [--viewport-inline-padding:--spacing(0.5)]"
                  >
                    <button
                      type="button"
                      onClick={() => setTodoCompleted({ id: todo.id, isCompleted: !todo.isCompleted })}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-accent"
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', todo.isCompleted ? 'bg-muted-foreground/40' : 'bg-success')} />
                      {todo.isCompleted ? 'Mark as open' : 'Mark as done'}
                    </button>
                    <div className="my-1 h-px bg-border" />
                    <button
                      type="button"
                      onClick={() => setDeleteId(todo.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </PopoverPopup>
                </Popover>
              </div>
            );
          })}
        </div>
      )}

      <QuickCaptureModal
        key={quickCaptureKey}
        open={quickCaptureOpen}
        onOpenChange={setQuickCaptureOpen}
        subjects={subjects}
        title="New todo"
        description="Quickly capture something. Assign a subject or due date later."
        subjectLabel="Subject"
        dateLabel="Due"
        saveLabel="Add todo"
        placeholder="What needs to get done?"
        subjectOptional
        onSave={async (input) => {
          await createTodo({ title: input.title, dueDate: input.dueDate, subjectId: input.subjectId });
          if (!input.createMore) {
            setQuickCaptureOpen(false);
          }
        }}
        saving={creatingTodo}
      />

      <AlertDialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogPopup>
          <AlertDialogTitle>Delete todo?</AlertDialogTitle>
          <AlertDialogDescription>{todoToDelete?.title} will be permanently removed.</AlertDialogDescription>
          <AlertDialogActions
            destructive
            confirmLabel="Delete"
            onConfirm={() => deleteId != null && deleteTodo(deleteId).finally(() => setDeleteId(null))}
            loading={deletingTodo}
          />
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
