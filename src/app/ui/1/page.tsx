import Link from 'next/link';
import { Button } from './components/button';
import { Badge } from './components/badge';
import {
  CheckSquare,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  MoreHorizontal,
} from 'lucide-react';

// Mock data
const upcomingAssignments = [
  {
    id: 1,
    title: 'Calculus Problem Set 4',
    subject: 'Mathematics',
    subjectColor: '#3b82f6',
    dueDate: 'Today',
    dueTime: '11:59 PM',
    priority: 'high',
  },
  {
    id: 2,
    title: 'Physics Lab Report',
    subject: 'Physics',
    subjectColor: '#8b5cf6',
    dueDate: 'Tomorrow',
    dueTime: '5:00 PM',
    priority: 'medium',
  },
  {
    id: 3,
    title: 'Essay Draft - Modern Literature',
    subject: 'English',
    subjectColor: '#10b981',
    dueDate: 'Fri, Jan 16',
    dueTime: '11:59 PM',
    priority: 'medium',
  },
  {
    id: 4,
    title: 'Chemistry Quiz Prep',
    subject: 'Chemistry',
    subjectColor: '#f59e0b',
    dueDate: 'Mon, Jan 20',
    dueTime: '9:00 AM',
    priority: 'low',
  },
];

const sprints = [
  {
    id: 1,
    name: 'Midterm Sprint',
    startDate: 'Jan 15',
    endDate: 'Jan 25',
    progress: 60,
    sessions: 12,
    completedSessions: 7,
  },
];

const todos = [
  { id: 1, title: 'Email professor about extension', completed: false },
  { id: 2, title: 'Buy textbooks for next week', completed: false },
  { id: 3, title: 'Review lecture notes', completed: true },
];

export default function DashboardPage() {
  return (
    <div className="space-y-10 animate-fade-in">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-medium tracking-tight">Welcome back, John</h1>
        <p className="text-muted-foreground">
          You have 4 assignments due this week
        </p>
      </div>

      {/* Mobile Quick Actions */}
      <div className="flex flex-col gap-3 md:hidden">
        <Button className="w-full justify-center">
          <Plus className="mr-2 h-4 w-4" />
          New Assignment
        </Button>
        <Button variant="outline" className="w-full justify-center">
          <Calendar className="mr-2 h-4 w-4" />
          View Calendar
        </Button>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">
          {/* Upcoming Assignments - clean list */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">Upcoming</h2>
              <Link href="/ui/1/assignments">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-1">
              {upcomingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="group flex items-start gap-3 py-4 px-3 -mx-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  {/* Subject color dot */}
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0 mt-1.5"
                    style={{ backgroundColor: assignment.subjectColor }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">
                            {assignment.title}
                          </span>
                          {assignment.dueDate === 'Today' && (
                            <Badge variant="destructive" className="sm:hidden">Today</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                          <span>{assignment.subject}</span>
                          <span className="hidden sm:inline">·</span>
                          <span className="hidden sm:flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {assignment.dueTime}
                          </span>
                        </div>
                      </div>

                      {/* Due date */}
                      <div className="text-left sm:text-right shrink-0">
                        <span className={`text-sm hidden sm:inline ${
                          assignment.dueDate === 'Today' 
                            ? 'text-destructive font-medium' 
                            : 'text-muted-foreground'
                        }`}>
                          {assignment.dueDate}
                        </span>
                        <span className="sm:hidden text-sm text-muted-foreground">
                          {assignment.dueTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Active Sprints */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">Active Sprint</h2>
              <Link href="/ui/1/sprints">
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {sprints.map((sprint) => (
              <div key={sprint.id} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{sprint.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {sprint.startDate} — {sprint.endDate}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {sprint.completedSessions}/{sprint.sessions} sessions
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${sprint.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:block space-y-10">
          {/* Quick Actions */}
          <section className="space-y-3">
            <Button className="w-full justify-start" size="lg">
              <Plus className="mr-2 h-4 w-4" />
              New Assignment
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Button>
          </section>

          {/* Quick Todos */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Todos</h2>
              <Link href="/ui/1/todos">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>

            <div className="space-y-1">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 py-3 cursor-pointer group"
                >
                  <div
                    className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                      todo.completed
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/30 group-hover:border-primary'
                    }`}
                  >
                    {todo.completed && (
                      <svg
                        className="h-2.5 w-2.5 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      todo.completed ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {todo.title}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Stats Summary */}
          <section>
            <h2 className="text-lg font-medium mb-4">Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckSquare className="h-4 w-4" />
                  <span className="text-sm">Tasks</span>
                </div>
                <span className="text-sm font-medium">12/24</span>
              </div>
              <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full w-1/2 rounded-full bg-primary" />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">Completion</span>
                <span className="text-sm font-medium">50%</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
