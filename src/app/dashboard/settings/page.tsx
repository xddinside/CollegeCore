import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import {
  getAllAssignments,
  getCurrentSemester,
  getExamSprints,
  getSemesterSubjects,
  getTodos,
} from '@/lib/actions';
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
    <div className="rounded-xl border border-border bg-background px-4 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-medium tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
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

  const pendingAssignments = assignments.filter((assignment) => assignment.status !== 'COMPLETED').length;
  const completedTodos = todos.filter((todo) => todo.isCompleted).length;
  const pendingTodos = todos.length - completedTodos;

  return (
    <div className="animate-fade-in mx-auto max-w-5xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-medium tracking-tight">Settings</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Review the semester you are working in and adjust desktop preferences when you open CollegeCore in the
          app.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Current semester</p>
            <div>
              <h2 className="text-xl font-medium tracking-tight">{semester.name}</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                This is the active workspace for your subjects, assignments, todos, and sprint plans.
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

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Subjects"
            value={String(subjects.length)}
            hint={subjects.length === 1 ? '1 course this term' : `${subjects.length} courses this term`}
          />
          <StatCard
            label="Assignments"
            value={String(pendingAssignments)}
            hint={pendingAssignments === 1 ? '1 item still open' : `${pendingAssignments} items still open`}
          />
          <StatCard
            label="Exam sprints"
            value={String(sprints.length)}
            hint={sprints.length === 0 ? 'No sprint plans yet' : 'Prep plans saved'}
          />
          <StatCard
            label="Todos"
            value={String(pendingTodos)}
            hint={pendingTodos === 0 ? 'Nothing waiting' : `${completedTodos} already completed`}
          />
        </div>
      </section>

      <DesktopSettingsPanel />
    </div>
  );
}
