import { db } from '@/db';
import {
  assignments,
  examSprints,
  semesters,
  sprintSessions,
  subjects,
  todos,
} from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

async function rowExists(query: Promise<unknown[]>): Promise<boolean> {
  const rows = await query;
  return rows.length > 0;
}

export async function assertSubjectOwner(subjectId: number, userId: string) {
  const owns = await rowExists(
    db
      .select({ id: subjects.id })
      .from(subjects)
      .innerJoin(semesters, eq(subjects.semesterId, semesters.id))
      .where(and(eq(subjects.id, subjectId), eq(semesters.userId, userId)))
      .limit(1)
  );

  if (!owns) {
    throw new ForbiddenError('Subject does not belong to the current user');
  }
}

export async function assertAssignmentOwner(assignmentId: number, userId: string) {
  const owns = await rowExists(
    db
      .select({ id: assignments.id })
      .from(assignments)
      .innerJoin(subjects, eq(assignments.subjectId, subjects.id))
      .innerJoin(semesters, eq(subjects.semesterId, semesters.id))
      .where(and(eq(assignments.id, assignmentId), eq(semesters.userId, userId)))
      .limit(1)
  );

  if (!owns) {
    throw new ForbiddenError('Assignment does not belong to the current user');
  }
}

export async function assertTodoOwner(todoId: number, userId: string) {
  const owns = await rowExists(
    db
      .select({ id: todos.id })
      .from(todos)
      .innerJoin(semesters, eq(todos.semesterId, semesters.id))
      .where(and(eq(todos.id, todoId), eq(semesters.userId, userId)))
      .limit(1)
  );

  if (!owns) {
    throw new ForbiddenError('Todo does not belong to the current user');
  }
}

export async function assertExamSprintOwner(sprintId: number, userId: string) {
  const owns = await rowExists(
    db
      .select({ id: examSprints.id })
      .from(examSprints)
      .innerJoin(semesters, eq(examSprints.semesterId, semesters.id))
      .where(and(eq(examSprints.id, sprintId), eq(semesters.userId, userId)))
      .limit(1)
  );

  if (!owns) {
    throw new ForbiddenError('Exam sprint does not belong to the current user');
  }
}

export async function assertSprintSessionOwner(sessionId: number, userId: string) {
  const owns = await rowExists(
    db
      .select({ id: sprintSessions.id })
      .from(sprintSessions)
      .innerJoin(examSprints, eq(sprintSessions.sprintId, examSprints.id))
      .innerJoin(semesters, eq(examSprints.semesterId, semesters.id))
      .where(and(eq(sprintSessions.id, sessionId), eq(semesters.userId, userId)))
      .limit(1)
  );

  if (!owns) {
    throw new ForbiddenError('Sprint session does not belong to the current user');
  }
}
