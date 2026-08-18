import axios from 'axios';

export interface AppError {
  message: string;
  success: boolean;
  errorCode: string;
  fields?: Record<string, string>;
}

export interface ApiErrorPayload {
  message?: string;
  errorCode?: string;
  errors?: Record<string, string>;
}

/**
 * Extracts and normalizes error details from API responses or standard Error instances.
 */
export const parseError = (error: unknown): AppError => {
  if (axios.isAxiosError<ApiErrorPayload>(error) && error.response?.data) {
    const data = error.response.data;
    return {
      message: data.message || 'An unexpected error occurred.',
      success: false,
      errorCode: data.errorCode || 'UNKNOWN_ERROR',
      fields: data.errors,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      success: false,
      errorCode: 'CLIENT_ERROR',
    };
  }

  return {
    message: 'An unexpected error occurred.',
    success: false,
    errorCode: 'UNKNOWN_ERROR',
  };
};
