import { AcademicError } from '@/lib/academic/model';

export function assertResourceInCurrentSemester(
  resourceSemesterId: number,
  currentSemesterId: number,
  resourceLabel: string,
): void {
  if (resourceSemesterId !== currentSemesterId) {
    throw new AcademicError('RESOURCE_UNAVAILABLE', `${resourceLabel} not found`);
  }
}
