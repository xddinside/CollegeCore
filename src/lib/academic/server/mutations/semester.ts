import 'server-only';

import { db } from '@/db';
import { semesters, subjects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { StartSemesterInput } from '@/lib/academic/model';
import { runAuthenticatedMutation } from '../mutation-context';
import { validateColor, validateName } from '../validation';

export async function startSemester(input: StartSemesterInput): Promise<{ id: number }> {
  return runAuthenticatedMutation('Failed to start semester', async (userId) => {
    const name = validateName(input.name, 'Semester name');
    const subjectsInput = Array.isArray(input.subjects) ? input.subjects : [];
    const normalizedSubjects = subjectsInput.map((subject) => ({
      name: validateName(subject.name, 'Subject name'),
      color: validateColor(subject.color),
    }));

    return db.transaction(async (tx) => {
      await tx.update(semesters).set({ isCurrent: false }).where(eq(semesters.userId, userId));
      const [{ id: semesterId }] = await tx
        .insert(semesters)
        .values({ userId, name, isCurrent: true })
        .$returningId();
      if (normalizedSubjects.length > 0) {
        await tx.insert(subjects).values(normalizedSubjects.map((subject) => ({ semesterId, ...subject })));
      }
      return { id: semesterId };
    });
  });
}
