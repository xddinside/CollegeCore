/**
 * Runtime-neutral assignment lifecycle semantics and pure projections.
 *
 * Owns status transitions, status labels, completion/visibility rules, and the
 * focus-feed and reminder projections derived from assignments and sprints.
 * All calendar behavior is delegated to `src/lib/academic-day` so the lifecycle
 * module never reimplements day arithmetic.
 */

import {
  academicDayOffset,
  describeDueDate,
  formatAcademicDate,
  toAcademicDay,
  type DueStatus,
} from './academic-day';

// ------------------------------------------------------------------
// Status semantics
// ------------------------------------------------------------------

export const ASSIGNMENT_STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED'] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const COMPLETED_ASSIGNMENT_STATUS = 'COMPLETED' as const;

export function isAssignmentStatus(value: unknown): value is AssignmentStatus {
  return typeof value === 'string' && (ASSIGNMENT_STATUSES as readonly string[]).includes(value);
}

export function nextAssignmentStatus(status: AssignmentStatus): AssignmentStatus {
  if (status === 'TODO') return 'IN_PROGRESS';
  if (status === 'IN_PROGRESS') return COMPLETED_ASSIGNMENT_STATUS;
  return 'TODO';
}

export function assignmentStatusLabel(status: AssignmentStatus): string {
  switch (status) {
    case 'TODO':
      return 'Todo';
    case 'IN_PROGRESS':
      return 'In progress';
    case COMPLETED_ASSIGNMENT_STATUS:
      return 'Completed';
    default:
      return status;
  }
}

export function isAssignmentCompleted(status: AssignmentStatus): boolean {
  return status === COMPLETED_ASSIGNMENT_STATUS;
}

// ------------------------------------------------------------------
// Optimistic interaction projection
// ------------------------------------------------------------------

export type AssignmentView = {
  id: string | number;
  title: string;
  status: AssignmentStatus;
  dueDate: Date | string | null;
  description?: string | null;
  subjectId?: string | number | null;
  subjectName?: string | null;
};

export type AssignmentInteraction<T extends AssignmentView = AssignmentView> =
  | { kind: 'created'; assignment: T }
  | { kind: 'status-changed'; id: T['id']; status: T['status'] }
  | { kind: 'description-changed'; id: T['id']; description: string | null }
  | { kind: 'deleted'; id: T['id'] };

/**
 * Project a single assignment interaction onto an immutable assignment list.
 * Useful for deterministic optimistic updates before the server reconciles.
 */
export function projectAssignmentInteraction<T extends AssignmentView>(
  state: readonly T[],
  interaction: AssignmentInteraction<T>,
): T[] {
  switch (interaction.kind) {
    case 'created':
      return [interaction.assignment, ...state];
    case 'status-changed':
      return state.map((a) =>
        a.id === interaction.id ? { ...a, status: interaction.status } : a,
      );
    case 'description-changed':
      return state.map((a) =>
        a.id === interaction.id ? { ...a, description: interaction.description } : a,
      );
    case 'deleted':
      return state.filter((a) => a.id !== interaction.id);
  }
}

// ------------------------------------------------------------------
// Focus feed
// ------------------------------------------------------------------

export type FocusAssignmentItem = {
  kind: 'assignment';
  id: string;
  title: string;
  subjectName: string;
  subjectColor: string;
  dueDate: Date;
  dueStatus: DueStatus;
  href: string;
};

export type FocusSprintItem = {
  kind: 'sprint';
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  href: string;
};

export type FocusTodoItem = {
  kind: 'todo';
  id: string;
  title: string;
  subjectName: string | null;
  subjectColor: string | null;
  dueDate: Date;
  dueStatus: DueStatus;
  href: string;
};

export type FocusItem = FocusAssignmentItem | FocusSprintItem | FocusTodoItem;

export type GroupTone = {
  pill: string;
  dot: string;
};

export type FocusGroup = {
  label: string;
  items: FocusItem[];
  tone: GroupTone;
};

