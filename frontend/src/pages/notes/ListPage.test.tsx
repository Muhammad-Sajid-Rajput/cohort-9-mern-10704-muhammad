import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListPage } from './ListPage';
import { MemoryRouter } from 'react-router-dom';
import { useNotes } from '../../hooks/useNotes';
import { useFolders } from '../../hooks/useFolders';
import type { PaginatedNotesResponse, FoldersResponse, Note, ChatResponse, ChatRequest } from '../../types/api.types';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';

vi.mock('../../hooks/useNotes', () => ({
  useNotes: vi.fn(),
}));

vi.mock('../../hooks/useFolders', () => ({
  useFolders: vi.fn(),
}));

const createFoldersMock = (overrides?: Partial<ReturnType<typeof useFolders>>): ReturnType<typeof useFolders> => ({
  useGetFolders: vi.fn(),
  useGetFolderDetails: vi.fn(),
  useGetAllFoldersFlat: () => ({ data: { success: true, data: [], folders: [] } as FoldersResponse, isLoading: false } as unknown as UseQueryResult<FoldersResponse, Error>),
  createFolder: vi.fn(),
  renameFolder: vi.fn(),
  deleteFolder: vi.fn(),
  addNoteToFolder: vi.fn(),
  removeNoteFromFolder: vi.fn(),
  useGetTrashFolders: vi.fn(),
  restoreFolder: vi.fn(),
  permanentDeleteFolder: vi.fn(),
  ...overrides,
});

const createNotesMock = (overrides?: Partial<ReturnType<typeof useNotes>>): ReturnType<typeof useNotes> => ({
  useGetById: vi.fn(),
  useGetAll: () => ({ data: undefined, isLoading: false } as unknown as UseQueryResult<PaginatedNotesResponse, Error>),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteAll: vi.fn(),
  useGetTrash: vi.fn(),
  restore: vi.fn(),
  permanentDelete: vi.fn(),
  emptyTrash: vi.fn(),
  chat: vi.fn() as unknown as UseMutationResult<ChatResponse, Error, ChatRequest>['mutateAsync'],
  ...overrides,
});

describe('ListPage - Initial Loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFolders).mockReturnValue(createFoldersMock());
    vi.mocked(useNotes).mockReturnValue(
      createNotesMock({
        useGetAll: () => ({
          data: undefined,
          isLoading: true,
          isFetching: false,
          isError: false,
          refetch: vi.fn(),
        } as unknown as UseQueryResult<PaginatedNotesResponse, Error>),
      })
    );
  });

  it('shows loading state when fetching notes', () => {
    const { container } = render(
      <MemoryRouter>
        <ListPage />
      </MemoryRouter>
    );
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});

describe('ListPage - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFolders).mockReturnValue(createFoldersMock());
    vi.mocked(useNotes).mockReturnValue(
      createNotesMock({
        useGetAll: () => ({
          data: { success: true, notes: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } } as PaginatedNotesResponse,
          isLoading: false,
          isFetching: false,
          isError: false,
          refetch: vi.fn(),
        } as unknown as UseQueryResult<PaginatedNotesResponse, Error>),
      })
    );
  });

  it('displays empty state heading and message', () => {
    render(
      <MemoryRouter>
        <ListPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/No Notes Found/i)).toBeInTheDocument();
    expect(screen.getByText(/Your workspace is empty/i)).toBeInTheDocument();
  });

  it('renders the "Capture Note" action button linking to new note', () => {
    render(
      <MemoryRouter>
        <ListPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /Capture Note/i })).toBeInTheDocument();
  });
});

describe('ListPage - Notes List & Search', () => {
  const mockNotes: Note[] = [
    {
      _id: '1',
      user: 'u1',
      title: 'First Note',
      body: 'Content 1',
      content: 'Content 1',
      tags: ['work'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      user: 'u1',
      title: 'Second Note',
      body: 'Content 2',
      content: 'Content 2',
      tags: ['personal'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFolders).mockReturnValue(createFoldersMock());
    vi.mocked(useNotes).mockReturnValue(
      createNotesMock({
        useGetAll: vi.fn().mockReturnValue({
          data: { success: true, notes: mockNotes, pagination: { total: 2, page: 1, limit: 10, totalPages: 1 } } as PaginatedNotesResponse,
          isLoading: false,
          isFetching: false,
          isError: false,
          refetch: vi.fn(),
        } as unknown as UseQueryResult<PaginatedNotesResponse, Error>),
      })
    );
  });

  it('renders the list of notes with their titles', () => {
    render(
      <MemoryRouter>
        <ListPage />
      </MemoryRouter>
    );
    expect(screen.getByText('First Note')).toBeInTheDocument();
    expect(screen.getByText('Second Note')).toBeInTheDocument();
  });

  it('renders the search input field', () => {
    render(
      <MemoryRouter>
        <ListPage />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/Search notes by title or content/i)).toBeInTheDocument();
  });

  it('updates search input value when typing', () => {
    render(
      <MemoryRouter>
        <ListPage />
      </MemoryRouter>
    );
    const input = screen.getByPlaceholderText(/Search notes by title or content/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'query' } });
    expect(input.value).toBe('query');
  });

  it('renders tag filter buttons', () => {
    render(
      <MemoryRouter>
        <ListPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/All Tags/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^work$/i })).toBeInTheDocument();
  });
});

describe('ListPage - Management Actions', () => {
  const mockNotes: Note[] = [
    {
      _id: '1',
      user: 'u1',
      title: 'Note To Delete',
      body: 'Bye bye',
      content: 'Bye bye',
      tags: ['work'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  const mockDelete = vi.fn();
  const mockDeleteAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFolders).mockReturnValue(createFoldersMock());
    vi.mocked(useNotes).mockReturnValue(
      createNotesMock({
        useGetAll: () => ({
          data: { success: true, notes: mockNotes, pagination: { total: 1, page: 1, limit: 10, totalPages: 1 } } as PaginatedNotesResponse,
          isLoading: false,
          isFetching: false,
          isError: false,
          refetch: vi.fn(),
        } as unknown as UseQueryResult<PaginatedNotesResponse, Error>),
        delete: mockDelete,
        deleteAll: mockDeleteAll,
      })
    );
  });

  it('opens note options menu when clicking More actions', () => {
    render(
      <MemoryRouter>
        <ListPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByTitle(/More actions/i));
    expect(screen.getByText(/Move to Trash/i)).toBeInTheDocument();
  });

  it('shows clear all confirmation when clicking Clear All button', () => {
    render(
      <MemoryRouter>
        <ListPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Clear All/i }));
    expect(screen.getByText(/Clear entire workspace\?/i)).toBeInTheDocument();
  });
});
