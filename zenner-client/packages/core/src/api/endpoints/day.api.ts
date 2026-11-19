import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import { DayResponse, DayResponseSchema } from '../../schema/day.schema';

export const dayKeys = {
  all: ['days'] as const,
  today: () => [...dayKeys.all, 'today'] as const,
  detail: (dayId: string) => [...dayKeys.all, 'detail', dayId] as const,
};

function unwrapResponse(payload: unknown): unknown {
  if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
    return (payload as { data: unknown }).data;
  }
  return payload;
}

export async function getDayToday(): Promise<DayResponse> {
  const response = await apiClient.get('/days/today');
  return DayResponseSchema.parse(unwrapResponse(response.data));
}

export async function getDayById(dayId: string): Promise<DayResponse> {
  const response = await apiClient.get(`/days/${dayId}`);
  return DayResponseSchema.parse(unwrapResponse(response.data));
}

export function useTodayQuery() {
  return useQuery({
    queryKey: dayKeys.today(),
    queryFn: getDayToday,
  });
}

export function useDayQuery(dayId: string) {
  return useQuery({
    queryKey: dayKeys.detail(dayId),
    queryFn: () => getDayById(dayId),
    enabled: Boolean(dayId),
  });
}
