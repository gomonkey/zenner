export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  note?: string;     // Ghi chú ngắn hiển thị trên Timeblock
  color?: string;    // CSS class or hex
}

export interface Reminder {
  id: string;
  label: string;
  value: 'Y' | 'N';
}

export interface DoTask {
  id: string;
  task: string;
  when: string;
  done: boolean;
}

export interface ScheduleTask {
  id: string;
  task: string;
  when: string;
}

export interface DelegateTask {
  id: string;
  task: string;
  who: string;
}

export interface DeleteTask {
  id: string;
  task: string;
}

export interface MockHomeData {
  date: string;
  selectedWeek: string;
  selectedMonth: string;
  reminders: Reminder[];
  gratitudeQuote: string;
  dailyGoal: string;
  events: CalendarEvent[];
  matrix: {
    do: DoTask[];
    schedule: ScheduleTask[];
    delegate: DelegateTask[];
    delete: DeleteTask[];
  };
}

export const initialMockData: MockHomeData = {
  date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  selectedWeek: 'Week 1',
  selectedMonth: new Date().toLocaleString('en-US', { month: 'short' }),
  gratitudeQuote: "Take the moment to think about you and the thing about you. It's often too easy to get catch up in our own lives. Please take a moment to express gratitude.",
  dailyGoal: "Today I will meditate at 10:00, read at 8:00, and exercise at 11:00",
  reminders: [
    { id: 'rem-1', label: 'Uống đủ 2L nước mỗi ngày', value: 'Y' },
    { id: 'rem-2', label: 'Tập thể dục 30 phút buổi sáng', value: 'N' },
    { id: 'rem-3', label: 'Đọc 10 trang sách trước khi đi ngủ', value: 'Y' },
    { id: 'rem-4', label: 'Học tiếng Anh trên Duolingo', value: 'N' },
    { id: 'rem-5', label: 'Review PR của các thành viên khác', value: 'Y' },
  ],
  events: [
    { id: 'evt-1', title: 'Daily Standup Meeting', startTime: '09:00', endTime: '09:30', note: 'Sync with frontend team', color: 'sky' },
    { id: 'evt-2', title: 'Deep Work: Coding Home Page', startTime: '10:00', endTime: '12:00', note: 'Implement Eisenhower Matrix & Timeblock', color: 'primary' },
    { id: 'evt-3', title: 'Lunch & Relax', startTime: '12:00', endTime: '13:00', note: 'Lunch with Elena at cafe', color: 'amber' },
    { id: 'evt-4', title: '1-on-1 with Tech Lead', startTime: '14:00', endTime: '14:45', note: 'Discuss PR comments & convention.md', color: 'purple' },
    { id: 'evt-5', title: 'Design System Review', startTime: '15:30', endTime: '17:00', note: 'Review hand-drawn styles on web/mobile', color: 'emerald' },
  ],
  matrix: {
    do: [
      { id: 'do-1', task: 'Fix critical auth redirection bug', when: 'Morning (10 AM)', done: false },
      { id: 'do-2', task: 'Deploy staging build for client review', when: 'Before 5 PM', done: true },
      { id: 'do-3', task: 'Submit timesheet for this week', when: 'End of Day', done: false },
    ],
    schedule: [
      { id: 'sch-1', task: 'Research React Native push notifications', when: 'Tuesday 2 PM' },
      { id: 'sch-2', task: 'Write unit tests for authentication hook', when: 'Wednesday Morning' },
      { id: 'sch-3', task: 'Plan sprint backlog for next week', when: 'Thursday' },
    ],
    delegate: [
      { id: 'del-1', task: 'Update API documentation on Postman', who: 'Alex (Junior Dev)' },
      { id: 'del-2', task: 'Prepare slide presentation deck', who: 'Elena (Designer)' },
    ],
    delete: [
      { id: 'dlt-1', task: 'Scroll social media feed during deep work hours' },
      { id: 'dlt-2', task: 'Attend non-essential alignment sync call' },
    ]
  }
};
