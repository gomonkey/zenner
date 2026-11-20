import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../useAuthStore';
import { authApi } from '../../api/endpoints/auth.api';

describe('useAuthStore', () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    useAuthStore.setState({
      isAuthenticated: false,
      token: null,
      isInitializing: true,
    });
    vi.clearAllMocks();
  });

  it('stores access token strictly in memory and sets isAuthenticated: true', () => {
    useAuthStore.getState().login('access-token-123');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('access-token-123');

    // Confirm localStorage was never touched
    expect(localStorageMock.getItem).not.toHaveBeenCalled();
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('clears token on logout and calls authApi.logout', async () => {
    const logoutSpy = vi.spyOn(authApi, 'logout').mockResolvedValue(undefined);
    useAuthStore.setState({ isAuthenticated: true, token: 'some-token' });

    await useAuthStore.getState().logout(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(logoutSpy).toHaveBeenCalledWith({ allDevices: true });
    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
  });

  it('checkAuth silently transitions to authenticated state on valid refresh', async () => {
    vi.spyOn(authApi, 'refresh').mockResolvedValue({
      accessToken: 'refreshed-jwt-token',
      tokenType: 'Bearer',
      expiresIn: 900,
    });

    await useAuthStore.getState().checkAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('refreshed-jwt-token');
    expect(state.isInitializing).toBe(false);
  });

  it('checkAuth finishes initialization as unauthenticated on 401/error', async () => {
    vi.spyOn(authApi, 'refresh').mockRejectedValue(new Error('Unauthorized'));

    await useAuthStore.getState().checkAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.isInitializing).toBe(false);
  });
});
