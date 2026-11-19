import { z } from 'zod';

export const TaskActionSchema = z.enum(['DO', 'SCHEDULE', 'DELEGATE', 'DELETE']);
export type TaskAction = z.infer<typeof TaskActionSchema>;

export const TimeblockItemResponseSchema = z.object({
  id: z.string().uuid(),
  detail: z.string(),
  finished: z.boolean(),
});
export type TimeblockItemResponse = z.infer<typeof TimeblockItemResponseSchema>;

export const TimeblockResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  finished: z.boolean(),
  startTime: z.string(), // "HH:mm:ss" or "HH:mm"
  endTime: z.string(),   // "HH:mm:ss" or "HH:mm"
  items: z.array(TimeblockItemResponseSchema).default([]),
});
export type TimeblockResponse = z.infer<typeof TimeblockResponseSchema>;

export const TaskResponseSchema = z.object({
  id: z.string().uuid(),
  detail: z.string(),
  action: TaskActionSchema,
  scheduledTime: z.string().nullable().optional(),
  finished: z.boolean().nullable().optional(),
  delegatedTo: z.string().nullable().optional(),
});
export type TaskResponse = z.infer<typeof TaskResponseSchema>;

export const ReminderResponseDtoSchema = z.object({
  id: z.string().uuid(),
  reminderId: z.string().uuid(),
  content: z.string(),
  completed: z.boolean(),
  note: z.string().nullable().optional(),
  answeredAt: z.string().nullable().optional(),
});
export type ReminderResponseDto = z.infer<typeof ReminderResponseDtoSchema>;

export const DayResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string(), // "YYYY-MM-DD"
  blocked: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  timeblocks: z.array(TimeblockResponseSchema).default([]),
  tasks: z.array(TaskResponseSchema).default([]),
  reminderResponses: z.array(ReminderResponseDtoSchema).default([]),
});
export type DayResponse = z.infer<typeof DayResponseSchema>;

// Matrix View Models mapped from canonical TaskResponse
export interface MatrixDoTask {
  id: string;
  task: string;
  when: string;
  done: boolean;
}

export interface MatrixScheduleTask {
  id: string;
  task: string;
  when: string;
}

export interface MatrixDelegateTask {
  id: string;
  task: string;
  who: string;
}

export interface MatrixDeleteTask {
  id: string;
  task: string;
}

export interface EisenhowerMatrixData {
  do: MatrixDoTask[];
  schedule: MatrixScheduleTask[];
  delegate: MatrixDelegateTask[];
  delete: MatrixDeleteTask[];
}
