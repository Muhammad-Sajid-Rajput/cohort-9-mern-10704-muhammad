import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNotes } from './useNotes';
import { notesApi } from '../api/notes.api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Note } from '../types/api.types';

vi.mock('../api/notes.api');
vi.mock('../utils/uiActions');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useNotes Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('useGetAll', () => {
    it('fetches all notes with correct parameters', async () => {
      const mockNotes: Note[] = [
        {
          _id: '1',
          user: 'u1',
          title: 'Test Note',
          body: 'Body',
          tags: ['work'],
          createdAt: '',
          updatedAt: '',
        },
      ];
      vi.mocked(notesApi.getAll).mockResolvedValue({
        success: true,
        notes: mockNotes,
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      const { result } = renderHook(() => useNotes().useGetAll({ search: 'test' }), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });

      expect(notesApi.getAll).toHaveBeenCalledWith({ search: 'test' });
      expect(result.current.data?.notes).toEqual(mockNotes);
    });
  });

  describe('update', () => {
    it('calls notesApi.update with correct data', async () => {
      const updateData = { title: 'Updated' };
      const updatedNote: Note = {
        _id: '1',
        user: 'u1',
        title: 'Updated',
        body: 'Body',
        tags: ['work'],
        createdAt: '',
        updatedAt: '',
      };
      vi.mocked(notesApi.update).mockResolvedValue({ success: true, note: updatedNote });

      const { result } = renderHook(() => useNotes(), { wrapper });

      await result.current.update({ id: '1', data: updateData });

      await waitFor(() => {
        expect(notesApi.update).toHaveBeenCalledWith('1', updateData);
      });
    });
  });

  describe('deleteAll', () => {
    it('calls notesApi.deleteAll', async () => {
      vi.mocked(notesApi.deleteAll).mockResolvedValue({ success: true, message: 'Deleted' });

      const { result } = renderHook(() => useNotes(), { wrapper });

      await result.current.deleteAll();

      await waitFor(() => {
        expect(notesApi.deleteAll).toHaveBeenCalled();
      });
    });
  });
});
