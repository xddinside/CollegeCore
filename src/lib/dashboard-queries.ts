import {
  getAllAssignments,
  getCurrentSemester,
  getExamSprints,
  getSemesterSubjects,
  getSprintSessions,
  getTodos,
} from '@/lib/actions';

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
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  subjectName: string;
  subjectColor: string;
  subjectId: number;
  isPending?: boolean;
}

export interface SubjectAssignmentSummary {
  id: number;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
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

export async function getTodosPageData(clerkId: string): Promise<TodosPageData> {
  const semester = await getCurrentSemester(clerkId);

  if (!semester) {
    throw new Error('No current semester found');
  }

  const [subjects, todos] = await Promise.all([
    getSemesterSubjects(semester.id),
    getTodos(semester.id),
  ]);

  return {
    semesterId: semester.id,
    subjects,
    todos,
  };
}

export async function getAssignmentsPageData(clerkId: string): Promise<AssignmentsPageData> {
  const semester = await getCurrentSemester(clerkId);

  if (!semester) {
    throw new Error('No current semester found');
  }

  const [subjects, assignments] = await Promise.all([
    getSemesterSubjects(semester.id),
    getAllAssignments(semester.id),
  ]);

  return {
    semesterId: semester.id,
    subjects,
    assignments,
  };
}

export async function getSubjectsPageData(clerkId: string): Promise<SubjectsPageData> {
  const semester = await getCurrentSemester(clerkId);

  if (!semester) {
    throw new Error('No current semester found');
  }

  const [subjects, loadedAssignments] = await Promise.all([
    getSemesterSubjects(semester.id),
    getAllAssignments(semester.id),
  ]);

  return {
    semesterId: semester.id,
    subjects,
    assignments: loadedAssignments.map((assignment) => ({
      id: assignment.id,
      subjectId: assignment.subjectId,
      status: assignment.status,
    })),
  };
}

export async function getSprintsPageData(clerkId: string): Promise<SprintsPageData> {
  const semester = await getCurrentSemester(clerkId);

  if (!semester) {
    throw new Error('No current semester found');
  }

  const [subjects, sprints] = await Promise.all([
    getSemesterSubjects(semester.id),
    getExamSprints(semester.id),
  ]);
  const sessionEntries = await Promise.all(
    sprints.map(async (sprint) => [sprint.id, await getSprintSessions(sprint.id)] as const)
  );

  return {
    semesterId: semester.id,
    subjects,
    sprints,
    sessions: Object.fromEntries(sessionEntries),
  };
}
