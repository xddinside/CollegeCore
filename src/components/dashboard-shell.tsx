"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  Menu,
  Search,
  Settings,
  X,
} from "lucide-react";
import { dashboardPrefetchRegistry } from "@/lib/dashboard-prefetch-registry";
import { hasDesktopBridge } from "@/lib/desktop";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { NoiseBackground } from "@/components/noise-background";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/assignments", label: "Assignments", icon: CheckSquare },
  { href: "/dashboard/todos", label: "Todos", icon: ListTodo },
  { href: "/dashboard/sprints", label: "Sprints", icon: Calendar },
  { href: "/dashboard/subjects", label: "Subjects", icon: BookOpen },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

type DashboardShellProps = {
  children: ReactNode;
  semesterName: string;
};

function runWhenBrowserIdle(callback: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    const idleId = window.requestIdleCallback(callback, { timeout: 1200 });
    return () => window.cancelIdleCallback(idleId);
  }

  const timeoutId = window.setTimeout(callback, 250);
  return () => window.clearTimeout(timeoutId);
}

function usePrefetchNavData() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUser();

  return function handleNavIntent(href: string) {
    if (!user) {
      return;
    }

    router.prefetch(href);

    const descriptor = dashboardPrefetchRegistry[href];
    if (!descriptor) {
      return;
    }

    void queryClient.prefetchQuery({
      queryKey: descriptor.queryKey(user.id),
      queryFn: () => descriptor.queryFn(user.id),
      staleTime: descriptor.staleTime,
    });
  };
}

function NavItems({
  pathname,
  onNavigate,
  intentHandlers,
  size = "default",
}: {
  pathname: string;
  onNavigate?: () => void;
  intentHandlers?: boolean;
  size?: "default" | "compact";
}) {
  const handleNavIntent = usePrefetchNavData();

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const commonProps = {
          "aria-current": isActive ? ("page" as const) : undefined,
          onClick: onNavigate,
          onFocus: intentHandlers
            ? () => handleNavIntent(item.href)
            : undefined,
          onPointerEnter: intentHandlers
            ? () => handleNavIntent(item.href)
            : undefined,
        };

        if (size === "compact") {
          return (
            <Link
              key={item.href}
              href={item.href}
              {...commonProps}
              className={cn(
                "flex min-w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            {...commonProps}
            className={cn(
              "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              isActive
                ? "bg-white/[0.07] text-foreground"
                : "text-sidebar-foreground/60 hover:bg-white/[0.07] hover:text-sidebar-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0 transition-colors" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function DashboardShell({
  children,
  semesterName,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [DesktopRuntimeComponent, setDesktopRuntimeComponent] =
    useState<ComponentType | null>(null);
  const { user } = useUser();
  const displayName = user?.firstName || user?.fullName || "Student";

  useEffect(() => {
    if (!hasDesktopBridge()) {
      return;
    }

    let active = true;
    const cancelIdle = runWhenBrowserIdle(() => {
      void import("@/components/desktop-runtime").then((mod) => {
        if (active) {
          setDesktopRuntimeComponent(() => mod.DesktopRuntime);
        }
      });
    });

    return () => {
      active = false;
      cancelIdle();
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-background md:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-3 focus:py-1.5 focus:text-foreground focus:ring-1 focus:ring-ring"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          <span className="font-medium">CollegeCore</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={
            mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background md:hidden">
          <div className="flex h-full flex-col pt-14">
            <nav className="flex-1 space-y-0.5 p-3">
              <NavItems
                pathname={pathname}
                onNavigate={() => setMobileMenuOpen(false)}
                intentHandlers={false}
              />
            </nav>
            <div className="border-t border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <UserButton />
                  <div>
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {semesterName}
                    </p>
                  </div>
                </div>
                <Button
                  render={
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setMobileMenuOpen(false)}
                    />
                  }
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Open settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <aside className="hidden bg-sidebar md:fixed md:bottom-0 md:left-0 md:top-0 md:z-40 md:flex md:w-60 md:flex-col">
        <div className="flex h-14 items-center justify-between px-3">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-white/[0.07]"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.06]">
              <GraduationCap className="h-3 w-3" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              CollegeCore
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground/60">
              {semesterName}
            </span>
          </Link>
        </div>
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="group flex w-full items-center justify-between gap-2 rounded-md border border-white/8 bg-white/[0.04] px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label="Open command palette"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              Search
            </span>
            <kbd className="flex items-center gap-0.5 rounded border border-white/8 bg-black/30 px-1 font-mono text-[10px] text-muted-foreground group-hover:text-foreground">
              ⌘K
            </kbd>
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-1">
          <NavItems pathname={pathname} intentHandlers />
        </nav>

        <div className="border-t border-white/8 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <UserButton />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {semesterName}
                </p>
              </div>
            </div>
            <Button
              render={<Link href="/dashboard/settings" />}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Open settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <main
        id="main-content"
        className="flex min-h-screen flex-1 flex-col bg-background pb-20 md:ml-60 md:pb-0"
        tabIndex={-1}
      >
        <div className="m-3 flex flex-1 flex-col md:m-4">
          <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-white/8 bg-card">
            <NoiseBackground />
            <div className="relative z-10 flex-1 px-5 py-6 md:px-10 md:py-8">
              {children}
            </div>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/8 bg-sidebar md:hidden">
        <div className="flex items-center gap-1 overflow-x-auto px-2 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavItems pathname={pathname} size="compact" intentHandlers={false} />
        </div>
      </nav>

      {DesktopRuntimeComponent ? <DesktopRuntimeComponent /> : null}

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onOpenQuickCapture={() => {
          window.dispatchEvent(new Event("cc:open-quick-capture-assignment"));
        }}
      />
    </div>
  );
}
