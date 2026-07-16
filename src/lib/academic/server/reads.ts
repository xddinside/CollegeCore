import 'server-only';

import { db } from '@/db';
import { assignments, examSprints, subjects, sprintSessions, todos } from '@/db/schema';
import { and, asc, desc, eq, gte, ne, sql } from 'drizzle-orm';
import { academicDateKey, type AcademicDateInput } from '@/lib/academic-day';
import { COMPLETED_ASSIGNMENT_STATUS } from '@/lib/assignment-lifecycle';
import { coerceNumber } from './validation';

export async function readSemesterSubjects(semesterId: number) {
  return db
    .select({ id: subjects.id, name: subjects.name, color: subjects.color })
    .from(subjects)
    .where(eq(subjects.semesterId, semesterId));
}

export async function readAllAssignments(semesterId: number) {
  return db
    .select({
      id: assignments.id,
      title: assignments.title,
      description: assignments.description,
      dueDate: assignments.dueDate,
      status: assignments.status,
      subjectName: subjects.name,
      subjectColor: subjects.color,
      subjectId: subjects.id,
    })
    .from(assignments)
    .innerJoin(subjects, eq(assignments.subjectId, subjects.id))
    .where(eq(subjects.semesterId, semesterId));
}

export async function readUpcomingAssignmentsPreview(semesterId: number, limit = 4) {
  return db
    .select({
      id: assignments.id,
      title: assignments.title,
      description: assignments.description,
      dueDate: assignments.dueDate,
      status: assignments.status,
      subjectName: subjects.name,
      subjectColor: subjects.color,
      subjectId: subjects.id,
    })
    .from(assignments)
    .innerJoin(subjects, eq(assignments.subjectId, subjects.id))
    .where(and(eq(subjects.semesterId, semesterId), ne(assignments.status, COMPLETED_ASSIGNMENT_STATUS)))
    .orderBy(
      sql`case when ${assignments.dueDate} is null then 1 else 0 end`,
      asc(assignments.dueDate),
      desc(assignments.createdAt),
    )
    .limit(limit);
}

export async function readActiveSprintsPreview(semesterId: number, today: AcademicDateInput, limit = 2) {
  return db
    .select({ id: examSprints.id, name: examSprints.name, startDate: examSprints.startDate, endDate: examSprints.endDate })
    .from(examSprints)
    .where(and(eq(examSprints.semesterId, semesterId), gte(examSprints.endDate, academicDateKey(today))))
    .orderBy(asc(examSprints.startDate), asc(examSprints.endDate))
    .limit(limit);
}

export async function readRecentTodosPreview(semesterId: number, limit = 5) {
  return db
    .select({
      id: todos.id,
      title: todos.title,
      dueDate: todos.dueDate,
      isCompleted: todos.isCompleted,
      subjectId: todos.subjectId,
      subjectName: subjects.name,
      subjectColor: subjects.color,
    })
    .from(todos)
    .leftJoin(subjects, eq(todos.subjectId, subjects.id))
    .where(eq(todos.semesterId, semesterId))
    .orderBy(
      asc(todos.isCompleted),
      sql`case when ${todos.dueDate} is null then 1 else 0 end`,
      asc(todos.dueDate),
      desc(todos.createdAt),
    )
    .limit(limit);
}

export async function readTodos(semesterId: number) {
  return db
    .select({
      id: todos.id,
      title: todos.title,
      dueDate: todos.dueDate,
      isCompleted: todos.isCompleted,
      subjectId: todos.subjectId,
      subjectName: subjects.name,
      subjectColor: subjects.color,
    })
    .from(todos)
    .leftJoin(subjects, eq(todos.subjectId, subjects.id))
    .where(eq(todos.semesterId, semesterId));
}

export async function readExamSprints(semesterId: number) {
  return db
    .select({ id: examSprints.id, name: examSprints.name, startDate: examSprints.startDate, endDate: examSprints.endDate })
    .from(examSprints)
    .where(eq(examSprints.semesterId, semesterId));
}

export async function readSprintSessions(sprintId: number) {
  return db
    .select({
      id: sprintSessions.id,
      date: sprintSessions.date,
      startTime: sprintSessions.startTime,
      endTime: sprintSessions.endTime,
      notes: sprintSessions.notes,
      subjectName: subjects.name,
      subjectColor: subjects.color,
    })
    .from(sprintSessions)
    .innerJoin(subjects, eq(sprintSessions.subjectId, subjects.id))
    .where(eq(sprintSessions.sprintId, sprintId));
}

export async function readAssignmentStats(semesterId: number) {
  const result = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when ${assignments.status} = ${COMPLETED_ASSIGNMENT_STATUS} then 1 else 0 end)`,
    })
    .from(assignments)
    .innerJoin(subjects, eq(assignments.subjectId, subjects.id))
    .where(eq(subjects.semesterId, semesterId))
    .limit(1);

  return {
    total: coerceNumber(result[0]?.total),
    completed: coerceNumber(result[0]?.completed),
  };
}

export async function readTodoStats(semesterId: number) {
  const result = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when ${todos.isCompleted} = true then 1 else 0 end)`,
    })
    .from(todos)
    .where(eq(todos.semesterId, semesterId))
    .limit(1);

  return {
    total: coerceNumber(result[0]?.total),
    completed: coerceNumber(result[0]?.completed),
  };
}

export async function countSubjects(semesterId: number) {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subjects)
    .where(eq(subjects.semesterId, semesterId))
    .limit(1);
  return coerceNumber(result?.count);
}

export async function countSprints(semesterId: number) {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(examSprints)
    .where(eq(examSprints.semesterId, semesterId))
    .limit(1);
  return coerceNumber(result?.count);
}
