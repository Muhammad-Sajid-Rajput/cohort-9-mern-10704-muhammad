import { apiClient } from './client';
import { API_CONSTANTS } from '../constants/api';
import type { AuthResponse, ApiResponse } from '../types/api.types';

export const authApi = {
  signup: (data: Record<string, unknown>) => apiClient.post<Record<string, unknown>, AuthResponse>(API_CONSTANTS.AUTH.SIGNUP, data),
  signin: (data: Record<string, unknown>) => apiClient.post<Record<string, unknown>, AuthResponse>(API_CONSTANTS.AUTH.LOGIN, data),
  logout: () => apiClient.get<void, ApiResponse<void>>(API_CONSTANTS.AUTH.LOGOUT),
  deleteUser: () => apiClient.delete<void, ApiResponse<void>>(API_CONSTANTS.AUTH.DELETE_USER),
  me: () => apiClient.get<void, AuthResponse>(API_CONSTANTS.AUTH.ME),
  verify: (token: string) => apiClient.get<void, ApiResponse<void>>(API_CONSTANTS.AUTH.VERIFY(token)),
  refresh: () => apiClient.get<void, ApiResponse<void>>(API_CONSTANTS.AUTH.REFRESH),
  forgotPassword: (data: Record<string, unknown>) => apiClient.post<Record<string, unknown>, ApiResponse<void>>(API_CONSTANTS.AUTH.FORGOT_PASSWORD, data),
  resetPassword: (token: string, data: Record<string, unknown>) => apiClient.post<Record<string, unknown>, ApiResponse<void>>(API_CONSTANTS.AUTH.RESET_PASSWORD(token), data),
};
