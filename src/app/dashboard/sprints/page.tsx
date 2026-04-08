'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Calendar, ChevronRight, Clock, Plus, Trash2 } from 'lucide-react';
import {
  createExamSprint,
  createSprintSession,
  deleteExamSprint,
  deleteSprintSession,
  getCurrentSemester,
  getExamSprints,
  getSemesterSubjects,
  getSprintSessions,
} from '@/lib/actions';
import { Badge } from '@/app/ui/1/components/badge';
import { Button } from '@/app/ui/1/components/button';
import { Input } from '@/app/ui/1/components/input';

interface ExamSprint {
  id: number;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
}

interface SprintSession {
  id: number;
  date: Date | string;
  startTime: string;
  endTime: string;
  notes: string | null;
  subjectName: string;
  subjectColor: string;
}

interface Subject {
  id: number;
  name: string;
  color: string;
}

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
  const [sprints, setSprints] = useState<ExamSprint[]>([]);
  const [sessions, setSessions] = useState<Record<number, SprintSession[]>>({});
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<number | null>(null);
  const [newNotes, setNewNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;

    void (async () => {
      const semester = await getCurrentSemester(user.id);
      if (!semester) return;

      const [loadedSubjects, loadedSprints] = await Promise.all([
        getSemesterSubjects(semester.id),
        getExamSprints(semester.id),
      ]);
      const sessionEntries = await Promise.all(
        loadedSprints.map(async (sprint) => [sprint.id, await getSprintSessions(sprint.id)] as const)
      );

      setSubjects(loadedSubjects);
      setSprints(loadedSprints);
      setSessions(Object.fromEntries(sessionEntries));
      setLoading(false);
    })();
  }, [isLoaded, user]);

  async function loadData() {
    if (!user) return;

    const semester = await getCurrentSemester(user.id);
    if (!semester) return;

    const [loadedSubjects, loadedSprints] = await Promise.all([
      getSemesterSubjects(semester.id),
      getExamSprints(semester.id),
    ]);
    const sessionEntries = await Promise.all(
      loadedSprints.map(async (sprint) => [sprint.id, await getSprintSessions(sprint.id)] as const)
    );

    setSubjects(loadedSubjects);
    setSprints(loadedSprints);
    setSessions(Object.fromEntries(sessionEntries));
    setLoading(false);
  }

  async function handleCreateSprint() {
    if (!newName.trim() || !newStartDate || !newEndDate || !user) return;

    const semester = await getCurrentSemester(user.id);
    if (!semester) return;

    await createExamSprint(semester.id, newName.trim(), new Date(newStartDate), new Date(newEndDate));

    setNewName('');
    setNewStartDate('');
    setNewEndDate('');
    setShowSprintForm(false);
    await loadData();
  }

  async function handleCreateSession(sprintId: number) {
    if (!newDate || !newStartTime || !newEndTime || !newSubjectId) return;

    await createSprintSession(
      sprintId,
      new Date(newDate),
      newStartTime,
      newEndTime,
      newSubjectId,
      newNotes.trim() || null
    );

    setNewDate('');
    setNewStartTime('');
    setNewEndTime('');
    setNewSubjectId(null);
    setNewNotes('');
    setShowSessionForm(null);
    await loadData();
  }

  async function handleDeleteSession(sessionId: number) {
    await deleteSprintSession(sessionId);
    await loadData();
  }

  async function handleDeleteSprint(id: number) {
    await deleteExamSprint(id);
    await loadData();
  }

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

  if (!isLoaded || loading) {
    return <div className="py-8 text-sm text-muted-foreground">Loading...</div>;
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
        <div className="space-y-4 rounded-xl border border-border bg-accent/40 p-5">
          <Input
            placeholder="Sprint name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            autoFocus
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="date"
              value={newStartDate}
              onChange={(event) => setNewStartDate(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              type="date"
              value={newEndDate}
              onChange={(event) => setNewEndDate(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreateSprint} disabled={!newName.trim() || !newStartDate || !newEndDate}>
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
                          >
                            Add Session
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSprint(sprint.id)}>
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
                        <div className="space-y-3 rounded-lg border border-border bg-background p-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <input
                              type="date"
                              value={newDate}
                              onChange={(event) => setNewDate(event.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <select
                              value={newSubjectId ?? ''}
                              onChange={(event) => setNewSubjectId(event.target.value ? Number(event.target.value) : null)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <option value="">Select subject</option>
                              {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                  {subject.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <input
                              type="time"
                              value={newStartTime}
                              onChange={(event) => setNewStartTime(event.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <input
                              type="time"
                              value={newEndTime}
                              onChange={(event) => setNewEndTime(event.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                          </div>
                          <textarea
                            value={newNotes}
                            onChange={(event) => setNewNotes(event.target.value)}
                            rows={3}
                            placeholder="Notes (optional)"
                            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                          <div className="flex justify-end">
                            <Button
                              onClick={() => handleCreateSession(sprint.id)}
                              disabled={!newDate || !newStartTime || !newEndTime || !newSubjectId}
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
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteSession(session.id)}>
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
