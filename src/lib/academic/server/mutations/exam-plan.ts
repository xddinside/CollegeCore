import 'server-only';

import { db } from '@/db';
import { examSprints, sprintSessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { academicDayOffset } from '@/lib/academic-day';
import type { ExamPlanChange } from '@/lib/academic/model';
import { runCurrentSemesterMutation } from '../mutation-context';
import {
  requireOwnedExamSprint,
  requireOwnedSprintSession,
  sprintBelongsToSemester,
  subjectBelongsToSemester,
} from '../ownership';
import { normalizeDate, normalizeText, validateName } from '../validation';
import { academicError } from '../context';

export async function changeExamPlan(change: ExamPlanChange): Promise<{ id: number }> {
  return runCurrentSemesterMutation('Failed to change exam plan', async ({ userId, semester }) =>
    db.transaction(async (tx) => {
      if (change.kind === 'create-sprint') {
        const startDate = normalizeDate(change.startDate);
        const endDate = normalizeDate(change.endDate);
        if (!startDate || !endDate) {
          academicError('INVALID_INPUT', 'Sprint dates are required');
        }
        if (academicDayOffset(endDate, startDate) < 0) {
          academicError('INVALID_INPUT', 'Sprint start date must be on or before end date');
        }
        const [{ id }] = await tx.insert(examSprints).values({
          semesterId: semester.id,
          name: validateName(change.name, 'Sprint name'),
          startDate,
          endDate,
        }).$returningId();
        return { id };
      }

      if (change.kind === 'create-session') {
        if (!(await sprintBelongsToSemester(change.sprintId, semester.id))) {
          academicError('RESOURCE_UNAVAILABLE', 'Sprint does not belong to the current semester');
        }
        if (!(await subjectBelongsToSemester(change.subjectId, semester.id))) {
          academicError('RESOURCE_UNAVAILABLE', 'Subject does not belong to the current semester');
        }
        const date = normalizeDate(change.date);
        if (!date) {
          academicError('INVALID_INPUT', 'Session date is required');
        }
        if (change.startTime >= change.endTime) {
          academicError('INVALID_INPUT', 'Session start time must be before end time');
        }
        const [{ id }] = await tx.insert(sprintSessions).values({
          sprintId: change.sprintId,
          date,
          startTime: change.startTime,
          endTime: change.endTime,
          subjectId: change.subjectId,
          notes: normalizeText(change.notes),
        }).$returningId();
        return { id };
      }

      if (change.kind === 'remove-sprint') {
        await requireOwnedExamSprint(change.sprintId, userId, semester.id);
        await tx.delete(sprintSessions).where(eq(sprintSessions.sprintId, change.sprintId));
        await tx.delete(examSprints).where(eq(examSprints.id, change.sprintId));
        return { id: change.sprintId };
      }

      await requireOwnedSprintSession(change.sessionId, userId, semester.id);
      await tx.delete(sprintSessions).where(eq(sprintSessions.id, change.sessionId));
      return { id: change.sessionId };
    }),
  );
}
