import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCurrentSemester, getDashboardHomeData } from '@/lib/academic/server/read-actions';
import { describeDueDate, toAcademicDay } from '@/lib/academic-day';
import { buildFocusFeed } from '@/lib/dashboard/focus-feed';
import { DashboardGreeting } from '@/components/dashboard-greeting';
import { DesktopNotificationPrompt } from '@/components/desktop-notification-prompt';
import { DashboardCreateModal } from '@/components/dashboard/dashboard-create-modal';
import { FocusFeed } from '@/components/dashboard/focus-feed';



export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const semester = await getCurrentSemester();

  if (!semester) {
    redirect('/onboarding');
  }

  const [user, homeData] = await Promise.all([
    currentUser(),
    getDashboardHomeData(),
  ]);
  const displayName = user?.firstName || user?.fullName || null;

  const {
    subjects,
    subjectCount,
    assignmentStats: stats,
    upcomingAssignments: pendingAssignments,
    activeSprints: sprints,
    recentTodos: todos,
  } = homeData;

  const today = toAcademicDay(new Date());

  const { items: focusItems, groups } = buildFocusFeed({
    assignments: pendingAssignments,
    todos,
    sprints,
    today,
  });

  const overdueCount = pendingAssignments.filter((a) => describeDueDate(a.dueDate, today).status === 'overdue').length;

  return (
    <div className="flex flex-1 flex-col">
      <div aria-live="polite" aria-atomic="true" className="sr-only" />

      <section className="-mx-5 -mt-6 border-b border-border px-5 pt-7 pb-6 sm:-mx-10 sm:-mt-8 sm:px-10 sm:pt-9 sm:pb-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60">
              {semester.name} <span className="text-muted-foreground/30">·</span> Dashboard
            </p>
            <DashboardGreeting className="leading-[1.1]" name={displayName} />
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground/70">
              <span className="tabular-nums">
                <span className="text-foreground/90">{stats.completed}</span>
                <span className="text-muted-foreground/50">/{stats.total}</span> done
              </span>
              <span aria-hidden="true" className="text-muted-foreground/35">·</span>
              <span className="tabular-nums">{subjectCount} subjects</span>
              <span aria-hidden="true" className="text-muted-foreground/35">·</span>
              <span className="tabular-nums">{pendingAssignments.length} upcoming</span>
              {overdueCount > 0 && (
                <>
                  <span aria-hidden="true" className="text-muted-foreground/35">·</span>
                  <span className="font-medium tabular-nums text-destructive">{overdueCount} overdue</span>
                </>
              )}
            </div>
          </div>
          <DashboardCreateModal subjects={subjects} />
        </div>
      </section>

      <DesktopNotificationPrompt />

      <FocusFeed groups={groups} items={focusItems} today={today} subjects={subjects} />
    </div>
  );
}
