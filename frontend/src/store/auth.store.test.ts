import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';
import type { User } from '../types/api.types';

describe('Auth Store - Initial State', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setInitialized(false);
  });

  it('starts with user as null', () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('starts as not authenticated', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('starts as not initialized', () => {
    expect(useAuthStore.getState().isInitialized).toBe(false);
  });
});

describe('Auth Store - Actions', () => {
  const mockUser: User = {
    _id: '1',
    email: 'test@example.com',
    username: 'testuser',
    isEmailVerified: true,
  };

  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('updates state correctly via setAuth', () => {
    useAuthStore.getState().setAuth(mockUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('clears state correctly via clearAuth', () => {
    useAuthStore.getState().setAuth(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('updates initialization status via setInitialized', () => {
    expect(useAuthStore.getState().isInitialized).toBe(false);

    useAuthStore.getState().setInitialized(true);
    expect(useAuthStore.getState().isInitialized).toBe(true);

    useAuthStore.getState().setInitialized(false);
    expect(useAuthStore.getState().isInitialized).toBe(false);
  });

  it('retains authentication state after setInitialized is called', () => {
    useAuthStore.getState().setAuth(mockUser);
    useAuthStore.getState().setInitialized(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.isInitialized).toBe(true);
  });
});
