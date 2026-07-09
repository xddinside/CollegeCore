'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, MoreHorizontal, Plus, Trash2, X } from 'lucide-react';
import { createExamSprint, createSprintSession, deleteExamSprint, deleteSprintSession } from '@/lib/actions';
import { getSprintsPageData, type SprintsPageData } from '@/lib/dashboard-queries';
import { dashboardQueryKeys } from '@/lib/dashboard-query-keys';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogActions,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TimePicker } from '@/components/ui/time-picker';
import { NewShortcutKbd } from '@/components/dashboard/new-shortcut-kbd';
import { SprintRowSkeleton } from '@/components/dashboard/row-skeletons';

type CreateSprintInput = {
  name: string;
  startDate: string;
  endDate: string;
};

type CreateSessionInput = {
  sprintId: number;
  date: string;
  startTime: string;
  endTime: string;
  subjectId: number;
  notes: string;
};

function formatDateRange(start: Date | string, end: Date | string) {
  return `${new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function getSprintStatus(startDate: Date | string, endDate: Date | string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  if (today < start) return 'upcoming';
  if (today > end) return 'completed';
  return 'active';
}

function getStatusBadge(status: string) {
  if (status === 'active') return <Badge variant="success" className="h-4 px-1 text-[10px]">Active</Badge>;
  if (status === 'upcoming') return <Badge variant="info" className="h-4 px-1 text-[10px]">Upcoming</Badge>;
  return <Badge variant="outline" className="h-4 px-1 text-[10px]">Completed</Badge>;
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function sessionSortTime(session: { date: Date | string; startTime: string }) {
  const d = new Date(session.date);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return new Date(`${dateStr}T${session.startTime}`).getTime();
}

export default function SprintsPage() {
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();
  const [sprintModalOpen, setSprintModalOpen] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newSubjectId, setNewSubjectId] = useState<number | null>(null);
  const [newNotes, setNewNotes] = useState('');
  const [attemptedSprintSave, setAttemptedSprintSave] = useState(false);
  const [attemptedSessionSave, setAttemptedSessionSave] = useState(false);
  const [deleteSprintId, setDeleteSprintId] = useState<number | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<number | null>(null);
  const [collapsedSprintIds, setCollapsedSprintIds] = useState<Set<number>>(new Set());

  const sprintsQueryKey = user ? dashboardQueryKeys.sprints(user.id) : ['dashboard', 'sprints', 'anonymous'];
  const sprintsQuery = useQuery({
    queryKey: sprintsQueryKey,
    queryFn: () => getSprintsPageData(user!.id),
    enabled: isLoaded && !!user,
  });

  useEffect(() => {
    if (!sprintsQuery.data) return;
    const completed = sprintsQuery.data.sprints.filter((sprint) => getSprintStatus(sprint.startDate, sprint.endDate) === 'completed').map((sprint) => sprint.id);
    setCollapsedSprintIds((current) => {
      const next = new Set(current);
      for (const id of completed) next.add(id);
      return next;
    });
  }, [sprintsQuery.data]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.matches('input, textarea, select, [contenteditable="true"]');
      if (!isTyping && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setSprintModalOpen(true);
        setAttemptedSprintSave(false);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const createSprintMutation = useMutation({
    mutationFn: async (variables: CreateSprintInput) => {
      if (!sprintsQuery.data) throw new Error('Sprints data not loaded');
      return createExamSprint(sprintsQuery.data.semesterId, variables.name, new Date(variables.startDate), new Date(variables.endDate));
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: sprintsQueryKey });
      const previousData = queryClient.getQueryData<SprintsPageData>(sprintsQueryKey);
      const tempId = -Date.now();
      setNewName('');
      setNewStartDate('');
      setNewEndDate('');
      setSprintModalOpen(false);
      setAttemptedSprintSave(false);
      queryClient.setQueryData<SprintsPageData>(sprintsQueryKey, (current) => {
        if (!current) return current;
        return { ...current, sprints: [{ id: tempId, name: variables.name, startDate: variables.startDate, endDate: variables.endDate, isPending: true }, ...current.sprints], sessions: { ...current.sessions, [tempId]: [] } };
      });
      return { previousData, tempId, variables };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) queryClient.setQueryData(sprintsQueryKey, context.previousData);
      if (context?.variables) {
        setNewName(context.variables.name);
        setNewStartDate(context.variables.startDate);
        setNewEndDate(context.variables.endDate);
        setSprintModalOpen(true);
      }
    },
    onSuccess: (createdSprint, _variables, context) => {
      queryClient.setQueryData<SprintsPageData>(sprintsQueryKey, (current) => {
        if (!current || !context) return current;
        const { [context.tempId]: tempSessions = [], ...remainingSessions } = current.sessions;
        return { ...current, sprints: current.sprints.map((sprint) => (sprint.id === context.tempId ? { ...sprint, id: createdSprint.id, isPending: false } : sprint)), sessions: { ...remainingSessions, [createdSprint.id]: tempSessions } };
      });
      void queryClient.invalidateQueries({ queryKey: sprintsQueryKey });
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: (variables: CreateSessionInput) => createSprintSession(variables.sprintId, new Date(variables.date), variables.startTime, variables.endTime, variables.subjectId, variables.notes.trim() || null),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: sprintsQueryKey });
      const previousData = queryClient.getQueryData<SprintsPageData>(sprintsQueryKey);
      const tempId = -Date.now();
      const subject = previousData?.subjects.find((item) => item.id === variables.subjectId);
      setNewDate('');
      setNewStartTime('09:00');
      setNewEndTime('10:00');
      setNewSubjectId(null);
      setNewNotes('');
      setShowSessionForm(null);
      setAttemptedSessionSave(false);
      queryClient.setQueryData<SprintsPageData>(sprintsQueryKey, (current) => {
        if (!current || !subject) return current;
        return { ...current, sessions: { ...current.sessions, [variables.sprintId]: [{ id: tempId, date: variables.date, startTime: variables.startTime, endTime: variables.endTime, notes: variables.notes.trim() || null, subjectName: subject.name, subjectColor: subject.color, isPending: true }, ...(current.sessions[variables.sprintId] ?? [])] } };
      });
      return { previousData, tempId, variables };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) queryClient.setQueryData(sprintsQueryKey, context.previousData);
      if (context?.variables) {
        setNewDate(context.variables.date);
        setNewStartTime(context.variables.startTime);
        setNewEndTime(context.variables.endTime);
        setNewSubjectId(context.variables.subjectId);
        setNewNotes(context.variables.notes);
        setShowSessionForm(context.variables.sprintId);
      }
    },
    onSuccess: (createdSession, _variables, context) => {
      queryClient.setQueryData<SprintsPageData>(sprintsQueryKey, (current) => {
        if (!current || !context) return current;
        return { ...current, sessions: { ...current.sessions, [context.variables.sprintId]: (current.sessions[context.variables.sprintId] ?? []).map((session) => (session.id === context.tempId ? { ...session, id: createdSession.id, isPending: false } : session)) } };
      });
      void queryClient.invalidateQueries({ queryKey: sprintsQueryKey });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id: number) => deleteSprintSession(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: sprintsQueryKey });
      const previousData = queryClient.getQueryData<SprintsPageData>(sprintsQueryKey);
      queryClient.setQueryData<SprintsPageData>(sprintsQueryKey, (current) => {
        if (!current) return current;
        return { ...current, sessions: Object.fromEntries(Object.entries(current.sessions).map(([sprintId, sprintSessions]) => [Number(sprintId), sprintSessions.filter((session) => session.id !== id)])) };
      });
      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) queryClient.setQueryData(sprintsQueryKey, context.previousData);
    },
    onSettled: () => {
      setDeleteSessionId(null);
      void queryClient.invalidateQueries({ queryKey: sprintsQueryKey });
    },
  });

  const deleteSprintMutation = useMutation({
    mutationFn: (id: number) => deleteExamSprint(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: sprintsQueryKey });
      const previousData = queryClient.getQueryData<SprintsPageData>(sprintsQueryKey);
      queryClient.setQueryData<SprintsPageData>(sprintsQueryKey, (current) => {
        if (!current) return current;
        const remainingSessions = { ...current.sessions };
        delete remainingSessions[id];
        return { ...current, sprints: current.sprints.filter((sprint) => sprint.id !== id), sessions: remainingSessions };
      });
      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) queryClient.setQueryData(sprintsQueryKey, context.previousData);
    },
    onSettled: () => {
      setDeleteSprintId(null);
      void queryClient.invalidateQueries({ queryKey: sprintsQueryKey });
    },
  });

  const sprints = useMemo(() => sprintsQuery.data?.sprints ?? [], [sprintsQuery.data?.sprints]);
  const sessions = useMemo(() => sprintsQuery.data?.sessions ?? {}, [sprintsQuery.data?.sessions]);
  const subjects = useMemo(() => sprintsQuery.data?.subjects ?? [], [sprintsQuery.data?.subjects]);

  const upcomingSessions = useMemo(() => {
    return sprints
      .flatMap((sprint) => (sessions[sprint.id] ?? []).map((session) => ({ ...session, sprintName: sprint.name })))
      .sort((a, b) => sessionSortTime(a) - sessionSortTime(b))
      .slice(0, 6);
  }, [sprints, sessions]);

  const sprintToDelete = sprints.find((sprint) => sprint.id === deleteSprintId);

  function handleSaveSprint() {
    setAttemptedSprintSave(true);
    if (!newName.trim() || !newStartDate || !newEndDate) return;
    createSprintMutation.mutate({ name: newName.trim(), startDate: newStartDate, endDate: newEndDate });
  }

  function handleSaveSession(sprintId: number) {
    setAttemptedSessionSave(true);
    if (!newDate || !newStartTime || !newEndTime || !newSubjectId) return;
    createSessionMutation.mutate({ sprintId, date: newDate, startTime: newStartTime, endTime: newEndTime, subjectId: newSubjectId, notes: newNotes });
  }

  function toggleCollapsed(sprintId: number) {
    setCollapsedSprintIds((current) => {
      const next = new Set(current);
      if (next.has(sprintId)) next.delete(sprintId);
      else next.add(sprintId);
      return next;
    });
  }

  if (!isLoaded || sprintsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="h-6 w-20 animate-skeleton rounded-md" />
            <div className="mt-2 h-4 w-40 animate-skeleton rounded-md" />
          </div>
          <div className="h-8 w-24 animate-skeleton rounded-md" />
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <SprintRowSkeleton key={i} delay={i * 60} />
          ))}
        </div>
      </div>
    );
  }

  if (sprintsQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">Unable to load sprints</p>
        <p className="mt-1 text-xs text-muted-foreground">Refresh the page and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sprints</h1>
          <p className="mt-1 text-sm text-muted-foreground/80">Plan your exam preparation</p>
        </div>
        <Button onClick={() => { setSprintModalOpen(true); setAttemptedSprintSave(false); }} size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New sprint
          <NewShortcutKbd />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-sm font-medium text-muted-foreground">Your sprints</h2>
          {sprints.length === 0 ? (
            <div className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted-foreground">No sprints yet. Create one to map out your study schedule.</div>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {sprints.map((sprint) => {
                const status = getSprintStatus(sprint.startDate, sprint.endDate);
                const sprintSessions = sessions[sprint.id] ?? [];
                const isCollapsed = collapsedSprintIds.has(sprint.id);
                return (
                  <div key={sprint.id} className="group">
                    <div className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent/50">
                      <button type="button" onClick={() => toggleCollapsed(sprint.id)} className="shrink-0 rounded-md text-muted-foreground transition-[color,transform] duration-150 ease-[var(--ease-out)] hover:text-foreground motion-safe:active:scale-90" aria-label={isCollapsed ? 'Expand sprint' : 'Collapse sprint'}>
                        <ChevronDown className={cn('h-4 w-4 transition-transform duration-150 ease-[var(--ease-out)]', isCollapsed && '-rotate-90')} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 truncate text-sm font-medium">{sprint.name}</span>
                          {getStatusBadge(status)}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground/80">{formatDateRange(sprint.startDate, sprint.endDate)} · {sprintSessions.length} sessions</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSessionForm((current) => (current === sprint.id ? null : sprint.id))}
                          disabled={sprint.isPending}
                          data-pressed={showSessionForm === sprint.id ? '' : undefined}
                          className="min-w-28"
                        >
                          {showSessionForm === sprint.id ? 'Close session' : 'Add session'}
                        </Button>
                        <Popover>
                          <PopoverTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label={`Open actions for ${sprint.name}`}
                                className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                                disabled={sprint.isPending}
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
                              onClick={() => setDeleteSprintId(sprint.id)}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete sprint
                            </button>
                          </PopoverPopup>
                        </Popover>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="border-t border-border bg-muted/20">
                        {showSessionForm === sprint.id && (
                          <div className="space-y-3 border-b border-border bg-background/35 p-3">
                            <div className="grid gap-3 md:grid-cols-4">
                              <div className="space-y-1.5">
                                <Label htmlFor={`session-date-${sprint.id}`} className="text-xs text-muted-foreground">Date</Label>
                                <DatePicker id={`session-date-${sprint.id}`} value={newDate} onChange={setNewDate} placeholder="Date" />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor={`session-subject-${sprint.id}`} className="text-xs text-muted-foreground">Subject</Label>
                                <Select id={`session-subject-${sprint.id}`} value={newSubjectId?.toString() ?? ''} onChange={(e) => setNewSubjectId(e.target.value ? Number(e.target.value) : null)} aria-invalid={attemptedSessionSave && !newSubjectId}>
                                  <SelectItem value="">Select</SelectItem>
                                  {subjects.map((s) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                  ))}
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor={`session-start-time-${sprint.id}`} className="text-xs text-muted-foreground">Start</Label>
                                <TimePicker id={`session-start-time-${sprint.id}`} value={newStartTime} onChange={setNewStartTime} placeholder="Start" />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor={`session-end-time-${sprint.id}`} className="text-xs text-muted-foreground">End</Label>
                                <TimePicker id={`session-end-time-${sprint.id}`} value={newEndTime} onChange={setNewEndTime} placeholder="End" />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor={`session-notes-${sprint.id}`} className="text-xs text-muted-foreground">Notes</Label>
                              <Textarea id={`session-notes-${sprint.id}`} value={newNotes} onChange={(e) => setNewNotes(e.target.value)} rows={2} placeholder="What are you covering?" />
                            </div>
                            {attemptedSessionSave && (!newDate || !newStartTime || !newEndTime) && <p className="text-xs text-destructive">Please fill in date and time.</p>}
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" onClick={() => { setShowSessionForm(null); setAttemptedSessionSave(false); }} size="sm">Cancel</Button>
                              <Button onClick={() => handleSaveSession(sprint.id)} loading={createSessionMutation.isPending} size="sm">Save session</Button>
                            </div>
                          </div>
                        )}

                        {sprintSessions.length > 0 && (
                          <div className="divide-y divide-border">
                            {sprintSessions.map((session) => (
                              <div key={session.id} className="group relative flex items-center gap-3 px-3 py-2 pl-8 transition-colors hover:bg-accent/30">
                                <div className="absolute left-3.5 top-1/2 h-3 w-px -translate-y-1/2 bg-border" />
                                <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: session.subjectColor }} />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm">{session.subjectName}</p>
                                  <p className="text-xs text-muted-foreground/80">
                                    {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(session.startTime)} – {formatTime(session.endTime)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setDeleteSessionId(session.id)}
                                  disabled={session.isPending}
                                  className="rounded-md p-1 text-muted-foreground opacity-0 transition-[opacity,background-color,color] duration-150 ease-[var(--ease-out)] hover:bg-accent hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                                  aria-label={`Delete ${session.subjectName} session`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Upcoming sessions</h2>
          {upcomingSessions.length === 0 ? (
            <div className="rounded-lg border border-border px-4 py-6 text-sm text-muted-foreground">No sessions planned yet.</div>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {upcomingSessions.map((session) => {
                const sessionDate = new Date(session.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const compare = new Date(sessionDate);
                compare.setHours(0, 0, 0, 0);
                let dateLabel = sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (compare.getTime() === today.getTime()) dateLabel = 'Today';
                if (compare.getTime() === tomorrow.getTime()) dateLabel = 'Tomorrow';
                return (
                  <div key={session.id} className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent/50">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: session.subjectColor }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{session.subjectName}</p>
                      <p className="truncate text-xs text-muted-foreground/80">{session.sprintName}</p>
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      <div className="text-muted-foreground">{dateLabel}</div>
                      <div className="tabular-nums text-muted-foreground/70">
                        {formatTime(session.startTime)} – {formatTime(session.endTime)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <DialogPrimitive.Root
        open={sprintModalOpen}
        onOpenChange={(open) => {
          setSprintModalOpen(open);
          if (open) {
            setNewName('');
            setNewStartDate('');
            setNewEndDate('');
            setAttemptedSprintSave(false);
          }
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-150 ease-[var(--ease-out)] data-starting-style:opacity-0 data-ending-style:opacity-0" />
          <DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl ring-1 ring-stone-950/10 transition-[opacity,transform] duration-200 ease-[var(--ease-out)] data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 dark:ring-white/10">
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3.5">
              <div>
                <DialogPrimitive.Title className="text-base font-medium tracking-tight">New sprint</DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-0.5 text-xs text-muted-foreground">Create a focused study window.</DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-xs" aria-label="Close" />}>
                <X className="h-3.5 w-3.5" />
              </DialogPrimitive.Close>
            </div>

            <form
              className="space-y-3 px-5 py-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleSaveSprint();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="sprint-name" className="text-xs text-muted-foreground">Sprint name</Label>
                <Input id="sprint-name" autoFocus type="text" placeholder="Finals prep" value={newName} onChange={(e) => setNewName(e.target.value)} aria-invalid={attemptedSprintSave && !newName.trim()} />
                {attemptedSprintSave && !newName.trim() && <p className="text-xs text-destructive">Please enter a name.</p>}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="sprint-start-date" className="text-xs text-muted-foreground">Start</Label>
                  <DatePicker id="sprint-start-date" value={newStartDate} onChange={setNewStartDate} placeholder="Start" max={newEndDate || undefined} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sprint-end-date" className="text-xs text-muted-foreground">End</Label>
                  <DatePicker id="sprint-end-date" value={newEndDate} onChange={setNewEndDate} placeholder="End" min={newStartDate || undefined} />
                </div>
              </div>
              {attemptedSprintSave && (!newStartDate || !newEndDate) && <p className="text-xs text-destructive">Please select both dates.</p>}
              <div className="flex justify-end gap-2 pt-1">
                <DialogPrimitive.Close render={<Button type="button" variant="ghost" size="sm" />}>
                  Cancel
                </DialogPrimitive.Close>
                <Button type="submit" loading={createSprintMutation.isPending} size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Save sprint
                </Button>
              </div>
            </form>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <AlertDialog open={deleteSprintId != null} onOpenChange={(open) => !open && setDeleteSprintId(null)}>
        <AlertDialogPopup>
          <AlertDialogTitle>Delete sprint?</AlertDialogTitle>
          <AlertDialogDescription>{sprintToDelete?.name} and all of its sessions will be removed.</AlertDialogDescription>
          <AlertDialogActions
            destructive
            confirmLabel="Delete"
            onConfirm={() => deleteSprintId != null && deleteSprintMutation.mutate(deleteSprintId)}
            loading={deleteSprintMutation.isPending}
          />
        </AlertDialogPopup>
      </AlertDialog>

      <AlertDialog open={deleteSessionId != null} onOpenChange={(open) => !open && setDeleteSessionId(null)}>
        <AlertDialogPopup>
          <AlertDialogTitle>Delete session?</AlertDialogTitle>
          <AlertDialogDescription>This session will be removed.</AlertDialogDescription>
          <AlertDialogActions
            destructive
            confirmLabel="Delete"
            onConfirm={() => deleteSessionId != null && deleteSessionMutation.mutate(deleteSessionId)}
            loading={deleteSessionMutation.isPending}
          />
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