export type BuildFocusFeedInput = {
  assignments: Array<{
    id: string | number;
    title: string;
    subjectName: string;
    subjectColor: string;
    dueDate: Date | string | null;
  }>;
  todos: Array<{
    id: string | number;
    title: string;
    subjectName: string | null;
    subjectColor: string | null;
    dueDate: Date | string | null;
    isCompleted: boolean;
  }>;
  sprints: Array<{
    id: string | number;
    name: string;
    startDate: Date | string;
    endDate: Date | string;
  }>;
  today: Date;
};

const GROUP_SORT_INDEX: Record<string, number> = {
  Overdue: 0,
  Today: 1,
  Tomorrow: 2,
  Active: 4,
  Upcoming: 99,
};

function groupSortIndex(label: string): number {
  return GROUP_SORT_INDEX[label] ?? 4;
}

function bucketLabel(date: Date, today: Date): string {
  const offset = academicDayOffset(date, today);
  if (offset < 0) return 'Overdue';
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Tomorrow';
  if (offset < 7) return formatAcademicDate(date, 'long-weekday');
  return 'Later';
}

function groupTone(label: string): GroupTone {
  if (label === 'Overdue') {
    return {
      pill: 'bg-destructive/12 text-destructive ring-1 ring-inset ring-destructive/15',
      dot: 'bg-destructive',
    };
  }
  if (label === 'Today') {
    return {
      pill: 'bg-warning/12 text-warning ring-1 ring-inset ring-warning/15',
      dot: 'bg-warning',
    };
  }
  if (label === 'Tomorrow' || label === 'Upcoming') {
    return {
      pill: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
      dot: 'bg-muted-foreground/50',
    };
  }
  if (label === 'Active') {
    return {
      pill: 'bg-success/12 text-success ring-1 ring-inset ring-success/15',
      dot: 'bg-success',
    };
  }
  return {
    pill: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
    dot: 'bg-muted-foreground/50',
  };
}

/**
 * Build the dashboard focus feed from assignments, todos, and sprints.
 *
 * Excludes assignments without due dates, completed or undated todos, and
 * orders items chronologically with a global ten-item cap. Group labels and
 * tones match the existing dashboard presentation.
 */
export function buildFocusFeed({
  assignments,
  todos,
  sprints,
  today,
}: BuildFocusFeedInput): { items: FocusItem[]; groups: FocusGroup[] } {
  const reference = toAcademicDay(today);

  const items: FocusItem[] = [
    ...assignments
      .filter((assignment) => assignment.dueDate != null)
      .map((assignment) => {
        const dueDate = toAcademicDay(assignment.dueDate!);
        return {
          kind: 'assignment' as const,
          id: `assignment-${assignment.id}`,
          title: assignment.title,
          subjectName: assignment.subjectName,
          subjectColor: assignment.subjectColor,
          dueDate,
          dueStatus: describeDueDate(assignment.dueDate, reference).status,
          href: '/dashboard/assignments',
        };
      }),
    ...todos
      .filter((todo) => !todo.isCompleted && todo.dueDate)
      .map((todo) => {
        const dueDate = toAcademicDay(todo.dueDate!);
        return {
          kind: 'todo' as const,
          id: `todo-${todo.id}`,
          title: todo.title,
          subjectName: todo.subjectName,
          subjectColor: todo.subjectColor,
          dueDate,
          dueStatus: describeDueDate(todo.dueDate, reference).status,
          href: '/dashboard/todos',
        };
      }),
    ...sprints.map((sprint) => {
      const startDate = toAcademicDay(sprint.startDate);
      const endDate = toAcademicDay(sprint.endDate);
      return {
        kind: 'sprint' as const,
        id: `sprint-${sprint.id}`,
        title: sprint.name,
        startDate,
        endDate,
        isActive: academicDayOffset(startDate, reference) <= 0 && academicDayOffset(endDate, reference) >= 0,
        href: '/dashboard/sprints',
      };
    }),
  ]
    .sort((a, b) => {
      const aTime = a.kind === 'sprint' ? (a.isActive ? a.endDate.getTime() : a.startDate.getTime()) : a.dueDate.getTime();
      const bTime = b.kind === 'sprint' ? (b.isActive ? b.endDate.getTime() : b.startDate.getTime()) : b.dueDate.getTime();
      return aTime - bTime;
    })
    .slice(0, 10);

  const grouped = items.reduce<Record<string, FocusItem[]>>((acc, item) => {
    const label = item.kind === 'sprint'
      ? item.isActive ? 'Active' : 'Upcoming'
      : bucketLabel(item.dueDate, reference);
    (acc[label] ??= []).push(item);
    return acc;
  }, {});

  const groupOrder = Object.keys(grouped).sort(
    (a, b) => groupSortIndex(a) - groupSortIndex(b),
  );

  const groups: FocusGroup[] = groupOrder.map((label) => ({
    label,
    items: grouped[label] ?? [],
    tone: groupTone(label),
  }));

  return { items, groups };
}

