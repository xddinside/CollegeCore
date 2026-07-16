'use client';

import { useUser } from '@clerk/nextjs';
import { useCallback } from 'react';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import {
  getAssignmentsPageData,
  getSprintsPageData,
  getSubjectsPageData,
  getTodosPageData,
} from '@/lib/academic/server/read-actions';
import {
  changeAssignment,
  changeExamPlan,
  changeSubject,
  changeTodo,
} from '@/lib/academic/server/mutation-actions';
import {
  projectAssignmentInteraction,
  type AssignmentStatus,
} from '@/lib/assignment-lifecycle';
import { toAcademicDay } from '@/lib/academic-day';
import type {
  AssignmentsPageData,
  CreateAssignmentInput,
  CreateSessionInput,
  CreateSprintInput,
  CreateTodoInput,
  DashboardCreateInput,
  SaveSubjectInput,
  SprintsPageData,
  SubjectsPageData,
  TodosPageData,
  UpdateAssignmentInput,
} from '@/lib/dashboard/types';
import {
  applyOptimisticUpdate,
  createOptimisticMutationHandlers,
  rollbackOptimisticUpdate,
} from '@/lib/dashboard/optimistic-mutation';

export type DashboardArea = 'todos' | 'assignments' | 'subjects' | 'sprints';

const STALE_TIME = 30_000;
const AREAS: DashboardArea[] = ['todos', 'assignments', 'subjects', 'sprints'];

// ---------------------------------------------------------------------------
// Cache identity
// ---------------------------------------------------------------------------

function viewerKey(viewerId: string, area: DashboardArea) {
  return ['dashboard', area, viewerId] as const;
}

function todosOptions(viewerId: string) {
  return queryOptions({
    queryKey: viewerKey(viewerId, 'todos'),
    queryFn: getTodosPageData,
    staleTime: STALE_TIME,
  });
}

function assignmentsOptions(viewerId: string) {
  return queryOptions({
    queryKey: viewerKey(viewerId, 'assignments'),
    queryFn: getAssignmentsPageData,
    staleTime: STALE_TIME,
  });
}

function subjectsOptions(viewerId: string) {
  return queryOptions({
    queryKey: viewerKey(viewerId, 'subjects'),
    queryFn: getSubjectsPageData,
    staleTime: STALE_TIME,
  });
}

function sprintsOptions(viewerId: string) {
  return queryOptions({
    queryKey: viewerKey(viewerId, 'sprints'),
    queryFn: getSprintsPageData,
    staleTime: STALE_TIME,
  });
}

function invalidateArea(queryClient: QueryClient, viewerId: string, area: DashboardArea) {
  void queryClient.invalidateQueries({ queryKey: viewerKey(viewerId, area) });
}

function invalidateAllAreas(queryClient: QueryClient, viewerId: string) {
  for (const area of AREAS) {
    invalidateArea(queryClient, viewerId, area);
  }
}

type DashboardCreateKind = DashboardCreateInput['kind'];
type DashboardCreateOf<K extends DashboardCreateKind> = Extract<DashboardCreateInput, { kind: K }>;
type DashboardCreateOperation<K extends DashboardCreateKind> = {
  execute: (input: DashboardCreateOf<K>) => Promise<{ id: number }>;
  invalidates: readonly DashboardArea[] | 'all';
};

const DASHBOARD_CREATE_OPERATIONS = {
  assignment: {
    execute: (input: DashboardCreateOf<'assignment'>) =>
      changeAssignment({
        kind: 'create',
        subjectId: input.input.subjectId,
        title: input.input.title,
        description: input.input.description,
        dueDate: input.input.dueDate,
      }),
    invalidates: ['assignments', 'subjects'],
  },
  todo: {
    execute: (input: DashboardCreateOf<'todo'>) =>
      changeTodo({
        kind: 'create',
        title: input.input.title,
        subjectId: input.input.subjectId,
        dueDate: input.input.dueDate,
      }),
    invalidates: ['todos'],
  },
  sprint: {
    execute: (input: DashboardCreateOf<'sprint'>) =>
      changeExamPlan({
        kind: 'create-sprint',
        name: input.input.name,
        startDate: input.input.startDate,
        endDate: input.input.endDate,
      }),
    invalidates: ['sprints'],
  },
  subject: {
    execute: (input: DashboardCreateOf<'subject'>) =>
      changeSubject({
        kind: 'create',
        name: input.input.name,
        color: input.input.color,
      }),
    invalidates: 'all',
  },
} satisfies { [K in DashboardCreateKind]: DashboardCreateOperation<K> };

