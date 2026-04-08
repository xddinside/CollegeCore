'use client';

import { useState } from 'react';
import { Button } from '../components/button';
import { Input } from '../components/input';
import {
  Plus,
  Trash2,
  ListTodo,
} from 'lucide-react';

// Mock todos data
const initialTodos = [
  { id: 1, title: 'Email professor about extension', completed: false },
  { id: 2, title: 'Buy textbooks for next week', completed: false },
  { id: 3, title: 'Review lecture notes', completed: true },
  { id: 4, title: 'Print assignment coversheet', completed: true },
  { id: 5, title: 'Organize study group meeting', completed: false },
];

export default function TodosPage() {
  const [todos, setTodos] = useState(initialTodos);
  const [newTodo, setNewTodo] = useState('');

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([
        ...todos,
        {
          id: Date.now(),
          title: newTodo,
          completed: false,
        },
      ]);
      setNewTodo('');
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className="space-y-10 animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-medium tracking-tight">Todos</h1>
        <p className="text-muted-foreground">
          {completedCount} of {todos.length} completed
        </p>
      </div>

      {/* Add Todo */}
      <div className="flex gap-3">
        <Input
          placeholder="Add a new todo..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          className="flex-1"
        />
        <Button onClick={addTodo}>
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Todos List */}
      <div className="space-y-1">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className={`group flex items-center gap-4 py-3 px-4 -mx-4 rounded-lg hover:bg-accent/50 transition-colors ${
              todo.completed ? 'opacity-50' : ''
            }`}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleTodo(todo.id)}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                todo.completed
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground/30 group-hover:border-primary'
              }`}
            >
              {todo.completed && (
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

            {/* Content */}
            <span
              className={`flex-1 text-sm ${
                todo.completed ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {todo.title}
            </span>

            {/* Delete */}
            <button
              onClick={() => deleteTodo(todo.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {todos.length === 0 && (
        <div className="empty-state">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent mb-4">
            <ListTodo className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No todos</h3>
          <p className="text-muted-foreground mt-1">Add your first todo to get started.</p>
        </div>
      )}
    </div>
  );
}
