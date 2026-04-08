import { mysqlTable, varchar, timestamp, boolean, text, date, time, int, mysqlEnum, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const users = mysqlTable('users', {
  clerkId: varchar('clerk_id', { length: 255 }).primaryKey().notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const semesters = mysqlTable('semesters', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  isCurrent: boolean('is_current').default(true).notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('semester_user_id_idx').on(table.userId),
}));

export const subjects = mysqlTable('subjects', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  semesterId: int('semester_id', { unsigned: true }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).notNull().default('#6366f1'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assignments = mysqlTable('assignments', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  subjectId: int('subject_id', { unsigned: true }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  dueDate: date('due_date'),
  status: mysqlEnum('status', ['TODO', 'IN_PROGRESS', 'COMPLETED']).default('TODO').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const attachments = mysqlTable('attachments', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  assignmentId: int('assignment_id', { unsigned: true }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const todos = mysqlTable('todos', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  semesterId: int('semester_id', { unsigned: true }).notNull(),
  subjectId: int('subject_id', { unsigned: true }),
  title: varchar('title', { length: 255 }).notNull(),
  dueDate: date('due_date'),
  isCompleted: boolean('is_completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const examSprints = mysqlTable('exam_sprints', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  semesterId: int('semester_id', { unsigned: true }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sprintSessions = mysqlTable('sprint_sessions', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  sprintId: int('sprint_id', { unsigned: true }).notNull(),
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  subjectId: int('subject_id', { unsigned: true }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  semesters: many(semesters),
}));

export const semestersRelations = relations(semesters, ({ one, many }) => ({
  user: one(users, {
    fields: [semesters.userId],
    references: [users.clerkId],
  }),
  subjects: many(subjects),
  assignments: many(assignments),
  todos: many(todos),
  examSprints: many(examSprints),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  semester: one(semesters, {
    fields: [subjects.semesterId],
    references: [semesters.id],
  }),
  assignments: many(assignments),
  todos: many(todos),
  sprintSessions: many(sprintSessions),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [assignments.subjectId],
    references: [subjects.id],
  }),
  attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  assignment: one(assignments, {
    fields: [attachments.assignmentId],
    references: [assignments.id],
  }),
}));

export const todosRelations = relations(todos, ({ one }) => ({
  semester: one(semesters, {
    fields: [todos.semesterId],
    references: [semesters.id],
  }),
  subject: one(subjects, {
    fields: [todos.subjectId],
    references: [subjects.id],
  }),
}));

export const examSprintsRelations = relations(examSprints, ({ one, many }) => ({
  semester: one(semesters, {
    fields: [examSprints.semesterId],
    references: [semesters.id],
  }),
  sessions: many(sprintSessions),
}));

export const sprintSessionsRelations = relations(sprintSessions, ({ one }) => ({
  sprint: one(examSprints, {
    fields: [sprintSessions.sprintId],
    references: [examSprints.id],
  }),
  subject: one(subjects, {
    fields: [sprintSessions.subjectId],
    references: [subjects.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Semester = typeof semesters.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type Todo = typeof todos.$inferSelect;
export type ExamSprint = typeof examSprints.$inferSelect;
export type SprintSession = typeof sprintSessions.$inferSelect;
