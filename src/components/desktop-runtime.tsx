'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { buildReminderCandidates } from '@/lib/assignment-lifecycle';
import { useDashboardReminderData } from '@/lib/dashboard/client-data';
import { getDesktopRuntime, type DesktopReminderMessage } from '@/lib/desktop';

function runWhenBrowserIdle(callback: () => void) {
  if (typeof window.requestIdleCallback === 'function') {
    const idleId = window.requestIdleCallback(callback, { timeout: 1500 });
    return () => window.cancelIdleCallback(idleId);
  }

  const timeoutId = window.setTimeout(callback, 300);
  return () => window.clearTimeout(timeoutId);
}

export function DesktopRuntime() {
  const { user } = useUser();
  const { load } = useDashboardReminderData();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      return;
    }
    const runtime = getDesktopRuntime();
    if (runtime.kind !== 'electron') {
      return;
    }

    let active = true;

    const submitReminders = async () => {
      if (!active || document.visibilityState !== 'visible') {
        return;
      }

      const { assignments, sprints } = await load();
      const reminders: DesktopReminderMessage[] = buildReminderCandidates(
        { assignments: assignments.assignments, sprints: sprints.sprints },
        new Date(),
      );
      await runtime.reminders.submit(reminders);
    };

    const unsubscribeReminderPoll = runtime.reminders.onPoll(() => {
      void submitReminders();
    });

    const unsubscribeSettingsChanged = runtime.settings.onChanged(() => {
      void submitReminders();
    });

    const cancelInitialRun = runWhenBrowserIdle(() => {
      void submitReminders();
    });

    return () => {
      active = false;
      cancelInitialRun();
      unsubscribeReminderPoll();
      unsubscribeSettingsChanged();
    };
  }, [load, userId]);

  return null;
}
