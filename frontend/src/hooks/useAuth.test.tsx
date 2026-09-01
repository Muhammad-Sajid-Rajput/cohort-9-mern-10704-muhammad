import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { uiActions } from '../utils/uiActions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('../api/auth.api');
vi.mock('../utils/uiActions');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setInitialized(false);
    vi.mocked(authApi.me).mockResolvedValue({ success: true, user: undefined });
  });

  describe('signin', () => {
    it('handles signin errors via uiActions', async () => {
      vi.mocked(authApi.signin).mockRejectedValue({ response: { data: { message: 'Error' } } });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.signin({ email: 'test@example.com', password: 'wrong' });
        } catch {
          // Expected rejection
        }
      });

      expect(uiActions.error).toHaveBeenCalled();
    });
  });
});
