import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { getCurrentSemester, getDashboardSettingsData } from '@/lib/academic/server/read-actions';
import { DesktopSettingsPanel } from '@/components/desktop-settings-panel';
import { Button } from '@/components/ui/button';

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 transition-colors hover:border-border-hover">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground/80">{hint}</p>
    </div>
  );
}

export default async function DashboardSettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const semester = await getCurrentSemester();
  if (!semester) redirect('/onboarding');

  const settingsData = await getDashboardSettingsData();
  const { subjectCount, assignmentStats, sprintCount, todoStats } = settingsData;

  const pendingAssignments = assignmentStats.total - assignmentStats.completed;
  const completedTodos = todoStats.completed;
  const pendingTodos = todoStats.total - completedTodos;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="max-w-2xl text-sm text-muted-foreground/80">
          Review the semester you are working in and adjust desktop preferences when you open CollegeCore in the app.
        </p>
      </div>

      <section className="space-y-5 rounded-lg border border-border bg-muted/30 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current semester</p>
            <div>
              <h2 className="text-lg font-medium tracking-tight">{semester.name}</h2>
              <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground/80">
                This is the active workspace for your subjects, assignments, todos, and sprint plans.
              </p>
            </div>
          </div>
          <Button render={<Link href="/dashboard/subjects" />} variant="outline" size="sm">
            Manage subjects
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Subjects" value={String(subjectCount)} hint={subjectCount === 1 ? '1 course this term' : `${subjectCount} courses this term`} />
          <StatCard label="Assignments" value={String(pendingAssignments)} hint={pendingAssignments === 1 ? '1 item still open' : `${pendingAssignments} items still open`} />
          <StatCard label="Exam sprints" value={String(sprintCount)} hint={sprintCount === 0 ? 'No sprint plans yet' : 'Prep plans saved'} />
          <StatCard label="Todos" value={String(pendingTodos)} hint={pendingTodos === 0 ? 'Nothing waiting' : `${completedTodos} already completed`} />
        </div>
      </section>

      <DesktopSettingsPanel />
    </div>
  );
}
