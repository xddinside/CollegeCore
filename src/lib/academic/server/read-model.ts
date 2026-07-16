import 'server-only';

import { db } from '@/db';
import { examSprints, subjects, sprintSessions } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { academicDateKey } from '@/lib/academic-day';
import type {
  AssignmentsPageData,
  DashboardHomeData,
  DashboardSettingsData,
  ReminderData,
  SemesterSummary,
  SprintsPageData,
  SubjectsPageData,
  TodosPageData,
} from '@/lib/academic/model';
import { requireCurrentSemester, readCurrentSemesterSummary } from './context';
import {
  countSprints,
  countSubjects,
  readActiveSprintsPreview,
  readAllAssignments,
  readAssignmentStats,
  readUpcomingAssignmentsPreview,
  readExamSprints,
  readRecentTodosPreview,
  readSemesterSubjects,
  readTodoStats,
  readTodos,
} from './reads';

export { readCurrentSemesterSummary };

export async function readDashboardHomeData(): Promise<DashboardHomeData> {
  const semester = await requireCurrentSemester();
  const semesterId = semester.id;
  const today = new Date();

  const [subjects, subjectCount, assignmentStats, upcomingAssignments, activeSprints, recentTodos] =
    await Promise.all([
      readSemesterSubjects(semesterId),
      countSubjects(semesterId),
      readAssignmentStats(semesterId),
      readUpcomingAssignmentsPreview(semesterId, 8),
      readActiveSprintsPreview(semesterId, academicDateKey(today), 4),
      readRecentTodosPreview(semesterId, 12),
    ]);

  return {
    semesterId,
    subjects,
    subjectCount,
    assignmentStats,
    upcomingAssignments,
    activeSprints,
    recentTodos,
  };
}

export async function readDashboardSettingsData(): Promise<DashboardSettingsData> {
  const semester = await requireCurrentSemester();
  const semesterId = semester.id;
  const [assignmentStats, subjectCount, todoStats, sprintCount] = await Promise.all([
    readAssignmentStats(semesterId),
    countSubjects(semesterId),
    readTodoStats(semesterId),
    countSprints(semesterId),
  ]);

  return { semesterId, assignmentStats, subjectCount, todoStats, sprintCount };
}

export async function readTodosPageData(): Promise<TodosPageData> {
  const semester = await requireCurrentSemester();
  const semesterId = semester.id;
  const [subjectList, todoRows] = await Promise.all([
    readSemesterSubjects(semesterId),
    readTodos(semesterId),
  ]);
  return { semesterId, subjects: subjectList, todos: todoRows };
}

export async function readAssignmentsPageData(): Promise<AssignmentsPageData> {
  const semester = await requireCurrentSemester();
  const semesterId = semester.id;
  const [subjectList, assignmentRows] = await Promise.all([
    readSemesterSubjects(semesterId),
    readAllAssignments(semesterId),
  ]);
  return { semesterId, subjects: subjectList, assignments: assignmentRows };
}

export async function readSubjectsPageData(): Promise<SubjectsPageData> {
  const semester = await requireCurrentSemester();
  const semesterId = semester.id;
  const [subjectList, assignmentRows] = await Promise.all([
    readSemesterSubjects(semesterId),
    readAllAssignments(semesterId),
  ]);
  return {
    semesterId,
    subjects: subjectList,
    assignments: assignmentRows.map((assignment) => ({
      id: assignment.id,
      status: assignment.status,
      subjectId: assignment.subjectId,
    })),
  };
}

export async function readSprintsPageData(): Promise<SprintsPageData> {
  const semester = await requireCurrentSemester();
  const semesterId = semester.id;
  const [subjectList, sprintRows] = await Promise.all([
    readSemesterSubjects(semesterId),
    readExamSprints(semesterId),
  ]);

  const sessionRows = await db
    .select({
      id: sprintSessions.id,
      sprintId: sprintSessions.sprintId,
      date: sprintSessions.date,
      startTime: sprintSessions.startTime,
      endTime: sprintSessions.endTime,
      notes: sprintSessions.notes,
      subjectName: subjects.name,
      subjectColor: subjects.color,
    })
    .from(sprintSessions)
    .innerJoin(examSprints, eq(sprintSessions.sprintId, examSprints.id))
    .innerJoin(subjects, eq(sprintSessions.subjectId, subjects.id))
    .where(eq(examSprints.semesterId, semesterId))
    .orderBy(asc(sprintSessions.date), asc(sprintSessions.startTime));

  const sessions: Record<number, typeof sessionRows> = {};
  for (const session of sessionRows) {
    (sessions[session.sprintId] ??= []).push(session);
  }

  return { semesterId, sprints: sprintRows, sessions, subjects: subjectList };
}

export async function readReminderData(): Promise<ReminderData> {
  const semester = await requireCurrentSemester();
  const semesterId = semester.id;
  const [assignmentRows, sprintRows] = await Promise.all([
    readAllAssignments(semesterId),
    readExamSprints(semesterId),
  ]);
  return { semesterId, assignments: assignmentRows, sprints: sprintRows };
}

export type { SemesterSummary };
