import { dashboardQueryKeys } from "@/lib/dashboard-query-keys";
import { getSprintsPageData } from "@/lib/dashboard-queries";
import type { QueryKey } from "@tanstack/react-query";

export const sprintsPrefetch = {
  href: "/dashboard/sprints",
  staleTime: 30_000,
  queryKey: (userId: string): QueryKey => dashboardQueryKeys.sprints(userId),
  queryFn: (userId: string) => getSprintsPageData(userId),
} as const;
