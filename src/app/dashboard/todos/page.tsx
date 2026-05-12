'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListTodo, Plus, Trash2 } from 'lucide-react';
import {
  createTodo,
  deleteTodo,
  setTodoCompleted,
} from '@/lib/actions';
import { getTodosPageData, type TodosPageData } from '@/lib/dashboard-queries';
import { dashboardQueryKeys } from '@/lib/dashboard-query-keys';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

type CreateTodoInput = {
  title: string;
  dueDate: string;
  subjectId: number | null;
};

export default function TodosPage() {
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<number | null>(null);

  const todosQueryKey = user ? dashboardQueryKeys.todos(user.id) : ['dashboard', 'todos', 'anonymous'];
  const todosQuery = useQuery({
    queryKey: todosQueryKey,
    queryFn: () => getTodosPageData(user!.id),
    enabled: isLoaded && !!user,
  });

  const createTodoMutation = useMutation({
    mutationFn: async (variables: CreateTodoInput) => {
      if (!todosQuery.data) {
        throw new Error('Todos data not loaded');
      }

      return createTodo(
        todosQuery.data.semesterId,
        variables.title,
        variables.subjectId,
        variables.dueDate ? new Date(variables.dueDate) : null
      );
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: todosQueryKey });

      const previousData = queryClient.getQueryData<TodosPageData>(todosQueryKey);
      const tempId = -Date.now();
      const subject = previousData?.subjects.find((item) => item.id === variables.subjectId) ?? null;

      setNewTitle('');
      setNewDueDate('');
      setNewSubjectId(null);

      queryClient.setQueryData<TodosPageData>(todosQueryKey, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          todos: [
            {
              id: tempId,
              title: variables.title,
              dueDate: variables.dueDate || null,
              isCompleted: false,
              subjectId: variables.subjectId,
              subjectName: subject?.name ?? null,
              subjectColor: subject?.color ?? null,
              isPending: true,
            },
            ...current.todos,
          ],
        };
      });

      return { previousData, tempId, variables };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(todosQueryKey, context.previousData);
      }

      if (context?.variables) {
        setNewTitle(context.variables.title);
        setNewDueDate(context.variables.dueDate);
        setNewSubjectId(context.variables.subjectId);
      }
    },
    onSuccess: (createdTodo, _variables, context) => {
      queryClient.setQueryData<TodosPageData>(todosQueryKey, (current) => {
        if (!current || !context) {
          return current;
        }

        return {
          ...current,
          todos: current.todos.map((todo) =>
            todo.id === context.tempId
              ? {
                  ...todo,
                  id: createdTodo.id,
                  isPending: false,
                }
              : todo
          ),
        };
      });

      void queryClient.invalidateQueries({ queryKey: todosQueryKey });
    },
  });

  const toggleTodoMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: number; isCompleted: boolean }) =>
      setTodoCompleted(id, isCompleted),
    onMutate: async ({ id, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey: todosQueryKey });

      const previousData = queryClient.getQueryData<TodosPageData>(todosQueryKey);

      queryClient.setQueryData<TodosPageData>(todosQueryKey, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          todos: current.todos.map((todo) =>
            todo.id === id ? { ...todo, isCompleted } : todo
          ),
        };
      });

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(todosQueryKey, context.previousData);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: todosQueryKey });
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: (id: number) => deleteTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: todosQueryKey });

      const previousData = queryClient.getQueryData<TodosPageData>(todosQueryKey);

      queryClient.setQueryData<TodosPageData>(todosQueryKey, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          todos: current.todos.filter((todo) => todo.id !== id),
        };
      });

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(todosQueryKey, context.previousData);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: todosQueryKey });
    },
  });

  const todos = todosQuery.data?.todos ?? [];
  const subjects = todosQuery.data?.subjects ?? [];
  const completedCount = todos.filter((todo) => todo.isCompleted).length;

  if (!isLoaded || todosQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        Loading todos...
      </div>
    );
  }

  if (todosQuery.isError) {
    return (
      <Alert variant="error">
        <AlertTitle>Unable to load todos</AlertTitle>
        <AlertDescription>Refresh the page and try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-3xl animate-fade-in space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-medium tracking-tight">Todos</h1>
        <p className="text-muted-foreground">
          {completedCount} of {todos.length} completed
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-background/80">
        <div className="grid gap-0 md:grid-cols-12">
          <div className="space-y-2 p-4 md:col-span-7 md:border-r md:border-border/70">
            <Label htmlFor="todo-title" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Task
            </Label>
            <Input
              id="todo-title"
              type="text"
              placeholder="Add a new todo..."
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && newTitle.trim()) {
                  createTodoMutation.mutate({
                    title: newTitle.trim(),
                    dueDate: newDueDate,
                    subjectId: newSubjectId,
                  });
                }
              }}
              className="flex-1"
            />
          </div>
          <div className="space-y-2 border-t border-border/70 p-4 md:col-span-5 md:border-t-0">
            <Label htmlFor="todo-subject" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Subject
            </Label>
            <Select
              id="todo-subject"
              value={newSubjectId?.toString() ?? ''}
              onChange={(event) => setNewSubjectId(event.target.value ? Number(event.target.value) : null)}
            >
              <SelectItem value="">No subject</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.name}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="space-y-2 border-t border-border/70 p-4 md:col-span-4 md:border-t md:border-r md:border-border/70 lg:col-span-3">
            <Label htmlFor="todo-due-date" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Due date
            </Label>
            <DatePicker
              id="todo-due-date"
              value={newDueDate}
              onChange={setNewDueDate}
              placeholder="Add a target date"
            />
          </div>
          <div className="flex items-end justify-end border-t border-border/70 p-4 md:col-span-8 md:border-t lg:col-span-9">
            <Button
              onClick={() =>
                createTodoMutation.mutate({
                  title: newTitle.trim(),
                  dueDate: newDueDate,
                  subjectId: newSubjectId,
                })
              }
              disabled={!newTitle.trim()}
              loading={createTodoMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Todo
            </Button>
          </div>
        </div>
      </div>

      {todos.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListTodo className="h-6 w-6 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>No todos</EmptyTitle>
            <EmptyDescription>Add your first todo to get started.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              aria-label="Focus new todo field"
              onClick={() => document.getElementById('todo-title')?.focus()}
            >
              <Plus className="h-4 w-4" />
              Add Todo
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-1">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`group -mx-4 flex items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-accent/50 ${
                todo.isCompleted ? 'opacity-50' : ''
              }`}
            >
              <Checkbox
                checked={todo.isCompleted}
                onCheckedChange={(checked) =>
                  toggleTodoMutation.mutate({
                    id: todo.id,
                    isCompleted: checked === true,
                  })
                }
                disabled={todo.isPending}
                className="mt-0.5"
                aria-label={`Toggle ${todo.title}`}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {todo.subjectColor && (
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: todo.subjectColor }} />
                  )}
                  <span
                    className={
                      todo.isCompleted ? 'text-sm text-muted-foreground line-through' : 'text-sm'
                    }
                  >
                    {todo.title}
                  </span>
                </div>
                {(todo.subjectName || todo.dueDate) && (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {todo.subjectName && <span>{todo.subjectName}</span>}
                    {todo.subjectName && todo.dueDate && <span>·</span>}
                    {todo.dueDate && (
                      <span>
                        {new Date(todo.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => deleteTodoMutation.mutate(todo.id)}
                disabled={todo.isPending}
                className="text-muted-foreground opacity-100 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                aria-label={`Delete ${todo.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
