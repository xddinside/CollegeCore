'use server';

import { db } from '@/db';
import { users, semesters, subjects, assignments, todos, examSprints, sprintSessions, attachments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createUserClerk(clerkId: string, email: string) {
  await db.insert(users).values({ clerkId, email }).onDuplicateKeyUpdate({
    set: { email },
  });
}

export async function getUserSemesters(clerkId: string) {
  return db.select().from(semesters).where(eq(semesters.userId, clerkId));
}

export async function getCurrentSemester(clerkId: string) {
  const result = await db.select().from(semesters).where(
    and(eq(semesters.userId, clerkId), eq(semesters.isCurrent, true))
  ).limit(1);
  return result[0] || null;
}

export async function createSemester(clerkId: string, name: string) {
  await db.update(semesters).set({ isCurrent: false }).where(eq(semesters.userId, clerkId));
  const [{ id }] = await db.insert(semesters).values({
    userId: clerkId,
    name,
    isCurrent: true,
  }).$returningId();
  return { id, userId: clerkId, name, isCurrent: true, isArchived: false };
}

export async function setCurrentSemester(semesterId: number, clerkId: string) {
  await db.update(semesters).set({ isCurrent: false }).where(eq(semesters.userId, clerkId));
  await db.update(semesters).set({ isCurrent: true }).where(eq(semesters.id, semesterId));
  revalidatePath('/dashboard');
}

export async function archiveSemester(semesterId: number) {
  await db.update(semesters).set({ isArchived: true, isCurrent: false }).where(eq(semesters.id, semesterId));
  revalidatePath('/dashboard');
}

export async function getSemesterSubjects(semesterId: number) {
  return db.select().from(subjects).where(eq(subjects.semesterId, semesterId));
}

export async function createSubject(semesterId: number, name: string, color: string) {
  const [{ id }] = await db.insert(subjects).values({ semesterId, name, color }).$returningId();
  return { id, semesterId, name, color };
}

export async function updateSubject(id: number, name: string, color: string) {
  await db.update(subjects).set({ name, color }).where(eq(subjects.id, id));
  revalidatePath('/dashboard');
}

export async function deleteSubject(id: number) {
  await db.delete(subjects).where(eq(subjects.id, id));
  revalidatePath('/dashboard');
}

export async function getAssignmentsBySubject(subjectId: number) {
  return db.select().from(assignments).where(eq(assignments.subjectId, subjectId));
}

export async function getAllAssignments(semesterId: number) {
  return db.select({
    id: assignments.id,
    title: assignments.title,
    description: assignments.description,
    dueDate: assignments.dueDate,
    status: assignments.status,
    createdAt: assignments.createdAt,
    subjectName: subjects.name,
    subjectColor: subjects.color,
    subjectId: subjects.id,
  })
    .from(assignments)
    .innerJoin(subjects, eq(assignments.subjectId, subjects.id))
    .where(eq(subjects.semesterId, semesterId));
}

export async function createAssignment(
  subjectId: number,
  title: string,
  description: string | null,
  dueDate: Date | null
) {
  const [{ id }] = await db.insert(assignments).values({
    subjectId,
    title,
    description,
    dueDate,
    status: 'TODO' as const,
  }).$returningId();
  return { id, subjectId, title, description, dueDate, status: 'TODO' };
}

export async function updateAssignmentStatus(id: number, status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED') {
  await db.update(assignments).set({ status }).where(eq(assignments.id, id));
  revalidatePath('/dashboard');
}

export async function updateAssignment(
  id: number,
  title: string,
  description: string | null,
  dueDate: Date | null
) {
  await db.update(assignments).set({ title, description, dueDate }).where(eq(assignments.id, id));
  revalidatePath('/dashboard');
}

export async function deleteAssignment(id: number) {
  await db.delete(attachments).where(eq(attachments.assignmentId, id));
  await db.delete(assignments).where(eq(assignments.id, id));
  revalidatePath('/dashboard');
}

export async function addAttachment(assignmentId: number, url: string, filename: string) {
  await db.insert(attachments).values({ assignmentId, url, filename });
  revalidatePath('/dashboard');
}

export async function getAssignmentStats(semesterId: number) {
  const result = await db.select({
    total: assignments.id,
  })
    .from(assignments)
    .innerJoin(subjects, eq(assignments.subjectId, subjects.id))
    .where(eq(subjects.semesterId, semesterId));
  
  const completed = await db.select({
    total: assignments.id,
  })
    .from(assignments)
    .innerJoin(subjects, eq(assignments.subjectId, subjects.id))
    .where(and(eq(subjects.semesterId, semesterId), eq(assignments.status, 'COMPLETED')));
  
  return { total: result.length, completed: completed.length };
}

export async function getTodos(semesterId: number) {
  return db.select({
    id: todos.id,
    title: todos.title,
    dueDate: todos.dueDate,
    isCompleted: todos.isCompleted,
    createdAt: todos.createdAt,
    subjectId: todos.subjectId,
    subjectName: subjects.name,
    subjectColor: subjects.color,
  })
    .from(todos)
    .leftJoin(subjects, eq(todos.subjectId, subjects.id))
    .where(eq(todos.semesterId, semesterId));
}

export async function createTodo(
  semesterId: number,
  title: string,
  subjectId: number | null,
  dueDate: Date | null
) {
  await db.insert(todos).values({ semesterId, subjectId, title, dueDate });
  revalidatePath('/dashboard');
}

export async function toggleTodo(id: number) {
  const [todo] = await db.select().from(todos).where(eq(todos.id, id));
  await db.update(todos).set({ isCompleted: !todo.isCompleted }).where(eq(todos.id, id));
  revalidatePath('/dashboard');
}

export async function deleteTodo(id: number) {
  await db.delete(todos).where(eq(todos.id, id));
  revalidatePath('/dashboard');
}

export async function getExamSprints(semesterId: number) {
  return db.select().from(examSprints).where(eq(examSprints.semesterId, semesterId));
}

export async function createExamSprint(
  semesterId: number,
  name: string,
  startDate: Date,
  endDate: Date
) {
  const [{ id }] = await db.insert(examSprints).values({
    semesterId,
    name,
    startDate,
    endDate,
  }).$returningId();
  return { id, semesterId, name, startDate, endDate };
}

export async function getSprintSessions(sprintId: number) {
  return db.select({
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

export async function createSprintSession(
  sprintId: number,
  date: Date,
  startTime: string,
  endTime: string,
  subjectId: number,
  notes: string | null
) {
  await db.insert(sprintSessions).values({
    sprintId,
    date,
    startTime,
    endTime,
    subjectId,
    notes,
  });
  revalidatePath('/dashboard');
}

export async function deleteSprintSession(id: number) {
  await db.delete(sprintSessions).where(eq(sprintSessions.id, id));
  revalidatePath('/dashboard');
}

export async function deleteExamSprint(id: number) {
  await db.delete(sprintSessions).where(eq(sprintSessions.sprintId, id));
  await db.delete(examSprints).where(eq(examSprints.id, id));
  revalidatePath('/dashboard');
}
