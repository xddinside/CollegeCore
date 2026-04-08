export const dashboardQueryKeys = {
  todos: (userId: string) => ['dashboard', 'todos', userId] as const,
  assignments: (userId: string) => ['dashboard', 'assignments', userId] as const,
};