function invalidateAreasForCreate(
  queryClient: QueryClient,
  viewerId: string,
  kind: DashboardCreateInput['kind'],
) {
  const areas = DASHBOARD_CREATE_OPERATIONS[kind].invalidates;
  if (areas === 'all') {
    invalidateAllAreas(queryClient, viewerId);
    return;
  }
  for (const area of areas) {
    invalidateArea(queryClient, viewerId, area);
  }
}

function createDashboardItem<K extends DashboardCreateKind>(input: DashboardCreateOf<K>) {
  const operation = DASHBOARD_CREATE_OPERATIONS[input.kind] as DashboardCreateOperation<K>;
  return operation.execute(input);
}

// ---------------------------------------------------------------------------
// Temporary IDs
// ---------------------------------------------------------------------------

let nextTempId = 0;

function allocateTempId(): number {
  nextTempId -= 1;
  return nextTempId;
}

// ---------------------------------------------------------------------------
// Todos
// ---------------------------------------------------------------------------

export function useTodosDashboard() {
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();
  const viewerId = user?.id ?? 'anonymous';
  const key = todosOptions(viewerId).queryKey;

  const query = useQuery({
    ...todosOptions(viewerId),
    enabled: isLoaded && !!user,
  });

  const createTodoMutation = useMutation({
    mutationFn: (input: CreateTodoInput) =>
      changeTodo({
        kind: 'create',
        title: input.title,
        subjectId: input.subjectId,
        dueDate: input.dueDate,
      }),
    onSettled: () => invalidateArea(queryClient, viewerId, 'todos'),
  });

  const setTodoCompletedMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: number; isCompleted: boolean }) =>
      changeTodo({ kind: 'set-completed', todoId: id, isCompleted }),
    ...createOptimisticMutationHandlers<TodosPageData, { id: number; isCompleted: boolean }>({
      queryClient,
      queryKey: key,
      update: (current, { id, isCompleted }) => {
        if (!current) return current;
        return {
          ...current,
          todos: current.todos.map((todo) => (todo.id === id ? { ...todo, isCompleted } : todo)),
        };
      },
      invalidate: () => invalidateArea(queryClient, viewerId, 'todos'),
    }),
  });

  const deleteTodoMutation = useMutation({
    mutationFn: (id: number) => changeTodo({ kind: 'remove', todoId: id }),
    ...createOptimisticMutationHandlers<TodosPageData, number>({
      queryClient,
      queryKey: key,
      update: (current, id) => {
        if (!current) return current;
        return { ...current, todos: current.todos.filter((todo) => todo.id !== id) };
      },
      invalidate: () => invalidateArea(queryClient, viewerId, 'todos'),
    }),
  });

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    createTodo: createTodoMutation.mutateAsync,
    creatingTodo: createTodoMutation.isPending,
    setTodoCompleted: setTodoCompletedMutation.mutateAsync,
    settingTodoCompleted: setTodoCompletedMutation.isPending,
    deleteTodo: deleteTodoMutation.mutateAsync,
    deletingTodo: deleteTodoMutation.isPending,
  };
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

