# College Exam & Assignment Planner - Project Plan

## 1. Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | Next.js 14+ (App Router) |
| Backend | Next.js Server Actions |
| Database | MySQL |
| ORM | Drizzle ORM |
| Auth | Clerk |
| File Storage | UploadThing |
| Styling | Tailwind CSS |
| State | React useState/useReducer (server state via actions) |

## 2. Core Data Model

### Relationships
```
User ( Clerk ID )
  └── Semester (one-to-many)
        ├── Subject (many-to-one)
        │     ├── Assignment (many-to-one)
        │     │     └── Attachment (many-to-one)
        │     └── Todo (many-to-one)
        └── ExamSprint (many-to-one)
              └── SprintSession (many-to-one)
```

### Schema Overview

**Users**
- clerkId (PK, unique)
- email
- createdAt

**Semesters**
- id (PK)
- userId (FK → users.clerkId)
- name (e.g., "Fall 2026")
- isCurrent (boolean)
- isArchived (boolean)
- createdAt

**Subjects**
- id (PK)
- semesterId (FK → semesters.id)
- name
- color (hex for visual identification)
- createdAt

**Assignments**
- id (PK)
- subjectId (FK → subjects.id)
- title
- description (optional)
- dueDate (date)
- status (TODO | IN_PROGRESS | COMPLETED)
- createdAt

**Attachments**
- id (PK)
- assignmentId (FK → assignments.id)
- url (UploadThing URL)
- filename
- createdAt

**Todos**
- id (PK)
- semesterId (FK → semesters.id)
- subjectId (FK → subjects.id, nullable)
- title
- dueDate (optional)
- isCompleted (boolean)
- createdAt

**ExamSprints**
- id (PK)
- semesterId (FK → semesters.id)
- name (e.g., "Finals Week")
- startDate
- endDate
- createdAt

**SprintSessions**
- id (PK)
- sprintId (FK → examSprints.id)
- date
- startTime
- endTime
- subjectId (FK → subjects.id)
- notes (what to cover in this slot)
- createdAt

## 3. Feature Breakdown

### 3.1 Authentication (Clerk)
- Sign up / Sign in flow via Clerk
- Protected routes with Clerk middleware
- User record created on first sign-up

### 3.2 Onboarding Flow
- Step 1: Select current semester name
- Step 2: Add subjects (name + color picker)
- Step 3: Confirm and create semester
- Redirect to dashboard

### 3.3 Semester Management
- View current semester
- Toggle to view archived semesters
- "Archive current semester" action
- "Set as current" for archived semesters
- Create new semester from archived

### 3.4 Subject Management
- Add/Edit/Delete subjects within a semester
- Each subject has a color for visual identification
- Subjects are the parent entity for assignments

### 3.5 Assignments
- Create assignment linked to subject
- Fields: title, due date, description (expandable), attachments
- Status: TODO → IN_PROGRESS → COMPLETED
- Due date indicators:
  - Red: Due today or overdue
  - Yellow: Due within 7 days
  - Green: Due later
- List view filterable by subject and status

### 3.6 Attachments (UploadThing)
- Add files to assignments
- File types: PDF, images, documents
- Max file size: 10MB (configurable)
- Displayed as chips below assignment

### 3.7 Todos
- Per-semester todo list
- Optional link to subject
- Optional due date
- Checkbox to mark complete
- Filterable by subject

### 3.8 Exam Sprint Scheduler
- Create sprint with date range
- Add multiple sessions per day
- Each session: date, time slot, subject, notes
- Editable and rescheduleable
- Calendar or list view of sessions

### 3.9 Progress Visualization
- Dashboard display showing:
  - Total assignments | Completed → percentage
  - Per-subject breakdown
  - Todos completed count

### 3.10 UI/UX
- Mobile-first responsive design
- Minimal aesthetic, not info-dense
- Color-coded indicators on elements
- Navigation: sidebar (desktop) / bottom tabs (mobile)

## 4. Page Structure

```
/
├── (public)
│   └── index (landing page)
├── (auth)
│   └── sign-in / sign-up (Clerk)
├── (app)
│   ├── onboarding (first-time setup)
│   └── dashboard (main app)
│         ├── semesters
│         ├── subjects
│         ├── assignments
│         ├── todos
│         ├── sprints
│         └── settings
```

## 5. Implementation Order

### Phase 1: Foundation
1. Initialize Next.js + Drizzle + MySQL
2. Set up Clerk auth
3. Create database schema
4. Build shared layout and navigation

### Phase 2: Core Features
5. Onboarding flow
6. Semester & subject CRUD
7. Assignments with attachments
8. Todos

### Phase 3: Advanced
9. Exam sprints
10. Progress visualization
11. Visual indicators polish

### Phase 4: Polish
12. Mobile responsiveness
13. Edge cases & error handling
14. Final testing

## 6. Environment Variables

```env
DATABASE_URL=
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
```

## 7. Key Libraries

- `next` - Framework
- `drizzle-orm` - ORM
- `@clerk/nextjs` - Auth
- `@uploadthing/react` - File uploads
- `date-fns` - Date manipulation
- `tailwindcss` - Styling
- `lucide-react` - Icons

## 8. Unresolved Items

- Exact UI component library (shadcn/ui vs custom)
- Color scheme decisions
- Specific visual indicator timing (7 days vs custom)
- Sprint view (calendar vs list)

## 9. Success Criteria

- [ ] Users can sign up and manage semesters
- [ ] Students can track assignments with due dates and attachments
- [ ] Todos are linkable to subjects
- [ ] Exam sprints can be scheduled flexibly
- [ ] Progress is visible on dashboard
- [ ] Mobile-responsive UI
- [ ] Minimal, non-overwhelming interface