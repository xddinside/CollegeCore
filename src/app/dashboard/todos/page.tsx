'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListTodo, Plus, Trash2 } from 'lucide-react';
import {
  createTodo,
  deleteTodo,
  getCurrentSemester,
  getSemesterSubjects,
  getTodos,
  setTodoCompleted,
} from '@/lib/actions';
import { dashboardQueryKeys } from '@/lib/dashboard-query-keys';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';

interface Todo {
  id: number;
  title: string;
  dueDate: Date | string | null;
  isCompleted: boolean;
  subjectId: number | null;
  subjectName: string | null;
  subjectColor: string | null;
}

interface Subject {
  id: number;
  name: string;
  color: string;
}

interface TodosPageData {
  semesterId: number;
  subjects: Subject[];
  todos: Todo[];
}

async function getTodosPageData(clerkId: string): Promise<TodosPageData> {
  const semester = await getCurrentSemester(clerkId);

  if (!semester) {
    throw new Error('No current semester found');
  }

  const [subjects, todos] = await Promise.all([
    getSemesterSubjects(semester.id),
    getTodos(semester.id),
  ]);

  return {
    semesterId: semester.id,
    subjects,
    todos,
  };
}

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
    mutationFn: async () => {
      if (!todosQuery.data || !newTitle.trim()) {
        return;
      }

      await createTodo(
        todosQuery.data.semesterId,
        newTitle.trim(),
        newSubjectId,
        newDueDate ? new Date(newDueDate) : null
      );
    },
    onSuccess: async () => {
      setNewTitle('');
      setNewDueDate('');
      setNewSubjectId(null);
      await queryClient.invalidateQueries({ queryKey: todosQueryKey });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: todosQueryKey });
    },
  });

  const todos = todosQuery.data?.todos ?? [];
  const subjects = todosQuery.data?.subjects ?? [];
  const completedCount = todos.filter((todo) => todo.isCompleted).length;

  if (!isLoaded || todosQuery.isLoading) {
    return <div className="py-8 text-sm text-muted-foreground">Loading...</div>;
  }

  if (todosQuery.isError) {
    return <div className="py-8 text-sm text-destructive">Unable to load todos.</div>;
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
              placeholder="Add a new todo..."
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && newTitle.trim()) {
                  createTodoMutation.mutate();
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
            <Button onClick={() => createTodoMutation.mutate()} disabled={!newTitle.trim() || createTodoMutation.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Add Todo
            </Button>
          </div>
        </div>
      </div>

      {todos.length === 0 ? (
        <div className="empty-state">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <ListTodo className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">No todos</h3>
          <p className="mt-1">Add your first todo to get started.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`group -mx-4 flex items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-accent/50 ${
                todo.isCompleted ? 'opacity-50' : ''
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  toggleTodoMutation.mutate({
                    id: todo.id,
                    isCompleted: !todo.isCompleted,
                  })
                }
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                  todo.isCompleted
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/30 group-hover:border-primary'
                }`}
                aria-label={`Toggle ${todo.title}`}
              >
                {todo.isCompleted && (
                  <svg
                    className="h-2.5 w-2.5 text-primary-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

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

              <button
                type="button"
                onClick={() => deleteTodoMutation.mutate(todo.id)}
                className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                aria-label={`Delete ${todo.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
