import 'server-only';

import { revalidatePath } from 'next/cache';
import { AcademicError } from '@/lib/academic/model';
import { requireCurrentSemester, requireUserId } from './context';

type CurrentSemester = Awaited<ReturnType<typeof requireCurrentSemester>>;

export async function runAuthenticatedMutation<T>(
  failureMessage: string,
  operation: (userId: string) => Promise<T>,
): Promise<T> {
  const userId = await requireUserId();
  return runPersistenceBoundary(failureMessage, () => operation(userId));
}

export async function runCurrentSemesterMutation<T>(
  failureMessage: string,
  operation: (context: { userId: string; semester: CurrentSemester }) => Promise<T>,
): Promise<T> {
  const userId = await requireUserId();
  const semester = await requireCurrentSemester(userId);
  return runPersistenceBoundary(failureMessage, () => operation({ userId, semester }));
}

async function runPersistenceBoundary<T>(failureMessage: string, operation: () => Promise<T>): Promise<T> {
  try {
    const result = await operation();
    revalidatePath('/dashboard');
    return result;
  } catch (err) {
    if (err instanceof AcademicError) throw err;
    academicPersistenceError(failureMessage);
  }
}

function academicPersistenceError(message: string): never {
  throw new AcademicError('PERSISTENCE_FAILED', message);
}
