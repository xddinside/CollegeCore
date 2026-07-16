import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  academicDayOffset,
  academicDateKey,
  describeDueDate,
  formatAcademicDate,
  InvalidAcademicDateError,
  toAcademicDay,
} from './academic-day';

describe('toAcademicDay', () => {
  test('normalizes a Date input to local midnight without mutating the original', () => {
    const original = new Date(2024, 5, 15, 14, 30, 45, 123);
    const day = toAcademicDay(original);

    assert.equal(day.getHours(), 0);
    assert.equal(day.getMinutes(), 0);
    assert.equal(day.getSeconds(), 0);
    assert.equal(day.getMilliseconds(), 0);
    assert.equal(original.getHours(), 14);
    assert.equal(day.getFullYear(), 2024);
    assert.equal(day.getMonth(), 5);
    assert.equal(day.getDate(), 15);
  });

  test('parses strict YYYY-MM-DD strings as local calendar dates', () => {
    const day = toAcademicDay('2024-06-15');

    assert.equal(day.getFullYear(), 2024);
    assert.equal(day.getMonth(), 5);
    assert.equal(day.getDate(), 15);
    assert.equal(day.getHours(), 0);
  });

  test('parses non-ISO date strings and normalizes to local midnight', () => {
    const day = toAcademicDay('2024/06/15 18:00:00');

    assert.equal(day.getFullYear(), 2024);
    assert.equal(day.getMonth(), 5);
    assert.equal(day.getDate(), 15);
    assert.equal(day.getHours(), 0);
  });

  test('throws InvalidAcademicDateError for an invalid Date', () => {
    assert.throws(() => toAcademicDay(new Date('not a date')), InvalidAcademicDateError);
  });

  test('throws InvalidAcademicDateError for non-Date non-string inputs', () => {
    // Runtime coercion: the public function accepts Date | string at the type
    // layer, but consumers may pass arbitrary values. Verify each is rejected.
    const invalidInputs: unknown[] = [42, null, undefined, {}, []];
    for (const input of invalidInputs) {
      assert.throws(() => toAcademicDay(input as string), InvalidAcademicDateError);
    }
  });

  test('throws InvalidAcademicDateError for an invalid ISO calendar date', () => {
    assert.throws(() => toAcademicDay('2023-02-30'), InvalidAcademicDateError);
    assert.throws(() => toAcademicDay('2023-13-01'), InvalidAcademicDateError);
  });

  test('throws InvalidAcademicDateError for an unparseable date string', () => {
    assert.throws(() => toAcademicDay('hello world'), InvalidAcademicDateError);
  });
});

describe('academicDayOffset', () => {
  test('returns 0 for the same local civil day', () => {
    const ref = new Date(2024, 5, 15);
    const target = new Date(2024, 5, 15, 23, 59);
    assert.equal(academicDayOffset(target, ref), 0);
  });

  test('counts exactly one day across a spring-forward DST transition', () => {
    // America/New_York springs forward 2024-03-10; that day has 23 hours.
    const beforeDst = new Date(2024, 2, 9);
    const afterDst = new Date(2024, 2, 10);
    assert.equal(academicDayOffset(afterDst, beforeDst), 1);
  });

  test('counts exactly one day across a fall-back DST transition', () => {
    // America/New_York falls back 2024-11-03; that day has 25 hours.
    const beforeFallback = new Date(2024, 10, 3);
    const afterFallback = new Date(2024, 10, 4);
    assert.equal(academicDayOffset(afterFallback, beforeFallback), 1);
  });

  test('returns negative offsets for past days', () => {
    const ref = new Date(2024, 5, 15);
    const target = new Date(2024, 5, 10);
    assert.equal(academicDayOffset(target, ref), -5);
  });

  test('accepts ISO strings and Date inputs interchangeably', () => {
    assert.equal(academicDayOffset('2024-06-17', new Date(2024, 5, 15)), 2);
    assert.equal(academicDayOffset(new Date(2024, 5, 13), '2024-06-15'), -2);
  });
});

describe('academicDateKey', () => {
  test('keeps the local civil date stable for persistence', () => {
    const input = new Date(2024, 5, 15, 23, 30);
    assert.equal(academicDateKey(input), '2024-06-15');
    assert.equal(academicDateKey('2024-06-15'), '2024-06-15');
  });
});

describe('describeDueDate', () => {
  test('maps null/undefined to "No due date" with a null status', () => {
    assert.deepEqual(describeDueDate(null, '2024-06-15'), {
      label: 'No due date',
      status: null,
      fullLabel: 'No due date',
    });
    assert.deepEqual(describeDueDate(undefined, '2024-06-15'), {
      label: 'No due date',
      status: null,
      fullLabel: 'No due date',
    });
  });

  test('labels today, tomorrow, and yesterday', () => {
    assert.deepEqual(describeDueDate('2024-06-15', '2024-06-15'), {
      label: 'Today',
      status: 'today',
      fullLabel: fullLabel(2024, 5, 15),
    });
    assert.deepEqual(describeDueDate('2024-06-16', '2024-06-15'), {
      label: 'Tomorrow',
      status: 'this-week',
      fullLabel: fullLabel(2024, 5, 16),
    });
    assert.deepEqual(describeDueDate('2024-06-14', '2024-06-15'), {
      label: 'Yesterday',
      status: 'overdue',
      fullLabel: fullLabel(2024, 5, 14),
    });
  });

  test('labels 2..7 days in the future as "In Nd" / this-week', () => {
    for (let offset = 2; offset <= 7; offset++) {
      const due = `2024-06-${15 + offset}`;
      const result = describeDueDate(due, '2024-06-15');
      assert.equal(result.label, `In ${offset}d`);
      assert.equal(result.status, 'this-week');
    }
  });

  test('labels 2..7 days in the past as "Nd overdue" / overdue', () => {
    for (let offset = 2; offset <= 7; offset++) {
      const due = `2024-06-${15 - offset}`;
      const result = describeDueDate(due, '2024-06-15');
      assert.equal(result.label, `${offset}d overdue`);
      assert.equal(result.status, 'overdue');
    }
  });

  test('labels far-future dates with a short date and status later', () => {
    const result = describeDueDate('2024-08-30', '2024-06-15');
    assert.equal(result.status, 'later');
    assert.match(result.label, /Aug/);
  });

  test('labels far-past dates with a short date and status overdue', () => {
    const result = describeDueDate('2024-01-10', '2024-06-15');
    assert.equal(result.status, 'overdue');
    assert.match(result.label, /Jan/);
  });

  test('omits the year in fullLabel when due and reference share a year', () => {
    const result = describeDueDate('2024-06-20', '2024-06-15');
    assert.doesNotMatch(result.fullLabel, /2024/);
  });

  test('includes the year in fullLabel when due and reference differ', () => {
    const result = describeDueDate('2025-06-20', '2024-06-15');
    assert.match(result.fullLabel, /2025/);
  });
});

describe('formatAcademicDate', () => {
  const date = new Date(2024, 5, 15);

  test('short-weekday returns the abbreviated weekday', () => {
    assert.equal(formatAcademicDate(date, 'short-weekday'), 'Sat');
  });

  test('long-weekday returns the full weekday', () => {
    assert.equal(formatAcademicDate(date, 'long-weekday'), 'Saturday');
  });

  test('short-date returns month and day', () => {
    assert.equal(formatAcademicDate(date, 'short-date'), 'Jun 15');
  });
});

function fullLabel(year: number, month: number, day: number): string {
  return new Date(year, month, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
