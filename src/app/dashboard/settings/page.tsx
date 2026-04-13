import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ComponentType } from 'react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CheckSquare,
  LaptopMinimal,
  ListTodo,
  MonitorCog,
  Sparkles,
} from 'lucide-react';
import {
  getAllAssignments,
  getCurrentSemester,
  getExamSprints,
  getSemesterSubjects,
  getTodos,
} from '@/lib/actions';
import { getDueStatus } from '@/lib/utils';
import { DesktopSettingsPanel } from '@/components/desktop-settings-panel';
import { Button } from '@/components/ui/button';

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-medium tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-accent/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/8 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default async function DashboardSettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const semester = await getCurrentSemester(userId);

  if (!semester) {
    redirect('/onboarding');
  }

  const [subjects, assignments, sprints, todos] = await Promise.all([
    getSemesterSubjects(semester.id),
    getAllAssignments(semester.id),
    getExamSprints(semester.id),
    getTodos(semester.id),
  ]);

  const upcomingAssignments = assignments.filter((assignment) => assignment.status !== 'COMPLETED').length;
  const overdueAssignments = assignments.filter((assignment) => getDueStatus(assignment.dueDate) === 'overdue').length;
  const completedTodos = todos.filter((todo) => todo.isCompleted).length;
  const pendingTodos = todos.length - completedTodos;

  return (
    <div className="animate-fade-in space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-medium tracking-tight">Settings</h1>
        <p className="max-w-3xl text-muted-foreground">
          Review your study workspace, keep tabs on the current semester, and tune native desktop behavior when
          you open CollegeCore in Electron.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  Active workspace
                </div>
                <div>
                  <h2 className="text-xl font-medium tracking-tight">{semester.name}</h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    This is the semester your dashboard is currently planning around across the web app and the
                    desktop app.
                  </p>
                </div>
              </div>

              <Link href="/dashboard/subjects">
                <Button variant="outline">
                  Manage subjects
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Subjects"
                value={String(subjects.length)}
                hint={subjects.length === 1 ? '1 course in rotation' : `${subjects.length} courses in rotation`}
              />
              <StatCard
                label="Assignments"
                value={String(upcomingAssignments)}
                hint={upcomingAssignments === 1 ? '1 item still pending' : `${upcomingAssignments} items still pending`}
              />
              <StatCard
                label="Exam sprints"
                value={String(sprints.length)}
                hint={sprints.length === 0 ? 'No sprint plans yet' : 'Structured prep windows saved'}
              />
              <StatCard
                label="Todos"
                value={String(pendingTodos)}
                hint={pendingTodos === 0 ? 'Nothing left open' : `${completedTodos} already completed`}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <h2 className="text-lg font-medium tracking-tight">Workspace shortcuts</h2>
              <p className="text-sm text-muted-foreground">
                Jump straight to the areas that usually need attention when you are adjusting how your semester is
                set up.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <QuickLink
                href="/dashboard/assignments"
                icon={CheckSquare}
                title="Assignments"
                body={
                  overdueAssignments > 0
                    ? `${overdueAssignments} overdue item${overdueAssignments === 1 ? '' : 's'} need attention.`
                    : 'Review due dates, progress, and what is coming up next.'
                }
              />
              <QuickLink
                href="/dashboard/todos"
                icon={ListTodo}
                title="Todos"
                body={
                  pendingTodos > 0
                    ? `${pendingTodos} todo${pendingTodos === 1 ? '' : 's'} still open for this semester.`
                    : 'Everything is checked off right now.'
                }
              />
              <QuickLink
                href="/dashboard/sprints"
                icon={Calendar}
                title="Exam sprints"
                body={sprints.length > 0 ? 'Refine your prep windows and study sessions.' : 'Create a focused prep plan for exam season.'}
              />
              <QuickLink
                href="/dashboard/subjects"
                icon={BookOpen}
                title="Subjects"
                body="Rename courses, adjust their colors, and keep your dashboard organized."
              />
            </div>
          </section>

          <DesktopSettingsPanel />
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium">
              <LaptopMinimal className="h-4 w-4" />
              Platforms
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MonitorCog className="h-4 w-4 text-primary" />
                  Web app
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your dashboard, assignments, todos, and sprints are always available in the browser with the
                  same cloud data as the desktop app.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Bell className="h-4 w-4 text-primary" />
                  Electron app
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Adds native notifications and tray behavior while still using the same production account and
                  server.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-[linear-gradient(180deg,#fafaf9,white)] p-6 shadow-sm">
            <h2 className="text-lg font-medium tracking-tight">What changes where</h2>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                Web settings are reflected immediately in your browser session because your dashboard data is
                already cloud-backed.
              </div>
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                Desktop settings only appear when the Electron bridge is available, and those changes apply
                immediately to the running desktop app.
              </div>
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                Sign-in stays shared across both surfaces because both point at the same CollegeCore deployment
                and Clerk app.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
