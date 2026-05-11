import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from './authStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.logout());
  });

  it('starts with unauthenticated state', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it('sets user and token on login', () => {
    const { result } = renderHook(() => useAuthStore());
    const user = { id: '1', email: 'test@test.com', name: 'Test', role: 'admin' as const };

    act(() => result.current.login(user, 'token-123', 'refresh-123'));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(user);
    expect(result.current.accessToken).toBe('token-123');
  });

  it('clears state on logout', () => {
    const { result } = renderHook(() => useAuthStore());
    const user = { id: '1', email: 'test@test.com', name: 'Test', role: 'admin' as const };

    act(() => result.current.login(user, 'token-123', 'refresh-123'));
    act(() => result.current.logout());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it('updates access token', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => result.current.setAccessToken('new-token'));

    expect(result.current.accessToken).toBe('new-token');
  });
});