export function useAssignmentsDashboard() {
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();
  const viewerId = user?.id ?? 'anonymous';
  const assignmentsKey = assignmentsOptions(viewerId).queryKey;

  const query = useQuery({
    ...assignmentsOptions(viewerId),
    enabled: isLoaded && !!user,
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (input: CreateAssignmentInput) =>
      changeAssignment({
        kind: 'create',
        subjectId: input.subjectId,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
      }),
    onSettled: () => {
      invalidateArea(queryClient, viewerId, 'assignments');
      invalidateArea(queryClient, viewerId, 'subjects');
    },
  });

  const updateAssignmentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AssignmentStatus }) =>
      changeAssignment({ kind: 'transition', assignmentId: id, status }),
    ...createOptimisticMutationHandlers<AssignmentsPageData, { id: number; status: AssignmentStatus }>({
      queryClient,
      queryKey: assignmentsKey,
      update: (current, { id, status }) => {
        if (!current) return current;
        return {
          ...current,
          assignments: projectAssignmentInteraction<AssignmentsPageData['assignments'][number]>(current.assignments, {
            kind: 'status-changed',
            id,
            status,
          }),
        };
      },
      invalidate: () => {
        invalidateArea(queryClient, viewerId, 'assignments');
        invalidateArea(queryClient, viewerId, 'subjects');
      },
    }),
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: (input: UpdateAssignmentInput) =>
      changeAssignment({
        kind: 'revise',
        assignmentId: input.id,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
      }),
    ...createOptimisticMutationHandlers<AssignmentsPageData, UpdateAssignmentInput>({
      queryClient,
      queryKey: assignmentsKey,
      update: (current, input) => {
        if (!current) return current;
        const dueDate = input.dueDate ? toAcademicDay(input.dueDate) : null;
        return {
          ...current,
          assignments: projectAssignmentInteraction<AssignmentsPageData['assignments'][number]>(current.assignments, {
            kind: 'description-changed',
            id: input.id,
            description: input.description,
          }).map((assignment) =>
            assignment.id === input.id ? { ...assignment, title: input.title, dueDate } : assignment,
          ),
        };
      },
      invalidate: () => {
        invalidateArea(queryClient, viewerId, 'assignments');
        invalidateArea(queryClient, viewerId, 'subjects');
      },
    }),
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: number) => changeAssignment({ kind: 'remove', assignmentId: id }),
    ...createOptimisticMutationHandlers<AssignmentsPageData, number>({
      queryClient,
      queryKey: assignmentsKey,
      update: (current, id) => {
        if (!current) return current;
        return {
          ...current,
          assignments: projectAssignmentInteraction<AssignmentsPageData['assignments'][number]>(current.assignments, { kind: 'deleted', id }),
        };
      },
      invalidate: () => {
        invalidateArea(queryClient, viewerId, 'assignments');
        invalidateArea(queryClient, viewerId, 'subjects');
      },
    }),
  });

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    createAssignment: createAssignmentMutation.mutateAsync,
    creatingAssignment: createAssignmentMutation.isPending,
    updateAssignmentStatus: updateAssignmentStatusMutation.mutateAsync,
    updatingAssignmentStatus: updateAssignmentStatusMutation.isPending,
    updateAssignment: updateAssignmentMutation.mutateAsync,
    updatingAssignment: updateAssignmentMutation.isPending,
    deleteAssignment: deleteAssignmentMutation.mutateAsync,
    deletingAssignment: deleteAssignmentMutation.isPending,
  };
}

// ---------------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------------

export function useSubjectsDashboard() {
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();
  const viewerId = user?.id ?? 'anonymous';
  const subjectsKey = subjectsOptions(viewerId).queryKey;

  const query = useQuery({
    ...subjectsOptions(viewerId),
    enabled: isLoaded && !!user,
  });

  const saveSubjectMutation = useMutation({
    mutationFn: (input: SaveSubjectInput) => {
      if (input.id) {
        return changeSubject({
          kind: 'revise',
          subjectId: input.id,
          name: input.name,
          color: input.color,
        });
      }
      return changeSubject({ kind: 'create', name: input.name, color: input.color });
    },
    onMutate: async (input) => {
      const tempId = input.id ? null : allocateTempId();
      const { previousData } = await applyOptimisticUpdate<SubjectsPageData>(queryClient, subjectsKey, (current) => {
        if (!current) return current;
        if (input.id) {
          return {
            ...current,
            subjects: current.subjects.map((s) =>
              s.id === input.id ? { ...s, name: input.name, color: input.color } : s,
            ),
          };
        }
        return {
          ...current,
          subjects: [
            { id: tempId!, name: input.name, color: input.color, isPending: true },
            ...current.subjects,
          ],
        };
      });
      return { previousData, tempId, input };
    },
    onError: (_error, _variables, context) => {
      rollbackOptimisticUpdate(queryClient, subjectsKey, context);
    },
    onSuccess: (result, input, context) => {
      if (!input.id && context?.tempId) {
        queryClient.setQueryData<SubjectsPageData>(subjectsKey, (current) => {
          if (!current) return current;
          return {
            ...current,
            subjects: current.subjects.map((s) =>
              s.id === context.tempId ? { ...s, id: result.id, isPending: false } : s,
            ),
          };
        });
      }
      invalidateAllAreas(queryClient, viewerId);
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id: number) => changeSubject({ kind: 'remove', subjectId: id }),
    ...createOptimisticMutationHandlers<SubjectsPageData, number>({
      queryClient,
      queryKey: subjectsKey,
      update: (current, id) => {
        if (!current) return current;
        return { ...current, subjects: current.subjects.filter((subject) => subject.id !== id) };
      },
      invalidate: () => invalidateAllAreas(queryClient, viewerId),
    }),
  });

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    saveSubject: saveSubjectMutation.mutateAsync,
    savingSubject: saveSubjectMutation.isPending,
    deleteSubject: deleteSubjectMutation.mutateAsync,
    deletingSubject: deleteSubjectMutation.isPending,
  };
}

