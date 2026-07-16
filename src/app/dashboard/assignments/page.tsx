'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, FileText, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import { ASSIGNMENT_STATUSES, assignmentStatusLabel, nextAssignmentStatus } from '@/lib/assignment-lifecycle';
import { describeDueDate } from '@/lib/academic-day';
import { useAssignmentsDashboard } from '@/lib/dashboard/client-data';
import { cn } from '@/lib/utils';
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
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectItem } from '@/components/ui/select';
import { AssignmentDetailDrawer } from '@/components/dashboard/assignment-detail-drawer';
import { QuickCaptureModal } from '@/components/dashboard/quick-capture-modal';
import { AssignmentRowSkeleton } from '@/components/dashboard/row-skeletons';
import { StatusDot } from '@/components/dashboard/status-dot';
import { NewShortcutKbd } from '@/components/dashboard/new-shortcut-kbd';

export default function AssignmentsPage() {
  const {
    data,
    loading,
    error,
    createAssignment,
    creatingAssignment,
    updateAssignmentStatus,
    updatingAssignmentStatus,
    updateAssignment,
    deleteAssignment,
    deletingAssignment,
  } = useAssignmentsDashboard();
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [quickCaptureKey, setQuickCaptureKey] = useState(0);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const openQuickCapture = useCallback(() => {
    setQuickCaptureKey((key) => key + 1);
    setQuickCaptureOpen(true);
  }, []);

  const assignments = data?.assignments ?? [];
  const subjects = data?.subjects ?? [];

  const filteredAssignments = assignments.filter((assignment) => {
    if (subjectFilter !== 'all' && assignment.subjectId !== Number(subjectFilter)) return false;
    if (statusFilter !== 'all' && assignment.status !== statusFilter) return false;
    if (search && !`${assignment.title} ${assignment.subjectName} ${assignment.description ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const todoCount = filteredAssignments.filter((a) => a.status === 'TODO').length;
  const inProgressCount = filteredAssignments.filter((a) => a.status === 'IN_PROGRESS').length;
  const completedCount = filteredAssignments.filter((a) => a.status === 'COMPLETED').length;
  const assignmentToDelete = assignments.find((a) => a.id === deleteId);
  const detailAssignment = detailId != null ? assignments.find((a) => a.id === detailId) ?? null : null;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.matches('input, textarea, select, [contenteditable="true"]');
      if (!isTyping && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        openQuickCapture();
      }
    }
    function onOpenEvent() {
      openQuickCapture();
    }
    function onMountOpen() {
      if (window.sessionStorage.getItem('cc:open-quick-capture') === '1') {
        window.sessionStorage.removeItem('cc:open-quick-capture');
        openQuickCapture();
      }
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('cc:open-quick-capture-assignment', onOpenEvent);
    onMountOpen();
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('cc:open-quick-capture-assignment', onOpenEvent);
    };
  }, [openQuickCapture]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="h-6 w-32 animate-skeleton rounded-md" />
            <div className="mt-2 h-4 w-48 animate-skeleton rounded-md" />
          </div>
          <div className="h-8 w-28 animate-skeleton rounded-md" />
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <AssignmentRowSkeleton key={i} delay={i * 60} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">Unable to load assignments</p>
        <p className="mt-1 text-xs text-muted-foreground">Refresh the page and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assignments</h1>
          <p className="mt-1 text-sm text-muted-foreground/80">
            {todoCount} to do · {inProgressCount} in progress · {completedCount} completed
          </p>
        </div>
        <Button onClick={openQuickCapture} size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New
          <NewShortcutKbd />
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search assignments..." inputClassName="pl-8 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Select aria-label="Filter by subject" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="h-8 text-sm">
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
            ))}
          </Select>
          <Select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 text-sm">
            <SelectItem value="all">All statuses</SelectItem>
            {ASSIGNMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{assignmentStatusLabel(s)}</SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><FileText className="h-5 w-5 text-muted-foreground" /></EmptyMedia>
            <EmptyTitle>No assignments</EmptyTitle>
            <EmptyDescription>Create your first assignment to get started.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button aria-label="Create first assignment" onClick={openQuickCapture} size="sm">
              <Plus className="h-3.5 w-3.5" />
              New assignment
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {filteredAssignments.map((assignment, index) => {
            const isCompleted = assignment.status === 'COMPLETED';
            const due = describeDueDate(assignment.dueDate, new Date());
            const delay = Math.min(index, 8) * 30;
            return (
              <div
                key={assignment.id}
                className="row-enter group flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent/50 focus-visible:bg-accent focus-visible:outline-none"
                style={{ ['--row-enter-delay' as string]: `${delay}ms` }}
                onClick={() => setDetailId(assignment.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDetailId(assignment.id);
                  }
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateAssignmentStatus({ id: assignment.id, status: nextAssignmentStatus(assignment.status) });
                  }}
                  disabled={assignment.isPending || updatingAssignmentStatus}
                  className={cn(
                    'rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card'
                  )}
                  aria-label={`Change status for ${assignment.title}`}
                  title={`Status: ${assignmentStatusLabel(assignment.status)}`}
                >
                  <StatusDot status={assignment.status} interactive />
                </button>

                <div className="min-w-0 flex-1">
                  <span className={cn('block truncate text-sm', isCompleted ? 'text-muted-foreground line-through' : 'font-medium')}>
                    {assignment.title}
                  </span>
                  {assignment.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground/80">{assignment.description}</p>
                  )}
                </div>

                <div className="hidden shrink-0 items-center gap-4 text-xs sm:flex">
                  <div className="flex items-center gap-1.5 text-muted-foreground/80">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: assignment.subjectColor }} />
                    {assignment.subjectName}
                  </div>
                  <span
                    className={cn(
                      'tabular-nums',
                      due.status === 'overdue' && !isCompleted ? 'font-medium text-destructive' :
                        due.status === 'today' && !isCompleted ? 'font-medium text-warning' :
                          'text-muted-foreground'
                    )}
                    title={due.fullLabel}
                  >
                    {due.label}
                  </span>
                </div>

                <Popover>
                  <PopoverTrigger
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    render={
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Open actions for ${assignment.title}`}
                        className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                        disabled={assignment.isPending}
                      />
                    }
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </PopoverTrigger>
                  <PopoverPopup
                    align="end"
                    sideOffset={4}
                    className="w-48"
                    viewportClassName="p-1 py-1 [--viewport-inline-padding:--spacing(0.5)]"
                  >
                    <div className="px-2 pb-1 pt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Set status
                    </div>
                    {ASSIGNMENT_STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateAssignmentStatus({ id: assignment.id, status: s });
                        }}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-accent',
                          assignment.status === s && 'bg-accent/50 text-foreground'
                        )}
                      >
                        <StatusDot status={s} size="sm" />
                        {assignmentStatusLabel(s)}
                        {assignment.status === s && <Check className="ml-auto h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                    ))}
                    <div className="my-1 h-px bg-border" />
                    <button
                      type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(assignment.id);
                        }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </PopoverPopup>
                </Popover>
              </div>
            );
          })}
        </div>
      )}

      <AssignmentDetailDrawer
        assignment={detailAssignment}
        open={detailId != null}
        onOpenChange={(open) => !open && setDetailId(null)}
        onStatusChange={(status) => {
          if (detailAssignment) updateAssignmentStatus({ id: detailAssignment.id, status });
        }}
        onDescriptionChange={(description) => {
          if (detailAssignment) {
            updateAssignment({
              id: detailAssignment.id,
              title: detailAssignment.title,
              description,
              dueDate: detailAssignment.dueDate,
            });
          }
        }}
        onDelete={() => {
          if (detailAssignment) {
            setDeleteId(detailAssignment.id);
          }
        }}
      />

      <QuickCaptureModal
        key={quickCaptureKey}
        open={quickCaptureOpen}
        onOpenChange={setQuickCaptureOpen}
        subjects={subjects}
        onSave={async (input) => {
          if (input.subjectId == null) return;
          await createAssignment({
            title: input.title,
            description: '',
            dueDate: input.dueDate,
            subjectId: input.subjectId,
          });
          if (!input.createMore) {
            setQuickCaptureOpen(false);
          }
        }}
        saving={creatingAssignment}
      />

      <AlertDialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogPopup>
          <AlertDialogTitle>Delete assignment?</AlertDialogTitle>
          <AlertDialogDescription>{assignmentToDelete?.title} will be permanently removed.</AlertDialogDescription>
          <AlertDialogActions
            destructive
            confirmLabel="Delete"
            onConfirm={() =>
              deleteId != null &&
              deleteAssignment(deleteId).finally(() => {
                setDeleteId(null);
                if (detailId === deleteId) setDetailId(null);
              })
            }
            loading={deletingAssignment}
          />
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
