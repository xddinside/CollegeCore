'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { ListTodo, Plus, Trash2 } from 'lucide-react';
import {
  createTodo,
  deleteTodo,
  getCurrentSemester,
  getSemesterSubjects,
  getTodos,
  toggleTodo,
} from '@/lib/actions';
import { Button } from '@/app/ui/1/components/button';
import { Input } from '@/app/ui/1/components/input';

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

export default function TodosPage() {
  const { user, isLoaded } = useUser();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;

    void (async () => {
      const semester = await getCurrentSemester(user.id);
      if (!semester) return;

      const [loadedSubjects, loadedTodos] = await Promise.all([
        getSemesterSubjects(semester.id),
        getTodos(semester.id),
      ]);

      setSubjects(loadedSubjects);
      setTodos(loadedTodos);
      setLoading(false);
    })();
  }, [isLoaded, user]);

  async function loadData() {
    if (!user) return;

    const semester = await getCurrentSemester(user.id);
    if (!semester) return;

    const [loadedSubjects, loadedTodos] = await Promise.all([
      getSemesterSubjects(semester.id),
      getTodos(semester.id),
    ]);

    setSubjects(loadedSubjects);
    setTodos(loadedTodos);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newTitle.trim() || !user) return;

    const semester = await getCurrentSemester(user.id);
    if (!semester) return;

    await createTodo(
      semester.id,
      newTitle.trim(),
      newSubjectId,
      newDueDate ? new Date(newDueDate) : null
    );

    setNewTitle('');
    setNewDueDate('');
    setNewSubjectId(null);
    await loadData();
  }

  async function handleToggle(id: number) {
    await toggleTodo(id);
    await loadData();
  }

  async function handleDelete(id: number) {
    await deleteTodo(id);
    await loadData();
  }

  const completedCount = todos.filter((todo) => todo.isCompleted).length;

  if (!isLoaded || loading) {
    return <div className="py-8 text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-3xl animate-fade-in space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-medium tracking-tight">Todos</h1>
        <p className="text-muted-foreground">
          {completedCount} of {todos.length} completed
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-accent/40 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Add a new todo..."
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && void handleCreate()}
            className="flex-1"
          />
          <Button onClick={handleCreate} disabled={!newTitle.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="date"
            value={newDueDate}
            onChange={(event) => setNewDueDate(event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <select
            value={newSubjectId ?? ''}
            onChange={(event) => setNewSubjectId(event.target.value ? Number(event.target.value) : null)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">No subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
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
                onClick={() => handleToggle(todo.id)}
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
                onClick={() => handleDelete(todo.id)}
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
