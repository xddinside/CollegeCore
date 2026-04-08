'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { BookOpen, PencilLine, Plus, Search, Trash2 } from 'lucide-react';
import {
  createSubject,
  deleteSubject,
  getAllAssignments,
  getCurrentSemester,
  getSemesterSubjects,
  updateSubject,
} from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Subject {
  id: number;
  name: string;
  color: string;
}

interface Assignment {
  id: number;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  subjectId: number;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

export default function SubjectsPage() {
  const { user, isLoaded } = useUser();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;

    void (async () => {
      const semester = await getCurrentSemester(user.id);
      if (!semester) return;

      const [loadedSubjects, loadedAssignments] = await Promise.all([
        getSemesterSubjects(semester.id),
        getAllAssignments(semester.id),
      ]);

      setSubjects(loadedSubjects);
      setAssignments(
        loadedAssignments.map((assignment) => ({
          id: assignment.id,
          subjectId: assignment.subjectId,
          status: assignment.status,
        }))
      );
      setLoading(false);
    })();
  }, [isLoaded, user]);

  async function loadData() {
    if (!user) return;

    const semester = await getCurrentSemester(user.id);
    if (!semester) return;

    const [loadedSubjects, loadedAssignments] = await Promise.all([
      getSemesterSubjects(semester.id),
      getAllAssignments(semester.id),
    ]);

    setSubjects(loadedSubjects);
    setAssignments(
      loadedAssignments.map((assignment) => ({
        id: assignment.id,
        subjectId: assignment.subjectId,
        status: assignment.status,
      }))
    );
    setLoading(false);
  }

  async function handleSubmit() {
    if (!newName.trim() || !user) return;

    const semester = await getCurrentSemester(user.id);
    if (!semester) return;

    if (editId) {
      await updateSubject(editId, newName.trim(), newColor);
    } else {
      await createSubject(semester.id, newName.trim(), newColor);
    }

    setNewName('');
    setNewColor(PRESET_COLORS[0]);
    setShowForm(false);
    setEditId(null);
    await loadData();
  }

  function handleEdit(subject: Subject) {
    setNewName(subject.name);
    setNewColor(subject.color);
    setEditId(subject.id);
    setShowForm(true);
  }

  async function handleDelete(id: number) {
    await deleteSubject(id);
    await loadData();
  }

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isLoaded || loading) {
    return <div className="py-8 text-sm text-muted-foreground">Loading...</div>;
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
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={!newName.trim()}>
              {editId ? 'Update Subject' : 'Save Subject'}
            </Button>
          </div>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search subjects..."
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="empty-state">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">No subjects</h3>
          <p className="mt-1">Add your first subject to get started.</p>
        </div>
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
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(subject)}>
                      <PencilLine className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(subject.id)}>
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
