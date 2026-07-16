import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assignmentStatusLabel,
  buildFocusFeed,
  buildReminderCandidates,
  isAssignmentCompleted,
  nextAssignmentStatus,
  projectAssignmentInteraction,
  type AssignmentView,
} from './assignment-lifecycle';

describe('nextAssignmentStatus', () => {
  test('cycles TODO -> IN_PROGRESS -> COMPLETED -> TODO', () => {
    assert.equal(nextAssignmentStatus('TODO'), 'IN_PROGRESS');
    assert.equal(nextAssignmentStatus('IN_PROGRESS'), 'COMPLETED');
    assert.equal(nextAssignmentStatus('COMPLETED'), 'TODO');
  });
});

describe('assignmentStatusLabel', () => {
  test('returns human-readable labels', () => {
    assert.equal(assignmentStatusLabel('TODO'), 'Todo');
    assert.equal(assignmentStatusLabel('IN_PROGRESS'), 'In progress');
    assert.equal(assignmentStatusLabel('COMPLETED'), 'Completed');
  });
});

describe('isAssignmentCompleted', () => {
  test('is true only for COMPLETED', () => {
    assert.equal(isAssignmentCompleted('TODO'), false);
    assert.equal(isAssignmentCompleted('IN_PROGRESS'), false);
    assert.equal(isAssignmentCompleted('COMPLETED'), true);
  });
});

describe('projectAssignmentInteraction', () => {
  const base: AssignmentView = {
    id: 'a1',
    title: 'Essay',
    status: 'TODO',
    dueDate: '2024-06-15',
  };

  test('created prepends the assignment', () => {
    const created: AssignmentView = {
      id: 'a2',
      title: 'Lab',
      status: 'TODO',
      dueDate: '2024-06-16',
    };
    const result = projectAssignmentInteraction([base], {
      kind: 'created',
      assignment: created,
    });
    assert.deepEqual(result.map((a) => a.id), ['a2', 'a1']);
  });

  test('status-changed updates the matching assignment', () => {
    const result = projectAssignmentInteraction([base], {
      kind: 'status-changed',
      id: 'a1',
      status: 'IN_PROGRESS',
    });
    assert.equal(result[0].status, 'IN_PROGRESS');
  });

  test('status-changed leaves unmatched assignments untouched', () => {
    const result = projectAssignmentInteraction([base], {
      kind: 'status-changed',
      id: 'missing',
      status: 'COMPLETED',
    });
    assert.deepEqual(result, [base]);
  });

  test('description-changed updates the matching assignment', () => {
    const result = projectAssignmentInteraction([base], {
      kind: 'description-changed',
      id: 'a1',
      description: 'Updated',
    });
    assert.equal(result[0].description, 'Updated');
  });

  test('deleted removes the matching assignment', () => {
    const result = projectAssignmentInteraction([base], {
      kind: 'deleted',
      id: 'a1',
    });
    assert.equal(result.length, 0);
  });
});

describe('buildFocusFeed', () => {
  const today = new Date(2024, 5, 15);

  test('excludes assignments without due dates', () => {
    const result = buildFocusFeed({
      assignments: [{ id: 'a1', title: 'Undated', subjectName: 'Math', subjectColor: '#000', dueDate: null }],
      todos: [],
      sprints: [],
      today,
    });
    assert.equal(result.items.length, 0);
  });

  test('excludes completed and undated todos', () => {
    const result = buildFocusFeed({
      assignments: [],
      todos: [
        { id: 't1', title: 'Done', subjectName: null, subjectColor: null, dueDate: '2024-06-15', isCompleted: true },
        { id: 't2', title: 'No date', subjectName: null, subjectColor: null, dueDate: null, isCompleted: false },
        { id: 't3', title: 'Open', subjectName: null, subjectColor: null, dueDate: '2024-06-15', isCompleted: false },
      ],
      sprints: [],
      today,
    });
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].id, 'todo-t3');
  });

  test('orders items chronologically and caps at ten', () => {
    const assignments = Array.from({ length: 12 }, (_, i) => ({
      id: `a${i}`,
      title: `Assignment ${i}`,
      subjectName: 'Math',
      subjectColor: '#000',
      dueDate: new Date(2024, 5, 16 + i),
    }));
    const result = buildFocusFeed({ assignments, todos: [], sprints: [], today });
    assert.equal(result.items.length, 10);
    assert.deepEqual(
      result.items.map((item) => item.id),
      ['assignment-a0', 'assignment-a1', 'assignment-a2', 'assignment-a3', 'assignment-a4', 'assignment-a5', 'assignment-a6', 'assignment-a7', 'assignment-a8', 'assignment-a9'],
    );
  });

  test('groups overdue, today, and tomorrow labels with the right tones', () => {
    const result = buildFocusFeed({
      assignments: [
        { id: 'a1', title: 'Late', subjectName: 'Math', subjectColor: '#000', dueDate: '2024-06-14' },
        { id: 'a2', title: 'Now', subjectName: 'Math', subjectColor: '#000', dueDate: '2024-06-15' },
        { id: 'a3', title: 'Next', subjectName: 'Math', subjectColor: '#000', dueDate: '2024-06-16' },
      ],
      todos: [],
      sprints: [],
      today,
    });
    const labels = result.groups.map((g) => g.label);
    assert.deepEqual(labels, ['Overdue', 'Today', 'Tomorrow']);
    assert.ok(result.groups[0].tone.dot.includes('destructive'));
    assert.ok(result.groups[1].tone.dot.includes('warning'));
  });

  test('active sprints are grouped under Active and sorted by end date', () => {
    const result = buildFocusFeed({
      assignments: [],
      todos: [],
      sprints: [
        { id: 's1', name: 'Ends later', startDate: '2024-06-10', endDate: '2024-06-20' },
        { id: 's2', name: 'Ends sooner', startDate: '2024-06-10', endDate: '2024-06-18' },
      ],
      today,
    });
    assert.equal(result.items.length, 2);
    assert.deepEqual(result.items.map((i) => i.id), ['sprint-s2', 'sprint-s1']);
    assert.ok(result.groups.some((g) => g.label === 'Active' && g.items.length === 2));
  });

  test('upcoming sprints are grouped under Upcoming and sorted by start date', () => {
    const result = buildFocusFeed({
      assignments: [],
      todos: [],
      sprints: [
        { id: 's1', name: 'Later start', startDate: '2024-07-01', endDate: '2024-07-05' },
        { id: 's2', name: 'Sooner start', startDate: '2024-06-20', endDate: '2024-06-25' },
      ],
      today,
    });
    assert.deepEqual(result.items.map((i) => i.id), ['sprint-s2', 'sprint-s1']);
    assert.ok(result.groups.some((g) => g.label === 'Upcoming' && g.items.length === 2));
  });

  test('interleaves assignments, todos, and sprints by chronological key', () => {
    const result = buildFocusFeed({
      assignments: [{ id: 'a1', title: 'Due tomorrow', subjectName: 'Math', subjectColor: '#000', dueDate: '2024-06-16' }],
      todos: [{ id: 't1', title: 'Due today', subjectName: null, subjectColor: null, dueDate: '2024-06-15', isCompleted: false }],
      sprints: [{ id: 's1', name: 'Active', startDate: '2024-06-10', endDate: '2024-06-20' }],
      today,
    });
    assert.deepEqual(result.items.map((i) => i.id), ['todo-t1', 'assignment-a1', 'sprint-s1']);
  });
});

