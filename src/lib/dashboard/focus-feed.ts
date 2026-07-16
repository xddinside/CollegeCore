/**
 * Focus-feed presentation seam.
 *
 * The derivation logic lives in `src/lib/assignment-lifecycle` so that status,
 * calendar, and grouping semantics are owned in one place. This module keeps
 * the small presentation helpers still imported by the dashboard focus-feed
 * component while delegating all date math to `src/lib/academic-day`.
 */

import { academicDayOffset, formatAcademicDate, type DueStatus } from '@/lib/academic-day';

export {
  buildFocusFeed,
  type BuildFocusFeedInput,
  type FocusAssignmentItem,
  type FocusItem,
  type FocusGroup,
  type FocusSprintItem,
  type FocusTodoItem,
  type GroupTone,
} from '@/lib/assignment-lifecycle';

/**
 * Day pill text for a focus item relative to the current academic day.
 */
export function formatDayPill(date: Date, today: Date): string {
  const offset = academicDayOffset(date, today);
  if (offset < 0) return 'Overdue';
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Tomorrow';
  if (offset < 7) return formatAcademicDate(date, 'short-weekday');
  return formatAcademicDate(date, 'short-date');
}

/**
 * Tailwind classes for a date pill from its due status.
 */
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
