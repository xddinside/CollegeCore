/**
 * Runtime-neutral academic-day semantics.
 *
 * An "academic day" is the user's local civil day. All date-only strings
 * (`YYYY-MM-DD`) are parsed as local calendar dates, not interpreted through
 * the ECMAScript UTC-to-local conversion of `new Date('YYYY-MM-DD')`.
 * Calendar arithmetic uses explicit reference dates and DST-safe day ordinals.
 */

export type AcademicDateInput = Date | string;

export type DueStatus = 'overdue' | 'today' | 'this-week' | 'later' | null;

export class InvalidAcademicDateError extends Error {
  constructor(message = 'Invalid academic date') {
    super(message);
    this.name = 'InvalidAcademicDateError';
  }
}

const MS_PER_DAY = 86_400_000;

/**
 * Return a local-midnight Date representing the civil day of `value`.
 * Strict `YYYY-MM-DD` strings are parsed as local year/month/day.
 * Date inputs are cloned and normalized to local midnight.
 */
export function toAcademicDay(value: AcademicDateInput): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new InvalidAcademicDateError('Date input is invalid');
    }
    const day = new Date(value.getFullYear(), value.getMonth(), value.getDate());
    day.setHours(0, 0, 0, 0);
    return day;
  }

  if (typeof value !== 'string') {
    throw new InvalidAcademicDateError('Academic date input must be a Date or string');
  }

  const isoOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoOnly) {
    const year = parseInt(isoOnly[1], 10);
    const month = parseInt(isoOnly[2], 10) - 1;
    const day = parseInt(isoOnly[3], 10);
    const parsed = new Date(year, month, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month ||
      parsed.getDate() !== day
    ) {
      throw new InvalidAcademicDateError(`Invalid calendar date: ${value}`);
    }
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new InvalidAcademicDateError(`Unparseable date string: ${value}`);
  }

  const normalized = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  );
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Return the canonical civil-date representation used at persistence
 * boundaries. Unlike `Date#toISOString`, this never converts through UTC.
 */
export function academicDateKey(value: AcademicDateInput): string {
  const day = toAcademicDay(value);
  return `${day.getFullYear().toString().padStart(4, '0')}-${(day.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${day.getDate().toString().padStart(2, '0')}`;
}

function dayOrdinal(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY,
  );
}

/**
 * Deterministic whole-day offset from `reference` to `target`.
 * Uses UTC-based calendar ordinals derived from local calendar fields so
 * spring-forward/fall-back days still count as exactly one day.
 */
export function academicDayOffset(
  target: AcademicDateInput,
  reference: AcademicDateInput,
): number {
  return dayOrdinal(toAcademicDay(target)) - dayOrdinal(toAcademicDay(reference));
}

export type DueDescription = {
  label: string;
  fullLabel: string;
  status: DueStatus;
};

/**
 * Describe a due date relative to an explicit reference day.
 *
 * - `null` / `undefined` → "No due date"
 * - offset 0 → Today / today
 * - offset +1 → Tomorrow / this-week
 * - offset -1 → Yesterday / overdue
 * - offset -2..-7 → "Nd overdue" / overdue
 * - offset +2..+7 → "In Nd" / this-week
 * - otherwise → short date / later (future) or overdue (past)
 */
export function describeDueDate(
  dueDate: AcademicDateInput | null | undefined,
  reference: AcademicDateInput,
): DueDescription {
  if (dueDate == null) {
    return { label: 'No due date', status: null, fullLabel: 'No due date' };
  }

  const due = toAcademicDay(dueDate);
  const ref = toAcademicDay(reference);
  const offset = academicDayOffset(due, ref);
  const fullLabel = due.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: due.getFullYear() === ref.getFullYear() ? undefined : 'numeric',
  });

  if (offset === 0) {
    return { label: 'Today', status: 'today', fullLabel };
  }

  if (offset === 1) {
    return { label: 'Tomorrow', status: 'this-week', fullLabel };
  }

  if (offset === -1) {
    return { label: 'Yesterday', status: 'overdue', fullLabel };
  }

  if (offset < -1) {
    const days = -offset;
    return {
      label: days <= 7 ? `${days}d overdue` : due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      status: 'overdue',
      fullLabel,
    };
  }

  // offset > 1
  if (offset <= 7) {
    return { label: `In ${offset}d`, status: 'this-week', fullLabel };
  }

  return { label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), status: 'later', fullLabel };
}

export type AcademicDatePreset = 'short-weekday' | 'long-weekday' | 'short-date';

/**
 * Narrow domain formatting presets for academic dates.
 * Keeps arbitrary `Intl.DateTimeFormat` options out of the public surface.
 */
export function formatAcademicDate(
  value: AcademicDateInput,
  preset: AcademicDatePreset,
): string {
  const date = toAcademicDay(value);
  switch (preset) {
    case 'short-weekday':
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    case 'long-weekday':
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    case 'short-date':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
