'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';
import { createSemester, createSubject } from '@/lib/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

const SEMESTERS = ['Sem I', 'Sem II', 'Sem III', 'Sem IV', 'Sem V', 'Sem VI', 'Sem VII', 'Sem VIII'];

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' ') || null,
  };
}

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [editedDisplayName, setEditedDisplayName] = useState('');
  const [semester, setSemester] = useState('Sem I');
  const [subjects, setSubjects] = useState<{ id: string; name: string; color: string }[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName =
    editedDisplayName || (isLoaded ? user?.fullName || user?.firstName || '' : '');

  const addSubject = () => {
    const name = newSubject.trim();
    if (!name) return;
    if (subjects.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setSubjects([...subjects, { id: crypto.randomUUID(), name, color: selectedColor }]);
    setNewSubject('');
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const canProceed = () => {
    if (step === 1) return displayName.trim().length > 0;
    if (step === 2) return true;
    return subjects.length > 0;
  };

  const handleSubmit = async () => {
    if (!user || !displayName.trim() || subjects.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const { firstName, lastName } = splitName(displayName);

      try {
        await user.update({ firstName, lastName });
      } catch (profileError) {
        console.error('Failed to update Clerk profile during onboarding', profileError);
      }

      const createdSemester = await createSemester(user.id, semester);
      await Promise.all(
        subjects.map((s) => createSubject(createdSemester.id, s.name, s.color))
      );

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Could not finish setting up your semester. Please try again.');
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          Loading...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl gap-10 lg:grid-cols-2 lg:items-center">
        <section className="space-y-5">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
              {step === 1 && 'What should we call you?'}
              {step === 2 && 'Which semester are you in?'}
              {step === 3 && 'What subjects are you taking?'}
            </h1>
            <p className="text-muted-foreground">
              {step === 1 && 'This is how you will see your name across the app.'}
              {step === 2 && `Setting up ${semester}. You can change this later.`}
              {step === 3 && `Add your courses for ${semester}.`}
            </p>
          </div>

          <div className="flex gap-2" aria-label="Onboarding progress">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                aria-current={s === step ? 'step' : undefined}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="display-name">Your name</Label>
                <Input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setEditedDisplayName(e.target.value)}
                  placeholder="e.g. Alex"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!canProceed()}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  id="semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  {SEMESTERS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </Select>
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSubject()}
                    placeholder="Add a subject..."
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={addSubject} disabled={!newSubject.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Choose ${color}`}
                      aria-pressed={selectedColor === color}
                      className={`h-5 w-5 rounded-full transition-transform motion-safe:active:scale-95 ${
                        selectedColor === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {subjects.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm"
                      >
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: subject.color }} />
                        <span>{subject.name}</span>
                        <button
                          type="button"
                          onClick={() => removeSubject(subject.id)}
                          aria-label={`Remove ${subject.name}`}
                          className="ml-1 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <Alert variant="error">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={!canProceed()} loading={loading}>
                  Get started
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
