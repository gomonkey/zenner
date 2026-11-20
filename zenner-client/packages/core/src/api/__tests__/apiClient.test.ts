import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { apiClient, DEFAULT_DEV_USER_ID } from '../apiClient';
import { useAuthStore } from '../../store/useAuthStore';

describe('apiClient', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      token: null,
      isInitializing: false,
    });
    vi.restoreAllMocks();
  });

  it('has withCredentials set to true', () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it('attaches Bearer token in request header when authenticated', async () => {
    useAuthStore.setState({ token: 'test-token', isAuthenticated: true });

    const config = await (apiClient.interceptors.request as any).handlers[0].fulfilled({
      headers: {},
    });

    expect(config.headers.Authorization).toBe('Bearer test-token');
  });

  it('attaches default dev user id header when unauthenticated', async () => {
    useAuthStore.setState({ token: null, isAuthenticated: false });

    const config = await (apiClient.interceptors.request as any).handlers[0].fulfilled({
      headers: {},
    });

    expect(config.headers['X-User-Id']).toBe(DEFAULT_DEV_USER_ID);
  });

  it('buffers concurrent 401 requests and replays them on successful refresh', async () => {
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { accessToken: 'new-refreshed-token' },
    });

    // Mock adapter on apiClient so retried requests succeed
    apiClient.defaults.adapter = async (config) => ({
      data: { success: true, url: config.url },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    const responseInterceptor = (apiClient.interceptors.response as any).handlers[0].rejected;

    // Simulate two concurrent failing requests
    const fakeError1 = {
      config: { url: '/days/today', headers: {} },
      response: { status: 401 },
    };
    const fakeError2 = {
      config: { url: '/days/other', headers: {} },
      response: { status: 401 },
    };

    const [res1, res2] = await Promise.all([
      responseInterceptor(fakeError1),
      responseInterceptor(fakeError2),
    ]);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().token).toBe('new-refreshed-token');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(res1.data).toEqual({ success: true, url: '/days/today' });
    expect(res2.data).toEqual({ success: true, url: '/days/other' });
    expect(fakeError1.config.headers.Authorization).toBe('Bearer new-refreshed-token');
    expect(fakeError2.config.headers.Authorization).toBe('Bearer new-refreshed-token');
  });

  it('clears in-memory auth on refresh failure', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Refresh failed'));
    useAuthStore.setState({ token: 'old-token', isAuthenticated: true });

    const responseInterceptor = (apiClient.interceptors.response as any).handlers[0].rejected;

    const fakeError = {
      config: { url: '/days/today', headers: {} },
      response: { status: 401 },
    };

    await expect(responseInterceptor(fakeError)).rejects.toThrow('Refresh failed');

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('does not attempt refresh for auth endpoints on 401', async () => {
    const postSpy = vi.spyOn(axios, 'post');
    const responseInterceptor = (apiClient.interceptors.response as any).handlers[0].rejected;

    const loginError = {
      config: { url: '/auth/login', headers: {} },
      response: { status: 401 },
    };

    await expect(responseInterceptor(loginError)).rejects.toEqual(loginError);
    expect(postSpy).not.toHaveBeenCalled();
  });
});
