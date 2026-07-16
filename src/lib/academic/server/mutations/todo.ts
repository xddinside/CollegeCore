import 'server-only';

import { db } from '@/db';
import { todos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { TodoChange } from '@/lib/academic/model';
import { runCurrentSemesterMutation } from '../mutation-context';
import { requireOwnedTodo, subjectBelongsToSemester } from '../ownership';
import { normalizeDate, validateName } from '../validation';
import { academicError } from '../context';

export async function changeTodo(change: TodoChange): Promise<{ id: number }> {
  return runCurrentSemesterMutation('Failed to change todo', async ({ userId, semester }) =>
    db.transaction(async (tx) => {
      if (change.kind === 'create') {
        if (change.subjectId !== null && !(await subjectBelongsToSemester(change.subjectId, semester.id))) {
          academicError('RESOURCE_UNAVAILABLE', 'Subject does not belong to the current semester');
        }
        const [{ id }] = await tx.insert(todos).values({
          semesterId: semester.id,
          subjectId: change.subjectId,
          title: validateName(change.title, 'Title'),
          dueDate: normalizeDate(change.dueDate),
        }).$returningId();
        return { id };
      }

      await requireOwnedTodo(change.todoId, userId, semester.id);
      if (change.kind === 'set-completed') {
        await tx.update(todos).set({ isCompleted: change.isCompleted }).where(eq(todos.id, change.todoId));
        return { id: change.todoId };
      }

      await tx.delete(todos).where(eq(todos.id, change.todoId));
      return { id: change.todoId };
    }),
  );
}