describe('buildReminderCandidates', () => {
  const today = new Date(2024, 5, 15);

  test('excludes completed and undated assignments', () => {
    const result = buildReminderCandidates(
      {
        assignments: [
          { id: 'a1', title: 'Done', subjectName: 'Math', dueDate: '2024-06-15', status: 'COMPLETED' },
          { id: 'a2', title: 'No date', subjectName: 'Math', dueDate: null, status: 'TODO' },
        ],
        sprints: [],
      },
      today,
    );
    assert.equal(result.length, 0);
  });

  test('emits a today reminder for assignments due today', () => {
    const result = buildReminderCandidates(
      {
        assignments: [{ id: 'a1', title: 'Essay', subjectName: 'History', dueDate: '2024-06-15', status: 'TODO' }],
        sprints: [],
      },
      today,
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].title, 'Assignment due today');
    assert.equal(result[0].route, '/dashboard/assignments');
    assert.match(result[0].body, /Essay/);
  });

  test('emits a tomorrow reminder for assignments due tomorrow', () => {
    const result = buildReminderCandidates(
      {
        assignments: [{ id: 'a1', title: 'Lab', subjectName: 'Chem', dueDate: '2024-06-16', status: 'IN_PROGRESS' }],
        sprints: [],
      },
      today,
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].title, 'Assignment due tomorrow');
  });

  test('ignores assignments due outside the today/tomorrow window', () => {
    const result = buildReminderCandidates(
      {
        assignments: [
          { id: 'a1', title: 'Past', subjectName: 'Math', dueDate: '2024-06-13', status: 'TODO' },
          { id: 'a2', title: 'Future', subjectName: 'Math', dueDate: '2024-06-20', status: 'TODO' },
        ],
        sprints: [],
      },
      today,
    );
    assert.equal(result.length, 0);
  });

  test('emits start reminders for sprints starting today or tomorrow', () => {
    const result = buildReminderCandidates(
      {
        assignments: [],
        sprints: [
          { id: 's1', name: 'Starts today', startDate: '2024-06-15', endDate: '2024-06-20' },
          { id: 's2', name: 'Starts tomorrow', startDate: '2024-06-16', endDate: '2024-06-20' },
          { id: 's3', name: 'Later', startDate: '2024-06-20', endDate: '2024-06-25' },
        ],
      },
      today,
    );
    assert.equal(result.length, 2);
    assert.ok(result.some((r) => r.title === 'Exam sprint starts today'));
    assert.ok(result.some((r) => r.title === 'Exam sprint starts tomorrow'));
  });

  test('emits an end reminder for sprints ending today', () => {
    const result = buildReminderCandidates(
      {
        assignments: [],
        sprints: [{ id: 's1', name: 'Wrapping', startDate: '2024-06-10', endDate: '2024-06-15' }],
      },
      today,
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].title, 'Exam sprint ends today');
    assert.equal(result[0].route, '/dashboard/sprints');
  });

  test('emits both start and end reminders when a sprint starts and ends today', () => {
    const result = buildReminderCandidates(
      {
        assignments: [],
        sprints: [{ id: 's1', name: 'Single day', startDate: '2024-06-15', endDate: '2024-06-15' }],
      },
      today,
    );
    const titles = result.map((r) => r.title);
    assert.ok(titles.includes('Exam sprint starts today'));
    assert.ok(titles.includes('Exam sprint ends today'));
  });
});
