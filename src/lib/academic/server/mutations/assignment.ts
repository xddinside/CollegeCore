import 'server-only';

import { db } from '@/db';
import { assignments, attachments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { AssignmentChange } from '@/lib/academic/model';
import { runCurrentSemesterMutation } from '../mutation-context';
import {
  requireOwnedAssignment,
  requireOwnedSubject,
} from '../ownership';
import { normalizeDate, normalizeText, validateName, validateStatus } from '../validation';

export async function changeAssignment(change: AssignmentChange): Promise<{ id: number }> {
  return runCurrentSemesterMutation('Failed to change assignment', async ({ userId, semester }) =>
    db.transaction(async (tx) => {
      if (change.kind === 'create') {
        await requireOwnedSubject(change.subjectId, userId, semester.id);
        const [{ id }] = await tx.insert(assignments).values({
          subjectId: change.subjectId,
          title: validateName(change.title, 'Title'),
          description: normalizeText(change.description),
          dueDate: normalizeDate(change.dueDate),
          status: 'TODO',
        }).$returningId();
        return { id };
      }

      if (change.kind === 'revise') {
        await requireOwnedAssignment(change.assignmentId, userId, semester.id);
        await tx.update(assignments).set({
          title: validateName(change.title, 'Title'),
          description: normalizeText(change.description),
          dueDate: normalizeDate(change.dueDate),
        }).where(eq(assignments.id, change.assignmentId));
        return { id: change.assignmentId };
      }

      if (change.kind === 'transition') {
        await requireOwnedAssignment(change.assignmentId, userId, semester.id);
        await tx.update(assignments).set({ status: validateStatus(change.status) }).where(eq(assignments.id, change.assignmentId));
        return { id: change.assignmentId };
      }

      await requireOwnedAssignment(change.assignmentId, userId, semester.id);
      await tx.delete(attachments).where(eq(attachments.assignmentId, change.assignmentId));
      await tx.delete(assignments).where(eq(assignments.id, change.assignmentId));
      return { id: change.assignmentId };
    }),
  );
}
