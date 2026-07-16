/**
 * Shared dashboard DTOs and command inputs.
 *
 * DTOs are re-exported from the academic read-model so the Server Function
 * boundary and the dashboard UI share one shape. Command inputs are owned by
 * the dashboard client-data interface and deliberately omit page-only controls
 * such as `createMore`.
 */

export type {
  Assignment,
  AssignmentStatus,
  AssignmentsPageData,
  ExamSprint,
  SprintSession,
  Subject,
  SubjectAssignmentSummary,
  SubjectsPageData,
  SprintsPageData,
  Todo,
  TodosPageData,
} from '@/lib/academic/model';

export interface CreateTodoInput {
  title: string;
  dueDate: string | null;
  subjectId: number | null;
}

export interface CreateAssignmentInput {
  title: string;
  description: string | null;
  dueDate: string | null;
  subjectId: number;
}

export interface UpdateAssignmentInput {
  id: number;
  title: string;
  description: string | null;
  dueDate: Date | string | null;
}

export interface SaveSubjectInput {
  id: number | null;
  name: string;
  color: string;
}

export interface CreateSprintInput {
  name: string;
  startDate: string;
  endDate: string;
}

export interface CreateSessionInput {
  sprintId: number;
  date: string;
  startTime: string;
  endTime: string;
  subjectId: number;
  notes: string | null;
}

export type DashboardCreateInput =
  | { kind: 'assignment'; input: CreateAssignmentInput }
  | { kind: 'todo'; input: CreateTodoInput }
  | { kind: 'sprint'; input: CreateSprintInput }
  | { kind: 'subject'; input: SaveSubjectInput };
