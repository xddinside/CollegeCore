'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  Menu,
  Settings,
  X,
} from 'lucide-react';
import {
  getAssignmentsPageData,
  getSprintsPageData,
  getSubjectsPageData,
  getTodosPageData,
} from '@/lib/dashboard-queries';
import { dashboardQueryKeys } from '@/lib/dashboard-query-keys';
import { hasDesktopBridge } from '@/lib/desktop';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const DesktopRuntime = dynamic(
  () => import('@/components/desktop-runtime').then((mod) => mod.DesktopRuntime),
  { ssr: false }
);

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/assignments', label: 'Assignments', icon: CheckSquare },
  { href: '/dashboard/todos', label: 'Todos', icon: ListTodo },
  { href: '/dashboard/sprints', label: 'Sprints', icon: Calendar },
  { href: '/dashboard/subjects', label: 'Subjects', icon: BookOpen },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

type DashboardShellProps = {
  children: ReactNode;
  semesterName: string;
};

function runWhenBrowserIdle(callback: () => void) {
  if (typeof window.requestIdleCallback === 'function') {
    const idleId = window.requestIdleCallback(callback, { timeout: 1200 });
    return () => window.cancelIdleCallback(idleId);
  }

  const timeoutId = window.setTimeout(callback, 250);
  return () => window.clearTimeout(timeoutId);
}

export function DashboardShell({ children, semesterName }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopRuntimeEnabled, setDesktopRuntimeEnabled] = useState(false);
  const { user } = useUser();
  const displayName = user?.firstName || user?.fullName || 'Student';

  useEffect(() => {
    if (!hasDesktopBridge()) {
      return;
    }

    return runWhenBrowserIdle(() => {
      setDesktopRuntimeEnabled(true);
    });
  }, []);

  function handleNavIntent(href: string) {
    if (!user) {
      return;
    }

    router.prefetch(href);

    if (href === '/dashboard/assignments') {
      void queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.assignments(user.id),
        queryFn: () => getAssignmentsPageData(user.id),
        staleTime: 30_000,
      });
    } else if (href === '/dashboard/todos') {
      void queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.todos(user.id),
        queryFn: () => getTodosPageData(user.id),
        staleTime: 30_000,
      });
    } else if (href === '/dashboard/subjects') {
      void queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.subjects(user.id),
        queryFn: () => getSubjectsPageData(user.id),
        staleTime: 30_000,
      });
    } else if (href === '/dashboard/sprints') {
      void queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.sprints(user.id),
        queryFn: () => getSprintsPageData(user.id),
        staleTime: 30_000,
      });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/50 bg-background px-4 py-3 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          <span className="font-medium">CollegeCore</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background md:hidden">
          <div className="flex h-full flex-col pt-16">
            <nav className="flex-1 space-y-1 p-4">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    onFocus={() => handleNavIntent(item.href)}
                    onPointerEnter={() => handleNavIntent(item.href)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserButton />
                  <div>
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{semesterName}</p>
                  </div>
                </div>
                <Link href="/dashboard/settings" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={pathname === '/dashboard/settings' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-9 w-9"
                    aria-label="Open settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <aside className="hidden border-r border-border/50 bg-background md:fixed md:bottom-0 md:left-0 md:top-0 md:flex md:w-60 md:flex-col">
        <div className="flex h-16 items-center px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            <span className="text-lg font-medium tracking-tight">CollegeCore</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                onFocus={() => handleNavIntent(item.href)}
                onPointerEnter={() => handleNavIntent(item.href)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <UserButton />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{semesterName}</p>
              </div>
            </div>
            <Link href="/dashboard/settings">
              <Button
                variant={pathname === '/dashboard/settings' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                aria-label="Open settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      <main className="pb-20 md:ml-60 md:pb-0">
        <div className="p-4 md:p-10">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background md:hidden">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onFocus={() => handleNavIntent(item.href)}
                onPointerEnter={() => handleNavIntent(item.href)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {desktopRuntimeEnabled ? <DesktopRuntime /> : null}
    </div>
  );
}
