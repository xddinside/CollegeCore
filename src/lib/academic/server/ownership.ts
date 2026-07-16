import 'server-only';

import { db } from '@/db';
import { assignments, examSprints, semesters, sprintSessions, subjects, todos } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { academicError } from './context';
import { assertResourceInCurrentSemester } from './resource-policy';

export { assertResourceInCurrentSemester } from './resource-policy';

export async function requireOwnedSubject(subjectId: number, userId: string, currentSemesterId: number) {
  const rows = await db
    .select({ id: subjects.id, semesterId: subjects.semesterId })
    .from(subjects)
    .innerJoin(semesters, eq(subjects.semesterId, semesters.id))
    .where(and(eq(subjects.id, subjectId), eq(semesters.userId, userId)))
    .limit(1);
  if (rows.length === 0) {
    academicError('RESOURCE_UNAVAILABLE', 'Subject not found');
  }
  assertResourceInCurrentSemester(rows[0].semesterId, currentSemesterId, 'Subject');
}

export async function requireOwnedAssignment(assignmentId: number, userId: string, currentSemesterId: number) {
  const rows = await db
    .select({ id: assignments.id, semesterId: subjects.semesterId })
    .from(assignments)
    .innerJoin(subjects, eq(assignments.subjectId, subjects.id))
    .innerJoin(semesters, eq(subjects.semesterId, semesters.id))
    .where(and(eq(assignments.id, assignmentId), eq(semesters.userId, userId)))
    .limit(1);
  if (rows.length === 0) {
    academicError('RESOURCE_UNAVAILABLE', 'Assignment not found');
  }
  assertResourceInCurrentSemester(rows[0].semesterId, currentSemesterId, 'Assignment');
}

export async function requireOwnedTodo(todoId: number, userId: string, currentSemesterId: number) {
  const rows = await db
    .select({ id: todos.id, semesterId: todos.semesterId })
    .from(todos)
    .innerJoin(semesters, eq(todos.semesterId, semesters.id))
    .where(and(eq(todos.id, todoId), eq(semesters.userId, userId)))
    .limit(1);
  if (rows.length === 0) {
    academicError('RESOURCE_UNAVAILABLE', 'Todo not found');
  }
  assertResourceInCurrentSemester(rows[0].semesterId, currentSemesterId, 'Todo');
}

export async function requireOwnedExamSprint(sprintId: number, userId: string, currentSemesterId: number) {
  const rows = await db
    .select({ id: examSprints.id, semesterId: examSprints.semesterId })
    .from(examSprints)
    .innerJoin(semesters, eq(examSprints.semesterId, semesters.id))
    .where(and(eq(examSprints.id, sprintId), eq(semesters.userId, userId)))
    .limit(1);
  if (rows.length === 0) {
    academicError('RESOURCE_UNAVAILABLE', 'Exam sprint not found');
  }
  assertResourceInCurrentSemester(rows[0].semesterId, currentSemesterId, 'Exam sprint');
}

export async function requireOwnedSprintSession(sessionId: number, userId: string, currentSemesterId: number) {
  const rows = await db
    .select({ id: sprintSessions.id, semesterId: examSprints.semesterId })
    .from(sprintSessions)
    .innerJoin(examSprints, eq(sprintSessions.sprintId, examSprints.id))
    .innerJoin(semesters, eq(examSprints.semesterId, semesters.id))
    .where(and(eq(sprintSessions.id, sessionId), eq(semesters.userId, userId)))
    .limit(1);
  if (rows.length === 0) {
    academicError('RESOURCE_UNAVAILABLE', 'Sprint session not found');
  }
  assertResourceInCurrentSemester(rows[0].semesterId, currentSemesterId, 'Sprint session');
}

export async function subjectBelongsToSemester(subjectId: number, semesterId: number): Promise<boolean> {
  const rows = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), eq(subjects.semesterId, semesterId)))
    .limit(1);
  return rows.length > 0;
}

export async function sprintBelongsToSemester(sprintId: number, semesterId: number): Promise<boolean> {
  const rows = await db
    .select({ id: examSprints.id })
    .from(examSprints)
    .where(and(eq(examSprints.id, sprintId), eq(examSprints.semesterId, semesterId)))
    .limit(1);
  return rows.length > 0;
}
