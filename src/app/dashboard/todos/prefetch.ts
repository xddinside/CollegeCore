import { dashboardQueryKeys } from "@/lib/dashboard-query-keys";
import { getTodosPageData } from "@/lib/dashboard-queries";
import type { QueryKey } from "@tanstack/react-query";

export const todosPrefetch = {
  href: "/dashboard/todos",
  staleTime: 30_000,
  queryKey: (userId: string): QueryKey => dashboardQueryKeys.todos(userId),
  queryFn: (userId: string) => getTodosPageData(userId),
} as const;
