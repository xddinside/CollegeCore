import 'server-only';

/**
 * Compatibility façade for the academic server surface.
 *
 * Domain intent lives in the semester, assignment, subject, todo, exam-plan,
 * and read-model modules. Keeping these exports stable lets Server Functions
 * and existing callers migrate independently without recreating auth,
 * persistence, or cache behavior at each call site.
 */

export {
  readCurrentSemesterSummary,
  readDashboardHomeData,
  readDashboardSettingsData,
  readTodosPageData,
  readAssignmentsPageData,
  readSubjectsPageData,
  readSprintsPageData,
  readReminderData,
} from './read-model';

export {
  readSemesterSubjects,
  readAllAssignments,
  readUpcomingAssignmentsPreview,
  readActiveSprintsPreview,
  readRecentTodosPreview,
  readTodos,
  readExamSprints,
  readSprintSessions,
  readAssignmentStats,
  readTodoStats,
  countSubjects,
  countSprints,
} from './reads';

export { requireCurrentSemester, requireUserId } from './context';
export { startSemester } from './mutations/semester';
export { changeAssignment } from './mutations/assignment';
export { changeSubject } from './mutations/subject';
export { changeTodo } from './mutations/todo';
export { changeExamPlan } from './mutations/exam-plan';