// ------------------------------------------------------------------
// Desktop reminders
// ------------------------------------------------------------------

export type ReminderAssignmentInput = {
  id: string | number;
  title: string;
  subjectName: string;
  dueDate: Date | string | null;
  status: AssignmentStatus | string;
};

export type ReminderSprintInput = {
  id: string | number;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
};

export type ReminderCandidate = {
  id: string;
  title: string;
  body: string;
  route: '/dashboard/assignments' | '/dashboard/sprints';
};

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Derive desktop reminder candidates from a minimal lifecycle snapshot.
 *
 * Uses an explicit reference date so the renderer classifies reminders against
 * its own local academic day. Date keys are derived from local calendar fields,
 * avoiding UTC-shift bugs for negative-offset timezones.
 */
export function buildReminderCandidates(
  snapshot: { assignments: ReminderAssignmentInput[]; sprints: ReminderSprintInput[] },
  reference: Date,
): ReminderCandidate[] {
  const today = toAcademicDay(reference);

  const assignmentReminders = snapshot.assignments.flatMap((assignment) => {
    if (!isAssignmentStatus(assignment.status) || isAssignmentCompleted(assignment.status) || assignment.dueDate == null) {
      return [];
    }

    const dueDate = toAcademicDay(assignment.dueDate);
    const offset = academicDayOffset(dueDate, today);
    const key = localDateKey(dueDate);

    if (offset === 0) {
      return [
        {
          id: `assignment-today-${assignment.id}-${key}`,
          title: 'Assignment due today',
          body: `${assignment.title} for ${assignment.subjectName} is due today.`,
          route: '/dashboard/assignments' as const,
        },
      ];
    }

    if (offset === 1) {
      return [
        {
          id: `assignment-tomorrow-${assignment.id}-${key}`,
          title: 'Assignment due tomorrow',
          body: `${assignment.title} for ${assignment.subjectName} is due tomorrow.`,
          route: '/dashboard/assignments' as const,
        },
      ];
    }

    return [];
  });

  const sprintReminders = snapshot.sprints.flatMap((sprint) => {
    const startDate = toAcademicDay(sprint.startDate);
    const endDate = toAcademicDay(sprint.endDate);
    const startOffset = academicDayOffset(startDate, today);
    const endOffset = academicDayOffset(endDate, today);
    const startKey = localDateKey(startDate);
    const endKey = localDateKey(endDate);

    const reminders: ReminderCandidate[] = [];

    if (startOffset === 0) {
      reminders.push({
        id: `sprint-start-${sprint.id}-${startKey}`,
        title: 'Exam sprint starts today',
        body: `${sprint.name} begins today. Time to lock in your study plan.`,
        route: '/dashboard/sprints',
      });
    } else if (startOffset === 1) {
      reminders.push({
        id: `sprint-start-${sprint.id}-${startKey}`,
        title: 'Exam sprint starts tomorrow',
        body: `${sprint.name} starts tomorrow.`,
        route: '/dashboard/sprints',
      });
    }

    if (endOffset === 0) {
      reminders.push({
        id: `sprint-end-${sprint.id}-${endKey}`,
        title: 'Exam sprint ends today',
        body: `${sprint.name} wraps up today.`,
        route: '/dashboard/sprints',
      });
    }

    return reminders;
  });

  return [...assignmentReminders, ...sprintReminders];
}
