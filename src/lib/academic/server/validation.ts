import { academicDateKey } from '@/lib/academic-day';
import { isAssignmentStatus, type AssignmentStatus } from '@/lib/assignment-lifecycle';
import { academicError } from './context';

export function normalizeText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeDate(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  try {
    return academicDateKey(value);
  } catch {
    return null;
  }
}

export function coerceNumber(value: unknown): number {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

export function validateName(value: unknown, field: string): string {
  const name = normalizeText(value);
  if (!name) {
    academicError('INVALID_INPUT', `${field} is required`);
  }
  return name;
}

export function validateColor(value: unknown): string {
  return normalizeText(value) ?? '#6366f1';
}

export function validateStatus(value: unknown): AssignmentStatus {
  if (isAssignmentStatus(value)) {
    return value;
  }
  academicError('INVALID_INPUT', 'Invalid assignment status');
}
