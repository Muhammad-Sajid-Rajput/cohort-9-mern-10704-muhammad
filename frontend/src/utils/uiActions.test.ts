import { describe, it, expect, vi } from 'vitest';
import { uiActions } from './uiActions';
import toast from 'react-hot-toast';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('uiActions utility', () => {
  it('calls toast.success correctly', () => {
    uiActions.success('Operation successful');
    expect(toast.success).toHaveBeenCalledWith('Operation successful', expect.any(Object));
  });

  it('calls toast.error and parses error correctly', () => {
    const mockError = new Error('Failed to fetch');
    const result = uiActions.error(mockError);
    
    expect(toast.error).toHaveBeenCalledWith('Failed to fetch');
    expect(result.message).toBe('Failed to fetch');
    expect(result.errorCode).toBe('CLIENT_ERROR');
  });
});
