import { dashboardQueryKeys } from "@/lib/dashboard-query-keys";
import { getSubjectsPageData } from "@/lib/dashboard-queries";
import type { QueryKey } from "@tanstack/react-query";

export const subjectsPrefetch = {
  href: "/dashboard/subjects",
  staleTime: 30_000,
  queryKey: (userId: string): QueryKey => dashboardQueryKeys.subjects(userId),
  queryFn: (userId: string) => getSubjectsPageData(userId),
} as const;
