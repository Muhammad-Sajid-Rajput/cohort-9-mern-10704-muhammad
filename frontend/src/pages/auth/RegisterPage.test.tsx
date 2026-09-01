import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterPage } from './RegisterPage';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth.store';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

describe('RegisterPage - UI Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: undefined,
      isAuthenticated: false,
      isInitialized: true,
      isLoading: false,
      signin: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      deleteUser: vi.fn(),
      verify: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    });
    vi.mocked(useAuthStore).mockReturnValue(false);
  });

  it('renders the "Create account" heading', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /Create account/i })).toBeInTheDocument();
  });

  it('renders the username input with correct label', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
  });

  it('renders the email input with correct label', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
  });

  it('renders the password input with correct label', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('renders the "Sign in" link for existing users', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    const link = screen.getByRole('link', { name: /Sign in/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });
});

describe('RegisterPage - Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: undefined,
      isAuthenticated: false,
      isInitialized: true,
      isLoading: false,
      signin: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      deleteUser: vi.fn(),
      verify: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    });
    vi.mocked(useAuthStore).mockReturnValue(false);
  });

  it('shows error when username is empty', async () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/Username too short/i)).toBeInTheDocument();
    });
  });

  it('shows error when password is too short', async () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/Password too short/i)).toBeInTheDocument();
    });
  });
});
