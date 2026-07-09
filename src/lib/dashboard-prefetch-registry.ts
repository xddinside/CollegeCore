import { assignmentsPrefetch } from "@/app/dashboard/assignments/prefetch";
import { sprintsPrefetch } from "@/app/dashboard/sprints/prefetch";
import { subjectsPrefetch } from "@/app/dashboard/subjects/prefetch";
import { todosPrefetch } from "@/app/dashboard/todos/prefetch";
import type { QueryKey } from "@tanstack/react-query";

export interface DashboardPrefetchDescriptor {
  href: string;
  staleTime: number;
  queryKey: (userId: string) => QueryKey;
  queryFn: (userId: string) => Promise<unknown>;
}

export const dashboardPrefetchRegistry: Record<
  string,
  DashboardPrefetchDescriptor
> = {
  [assignmentsPrefetch.href]: assignmentsPrefetch,
  [todosPrefetch.href]: todosPrefetch,
  [subjectsPrefetch.href]: subjectsPrefetch,
  [sprintsPrefetch.href]: sprintsPrefetch,
};
