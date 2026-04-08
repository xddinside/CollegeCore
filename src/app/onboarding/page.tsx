'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';
import { createSemester, createSubject } from '@/lib/actions';
import { Button } from '@/app/ui/1/components/button';
import { Input } from '@/app/ui/1/components/input';

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
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [semester, setSemester] = useState('Sem I');
  const [subjects, setSubjects] = useState<{ name: string; color: string }[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user || displayName) return;
    const name = user.fullName || user.firstName || '';
    if (name) setDisplayName(name);
  }, [isLoaded, user, displayName]);

  const addSubject = () => {
    const name = newSubject.trim();
    if (!name) return;
    if (subjects.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setSubjects([...subjects, { name, color: selectedColor }]);
    setNewSubject('');
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
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

      window.location.assign('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Could not finish setting up your semester. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl gap-8 lg:grid-cols-2 lg:items-center">
        <section className="space-y-6">
          <div className="space-y-2">
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

          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex"
                  autoFocus
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
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
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
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
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
                      className={`h-6 w-6 rounded-full transition-transform ${
                        selectedColor === color ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {subjects.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject, index) => (
                      <div
                        key={`${subject.name}-${index}`}
                        className="flex items-center gap-2 rounded-full border border-border bg-accent/50 px-3 py-1.5 text-sm"
                      >
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: subject.color }} />
                        <span>{subject.name}</span>
                        <button
                          type="button"
                          onClick={() => removeSubject(index)}
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={!canProceed() || loading}>
                  {loading ? 'Setting up...' : 'Get started'}
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
