import type { QueryClient, QueryKey } from '@tanstack/react-query';

export type OptimisticMutationContext<TData> = {
  previousData: TData | undefined;
};

type OptimisticMutationOptions<TData, TVariables> = {
  queryClient: QueryClient;
  queryKey: QueryKey;
  update: (current: TData | undefined, variables: TVariables) => TData | undefined;
  invalidate: () => void;
};

export async function applyOptimisticUpdate<TData>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  update: (current: TData | undefined) => TData | undefined,
): Promise<OptimisticMutationContext<TData>> {
  await queryClient.cancelQueries({ queryKey });
  const previousData = queryClient.getQueryData<TData>(queryKey);
  queryClient.setQueryData<TData>(queryKey, update);
  return { previousData };
}

export function rollbackOptimisticUpdate<TData>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  context: { previousData: TData | undefined } | undefined,
): void {
  if (context?.previousData !== undefined) {
    queryClient.setQueryData(queryKey, context.previousData);
  }
}

/**
 * Shared cancel/snapshot/update/rollback/invalidate behavior for dashboard
 * mutations. The mutation-specific code only describes how its read model
 * changes.
 */
export function createOptimisticMutationHandlers<TData, TVariables>({
  queryClient,
  queryKey,
  update,
  invalidate,
}: OptimisticMutationOptions<TData, TVariables>) {
  return {
    onMutate: async (variables: TVariables): Promise<OptimisticMutationContext<TData>> => {
      return applyOptimisticUpdate(queryClient, queryKey, (current) => update(current, variables));
    },
    onError: (
      _error: unknown,
      _variables: TVariables,
      context: OptimisticMutationContext<TData> | undefined,
    ) => {
      rollbackOptimisticUpdate(queryClient, queryKey, context);
    },
    onSettled: invalidate,
  };
}
