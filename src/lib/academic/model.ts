import type { AssignmentStatus } from '../assignment-lifecycle';

export type { AssignmentStatus } from '../assignment-lifecycle';

/**
 * Serializable domain/read-model types and commands for the academic workspace.
 *
 * This file contains no database types and no client-only optimistic flags.
 * It is the single source of truth for the shapes that cross the Server
 * Function boundary.
 */

export interface Subject {
  id: number;
  name: string;
  color: string;
  isPending?: boolean;
}

export interface Todo {
  id: number;
  title: string;
  dueDate: Date | string | null;
  isCompleted: boolean;
  subjectId: number | null;
  subjectName: string | null;
  subjectColor: string | null;
  isPending?: boolean;
}

export interface Assignment {
  id: number;
  title: string;
  description: string | null;
  dueDate: Date | string | null;
  status: AssignmentStatus;
  subjectName: string;
  subjectColor: string;
  subjectId: number;
  isPending?: boolean;
}

export interface SubjectAssignmentSummary {
  id: number;
  status: AssignmentStatus;
  subjectId: number;
}

export interface ExamSprint {
  id: number;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  isPending?: boolean;
}

export interface SprintSession {
  id: number;
  date: Date | string;
  startTime: string;
  endTime: string;
  notes: string | null;
  subjectName: string;
  subjectColor: string;
  isPending?: boolean;
}

export interface TodosPageData {
  semesterId: number;
  subjects: Subject[];
  todos: Todo[];
}

export interface AssignmentsPageData {
  semesterId: number;
  subjects: Subject[];
  assignments: Assignment[];
}

export interface SubjectsPageData {
  semesterId: number;
  subjects: Subject[];
  assignments: SubjectAssignmentSummary[];
}

export interface SprintsPageData {
  semesterId: number;
  sprints: ExamSprint[];
  sessions: Record<number, SprintSession[]>;
  subjects: Subject[];
}

export interface DashboardHomeData {
  semesterId: number;
  subjects: Subject[];
  subjectCount: number;
  assignmentStats: { total: number; completed: number };
  upcomingAssignments: Assignment[];
  activeSprints: ExamSprint[];
  recentTodos: Todo[];
}

export interface DashboardSettingsData {
  semesterId: number;
  assignmentStats: { total: number; completed: number };
  subjectCount: number;
  todoStats: { total: number; completed: number };
  sprintCount: number;
}

export interface ReminderData {
  semesterId: number;
  assignments: Assignment[];
  sprints: ExamSprint[];
}

export interface SemesterSummary {
  id: number;
  name: string;
}

export interface StartSemesterInput {
  name: string;
  subjects: Array<{ name: string; color: string }>;
}

export type AssignmentChange =
  | { kind: 'create'; subjectId: number; title: string; description: string | null; dueDate: Date | string | null }
  | { kind: 'revise'; assignmentId: number; title: string; description: string | null; dueDate: Date | string | null }
  | { kind: 'transition'; assignmentId: number; status: AssignmentStatus }
  | { kind: 'remove'; assignmentId: number };

export type SubjectChange =
  | { kind: 'create'; name: string; color: string }
  | { kind: 'revise'; subjectId: number; name: string; color: string }
  | { kind: 'remove'; subjectId: number };

export type TodoChange =
  | { kind: 'create'; title: string; subjectId: number | null; dueDate: Date | string | null }
  | { kind: 'set-completed'; todoId: number; isCompleted: boolean }
  | { kind: 'remove'; todoId: number };

export type ExamPlanChange =
  | { kind: 'create-sprint'; name: string; startDate: Date | string; endDate: Date | string }
  | {
      kind: 'create-session';
      sprintId: number;
      subjectId: number;
      date: Date | string;
      startTime: string;
      endTime: string;
      notes: string | null;
    }
  | { kind: 'remove-sprint'; sprintId: number }
  | { kind: 'remove-session'; sessionId: number };

export type AcademicErrorCode =
  | 'UNAUTHENTICATED'
  | 'RESOURCE_UNAVAILABLE'
  | 'INVALID_INPUT'
  | 'NO_CURRENT_SEMESTER'
  | 'CONFLICT'
  | 'PERSISTENCE_FAILED';

export class AcademicError extends Error {
  constructor(
    public readonly code: AcademicErrorCode,
    message?: string
  ) {
    super(message ?? code);
    this.name = 'AcademicError';
  }
}

/** Legacy error aliases kept for the temporary actions.ts compatibility surface. */
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
