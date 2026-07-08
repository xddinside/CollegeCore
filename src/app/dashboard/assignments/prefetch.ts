import { dashboardQueryKeys } from "@/lib/dashboard-query-keys";
import { getAssignmentsPageData } from "@/lib/dashboard-queries";
import type { QueryKey } from "@tanstack/react-query";

export const assignmentsPrefetch = {
  href: "/dashboard/assignments",
  staleTime: 30_000,
  queryKey: (userId: string): QueryKey => dashboardQueryKeys.assignments(userId),
  queryFn: (userId: string) => getAssignmentsPageData(userId),
} as const;
