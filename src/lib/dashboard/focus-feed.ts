import { getDueStatus, type DueStatus } from '@/lib/utils';

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

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

export function bucketLabel(date: Date, today: Date) {
  const day = startOfDay(date).getTime();
  const t = today.getTime();
  const diffDays = Math.round((day - t) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return 'Later';
}

export function bucketOrder(label: string) {
  return ['Overdue', 'Today', 'Tomorrow'].includes(label)
    ? ['Overdue', 'Today', 'Tomorrow'].indexOf(label)
    : 4;
}

export function formatDayPill(date: Date, today: Date) {
  const day = startOfDay(date).getTime();
  const t = today.getTime();
  const diffDays = Math.round((day - t) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function groupTone(label: string): GroupTone {
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
  if (label === 'Tomorrow') {
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
  if (label === 'Upcoming') {
    return {
      pill: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
      dot: 'bg-muted-foreground/50',
    };
  }
  return {
    pill: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
    dot: 'bg-muted-foreground/50',
  };
}

export function datePillClasses(status: DueStatus): string {
  if (status === 'overdue') {
    return 'bg-destructive/12 text-destructive';
  }
  if (status === 'today') {
    return 'bg-warning/12 text-warning';
  }
  if (status === 'this-week') {
    return 'bg-muted text-muted-foreground';
  }
  return 'bg-muted text-muted-foreground';
}

export function buildFocusFeed({ assignments, todos, sprints, today }: BuildFocusFeedInput) {
  const items: FocusItem[] = [
    ...assignments
      .filter((assignment) => assignment.dueDate != null)
      .map((assignment) => ({
        kind: 'assignment' as const,
        id: `assignment-${assignment.id}`,
        title: assignment.title,
        subjectName: assignment.subjectName,
        subjectColor: assignment.subjectColor,
        dueDate: startOfDay(new Date(assignment.dueDate!)),
        dueStatus: getDueStatus(assignment.dueDate),
        href: '/dashboard/assignments',
      })),
    ...todos
      .filter((todo) => !todo.isCompleted && todo.dueDate)
      .map((todo) => ({
        kind: 'todo' as const,
        id: `todo-${todo.id}`,
        title: todo.title,
        subjectName: todo.subjectName,
        subjectColor: todo.subjectColor,
        dueDate: startOfDay(new Date(todo.dueDate!)),
        dueStatus: getDueStatus(todo.dueDate),
        href: '/dashboard/todos',
      })),
    ...sprints.map((sprint) => {
      const startDate = startOfDay(new Date(sprint.startDate));
      const endDate = startOfDay(new Date(sprint.endDate));
      return {
        kind: 'sprint' as const,
        id: `sprint-${sprint.id}`,
        title: sprint.name,
        startDate,
        endDate,
        isActive: startDate.getTime() <= today.getTime() && endDate.getTime() >= today.getTime(),
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
    let label: string;
    if (item.kind === 'sprint') {
      label = item.isActive ? 'Active' : 'Upcoming';
    } else {
      label = bucketLabel(item.dueDate, today);
    }
    (acc[label] ??= []).push(item);
    return acc;
  }, {});

  const groupOrder = Object.keys(grouped).sort((a, b) => {
    const orderOf = (label: string) => {
      if (label === 'Active') return 4;
      if (label === 'Upcoming') return 99;
      return bucketOrder(label);
    };
    return orderOf(a) - orderOf(b);
  });

  const groups: FocusGroup[] = groupOrder.map((label) => ({
    label,
    items: grouped[label] ?? [],
    tone: groupTone(label),
  }));

  return { items, groups };
}
