import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from './LoginPage';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth.store';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

describe('LoginPage - UI Rendering', () => {
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

  it('renders the "Welcome back" heading', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
  });

  it('renders the supportive description text', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByText(/Sign in to your account to continue/i)).toBeInTheDocument();
  });

  it('renders the email input field with correct label', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
  });

  it('renders the email input with correct placeholder', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument();
  });

  it('renders the password input field with correct label', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('renders the password input with correct placeholder', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
  });

  it('renders the "Forgot?" password link', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    const link = screen.getByRole('link', { name: /Forgot?/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/forgot-password');
  });

  it('renders the "Sign in" button', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });

  it('renders the "Create account" link', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    const link = screen.getByRole('link', { name: /Create account/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/register');
  });

  it('renders the decorative background image', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByAltText(/NotesHub Login Illustration/i)).toBeInTheDocument();
  });
});

describe('LoginPage - Form Validation', () => {
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

  it('displays error if email is left empty', async () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/Enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('displays error if password is too short', async () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/Password too short/i)).toBeInTheDocument();
    });
  });
});
