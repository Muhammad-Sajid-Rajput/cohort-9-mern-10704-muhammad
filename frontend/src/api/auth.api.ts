import { apiClient } from './client';
import { API_CONSTANTS } from '../constants/api';
import type {
  AuthResponse,
  ApiResponse,
  SignupRequest,
  SigninRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types/api.types';

export const authApi = {
  signup: (data: SignupRequest) => apiClient.post<SignupRequest, AuthResponse>(API_CONSTANTS.AUTH.SIGNUP, data),
  signin: (data: SigninRequest) => apiClient.post<SigninRequest, AuthResponse>(API_CONSTANTS.AUTH.LOGIN, data),
  logout: () => apiClient.post<void, ApiResponse<void>>(API_CONSTANTS.AUTH.LOGOUT),
  deleteUser: () => apiClient.delete<void, ApiResponse<void>>(API_CONSTANTS.AUTH.DELETE_USER),
  me: () => apiClient.get<void, AuthResponse>(API_CONSTANTS.AUTH.ME),
  verify: (token: string) => apiClient.get<void, ApiResponse<void>>(API_CONSTANTS.AUTH.VERIFY(token)),
  refresh: () => apiClient.post<void, ApiResponse<void>>(API_CONSTANTS.AUTH.REFRESH),
  forgotPassword: (data: ForgotPasswordRequest) => apiClient.post<ForgotPasswordRequest, ApiResponse<void>>(API_CONSTANTS.AUTH.FORGOT_PASSWORD, data),
  resetPassword: (token: string, data: ResetPasswordRequest) => apiClient.post<ResetPasswordRequest, ApiResponse<void>>(API_CONSTANTS.AUTH.RESET_PASSWORD(token), data),
};
