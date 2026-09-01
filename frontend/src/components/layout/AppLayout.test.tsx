import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppLayout } from './AppLayout';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../types/api.types';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../chat/ChatBot', () => ({
  ChatBot: () => <div data-testid="mock-chatbot">ChatBot</div>,
}));

describe('AppLayout - UI Rendering', () => {
  const mockLogout = vi.fn();
  const mockUser: User = {
    _id: '1',
    username: 'testuser',
    email: 'test@example.com',
    isEmailVerified: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isInitialized: true,
      isLoading: false,
      logout: mockLogout,
      signin: vi.fn(),
      signup: vi.fn(),
      deleteUser: vi.fn(),
      verify: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    });
  });

  it('renders the application brand logo/name', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );
    expect(screen.getByText(/NotesHub/i)).toBeInTheDocument();
  });

  it('renders the "New Note" button in sidebar', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );
    expect(screen.getByText(/New Note/i)).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );
    expect(screen.getByText(/All Notes/i)).toBeInTheDocument();
  });

  it('renders the settings link', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
  });

  it('displays the current user\'s username', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );
    expect(screen.getByText(/testuser/i)).toBeInTheDocument();
  });

  it('renders the chatbot component', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );
    expect(screen.getByTestId('mock-chatbot')).toBeInTheDocument();
  });
});
