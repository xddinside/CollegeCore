'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { getAssignmentsPageData, getSprintsPageData } from '@/lib/dashboard-queries';
import { hasDesktopBridge, type DesktopReminderCandidate } from '@/lib/desktop';
import { getDueStatus } from '@/lib/utils';

function getCalendarDiffDays(date: Date | string) {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

async function collectReminderCandidates(userId: string): Promise<DesktopReminderCandidate[]> {
  const [assignmentsData, sprintsData] = await Promise.all([
    getAssignmentsPageData(userId),
    getSprintsPageData(userId),
  ]);

  const assignmentReminders = assignmentsData.assignments.flatMap((assignment) => {
    if (assignment.status === 'COMPLETED' || !assignment.dueDate) {
      return [];
    }

    const dueStatus = getDueStatus(assignment.dueDate);
    const dueDate = new Date(assignment.dueDate);
    const key = dueDate.toISOString().slice(0, 10);

    if (dueStatus === 'today') {
      return [
        {
          id: `assignment-today-${assignment.id}-${key}`,
          title: 'Assignment due today',
          body: `${assignment.title} for ${assignment.subjectName} is due today.`,
          route: '/dashboard/assignments',
        },
      ];
    }

    if (getCalendarDiffDays(dueDate) === 1) {
      return [
        {
          id: `assignment-tomorrow-${assignment.id}-${key}`,
          title: 'Assignment due tomorrow',
          body: `${assignment.title} for ${assignment.subjectName} is due tomorrow.`,
          route: '/dashboard/assignments',
        },
      ];
    }

    return [];
  });

  const sprintReminders = sprintsData.sprints.flatMap((sprint) => {
    const startDiff = getCalendarDiffDays(sprint.startDate);
    const endDiff = getCalendarDiffDays(sprint.endDate);
    const startKey = new Date(sprint.startDate).toISOString().slice(0, 10);
    const endKey = new Date(sprint.endDate).toISOString().slice(0, 10);

    const reminders: DesktopReminderCandidate[] = [];

    if (startDiff === 0) {
      reminders.push({
        id: `sprint-start-${sprint.id}-${startKey}`,
        title: 'Exam sprint starts today',
        body: `${sprint.name} begins today. Time to lock in your study plan.`,
        route: '/dashboard/sprints',
      });
    } else if (startDiff === 1) {
      reminders.push({
        id: `sprint-start-${sprint.id}-${startKey}`,
        title: 'Exam sprint starts tomorrow',
        body: `${sprint.name} starts tomorrow.`,
        route: '/dashboard/sprints',
      });
    }

    if (endDiff === 0) {
      reminders.push({
        id: `sprint-end-${sprint.id}-${endKey}`,
        title: 'Exam sprint ends today',
        body: `${sprint.name} wraps up today.`,
        route: '/dashboard/sprints',
      });
    }

    return reminders;
  });

  return [...assignmentReminders, ...sprintReminders];
}

export function DesktopRuntime() {
  const { user } = useUser();

  useEffect(() => {
    if (!user || !hasDesktopBridge() || !window.collegeCoreDesktop) {
      return;
    }

    const desktop = window.collegeCoreDesktop;
    let active = true;

    const submitReminders = async () => {
      if (!active) {
        return;
      }

      const reminders = await collectReminderCandidates(user.id);
      await desktop.submitReminders(reminders);
    };

    const unsubscribeReminderPoll = desktop.onReminderPoll(() => {
      void submitReminders();
    });

    const unsubscribeSettingsChanged = desktop.onSettingsChanged(() => {
      void submitReminders();
    });

    void submitReminders();

    return () => {
      active = false;
      unsubscribeReminderPoll();
      unsubscribeSettingsChanged();
    };
  }, [user]);

  return null;
}
