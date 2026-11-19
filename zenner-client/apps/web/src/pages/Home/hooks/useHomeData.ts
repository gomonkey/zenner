import { useState, useEffect, useMemo } from 'react';
import { useTodayQuery } from '@zenner/core/api/endpoints/day.api';
import { TimeblockEvent } from '@zenner/ui';
import { EisenhowerMatrixData } from '@zenner/core/schema/day.schema';

export interface ReminderItem {
  id: string;
  label: string;
  value: 'Y' | 'N';
}

export interface HomeViewData {
  date: string;
  selectedWeek: string;
  selectedMonth: string;
  reminders: ReminderItem[];
  gratitudeQuote: string;
  dailyGoal: string;
  events: TimeblockEvent[];
  matrix: EisenhowerMatrixData;
}

const DEFAULT_GRATITUDE =
  "Take a moment to reflect on your day and express gratitude. Living one day at a time brings clarity.";

export function useHomeData() {
  const { data: dayData, isLoading, isError, error, refetch } = useTodayQuery();

  // Local-only UI fields until backend schema adds support
  const [dailyGoal, setDailyGoal] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('zenner-daily-goal') || '';
    }
    return '';
  });

  const [gratitudeQuote] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('zenner-gratitude-quote') || DEFAULT_GRATITUDE;
    }
    return DEFAULT_GRATITUDE;
  });

  const [selectedWeek, setSelectedWeek] = useState<string>('Week 1');
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    new Date().toLocaleString('en-US', { month: 'short' })
  );

  // Local overrides for optimistic toggle states before mutation endpoints exist
  const [localCompletedTasks, setLocalCompletedTasks] = useState<Record<string, boolean>>({});
  const [localCompletedReminders, setLocalCompletedReminders] = useState<Record<string, 'Y' | 'N'>>({});

  // Theme selection
  const [themeBoost, setThemeBoost] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('zenner-boost-theme-selected') || 'default';
    }
    return 'default';
  });

  useEffect(() => {
    const handleThemeUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.deleted && detail.id === themeBoost) {
        toggleThemeBoost('default');
      }
    };

    window.addEventListener('zenner:theme-updated', handleThemeUpdate);
    return () => {
      window.removeEventListener('zenner:theme-updated', handleThemeUpdate);
    };
  }, [themeBoost]);

  const toggleThemeBoost = (theme: string) => {
    setThemeBoost(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zenner-boost-theme-selected', theme);
    }
  };

  const handleToggleReminder = (reminderId: string) => {
    setLocalCompletedReminders((prev) => {
      const current = prev[reminderId];
      const nextVal = current === 'Y' ? 'N' : 'Y';
      return { ...prev, [reminderId]: nextVal };
    });
  };

  const handleToggleDoTask = (taskId: string) => {
    setLocalCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleTimeGoalChange = (value: string) => {
    setDailyGoal(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zenner-daily-goal', value);
    }
  };

  const pageData: HomeViewData = useMemo(() => {
    const formattedDate = dayData?.date
      ? new Date(`${dayData.date}T00:00:00`).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

    const monthName = dayData?.date
      ? new Date(`${dayData.date}T00:00:00`).toLocaleString('en-US', { month: 'short' })
      : selectedMonth;

    const events: TimeblockEvent[] = (dayData?.timeblocks || []).map((tb) => ({
      id: tb.id,
      title: tb.title,
      startTime: tb.startTime.slice(0, 5),
      endTime: tb.endTime.slice(0, 5),
      note: tb.items && tb.items.length > 0 ? tb.items.map((i) => i.detail).join(', ') : undefined,
    }));

    const doTasks = (dayData?.tasks || [])
      .filter((t) => t.action === 'DO')
      .map((t) => {
        const isFinished =
          localCompletedTasks[t.id] !== undefined
            ? localCompletedTasks[t.id]
            : Boolean(t.finished);
        return {
          id: t.id,
          task: t.detail,
          when: t.scheduledTime ? t.scheduledTime.slice(11, 16) : '',
          done: isFinished,
        };
      });

    const scheduleTasks = (dayData?.tasks || [])
      .filter((t) => t.action === 'SCHEDULE')
      .map((t) => ({
        id: t.id,
        task: t.detail,
        when: t.scheduledTime ? t.scheduledTime.slice(11, 16) : '',
      }));

    const delegateTasks = (dayData?.tasks || [])
      .filter((t) => t.action === 'DELEGATE')
      .map((t) => ({
        id: t.id,
        task: t.detail,
        who: t.delegatedTo || '',
      }));

    const deleteTasks = (dayData?.tasks || [])
      .filter((t) => t.action === 'DELETE')
      .map((t) => ({
        id: t.id,
        task: t.detail,
      }));

    const reminders: ReminderItem[] = (dayData?.reminderResponses || []).map((r) => {
      const overrideVal = localCompletedReminders[r.id];
      const initialVal = r.completed ? 'Y' : 'N';
      return {
        id: r.id,
        label: r.content,
        value: overrideVal !== undefined ? overrideVal : initialVal,
      };
    });

    return {
      date: formattedDate,
      selectedWeek,
      selectedMonth: monthName,
      reminders,
      gratitudeQuote,
      dailyGoal,
      events,
      matrix: {
        do: doTasks,
        schedule: scheduleTasks,
        delegate: delegateTasks,
        delete: deleteTasks,
      },
    };
  }, [
    dayData,
    selectedWeek,
    selectedMonth,
    gratitudeQuote,
    dailyGoal,
    localCompletedTasks,
    localCompletedReminders,
  ]);

  return {
    dayData,
    pageData,
    isLoading,
    isError,
    error,
    refetch,
    themeBoost,
    toggleThemeBoost,
    handleToggleReminder,
    handleToggleDoTask,
    handleTimeGoalChange,
    handleSelectWeek: setSelectedWeek,
    handleSelectMonth: setSelectedMonth,
  };
}
