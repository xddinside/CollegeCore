import 'server-only';

import { cache } from 'react';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { semesters } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import type { AcademicErrorCode, SemesterSummary } from '@/lib/academic/model';
import { AcademicError } from '@/lib/academic/model';

export function academicError(code: AcademicErrorCode, message?: string): never {
  throw new AcademicError(code, message);
}

export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    academicError('UNAUTHENTICATED', 'You must be signed in');
  }
  return userId;
}

export const requireCurrentSemester = cache(async (knownUserId?: string) => {
  const userId = knownUserId ?? await requireUserId();
  const result = await db
    .select()
    .from(semesters)
    .where(and(eq(semesters.userId, userId), eq(semesters.isCurrent, true), eq(semesters.isArchived, false)))
    .limit(1);

  const semester = result[0];
  if (!semester) {
    academicError('NO_CURRENT_SEMESTER', 'No current semester found');
  }
  return semester;
});

export async function readCurrentSemesterSummary(): Promise<SemesterSummary | null> {
  try {
    const semester = await requireCurrentSemester();
    return { id: semester.id, name: semester.name };
  } catch (err) {
    if (err instanceof AcademicError && err.code === 'NO_CURRENT_SEMESTER') {
      return null;
    }
    throw err;
  }
}
