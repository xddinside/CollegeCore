import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { AcademicError } from '../model';
import { assertResourceInCurrentSemester } from './resource-policy';

describe('current-semester resource policy', () => {
  test('allows resources from the current semester', () => {
    assert.doesNotThrow(() => assertResourceInCurrentSemester(12, 12, 'Assignment'));
  });

  test('rejects resources from inactive semesters', () => {
    assert.throws(
      () => assertResourceInCurrentSemester(11, 12, 'Assignment'),
      (error: unknown) => error instanceof AcademicError && error.code === 'RESOURCE_UNAVAILABLE',
    );
  });
});
