import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { uiActions } from '../utils/uiActions';
import type { AuthResponse } from '../types/api.types';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const { user: storeUser, isAuthenticated, isInitialized, setAuth, clearAuth, setInitialized } = useAuthStore();

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const res = await authApi.me();
        const user = res.data?.user;
        if (user) setAuth(user);
        return user;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          clearAuth();
        }
        throw error;
      } finally {
        setInitialized(true);
      }
    },
    retry: false,
    enabled: !isInitialized,
  });

  const handleAuthSuccess = (res: AuthResponse, fallbackMessage: string) => {
    const user = res.data?.user;
    if (user) {
      setAuth(user);
      queryClient.setQueryData(['auth', 'me'], user);
      setInitialized(true);
    }
    uiActions.success(res.message || fallbackMessage);
  };

  const signinMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => authApi.signin(data),
    onSuccess: (res) => handleAuthSuccess(res, 'Successfully logged in.'),
    onError: uiActions.error,
  });

  const signupMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => authApi.signup(data),
    onSuccess: (res) => {
      clearAuth();
      queryClient.removeQueries({ queryKey: ['auth'] });
      uiActions.success(res.message || 'Registration successful. Please verify your email.');
    },
    onError: uiActions.error,
  });

  const clearSession = () => {
    clearAuth();
    queryClient.clear();
  };

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      uiActions.success('Logged out successfully.');
      clearSession();
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: () => authApi.deleteUser(),
    onSuccess: (res) => {
      uiActions.success(res.message || 'Account deleted successfully.');
      clearSession();
    },
    onError: uiActions.error,
  });

  return {
    user: storeUser || meQuery.data,
    isAuthenticated,
    isInitialized,
    isLoading: meQuery.isLoading && !isInitialized,
    signin: signinMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    deleteUser: deleteUserMutation.mutateAsync,
    verify: authApi.verify,
    forgotPassword: authApi.forgotPassword,
    resetPassword: ({ token, data }: { token: string; data: Record<string, unknown> }) =>
      authApi.resetPassword(token, data),
  };
};
