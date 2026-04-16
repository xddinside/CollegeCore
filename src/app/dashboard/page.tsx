import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Calendar, CheckSquare, Clock, Plus } from 'lucide-react';
import {
  getAllAssignments,
  getAssignmentStats,
  getExamSprints,
  getSemesterSubjects,
  getTodos,
  getCachedCurrentSemester,
} from '@/lib/actions';
import { getDueStatus } from '@/lib/utils';
import { DashboardGreeting } from '@/components/dashboard-greeting';
import { DesktopNotificationPrompt } from '@/components/desktop-notification-prompt';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function formatDueDate(dueDate: Date | string | null, precomputedStatus?: ReturnType<typeof getDueStatus>) {
  if (!dueDate) {
    return 'No due date';
  }

  const status = precomputedStatus ?? getDueStatus(dueDate);
  const date = new Date(dueDate);

  if (status === 'today') {
    return 'Today';
  }

  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const current = new Date(date);
  current.setHours(0, 0, 0, 0);

  if (current.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  }

  if (status === 'overdue') {
    return 'Overdue';
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const semester = await getCachedCurrentSemester(userId);

  if (!semester) {
    redirect('/onboarding');
  }

  const [subjects, stats, assignments, sprints, todos] = await Promise.all([
    getSemesterSubjects(semester.id),
    getAssignmentStats(semester.id),
    getAllAssignments(semester.id),
    getExamSprints(semester.id),
    getTodos(semester.id),
  ]);

  const pendingAssignments = assignments
    .filter((assignment) => assignment.status !== 'COMPLETED')
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 4);
  const completedTodos = todos.filter((todo) => todo.isCompleted).length;
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="animate-fade-in space-y-10">
      <div className="space-y-2">
        <DashboardGreeting />
        <p className="text-muted-foreground">
          {pendingAssignments.length > 0
            ? `You have ${pendingAssignments.length} upcoming assignments in ${semester.name}.`
            : `Everything is up to date for ${semester.name}.`}
        </p>
      </div>

      <DesktopNotificationPrompt />

      <div className="flex flex-col gap-3 md:hidden">
        <Link href="/dashboard/assignments">
          <Button className="w-full justify-center">
            <Plus className="mr-2 h-4 w-4" />
            New Assignment
          </Button>
        </Link>
        <Link href="/dashboard/sprints">
          <Button variant="outline" className="w-full justify-center">
            <Calendar className="mr-2 h-4 w-4" />
            View Sprints
          </Button>
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-medium">Upcoming</h2>
              <Link href="/dashboard/assignments">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {pendingAssignments.length === 0 ? (
              <div className="empty-state rounded-xl border border-border bg-accent/40 px-6 py-12">
                <h3 className="text-lg font-medium text-foreground">No upcoming assignments</h3>
                <p className="mt-1">Create your first assignment to start planning the semester.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {pendingAssignments.map((assignment) => {
                  const dueStatus = getDueStatus(assignment.dueDate);
                  const formattedDue = formatDueDate(assignment.dueDate, dueStatus);

                  return (
                    <Link
                      key={assignment.id}
                      href="/dashboard/assignments"
                      className="group -mx-3 flex items-start gap-3 rounded-lg px-3 py-4 transition-colors hover:bg-accent/50"
                    >
                      <div
                        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: assignment.subjectColor }}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate font-medium">{assignment.title}</span>
                              {dueStatus === 'today' && <Badge variant="destructive">Today</Badge>}
                              {dueStatus === 'overdue' && <Badge variant="destructive">Overdue</Badge>}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <span>{assignment.subjectName}</span>
                              {assignment.dueDate && (
                                <>
                                  <span className="hidden sm:inline">·</span>
                                  <span className="hidden items-center gap-1 sm:flex">
                                    <Clock className="h-3.5 w-3.5" />
                                    {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 text-left sm:text-right">
                            <span
                              className={
                                dueStatus === 'today' || dueStatus === 'overdue'
                                  ? 'text-sm font-medium text-destructive'
                                  : 'text-sm text-muted-foreground'
                              }
                            >
                              {formattedDue}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="content-visibility-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-medium">Active Sprints</h2>
              <Link href="/dashboard/sprints">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {sprints.length === 0 ? (
              <div className="rounded-xl border border-border bg-accent/40 px-6 py-8 text-sm text-muted-foreground">
                Create a sprint to plan your exam prep and study sessions.
              </div>
            ) : (
              <div className="space-y-6">
                {sprints.slice(0, 2).map((sprint) => (
                  <Link key={sprint.id} href="/dashboard/sprints" className="block space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-medium">{sprint.name}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {new Date(sprint.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          -{' '}
                          {new Date(sprint.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">{semester.name}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-full rounded-full bg-primary/20" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="hidden space-y-10 lg:block content-visibility-auto contain-intrinsic-size-auto-300">
          <section className="space-y-3">
            <Link href="/dashboard/assignments">
              <Button className="w-full justify-start" size="lg">
                <Plus className="mr-2 h-4 w-4" />
                New Assignment
              </Button>
            </Link>
            <Link href="/dashboard/subjects">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Calendar className="mr-2 h-4 w-4" />
                Manage Subjects
              </Button>
            </Link>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Todos</h2>
              <Link href="/dashboard/todos">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>

            <div className="space-y-1">
              {todos.slice(0, 5).map((todo) => (
                <div key={todo.id} className="group flex items-center gap-3 py-3">
                  <div
                    className={
                      todo.isCompleted
                        ? 'flex h-4 w-4 items-center justify-center rounded border border-primary bg-primary'
                        : 'flex h-4 w-4 items-center justify-center rounded border border-muted-foreground/30'
                    }
                  >
                    {todo.isCompleted && (
                      <svg
                        className="h-2.5 w-2.5 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={
                      todo.isCompleted
                        ? 'text-sm text-muted-foreground line-through'
                        : 'text-sm text-foreground'
                    }
                  >
                    {todo.title}
                  </span>
                </div>
              ))}
              {todos.length === 0 && (
                <p className="text-sm text-muted-foreground">No todos yet.</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium">Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckSquare className="h-4 w-4" />
                  <span className="text-sm">Tasks</span>
                </div>
                <span className="text-sm font-medium">
                  {stats.completed}/{stats.total}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${completionRate}%` }} />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">Completion</span>
                <span className="text-sm font-medium">{completionRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subjects</span>
                <span className="text-sm font-medium">{subjects.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Todos done</span>
                <span className="text-sm font-medium">
                  {completedTodos}/{todos.length}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
