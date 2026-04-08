export const dashboardQueryKeys = {
  todos: (userId: string) => ['dashboard', 'todos', userId] as const,
  assignments: (userId: string) => ['dashboard', 'assignments', userId] as const,
  subjects: (userId: string) => ['dashboard', 'subjects', userId] as const,
  sprints: (userId: string) => ['dashboard', 'sprints', userId] as const,
};
