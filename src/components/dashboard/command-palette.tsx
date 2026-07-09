'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  Search,
  Settings,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';

type Action = {
  id: string;
  label: string;
  hint?: string;
  group: 'Navigate' | 'Create' | 'Quick';
  icon: ComponentType<{ className?: string }>;
  shortcut?: string[];
  onSelect: () => void;
};

type PaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenQuickCapture: () => void;
};

export function CommandPalette({ open, onOpenChange, onOpenQuickCapture }: PaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const navigateActions: Action[] = useMemo(() => [
    { id: 'nav-dashboard', label: 'Go to Dashboard', hint: 'Home', group: 'Navigate', icon: LayoutDashboard, onSelect: () => router.push('/dashboard') },
    { id: 'nav-assignments', label: 'Go to Assignments', group: 'Navigate', icon: CheckSquare, onSelect: () => router.push('/dashboard/assignments') },
    { id: 'nav-todos', label: 'Go to Todos', group: 'Navigate', icon: ListTodo, onSelect: () => router.push('/dashboard/todos') },
    { id: 'nav-sprints', label: 'Go to Sprints', group: 'Navigate', icon: Calendar, onSelect: () => router.push('/dashboard/sprints') },
    { id: 'nav-subjects', label: 'Go to Subjects', group: 'Navigate', icon: BookOpen, onSelect: () => router.push('/dashboard/subjects') },
    { id: 'nav-settings', label: 'Go to Settings', group: 'Navigate', icon: Settings, onSelect: () => router.push('/dashboard/settings') },
  ], [router]);

  const createActions: Action[] = useMemo(() => [
    {
      id: 'create-assignment',
      label: 'New assignment',
      hint: 'Add a new task with a due date',
      group: 'Create',
      icon: CheckSquare,
      shortcut: ['N'],
      onSelect: () => {
        onOpenChange(false);
        window.sessionStorage.removeItem('cc:open-quick-capture');
        if (pathname === '/dashboard/assignments') {
          onOpenQuickCapture();
        } else {
          window.sessionStorage.setItem('cc:open-quick-capture', '1');
          router.push('/dashboard/assignments');
        }
      },
    },
    {
      id: 'create-todo',
      label: 'New todo',
      hint: 'Quick task — no deadline required',
      group: 'Create',
      icon: ListTodo,
      onSelect: () => {
        onOpenChange(false);
        router.push('/dashboard/todos');
      },
    },
    {
      id: 'create-subject',
      label: 'New subject',
      hint: 'Add a course for this semester',
      group: 'Create',
      icon: GraduationCap,
      onSelect: () => router.push('/dashboard/subjects'),
    },
  ], [router, pathname, onOpenChange, onOpenQuickCapture]);

  const quickActions: Action[] = useMemo(() => [
    {
      id: 'quick-today',
      label: "What's due today?",
      hint: 'View all items due today',
      group: 'Quick',
      icon: Calendar,
      onSelect: () => router.push('/dashboard/assignments'),
    },
    {
      id: 'quick-overdue',
      label: "What's overdue?",
      hint: 'See all past-due items',
      group: 'Quick',
      icon: Calendar,
      onSelect: () => router.push('/dashboard/assignments'),
    },
  ], [router]);

  const allActions = useMemo(() => [...navigateActions, ...createActions, ...quickActions], [navigateActions, createActions, quickActions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allActions;
    return allActions.filter((a) =>
      a.label.toLowerCase().includes(q) ||
      a.hint?.toLowerCase().includes(q) ||
      a.group.toLowerCase().includes(q)
    );
  }, [allActions, query]);

  const grouped = useMemo(() => {
    const groups: Record<string, Action[]> = {};
    for (const action of filtered) {
      (groups[action.group] ??= []).push(action);
    }
    return groups;
  }, [filtered]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function handleSelect(action: Action) {
    action.onSelect();
    onOpenChange(false);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const action = filtered[activeIndex];
      if (action) handleSelect(action);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ease-[var(--ease-out)] data-starting-style:opacity-0 data-ending-style:opacity-0" />
        <DialogPrimitive.Popup
          aria-label="Command palette"
          className="fixed left-1/2 top-[20%] z-[60] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl ring-1 ring-stone-950/10 transition-[opacity,transform] duration-200 ease-[var(--ease-out)] data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 dark:ring-white/10"
        >
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="h-5 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
            />
            <kbd className="hidden items-center gap-0.5 rounded border border-border bg-background/60 px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
              ESC
            </kbd>
          </div>

          <div className="max-h-[32rem] overflow-y-auto p-1 py-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 px-4 py-10 text-center">
                <p className="text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-muted-foreground/70">Try a different keyword.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(grouped).map(([group, items]) => (
                  <div key={group}>
                    <div className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      {group}
                    </div>
                    <div className="space-y-px">
                      {items.map((action) => {
                        const Icon = action.icon;
                        const flatIndex = filtered.indexOf(action);
                        const isActive = flatIndex === activeIndex;
                        return (
                          <button
                            key={action.id}
                            type="button"
                            onMouseEnter={() => setActiveIndex(flatIndex)}
                            onClick={() => handleSelect(action)}
                            className={cn(
                              'group flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left text-sm transition-colors',
                              isActive ? 'bg-accent text-foreground' : 'text-foreground/90'
                            )}
                          >
                            <span className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-md',
                              isActive ? 'bg-background/80 text-foreground' : 'text-muted-foreground'
                            )}>
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">{action.label}</div>
                              {action.hint && <div className="truncate text-xs text-muted-foreground/80">{action.hint}</div>}
                            </div>
                            {action.shortcut ? (
                              <div className="flex items-center gap-0.5">
                                {action.shortcut.map((key) => (
                                  <kbd key={key} className="rounded border border-border bg-background/60 px-1 font-mono text-[10px] text-muted-foreground">
                                    {key}
                                  </kbd>
                                ))}
                              </div>
                            ) : (
                              <ArrowRight className={cn('h-3.5 w-3.5 text-muted-foreground/70 transition-opacity', isActive ? 'opacity-100' : 'opacity-0')} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border bg-card/30 px-4 py-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <kbd className="inline-flex items-center gap-0.5 rounded border border-border/60 bg-background/40 px-1 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
              <span className="inline-flex items-center gap-1">↑↓ navigate</span>
              <span className="inline-flex items-center gap-1">↵ select</span>
            </div>
            <span>CollegeCore</span>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
