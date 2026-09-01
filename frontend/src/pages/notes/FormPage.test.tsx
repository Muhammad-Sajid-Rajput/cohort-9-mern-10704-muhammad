import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormPage } from './FormPage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useNotes } from '../../hooks/useNotes';
import type { SingleNoteResponse, Note } from '../../types/api.types';

vi.mock('../../hooks/useNotes', () => ({
  useNotes: vi.fn(),
}));

vi.mock('../../components/editor/RichTextEditor', () => ({
  RichTextEditor: ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <textarea
      data-testid="rich-text-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const createNotesMock = (overrides = {}) => ({
  useGetById: () => ({ data: undefined, isLoading: false }),
  useGetAll: () => ({ data: undefined, isLoading: false }),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteAll: vi.fn(),
  useGetTrash: () => ({ data: undefined, isLoading: false }),
  restore: vi.fn(),
  permanentDelete: vi.fn(),
  emptyTrash: vi.fn(),
  chat: vi.fn(),
  ...overrides,
});

describe('FormPage - Create Mode', () => {
  const mockCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotes).mockReturnValue(
      createNotesMock({ create: mockCreate }) as unknown as ReturnType<typeof useNotes>
    );
  });

  it('renders "Create Note" button for new notes', () => {
    render(
      <MemoryRouter>
        <FormPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Create Note/i })).toBeInTheDocument();
  });

  it('renders placeholder for title input', () => {
    render(
      <MemoryRouter>
        <FormPage />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/e.g. Architecture Decisions/i)).toBeInTheDocument();
  });

  it('shows validation error for short title', async () => {
    render(
      <MemoryRouter>
        <FormPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText(/e.g. Architecture Decisions/i), { target: { value: 'ab' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Note/i }));
    await waitFor(() => {
      expect(screen.getByText(/Title is too short/i)).toBeInTheDocument();
    });
  });

  it('calls create with correct data on valid submission', async () => {
    render(
      <MemoryRouter>
        <FormPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/e.g. Architecture Decisions/i), { target: { value: 'New Amazing Note' } });
    fireEvent.change(screen.getByTestId('rich-text-editor'), { target: { value: 'This is a long enough body for validation.' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Note/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      const callData = mockCreate.mock.calls[0][0];
      expect(callData.title).toBe('New Amazing Note');
      expect(callData.body).toBe('This is a long enough body for validation.');
      expect(callData.tags).toContain('work');
    });
  });
});

describe('FormPage - Edit Mode', () => {
  const mockUpdate = vi.fn();
  const existingNote: Note = {
    _id: '123',
    user: 'u1',
    title: 'Existing Note',
    body: 'This is the existing content of the note.',
    content: 'This is the existing content of the note.',
    tags: ['work'],
    createdAt: '',
    updatedAt: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotes).mockReturnValue(
      createNotesMock({
        useGetById: () => ({ data: { success: true, note: existingNote } as SingleNoteResponse, isLoading: false }),
        update: mockUpdate,
      }) as unknown as ReturnType<typeof useNotes>
    );
  });

  it('renders "Save Changes" button for editing notes', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/123/edit']}>
        <Routes>
          <Route path="/notes/:id/edit" element={<FormPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
    });
  });

  it('populates the form with existing note data', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/123/edit']}>
        <Routes>
          <Route path="/notes/:id/edit" element={<FormPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing Note')).toBeInTheDocument();
      expect(screen.getByDisplayValue('This is the existing content of the note.')).toBeInTheDocument();
    });
  });
});
