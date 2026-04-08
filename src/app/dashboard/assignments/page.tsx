'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Circle,
  FileText,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  createAssignment,
  deleteAssignment,
  getAllAssignments,
  getCurrentSemester,
  getSemesterSubjects,
  updateAssignmentStatus,
} from '@/lib/actions';
import { dashboardQueryKeys } from '@/lib/dashboard-query-keys';
import { getDueStatus } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'COMPLETED'] as const;

type AssignmentStatus = (typeof STATUS_OPTIONS)[number];

interface Assignment {
  id: number;
  title: string;
  description: string | null;
  dueDate: Date | string | null;
  status: AssignmentStatus;
  subjectName: string;
  subjectColor: string;
  subjectId: number;
}

interface Subject {
  id: number;
  name: string;
  color: string;
}

interface AssignmentsPageData {
  semesterId: number;
  subjects: Subject[];
  assignments: Assignment[];
}

function getStatusIcon(status: AssignmentStatus) {
  return status === 'COMPLETED' ? (
    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
  ) : (
    <Circle className="h-5 w-5 text-muted-foreground" />
  );
}

function formatDate(dateValue: Date | string | null) {
  if (!dateValue) {
    return 'No due date';
  }

  const status = getDueStatus(dateValue);
  const date = new Date(dateValue);

  if (status === 'overdue') return 'Overdue';
  if (status === 'today') return 'Today';

  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const current = new Date(date);
  current.setHours(0, 0, 0, 0);

  if (current.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function getAssignmentsPageData(clerkId: string): Promise<AssignmentsPageData> {
  const semester = await getCurrentSemester(clerkId);

  if (!semester) {
    throw new Error('No current semester found');
  }

  const [subjects, assignments] = await Promise.all([
    getSemesterSubjects(semester.id),
    getAllAssignments(semester.id),
  ]);

  return {
    semesterId: semester.id,
    subjects,
    assignments,
  };
}

export default function AssignmentsPage() {
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<number | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const assignmentsQueryKey = user
    ? dashboardQueryKeys.assignments(user.id)
    : ['dashboard', 'assignments', 'anonymous'];
  const assignmentsQuery = useQuery({
    queryKey: assignmentsQueryKey,
    queryFn: () => getAssignmentsPageData(user!.id),
    enabled: isLoaded && !!user,
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (!newTitle.trim() || !newSubjectId) {
        return;
      }

      await createAssignment(
        newSubjectId,
        newTitle.trim(),
        newDescription.trim() || null,
        newDueDate ? new Date(newDueDate) : null
      );
    },
    onSuccess: async () => {
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      setNewSubjectId(null);
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: assignmentsQueryKey });
    },
  });

  const updateAssignmentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AssignmentStatus }) =>
      updateAssignmentStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: assignmentsQueryKey });

      const previousData = queryClient.getQueryData<AssignmentsPageData>(assignmentsQueryKey);

      queryClient.setQueryData<AssignmentsPageData>(assignmentsQueryKey, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          assignments: current.assignments.map((assignment) =>
            assignment.id === id ? { ...assignment, status } : assignment
          ),
        };
      });

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(assignmentsQueryKey, context.previousData);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: assignmentsQueryKey });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: number) => deleteAssignment(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: assignmentsQueryKey });
    },
  });

  const assignments = assignmentsQuery.data?.assignments ?? [];
  const subjects = assignmentsQuery.data?.subjects ?? [];

  const filteredAssignments = assignments.filter((assignment) => {
    if (subjectFilter !== 'all' && assignment.subjectId !== Number(subjectFilter)) {
      return false;
    }

    if (statusFilter !== 'all' && assignment.status !== statusFilter) {
      return false;
    }

    if (
      search &&
      !`${assignment.title} ${assignment.subjectName} ${assignment.description ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const todoCount = filteredAssignments.filter((assignment) => assignment.status === 'TODO').length;
  const inProgressCount = filteredAssignments.filter((assignment) => assignment.status === 'IN_PROGRESS').length;
  const completedCount = filteredAssignments.filter((assignment) => assignment.status === 'COMPLETED').length;

  if (!isLoaded || assignmentsQuery.isLoading) {
    return <div className="py-8 text-sm text-muted-foreground">Loading...</div>;
  }

  if (assignmentsQuery.isError) {
    return <div className="py-8 text-sm text-destructive">Unable to load assignments.</div>;
  }

  return (
    <div className="animate-fade-in space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Assignments</h1>
          <p className="mt-1 text-muted-foreground">
            {todoCount} to do · {inProgressCount} in progress · {completedCount} completed
          </p>
        </div>
        <Button onClick={() => setShowForm((open) => !open)}>
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Close Form' : 'New Assignment'}
        </Button>
      </div>

      {showForm && (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-background/80">
          <div className="grid gap-0 md:grid-cols-12">
            <div className="space-y-2 p-4 md:col-span-7 md:border-b md:border-r md:border-border/70">
              <Label htmlFor="assignment-title" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Title
              </Label>
              <Input
                id="assignment-title"
                placeholder="Assignment title"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2 border-t border-border/70 p-4 md:col-span-5 md:border-t-0 md:border-b">
              <Label htmlFor="assignment-subject" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Subject
              </Label>
              <Select
                id="assignment-subject"
                value={newSubjectId?.toString() ?? ''}
                onChange={(event) => setNewSubjectId(event.target.value ? Number(event.target.value) : null)}
              >
                <SelectItem value="">Select subject</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div className="space-y-2 border-t border-border/70 p-4 md:col-span-12 md:border-t-0 md:border-b">
              <Label htmlFor="assignment-description" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Description
              </Label>
              <Textarea
                id="assignment-description"
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
                placeholder="Context, notes, or what needs to get done"
                rows={4}
              />
            </div>
            <div className="space-y-2 p-4 md:col-span-5 lg:col-span-4">
              <Label htmlFor="assignment-due-date" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Due date
              </Label>
              <DatePicker
                id="assignment-due-date"
                value={newDueDate}
                onChange={setNewDueDate}
                placeholder="Choose a deadline"
              />
            </div>
          </div>
          <div className="flex items-center justify-end border-t border-border/70 px-4 py-4">
            <Button
              onClick={() => createAssignmentMutation.mutate()}
              disabled={!newTitle.trim() || !newSubjectId || createAssignmentMutation.isPending}
            >
              Save Assignment
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            aria-label="Filter assignments by subject"
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
            className="min-w-40"
          >
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id.toString()}>
                {subject.name}
              </SelectItem>
            ))}
          </Select>
          <Select
            aria-label="Filter assignments by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="min-w-40"
          >
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace('_', ' ')}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="empty-state">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">No assignments</h3>
          <p className="mt-1">Create your first assignment to get started.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredAssignments.map((assignment) => {
            const formattedDate = formatDate(assignment.dueDate);

            return (
              <div
                key={assignment.id}
                className={`group -mx-4 flex items-start gap-4 rounded-lg px-4 py-4 transition-colors hover:bg-accent/50 ${
                  assignment.status === 'COMPLETED' ? 'opacity-50' : ''
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5"
                  onClick={() =>
                    updateAssignmentStatusMutation.mutate({
                      id: assignment.id,
                      status: assignment.status === 'COMPLETED' ? 'TODO' : 'COMPLETED',
                    })
                  }
                  aria-label={`Mark ${assignment.title} as ${assignment.status === 'COMPLETED' ? 'todo' : 'completed'}`}
                >
                  {getStatusIcon(assignment.status)}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={
                            assignment.status === 'COMPLETED'
                              ? 'font-medium text-muted-foreground line-through'
                              : 'font-medium'
                          }
                        >
                          {assignment.title}
                        </span>
                        {assignment.status === 'IN_PROGRESS' && <Badge variant="secondary">In Progress</Badge>}
                        {formattedDate === 'Overdue' && assignment.status !== 'COMPLETED' && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                        {formattedDate === 'Today' && assignment.status !== 'COMPLETED' && (
                          <Badge variant="warning">Today</Badge>
                        )}
                      </div>
                      {assignment.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {assignment.description}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span
                          className={
                            formattedDate === 'Overdue'
                              ? 'font-medium text-destructive'
                              : formattedDate === 'Today'
                                ? 'font-medium text-warning'
                                : ''
                          }
                        >
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: assignment.subjectColor }}
                        />
                        <span className="text-sm text-muted-foreground">{assignment.subjectName}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        aria-label={`Change status for ${assignment.title}`}
                        value={assignment.status}
                        onChange={(event) =>
                          updateAssignmentStatusMutation.mutate({
                            id: assignment.id,
                            status: event.target.value as AssignmentStatus,
                          })
                        }
                        className="h-9 min-w-36 px-3 text-xs"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => deleteAssignmentMutation.mutate(assignment.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
