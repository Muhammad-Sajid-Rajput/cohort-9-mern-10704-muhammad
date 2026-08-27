import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { uiActions } from '../utils/uiActions';
import type {
  AuthResponse,
  SignupRequest,
  SigninRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types/api.types';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const { user: storeUser, isAuthenticated, isInitialized, setAuth, clearAuth, setInitialized } = useAuthStore();

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const res = await authApi.me();
        const user = res.user ?? res.data?.user;
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

  const handleAuthSuccess = async (res: AuthResponse, fallbackMessage: string): Promise<void> => {
    let user = res.user ?? res.data?.user;
    if (!user) {
      try {
        const meRes = await authApi.me();
        user = meRes.user ?? meRes.data?.user;
      } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to fetch user session.');
      }
    }
    if (!user) {
      throw new Error('Authentication succeeded without user data.');
    }
    setAuth(user);
    queryClient.setQueryData(['auth', 'me'], user);
    setInitialized(true);
    uiActions.success(res.message || fallbackMessage);
  };

  const signinMutation = useMutation({
    mutationFn: async (data: SigninRequest) => {
      try {
        const res = await authApi.signin(data);
        await handleAuthSuccess(res, 'Successfully logged in.');
        return res;
      } catch (error) {
        throw error instanceof Error ? error : new Error('Signin failed.');
      }
    },
    onError: uiActions.error,
  });

  const signupMutation = useMutation({
    mutationFn: (data: SignupRequest) => authApi.signup(data),
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
    onSuccess: () => {
      uiActions.success('Logged out successfully.');
      clearSession();
    },
    onError: (error) => {
      clearSession();
      uiActions.error(error);
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
    forgotPassword: (data: ForgotPasswordRequest) => authApi.forgotPassword(data),
    resetPassword: ({ token, data }: { token: string; data: ResetPasswordRequest }) =>
      authApi.resetPassword(token, data),
  };
};
