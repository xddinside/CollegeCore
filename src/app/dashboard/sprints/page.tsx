'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, ChevronRight, Clock, Plus, Trash2 } from 'lucide-react';
import {
  createExamSprint,
  createSprintSession,
  deleteExamSprint,
  deleteSprintSession,
} from '@/lib/actions';
import {
  getSprintsPageData,
  type SprintsPageData,
} from '@/lib/dashboard-queries';
import { dashboardQueryKeys } from '@/lib/dashboard-query-keys';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TimePicker } from '@/components/ui/time-picker';

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
  return `${new Date(start).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} - ${new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
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

function getSprintProgress(startDate: Date | string, endDate: Date | string) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();

  if (now <= start) return 0;
  if (now >= end) return 100;
  if (end <= start) return 0;

  return Math.round(((now - start) / (end - start)) * 100);
}

function getStatusBadge(status: string) {
  if (status === 'active') return <Badge variant="success">Active</Badge>;
  if (status === 'upcoming') return <Badge variant="secondary">Upcoming</Badge>;
  return <Badge variant="ghost">Completed</Badge>;
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default function SprintsPage() {
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newSubjectId, setNewSubjectId] = useState<number | null>(null);
  const [newNotes, setNewNotes] = useState('');

  const sprintsQueryKey = user ? dashboardQueryKeys.sprints(user.id) : ['dashboard', 'sprints', 'anonymous'];
  const sprintsQuery = useQuery({
    queryKey: sprintsQueryKey,
    queryFn: () => getSprintsPageData(user!.id),
    enabled: isLoaded && !!user,
  });

  const createSprintMutation = useMutation({
    mutationFn: async (variables: CreateSprintInput) => {
      if (!sprintsQuery.data) {
        throw new Error('Sprints data not loaded');
      }

      return createExamSprint(
        sprintsQuery.data.semesterId,
        variables.name,
        new Date(variables.startDate),
        new Date(variables.endDate)
      );
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: sprintsQueryKey });

      const previousData = queryClient.getQueryData<SprintsPageData>(sprintsQueryKey);
      const tempId = -Date.now();

      setNewName('');
      setNewStartDate('');
      setNewEndDate('');
      setShowSprintForm(false);

      queryClient.setQueryData<SprintsPageData>(sprintsQueryKey, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          sprints: [
            {
              id: tempId,
              name: variables.name,
              startDate: variables.startDate,
              endDate: variables.endDate,
              isPending: true,
            },
            ...current.sprints,
          ],
          sessions: {
            ...current.sessions,
            [tempId]: [],
          },
        };
      });

      return { previousData, tempId, variables };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(sprintsQueryKey, context.previousData);
      }

      if (context?.variables) {
        setNewName(context.variables.name);
        setNewStartDate(context.variables.startDate);
        setNewEndDate(context.variables.endDate);
        setShowSprintForm(true);
      }
    },
    onSuccess: (createdSprint, _variables, context) => {
      queryClient.setQueryData<SprintsPageData>(sprintsQueryKey, (current) => {
        if (!current || !context) {
          return current;
        }

        const { [context.tempId]: tempSessions = [], ...remainingSessions } = current.sessions;

        return {
          ...current,
          sprints: current.sprints.map((sprint) =>
            sprint.id === context.tempId
              ? { ...sprint, id: createdSprint.id, isPending: false }
              : sprint
          ),
          sessions: {
            ...remainingSessions,
            [createdSprint.id]: tempSessions,
          },
        };
      });

      void queryClient.invalidateQueries({ queryKey: sprintsQueryKey });
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: (variables: CreateSessionInput) =>
      createSprintSession(
        variables.sprintId,
        new Date(variables.date),
        variables.startTime,
        variables.endTime,
        variables.subjectId,
        variables.notes.trim() || null
      ),
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

      queryClient.setQueryData<SprintsPageData>(sprintsQueryKey, (current) => {
        if (!current || !subject) {
          return current;
        }

        return {
          ...current,
          sessions: {
            ...current.sessions,
            [variables.sprintId]: [
              {
                id: tempId,
                date: variables.date,
                startTime: variables.startTime,
                endTime: variables.endTime,
                notes: variables.notes.trim() || null,
                subjectName: subject.name,
                subjectColor: subject.color,
                isPending: true,
              },
              ...(current.sessions[variables.sprintId] ?? []),
            ],
          },
        };
      });

      return { previousData, tempId, variables };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(sprintsQueryKey, context.previousData);
      }

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
        if (!current || !context) {
          return current;
        }

        return {
          ...current,
          sessions: {
            ...current.sessions,
            [context.variables.sprintId]: (current.sessions[context.variables.sprintId] ?? []).map((session) =>
              session.id === context.tempId
                ? { ...session, id: createdSession.id, isPending: false }
                : session
            ),
          },
        };
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
        if (!current) {
          return current;
        }

        return {
          ...current,
          sessions: Object.fromEntries(
            Object.entries(current.sessions).map(([sprintId, sprintSessions]) => [
              Number(sprintId),
              sprintSessions.filter((session) => session.id !== id),
            ])
          ),
        };
      });

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(sprintsQueryKey, context.previousData);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: sprintsQueryKey });
    },
  });

  const deleteSprintMutation = useMutation({
    mutationFn: (id: number) => deleteExamSprint(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: sprintsQueryKey });

      const previousData = queryClient.getQueryData<SprintsPageData>(sprintsQueryKey);

      queryClient.setQueryData<SprintsPageData>(sprintsQueryKey, (current) => {
        if (!current) {
          return current;
        }

        const remainingSessions = { ...current.sessions };
        delete remainingSessions[id];

        return {
          ...current,
          sprints: current.sprints.filter((sprint) => sprint.id !== id),
          sessions: remainingSessions,
        };
      });

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(sprintsQueryKey, context.previousData);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: sprintsQueryKey });
    },
  });

  const sprints = sprintsQuery.data?.sprints ?? [];
  const sessions = sprintsQuery.data?.sessions ?? {};
  const subjects = sprintsQuery.data?.subjects ?? [];

  const upcomingSessions = sprints
    .flatMap((sprint) =>
      (sessions[sprint.id] ?? []).map((session) => ({
        ...session,
        sprintName: sprint.name,
      }))
    )
    .sort((a, b) => {
      const aTime = new Date(`${new Date(a.date).toISOString().slice(0, 10)}T${a.startTime}`).getTime();
      const bTime = new Date(`${new Date(b.date).toISOString().slice(0, 10)}T${b.startTime}`).getTime();
      return aTime - bTime;
    })
    .slice(0, 6);

  if (!isLoaded || sprintsQuery.isLoading) {
    return <div className="py-8 text-sm text-muted-foreground">Loading...</div>;
  }

  if (sprintsQuery.isError) {
    return <div className="py-8 text-sm text-destructive">Unable to load sprints.</div>;
  }

  return (
    <div className="animate-fade-in space-y-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Sprints</h1>
          <p className="mt-1 text-muted-foreground">Plan your exam preparation</p>
        </div>
        <Button onClick={() => setShowSprintForm((open) => !open)}>
          <Plus className="mr-2 h-4 w-4" />
          {showSprintForm ? 'Close Form' : 'New Sprint'}
        </Button>
      </div>

      {showSprintForm && (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-background/80">
          <div className="grid gap-0 md:grid-cols-12">
            <div className="space-y-2 p-4 md:col-span-6 md:border-r md:border-border/70">
              <Label htmlFor="sprint-name" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Sprint name
              </Label>
              <Input
                id="sprint-name"
                placeholder="Sprint name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2 border-t border-border/70 p-4 md:col-span-3 md:border-t-0 md:border-r md:border-border/70">
              <Label htmlFor="sprint-start-date" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Start date
              </Label>
              <DatePicker
                id="sprint-start-date"
                value={newStartDate}
                onChange={setNewStartDate}
                placeholder="Choose a start"
                max={newEndDate || undefined}
              />
            </div>
            <div className="space-y-2 border-t border-border/70 p-4 md:col-span-3 md:border-t-0">
              <Label htmlFor="sprint-end-date" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                End date
              </Label>
              <DatePicker
                id="sprint-end-date"
                value={newEndDate}
                onChange={setNewEndDate}
                placeholder="Choose an end"
                min={newStartDate || undefined}
              />
            </div>
          </div>
          <div className="flex justify-end border-t border-border/70 px-4 py-4">
            <Button
              onClick={() =>
                createSprintMutation.mutate({
                  name: newName.trim(),
                  startDate: newStartDate,
                  endDate: newEndDate,
                })
              }
              disabled={!newName.trim() || !newStartDate || !newEndDate || createSprintMutation.isPending}
            >
              Save Sprint
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-12 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="mb-6 text-lg font-medium">Your Sprints</h2>

            {sprints.length === 0 ? (
              <div className="rounded-xl border border-border bg-accent/40 px-6 py-8 text-sm text-muted-foreground">
                No sprints yet. Create one to map out your study schedule.
              </div>
            ) : (
              <div className="space-y-8">
                {sprints.map((sprint) => {
                  const status = getSprintStatus(sprint.startDate, sprint.endDate);
                  const progress = getSprintProgress(sprint.startDate, sprint.endDate);
                  const sprintSessions = sessions[sprint.id] ?? [];

                  return (
                    <div key={sprint.id} className="space-y-4 rounded-xl border border-border bg-accent/30 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="mb-1 flex items-center gap-3">
                            <h3 className="font-medium">{sprint.name}</h3>
                            {getStatusBadge(status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{formatDateRange(sprint.startDate, sprint.endDate)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSessionForm((current) => (current === sprint.id ? null : sprint.id))}
                            disabled={sprint.isPending}
                          >
                            Add Session
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteSprintMutation.mutate(sprint.id)} disabled={sprint.isPending}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{sprintSessions.length} planned sessions</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      {showSessionForm === sprint.id && (
                        <div className="overflow-hidden rounded-xl border border-border/80 bg-background/80">
                          <div className="grid gap-0 md:grid-cols-12">
                            <div className="space-y-2 p-4 md:col-span-3 md:border-r md:border-border/70">
                              <Label htmlFor={`session-date-${sprint.id}`} className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                                Session date
                              </Label>
                              <DatePicker
                                id={`session-date-${sprint.id}`}
                                value={newDate}
                                onChange={setNewDate}
                                placeholder="Choose a study date"
                              />
                            </div>
                            <div className="space-y-2 border-t border-border/70 p-4 md:col-span-3 md:border-t-0 md:border-r md:border-border/70">
                              <Label htmlFor={`session-subject-${sprint.id}`} className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                                Subject
                              </Label>
                              <Select
                                id={`session-subject-${sprint.id}`}
                                value={newSubjectId?.toString() ?? ''}
                                onChange={(event) => setNewSubjectId(event.target.value ? Number(event.target.value) : null)}
                              >
                                <SelectItem value="">Select subject</SelectItem>
                                {subjects.map((subject) => (
                                  <SelectItem key={subject.id} value={subject.id.toString()}>
                                    {subject.name}
                                  </SelectItem>
                                ))}
                              </Select>
                            </div>
                            <div className="space-y-2 border-t border-border/70 p-4 md:col-span-3 md:border-t-0 md:border-r md:border-border/70">
                              <Label htmlFor={`session-start-time-${sprint.id}`} className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                                Start
                              </Label>
                              <TimePicker
                                id={`session-start-time-${sprint.id}`}
                                value={newStartTime}
                                onChange={setNewStartTime}
                                placeholder="Pick a start"
                              />
                            </div>
                            <div className="space-y-2 border-t border-border/70 p-4 md:col-span-3 md:border-t-0">
                              <Label htmlFor={`session-end-time-${sprint.id}`} className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                                End
                              </Label>
                              <TimePicker
                                id={`session-end-time-${sprint.id}`}
                                value={newEndTime}
                                onChange={setNewEndTime}
                                placeholder="Pick an end"
                              />
                            </div>
                            <div className="space-y-2 border-t border-border/70 p-4 md:col-span-12">
                              <Label htmlFor={`session-notes-${sprint.id}`} className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                                Notes
                              </Label>
                              <Textarea
                                id={`session-notes-${sprint.id}`}
                                value={newNotes}
                                onChange={(event) => setNewNotes(event.target.value)}
                                rows={3}
                                placeholder="What are you covering in this block?"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end border-t border-border/70 px-4 py-4">
                            <Button
                              onClick={() =>
                                newSubjectId &&
                                createSessionMutation.mutate({
                                  sprintId: sprint.id,
                                  date: newDate,
                                  startTime: newStartTime,
                                  endTime: newEndTime,
                                  subjectId: newSubjectId,
                                  notes: newNotes,
                                })
                              }
                              disabled={!newDate || !newStartTime || !newEndTime || !newSubjectId || createSessionMutation.isPending}
                            >
                              Save Session
                            </Button>
                          </div>
                        </div>
                      )}

                      {sprintSessions.length > 0 && (
                        <div className="space-y-3 border-t border-border pt-4">
                          {sprintSessions.map((session) => (
                            <div key={session.id} className="flex items-start gap-3">
                              <div
                                className="mt-1.5 h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: session.subjectColor }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="font-medium">{session.subjectName}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(session.date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                      })}{' '}
                                      · {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                    </p>
                                  </div>
                                  <Button variant="ghost" size="icon" onClick={() => deleteSessionMutation.mutate(session.id)} disabled={session.isPending}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                {session.notes && (
                                  <p className="mt-1 text-sm text-muted-foreground">{session.notes}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-medium">Upcoming Sessions</h2>
          {upcomingSessions.length === 0 ? (
            <div className="rounded-xl border border-border bg-accent/40 px-5 py-6 text-sm text-muted-foreground">
              No sessions planned yet.
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => {
                const sessionDate = new Date(session.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const compare = new Date(sessionDate);
                compare.setHours(0, 0, 0, 0);

                let dateLabel = sessionDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                if (compare.getTime() === today.getTime()) dateLabel = 'Today';
                if (compare.getTime() === tomorrow.getTime()) dateLabel = 'Tomorrow';

                return (
                  <div key={session.id} className="space-y-2 rounded-xl border border-border bg-accent/30 p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: session.subjectColor }}
                      />
                      <span className="font-medium">{session.subjectName}</span>
                      {dateLabel === 'Today' && <Badge variant="destructive">Today</Badge>}
                    </div>
                    <p className="pl-5 text-sm text-muted-foreground">{session.sprintName}</p>
                    <div className="flex items-center gap-1.5 pl-5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {dateLabel}
                    </div>
                    <div className="flex items-center gap-1.5 pl-5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(session.startTime)} - {formatTime(session.endTime)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
