import { Button } from '../components/button';
import { Badge } from '../components/badge';
import {
  Plus,
  Calendar,
  Clock,
  ChevronRight,
} from 'lucide-react';

// Mock sprints data
const sprints = [
  {
    id: 1,
    name: 'Midterm Exam Sprint',
    description: 'Intensive preparation for midterm examinations',
    startDate: '2026-01-15',
    endDate: '2026-01-25',
    progress: 60,
    totalSessions: 12,
    completedSessions: 7,
    status: 'active',
  },
  {
    id: 2,
    name: 'Finals Preparation',
    description: 'Comprehensive review for final examinations',
    startDate: '2026-04-20',
    endDate: '2026-05-05',
    progress: 0,
    totalSessions: 20,
    completedSessions: 0,
    status: 'upcoming',
  },
];

const upcomingSessions = [
  {
    id: 1,
    date: 'Today',
    time: '2:00 PM - 4:00 PM',
    subject: 'Mathematics',
    subjectColor: '#3b82f6',
    topic: 'Integration Techniques',
  },
  {
    id: 2,
    date: 'Tomorrow',
    time: '10:00 AM - 12:00 PM',
    subject: 'Physics',
    subjectColor: '#8b5cf6',
    topic: 'Mechanics Review',
  },
];

function formatDateRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge variant="success">Active</Badge>;
    case 'upcoming':
      return <Badge variant="secondary">Upcoming</Badge>;
    default:
      return <Badge variant="ghost">Planned</Badge>;
  }
}

export default function SprintsPage() {
  return (
    <div className="space-y-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Sprints</h1>
          <p className="text-muted-foreground mt-1">Plan your exam preparation</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Sprint
        </Button>
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
        {/* Sprints List */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-lg font-medium mb-6">Your Sprints</h2>
            <div className="space-y-6">
              {sprints.map((sprint) => (
                <div
                  key={sprint.id}
                  className="group cursor-pointer space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium">{sprint.name}</h3>
                        {getStatusBadge(sprint.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{sprint.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      View
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {sprint.completedSessions} of {sprint.totalSessions} sessions
                      </span>
                      <span className="font-medium">{sprint.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${sprint.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDateRange(sprint.startDate, sprint.endDate)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Upcoming Sessions */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium">Upcoming Sessions</h2>
          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="group cursor-pointer space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: session.subjectColor }}
                  />
                  <span className="font-medium">{session.subject}</span>
                  {session.date === 'Today' && (
                    <Badge variant="destructive">Today</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground pl-5">{session.topic}</p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground pl-5">
                  <Clock className="h-3.5 w-3.5" />
                  {session.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
