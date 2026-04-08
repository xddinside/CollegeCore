import { Button } from '../components/button';
import { Badge } from '../components/badge';
import { Input } from '../components/input';
import {
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Circle,
  FileText,
} from 'lucide-react';

// Mock assignments data
const assignments = [
  {
    id: 1,
    title: 'Calculus Problem Set 4',
    subject: 'Mathematics',
    subjectColor: '#3b82f6',
    dueDate: '2026-01-14',
    dueTime: '11:59 PM',
    status: 'TODO',
    priority: 'high',
  },
  {
    id: 2,
    title: 'Physics Lab Report',
    subject: 'Physics',
    subjectColor: '#8b5cf6',
    dueDate: '2026-01-15',
    dueTime: '5:00 PM',
    status: 'IN_PROGRESS',
    priority: 'medium',
  },
  {
    id: 3,
    title: 'Essay Draft - Modern Literature',
    subject: 'English',
    subjectColor: '#10b981',
    dueDate: '2026-01-16',
    dueTime: '11:59 PM',
    status: 'TODO',
    priority: 'medium',
  },
  {
    id: 4,
    title: 'Chemistry Quiz Prep',
    subject: 'Chemistry',
    subjectColor: '#f59e0b',
    dueDate: '2026-01-20',
    dueTime: '9:00 AM',
    status: 'TODO',
    priority: 'low',
  },
  {
    id: 5,
    title: 'History Research Paper',
    subject: 'History',
    subjectColor: '#ef4444',
    dueDate: '2026-01-22',
    dueTime: '11:59 PM',
    status: 'COMPLETED',
    priority: 'high',
  },
  {
    id: 6,
    title: 'Programming Assignment 3',
    subject: 'Computer Science',
    subjectColor: '#06b6d4',
    dueDate: '2026-01-25',
    dueTime: '11:59 PM',
    status: 'IN_PROGRESS',
    priority: 'high',
  },
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-5 w-5 text-muted-foreground" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground" />;
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AssignmentsPage() {
  const todoCount = assignments.filter((a) => a.status === 'TODO').length;
  const inProgressCount = assignments.filter((a) => a.status === 'IN_PROGRESS').length;
  const completedCount = assignments.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Assignments</h1>
          <p className="text-muted-foreground mt-1">
            {todoCount} to do · {inProgressCount} in progress · {completedCount} completed
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Assignment
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search assignments..." className="pl-9" />
      </div>

      {/* Assignments List */}
      <div className="space-y-1">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className={`group flex items-start gap-4 py-4 px-4 -mx-4 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer ${
              assignment.status === 'COMPLETED' ? 'opacity-50' : ''
            }`}
          >
            {/* Status */}
            <div className="mt-0.5">
              {getStatusIcon(assignment.status)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${
                      assignment.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''
                    }`}>
                      {assignment.title}
                    </span>
                    {assignment.priority === 'high' && assignment.status !== 'COMPLETED' && (
                      <Badge variant="destructive">High</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    Complete all problems from Chapter 7. Show your work for full credit.
                  </p>
                </div>

                {/* Due Date */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className={
                      formatDate(assignment.dueDate) === 'Overdue'
                        ? 'text-destructive font-medium'
                        : formatDate(assignment.dueDate) === 'Today'
                        ? 'text-warning font-medium'
                        : ''
                    }>
                      {formatDate(assignment.dueDate)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{assignment.dueTime}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: assignment.subjectColor }}
                  />
                  <span className="text-sm text-muted-foreground">{assignment.subject}</span>
                </div>
                {assignment.status === 'IN_PROGRESS' && (
                  <Badge variant="secondary">In Progress</Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {assignments.length === 0 && (
        <div className="empty-state">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent mb-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No assignments</h3>
          <p className="text-muted-foreground mt-1">Create your first assignment to get started.</p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            New Assignment
          </Button>
        </div>
      )}
    </div>
  );
}