// ---------------------------------------------------------------------------
// Sprints
// ---------------------------------------------------------------------------

export function useSprintsDashboard() {
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();
  const viewerId = user?.id ?? 'anonymous';
  const sprintsKey = sprintsOptions(viewerId).queryKey;

  const query = useQuery({
    ...sprintsOptions(viewerId),
    enabled: isLoaded && !!user,
  });

  const createSprintMutation = useMutation({
    mutationFn: (input: CreateSprintInput) =>
      changeExamPlan({
        kind: 'create-sprint',
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
      }),
    onMutate: async (input) => {
      const tempId = allocateTempId();
      const { previousData } = await applyOptimisticUpdate<SprintsPageData>(queryClient, sprintsKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          sprints: [
            {
              id: tempId,
              name: input.name,
              startDate: input.startDate,
              endDate: input.endDate,
              isPending: true,
            },
            ...current.sprints,
          ],
          sessions: { ...current.sessions, [tempId]: [] },
        };
      });
      return { previousData, tempId, input };
    },
    onError: (_error, _variables, context) => {
      rollbackOptimisticUpdate(queryClient, sprintsKey, context);
    },
    onSuccess: (result, _input, context) => {
      queryClient.setQueryData<SprintsPageData>(sprintsKey, (current) => {
        if (!current || !context) return current;
        const { [context.tempId]: tempSessions = [], ...remainingSessions } = current.sessions;
        return {
          ...current,
          sprints: current.sprints.map((sprint) =>
            sprint.id === context.tempId ? { ...sprint, id: result.id, isPending: false } : sprint,
          ),
          sessions: { ...remainingSessions, [result.id]: tempSessions },
        };
      });
      invalidateArea(queryClient, viewerId, 'sprints');
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: (input: CreateSessionInput) =>
      changeExamPlan({
        kind: 'create-session',
        sprintId: input.sprintId,
        subjectId: input.subjectId,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        notes: input.notes,
      }),
    onMutate: async (input) => {
      const tempId = allocateTempId();
      let subject: SprintsPageData['subjects'][number] | undefined;
      const { previousData } = await applyOptimisticUpdate<SprintsPageData>(queryClient, sprintsKey, (current) => {
        subject = current?.subjects.find((item) => item.id === input.subjectId);
        if (!subject) return current;
        if (!current) return current;
        return {
          ...current,
          sessions: {
            ...current.sessions,
            [input.sprintId]: [
              {
                id: tempId,
                date: input.date,
                startTime: input.startTime,
                endTime: input.endTime,
                notes: input.notes,
                subjectName: subject.name,
                subjectColor: subject.color,
                isPending: true,
              },
              ...(current.sessions[input.sprintId] ?? []),
            ],
          },
        };
      });
      return { previousData, tempId: subject ? tempId : null, input };
    },
    onError: (_error, _variables, context) => {
      rollbackOptimisticUpdate(queryClient, sprintsKey, context);
    },
    onSuccess: (result, _input, context) => {
      if (!context?.tempId) return;
      queryClient.setQueryData<SprintsPageData>(sprintsKey, (current) => {
        if (!current || !context.tempId) return current;
        return {
          ...current,
          sessions: {
            ...current.sessions,
            [context.input.sprintId]: (current.sessions[context.input.sprintId] ?? []).map(
              (session) =>
                session.id === context.tempId ? { ...session, id: result.id, isPending: false } : session,
            ),
          },
        };
      });
      invalidateArea(queryClient, viewerId, 'sprints');
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id: number) => changeExamPlan({ kind: 'remove-session', sessionId: id }),
    ...createOptimisticMutationHandlers<SprintsPageData, number>({
      queryClient,
      queryKey: sprintsKey,
      update: (current, id) => {
        if (!current) return current;
        return {
          ...current,
          sessions: Object.fromEntries(
            Object.entries(current.sessions).map(([sprintId, sprintSessions]) => [
              Number(sprintId),
              sprintSessions.filter((session) => session.id !== id),
            ]),
          ),
        };
      },
      invalidate: () => invalidateArea(queryClient, viewerId, 'sprints'),
    }),
  });

  const deleteSprintMutation = useMutation({
    mutationFn: (id: number) => changeExamPlan({ kind: 'remove-sprint', sprintId: id }),
    ...createOptimisticMutationHandlers<SprintsPageData, number>({
      queryClient,
      queryKey: sprintsKey,
      update: (current, id) => {
        if (!current) return current;
        const remainingSessions = { ...current.sessions };
        delete remainingSessions[id];
        return {
          ...current,
          sprints: current.sprints.filter((sprint) => sprint.id !== id),
          sessions: remainingSessions,
        };
      },
      invalidate: () => invalidateArea(queryClient, viewerId, 'sprints'),
    }),
  });

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    createSprint: createSprintMutation.mutateAsync,
    creatingSprint: createSprintMutation.isPending,
    createSession: createSessionMutation.mutateAsync,
    creatingSession: createSessionMutation.isPending,
    deleteSession: deleteSessionMutation.mutateAsync,
    deletingSession: deleteSessionMutation.isPending,
    deleteSprint: deleteSprintMutation.mutateAsync,
    deletingSprint: deleteSprintMutation.isPending,
  };
}

