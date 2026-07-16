import 'server-only';

import { db } from '@/db';
import { assignments, attachments, sprintSessions, subjects, todos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { SubjectChange } from '@/lib/academic/model';
import { runCurrentSemesterMutation } from '../mutation-context';
import { requireOwnedSubject } from '../ownership';
import { validateColor, validateName } from '../validation';

export async function changeSubject(change: SubjectChange): Promise<{ id: number }> {
  return runCurrentSemesterMutation('Failed to change subject', async ({ userId, semester }) =>
    db.transaction(async (tx) => {
      if (change.kind === 'create') {
        const [{ id }] = await tx.insert(subjects).values({
          semesterId: semester.id,
          name: validateName(change.name, 'Subject name'),
          color: validateColor(change.color),
        }).$returningId();
        return { id };
      }

      await requireOwnedSubject(change.subjectId, userId, semester.id);

      if (change.kind === 'revise') {
        await tx.update(subjects).set({
          name: validateName(change.name, 'Subject name'),
          color: validateColor(change.color),
        }).where(eq(subjects.id, change.subjectId));
        return { id: change.subjectId };
      }

      const subjectAssignmentIds = await tx
        .select({ id: assignments.id })
        .from(assignments)
        .where(eq(assignments.subjectId, change.subjectId));
      for (const { id } of subjectAssignmentIds) {
        await tx.delete(attachments).where(eq(attachments.assignmentId, id));
      }
      await tx.delete(assignments).where(eq(assignments.subjectId, change.subjectId));
      await tx.update(todos).set({ subjectId: null }).where(eq(todos.subjectId, change.subjectId));
      await tx.delete(sprintSessions).where(eq(sprintSessions.subjectId, change.subjectId));
      await tx.delete(subjects).where(eq(subjects.id, change.subjectId));
      return { id: change.subjectId };
    }),
  );
}
