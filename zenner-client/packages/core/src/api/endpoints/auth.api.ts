import { apiClient } from '../apiClient';
import {
  LoginRequest,
  LogoutRequest,
  TokenResponse,
  TokenResponseSchema,
} from '../../schema/auth.schema';

function unwrapResponse(payload: unknown): unknown {
  if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
    return (payload as { data: unknown }).data;
  }
  return payload;
}

export async function login(credentials: LoginRequest): Promise<TokenResponse> {
  const response = await apiClient.post('/auth/login', credentials);
  return TokenResponseSchema.parse(unwrapResponse(response.data));
}

export async function refresh(): Promise<TokenResponse> {
  const response = await apiClient.post('/auth/refresh');
  return TokenResponseSchema.parse(unwrapResponse(response.data));
}

export async function logout(data?: LogoutRequest): Promise<void> {
  await apiClient.post('/auth/logout', data ?? { allDevices: false });
}

export const authApi = {
  login,
  refresh,
  logout,
};
