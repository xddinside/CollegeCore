'use server';

import {
  changeAssignment as changeAssignmentImpl,
  changeExamPlan as changeExamPlanImpl,
  changeSubject as changeSubjectImpl,
  changeTodo as changeTodoImpl,
  startSemester as startSemesterImpl,
} from '@/lib/academic/server/workspace';
import type {
  AssignmentChange,
  ExamPlanChange,
  StartSemesterInput,
  SubjectChange,
  TodoChange,
} from '@/lib/academic/model';

export async function startSemester(input: StartSemesterInput): Promise<{ id: number }> {
  return startSemesterImpl(input);
}

export async function changeAssignment(change: AssignmentChange): Promise<{ id: number }> {
  return changeAssignmentImpl(change);
}

export async function changeSubject(change: SubjectChange): Promise<{ id: number }> {
  return changeSubjectImpl(change);
}

export async function changeTodo(change: TodoChange): Promise<{ id: number }> {
  return changeTodoImpl(change);
}

export async function changeExamPlan(change: ExamPlanChange): Promise<{ id: number }> {
  return changeExamPlanImpl(change);
}
