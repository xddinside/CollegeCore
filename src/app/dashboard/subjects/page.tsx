'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, PencilLine, Plus, Search, Trash2 } from 'lucide-react';
import {
  createSubject,
  deleteSubject,
  updateSubject,
} from '@/lib/actions';
import {
  getSubjectsPageData,
  type SubjectsPageData,
} from '@/lib/dashboard-queries';
import { dashboardQueryKeys } from '@/lib/dashboard-query-keys';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type SaveSubjectInput = {
  id: number | null;
  name: string;
  color: string;
};

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

export default function SubjectsPage() {
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [search, setSearch] = useState('');

  const subjectsQueryKey = user ? dashboardQueryKeys.subjects(user.id) : ['dashboard', 'subjects', 'anonymous'];
  const subjectsQuery = useQuery({
    queryKey: subjectsQueryKey,
    queryFn: () => getSubjectsPageData(user!.id),
    enabled: isLoaded && !!user,
  });

  const saveSubjectMutation = useMutation({
    mutationFn: async (variables: SaveSubjectInput) => {
      if (!subjectsQuery.data) {
        throw new Error('Subjects data not loaded');
      }

      if (variables.id) {
        await updateSubject(variables.id, variables.name, variables.color);
        return null;
      }

      return createSubject(subjectsQuery.data.semesterId, variables.name, variables.color);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: subjectsQueryKey });

      const previousData = queryClient.getQueryData<SubjectsPageData>(subjectsQueryKey);
      const tempId = variables.id ? null : -Date.now();

      setNewName('');
      setNewColor(PRESET_COLORS[0]);
      setShowForm(false);
      setEditId(null);

      queryClient.setQueryData<SubjectsPageData>(subjectsQueryKey, (current) => {
        if (!current) {
          return current;
        }

        if (variables.id) {
          return {
            ...current,
            subjects: current.subjects.map((subject) =>
              subject.id === variables.id
                ? { ...subject, name: variables.name, color: variables.color }
                : subject
            ),
          };
        }

        return {
          ...current,
          subjects: [
            {
              id: tempId!,
              name: variables.name,
              color: variables.color,
              isPending: true,
            },
            ...current.subjects,
          ],
        };
      });

      return { previousData, tempId, variables };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(subjectsQueryKey, context.previousData);
      }

      if (context?.variables) {
        setNewName(context.variables.name);
        setNewColor(context.variables.color);
        setEditId(context.variables.id);
        setShowForm(true);
      }
    },
    onSuccess: (createdSubject, variables, context) => {
      if (!variables.id && createdSubject && context?.tempId) {
        queryClient.setQueryData<SubjectsPageData>(subjectsQueryKey, (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            subjects: current.subjects.map((subject) =>
              subject.id === context.tempId
                ? { ...subject, id: createdSubject.id, isPending: false }
                : subject
            ),
          };
        });
      }

      void queryClient.invalidateQueries({ queryKey: subjectsQueryKey });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id: number) => deleteSubject(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: subjectsQueryKey });

      const previousData = queryClient.getQueryData<SubjectsPageData>(subjectsQueryKey);

      queryClient.setQueryData<SubjectsPageData>(subjectsQueryKey, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          subjects: current.subjects.filter((subject) => subject.id !== id),
        };
      });

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(subjectsQueryKey, context.previousData);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: subjectsQueryKey });
    },
  });

  const subjects = subjectsQuery.data?.subjects ?? [];
  const assignments = subjectsQuery.data?.assignments ?? [];

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isLoaded || subjectsQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        Loading subjects...
      </div>
    );
  }

  if (subjectsQuery.isError) {
    return (
      <Alert variant="error">
        <AlertTitle>Unable to load subjects</AlertTitle>
        <AlertDescription>Refresh the page and try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="animate-fade-in space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Subjects</h1>
          <p className="mt-1 text-muted-foreground">{subjects.length} courses this semester</p>
        </div>
        <Button
          onClick={() => {
            setShowForm((open) => !open);
            setEditId(null);
            setNewName('');
            setNewColor(PRESET_COLORS[0]);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Close Form' : 'Add Subject'}
        </Button>
      </div>

      {showForm && (
        <div className="space-y-5 rounded-2xl border border-border bg-accent/40 p-5 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="subject-name">Subject name</Label>
            <Input
              id="subject-name"
              type="text"
              placeholder="Subject name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Color</Label>
              <p className="text-sm text-muted-foreground">Pick the accent used across assignments and sessions.</p>
            </div>
            <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-background/80 p-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    newColor === color ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Choose ${color}`}
                  aria-pressed={newColor === color}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() =>
                saveSubjectMutation.mutate({
                  id: editId,
                  name: newName.trim(),
                  color: newColor,
                })
              }
              disabled={!newName.trim()}
              loading={saveSubjectMutation.isPending}
            >
              {editId ? 'Update Subject' : 'Save Subject'}
            </Button>
          </div>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search subjects..."
          inputClassName="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {filteredSubjects.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>No subjects</EmptyTitle>
            <EmptyDescription>Add your first subject to get started.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              aria-label="Create first subject"
              onClick={() => {
                setSearch('');
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Subject
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((subject) => {
            const subjectAssignments = assignments.filter((assignment) => assignment.subjectId === subject.id);
            const completedAssignments = subjectAssignments.filter(
              (assignment) => assignment.status === 'COMPLETED'
            ).length;
            const progress =
              subjectAssignments.length > 0
                ? (completedAssignments / subjectAssignments.length) * 100
                : 0;

            return (
              <div key={subject.id} className="space-y-4 rounded-xl border border-border bg-accent/30 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: subject.color }}
                    >
                      {subject.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium">{subject.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {completedAssignments} of {subjectAssignments.length} done
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" aria-label={`Edit ${subject.name}`} onClick={() => {
                      setNewName(subject.name);
                      setNewColor(subject.color);
                      setEditId(subject.id);
                      setShowForm(true);
                    }} disabled={subject.isPending}>
                      <PencilLine className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Delete ${subject.name}`} onClick={() => deleteSubjectMutation.mutate(subject.id)} disabled={subject.isPending}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progress}%`, backgroundColor: subject.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