// ---------------------------------------------------------------------------
// Navigation prefetch
// ---------------------------------------------------------------------------

export function useDashboardDataPrefetch() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const viewerId = user?.id ?? 'anonymous';

  const prefetch = useCallback(
    async (area: DashboardArea) => {
      switch (area) {
        case 'todos':
          await queryClient.prefetchQuery(todosOptions(viewerId));
          break;
        case 'assignments':
          await queryClient.prefetchQuery(assignmentsOptions(viewerId));
          break;
        case 'subjects':
          await queryClient.prefetchQuery(subjectsOptions(viewerId));
          break;
        case 'sprints':
          await queryClient.prefetchQuery(sprintsOptions(viewerId));
          break;
      }
    },
    [queryClient, viewerId],
  );

  return { prefetch };
}

// ---------------------------------------------------------------------------
// Desktop reminders
// ---------------------------------------------------------------------------

export function useDashboardReminderData() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const viewerId = user?.id ?? 'anonymous';

  const load = useCallback(async () => {
    const [assignments, sprints] = await Promise.all([
      queryClient.ensureQueryData(assignmentsOptions(viewerId)),
      queryClient.ensureQueryData(sprintsOptions(viewerId)),
    ]);
    return { assignments, sprints };
  }, [queryClient, viewerId]);

  return { load };
}

// ---------------------------------------------------------------------------
// Unified dashboard creation
// ---------------------------------------------------------------------------

export function useDashboardCreateItem() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const viewerId = user?.id ?? 'anonymous';

  const mutation = useMutation({
    mutationFn: (input: DashboardCreateInput) => createDashboardItem(input),
    onSuccess: (_data, input) => {
      invalidateAreasForCreate(queryClient, viewerId, input.kind);
    },
  });

  return { create: mutation.mutateAsync, creating: mutation.isPending };
}
