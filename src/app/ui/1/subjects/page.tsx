import { Button } from '../components/button';
import { Input } from '../components/input';
import {
  Plus,
  Search,
  BookOpen,
} from 'lucide-react';

// Mock subjects data
const subjects = [
  {
    id: 1,
    name: 'Mathematics',
    color: '#3b82f6',
    totalAssignments: 8,
    completedAssignments: 4,
  },
  {
    id: 2,
    name: 'Physics',
    color: '#8b5cf6',
    totalAssignments: 6,
    completedAssignments: 2,
  },
  {
    id: 3,
    name: 'English',
    color: '#10b981',
    totalAssignments: 5,
    completedAssignments: 3,
  },
  {
    id: 4,
    name: 'Chemistry',
    color: '#f59e0b',
    totalAssignments: 4,
    completedAssignments: 1,
  },
  {
    id: 5,
    name: 'History',
    color: '#ef4444',
    totalAssignments: 3,
    completedAssignments: 3,
  },
  {
    id: 6,
    name: 'Computer Science',
    color: '#06b6d4',
    totalAssignments: 7,
    completedAssignments: 3,
  },
];

export default function SubjectsPage() {
  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Subjects</h1>
          <p className="text-muted-foreground mt-1">{subjects.length} courses this semester</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search subjects..." className="pl-9" />
      </div>

      {/* Subjects Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => {
          const progress = (subject.completedAssignments / subject.totalAssignments) * 100;

          return (
            <div
              key={subject.id}
              className="group cursor-pointer space-y-4"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-medium"
                  style={{ backgroundColor: subject.color }}
                >
                  {subject.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium">{subject.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {subject.completedAssignments} of {subject.totalAssignments} done
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, backgroundColor: subject.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {subjects.length === 0 && (
        <div className="empty-state">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent mb-4">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No subjects</h3>
          <p className="text-muted-foreground mt-1">Add your first subject to get started.</p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        </div>
      )}
    </div>
  );
}
