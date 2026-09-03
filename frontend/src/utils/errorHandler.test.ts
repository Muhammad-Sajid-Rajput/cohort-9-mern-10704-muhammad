import { describe, it, expect } from 'vitest';
import { parseError } from './errorHandler';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';

describe('errorHandler utility', () => {
  it('parses AxiosError correctly', () => {
    const mockData = {
      message: 'Email already exists',
      errorCode: 'EMAIL_EXISTS',
      errors: { email: 'Duplicate' },
    };
    const axiosError = new AxiosError(
      'Request failed',
      '400',
      undefined,
      undefined,
      {
        data: mockData,
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      }
    );

    const result = parseError(axiosError);
    expect(result.message).toBe(mockData.message);
    expect(result.errorCode).toBe(mockData.errorCode);
    expect(result.fields).toEqual(mockData.errors);
    expect(result.success).toBe(false);
  });

  it('parses generic Error correctly', () => {
    const error = new Error('Something went wrong');
    const result = parseError(error);
    expect(result.message).toBe('Something went wrong');
    expect(result.errorCode).toBe('CLIENT_ERROR');
    expect(result.success).toBe(false);
  });

  it('handles unknown error types', () => {
    const result = parseError('weird string');
    expect(result.message).toBe('An unexpected error occurred.');
    expect(result.errorCode).toBe('UNKNOWN_ERROR');
    expect(result.success).toBe(false);
  });
});
