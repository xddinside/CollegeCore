'use server';

import {
  readAssignmentsPageData,
  readCurrentSemesterSummary,
  readDashboardHomeData,
  readDashboardSettingsData,
  readReminderData,
  readSprintsPageData,
  readSubjectsPageData,
  readTodosPageData,
} from '@/lib/academic/server/workspace';
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

export async function getCurrentSemester(): Promise<SemesterSummary | null> {
  return readCurrentSemesterSummary();
}

export async function getDashboardHomeData(): Promise<DashboardHomeData> {
  return readDashboardHomeData();
}

export async function getDashboardSettingsData(): Promise<DashboardSettingsData> {
  return readDashboardSettingsData();
}

export async function getTodosPageData(): Promise<TodosPageData> {
  return readTodosPageData();
}

export async function getAssignmentsPageData(): Promise<AssignmentsPageData> {
  return readAssignmentsPageData();
}

export async function getSubjectsPageData(): Promise<SubjectsPageData> {
  return readSubjectsPageData();
}

export async function getSprintsPageData(): Promise<SprintsPageData> {
  return readSprintsPageData();
}

export async function getReminderData(): Promise<ReminderData> {
  return readReminderData();
}
