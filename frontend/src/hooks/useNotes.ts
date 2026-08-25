import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '../api/notes.api';
import { uiActions } from '../utils/uiActions';
import type { CreateNoteRequest, UpdateNoteRequest, NoteQueryParams } from '../types/api.types';

export const useNotes = (params?: NoteQueryParams) => {
  const queryClient = useQueryClient();

  const useGetAll = (p?: NoteQueryParams) => useQuery({
    queryKey: ['notes', p || params],
    queryFn: () => notesApi.getAll(p || params),
    staleTime: 0,
  });

  const useGetById = (id: string) => useQuery({
    queryKey: ['notes', id],
    queryFn: () => notesApi.getById(id),
    staleTime: 0,
    enabled: !!id,
  });

  const mutationOptions = (msg: string, invalidate = true) => ({
    onSuccess: () => {
      uiActions.success(msg);
      if (invalidate) queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: uiActions.error,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateNoteRequest) => notesApi.create(data),
    ...mutationOptions('Note captured successfully.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteRequest }) => notesApi.update(id, data),
    onSuccess: (_, vars) => {
      uiActions.success('Changes synced to workspace.');
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes', vars.id] });
    },
    onError: uiActions.error,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notesApi.delete(id),
    ...mutationOptions('Note permanently removed.'),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => notesApi.deleteAll(),
    ...mutationOptions('Your workspace has been cleared.'),
  });

  const chatMutation = useMutation({
    mutationFn: (data: { message: string }) => notesApi.chat(data),
    onError: uiActions.error,
  });

  return {
    useGetAll,
    useGetById,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    deleteAll: deleteAllMutation.mutateAsync,
    chat: chatMutation.mutateAsync,
  };
};
