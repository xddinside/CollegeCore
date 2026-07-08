'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import { createSubject, deleteSubject, updateSubject } from '@/lib/actions';
import { getSubjectsPageData, type SubjectsPageData } from '@/lib/dashboard-queries';
import { dashboardQueryKeys } from '@/lib/dashboard-query-keys';
import { cn, getContrastColor } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogActions,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover';
import { NewShortcutKbd } from '@/components/dashboard/new-shortcut-kbd';
import { SubjectCardSkeleton } from '@/components/dashboard/row-skeletons';

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
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const subjectsQueryKey = user ? dashboardQueryKeys.subjects(user.id) : ['dashboard', 'subjects', 'anonymous'];
  const subjectsQuery = useQuery({
    queryKey: subjectsQueryKey,
    queryFn: () => getSubjectsPageData(user!.id),
    enabled: isLoaded && !!user,
  });

  const saveSubjectMutation = useMutation({
    mutationFn: async (variables: SaveSubjectInput) => {
      if (!subjectsQuery.data) throw new Error('Subjects data not loaded');
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
      setAttemptedSave(false);

      queryClient.setQueryData<SubjectsPageData>(subjectsQueryKey, (current) => {
        if (!current) return current;
        if (variables.id) {
          return { ...current, subjects: current.subjects.map((s) => (s.id === variables.id ? { ...s, name: variables.name, color: variables.color } : s)) };
        }
        return { ...current, subjects: [{ id: tempId!, name: variables.name, color: variables.color, isPending: true }, ...current.subjects] };
      });
      return { previousData, tempId, variables };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) queryClient.setQueryData(subjectsQueryKey, context.previousData);
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
          if (!current) return current;
          return { ...current, subjects: current.subjects.map((s) => (s.id === context.tempId ? { ...s, id: createdSubject.id, isPending: false } : s)) };
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
        if (!current) return current;
        return { ...current, subjects: current.subjects.filter((s) => s.id !== id) };
      });
      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) queryClient.setQueryData(subjectsQueryKey, context.previousData);
    },
    onSettled: () => {
      setDeleteId(null);
      void queryClient.invalidateQueries({ queryKey: subjectsQueryKey });
    },
  });

  const subjects = subjectsQuery.data?.subjects ?? [];
  const assignments = subjectsQuery.data?.assignments ?? [];
  const filteredSubjects = subjects.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  const subjectToDelete = subjects.find((s) => s.id === deleteId);

  function handleSave() {
    setAttemptedSave(true);
    if (!newName.trim()) return;
    saveSubjectMutation.mutate({ id: editId, name: newName.trim(), color: newColor });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.matches('input, textarea, select, [contenteditable="true"]');
      if (!isTyping && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setShowForm(true);
        setEditId(null);
        setNewName('');
        setNewColor(PRESET_COLORS[0]);
        setAttemptedSave(false);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!isLoaded || subjectsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="h-6 w-24 animate-skeleton rounded-md" />
            <div className="mt-2 h-4 w-44 animate-skeleton rounded-md" />
          </div>
          <div className="h-8 w-28 animate-skeleton rounded-md" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SubjectCardSkeleton key={i} delay={i * 50} />
          ))}
        </div>
      </div>
    );
  }

  if (subjectsQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">Unable to load subjects</p>
        <p className="mt-1 text-xs text-muted-foreground">Refresh the page and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subjects</h1>
          <p className="mt-1 text-sm text-muted-foreground/80">{subjects.length} courses this semester</p>
        </div>
        <Button onClick={() => { setShowForm((open) => !open); setEditId(null); setNewName(''); setNewColor(PRESET_COLORS[0]); setAttemptedSave(false); }} size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {showForm ? 'Close' : 'Add subject'}
          {!showForm && <NewShortcutKbd />}
        </Button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject-name" className="text-xs text-muted-foreground">Subject name</Label>
            <Input id="subject-name" type="text" placeholder="Subject name" value={newName} onChange={(e) => setNewName(e.target.value)} aria-invalid={attemptedSave && !newName.trim()} />
            {attemptedSave && !newName.trim() && <p id="subject-name-error" className="text-xs text-destructive">Please enter a subject name.</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={cn(
                    'h-6 w-6 rounded-full transition-transform motion-safe:active:scale-95',
                    newColor === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Choose ${color}`}
                  aria-pressed={newColor === color}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saveSubjectMutation.isPending} size="sm">{editId ? 'Update' : 'Save'}</Button>
          </div>
        </div>
      )}

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" placeholder="Search subjects..." inputClassName="pl-8 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filteredSubjects.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><BookOpen className="h-5 w-5 text-muted-foreground" /></EmptyMedia>
            <EmptyTitle>No subjects</EmptyTitle>
            <EmptyDescription>Add your first subject to get started.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button aria-label="Create first subject" onClick={() => { setSearch(''); setShowForm(true); }} size="sm">
              <Plus className="h-3.5 w-3.5" />
              Add subject
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSubjects.map((subject, index) => {
            const subjectAssignments = assignments.filter((a) => a.subjectId === subject.id);
            const completedAssignments = subjectAssignments.filter((a) => a.status === 'COMPLETED').length;
            const progress = subjectAssignments.length > 0 ? (completedAssignments / subjectAssignments.length) * 100 : 0;
            const textColor = getContrastColor(subject.color);
            const delay = Math.min(index, 8) * 30;
            return (
              <div
                key={subject.id}
                className="row-enter group relative overflow-hidden rounded-lg border border-border p-3.5 transition-colors hover:border-border-hover hover:bg-accent/30"
                style={{ ['--row-enter-delay' as string]: `${delay}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => { setNewName(subject.name); setNewColor(subject.color); setEditId(subject.id); setShowForm(true); setAttemptedSave(false); }}
                    className="flex min-w-0 items-center gap-2.5 rounded-md text-left transition-colors hover:text-foreground/80"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-medium" style={{ backgroundColor: subject.color, color: textColor }}>
                      {subject.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium">{subject.name}</h3>
                      <p className="text-xs text-muted-foreground/80">{completedAssignments} of {subjectAssignments.length} done</p>
                    </div>
                  </button>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Open actions for ${subject.name}`}
                          className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                          disabled={subject.isPending}
                        />
                      }
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </PopoverTrigger>
                    <PopoverPopup
                      align="end"
                      sideOffset={4}
                      className="w-44"
                      viewportClassName="p-1 py-1 [--viewport-inline-padding:--spacing(0.5)]"
                    >
                      <button
                        type="button"
                        onClick={() => { setNewName(subject.name); setNewColor(subject.color); setEditId(subject.id); setShowForm(true); setAttemptedSave(false); }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-accent"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <div className="my-1 h-px bg-border" />
                      <button
                        type="button"
                        onClick={() => setDeleteId(subject.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </PopoverPopup>
                  </Popover>
                </div>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full origin-left transition-transform duration-200 ease-[var(--ease-out)] motion-reduce:transition-none"
                    style={{ transform: `scaleX(${progress / 100})`, backgroundColor: subject.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogPopup>
          <AlertDialogTitle>Delete subject?</AlertDialogTitle>
          <AlertDialogDescription>{subjectToDelete?.name} and all of its assignments will be removed.</AlertDialogDescription>
          <AlertDialogActions
            destructive
            confirmLabel="Delete"
            onConfirm={() => deleteId != null && deleteSubjectMutation.mutate(deleteId)}
            loading={deleteSubjectMutation.isPending}
          />
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
