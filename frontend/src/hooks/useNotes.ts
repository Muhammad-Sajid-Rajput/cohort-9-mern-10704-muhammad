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

  const useGetTrash = () => useQuery({
    queryKey: ['notes', 'trash'],
    queryFn: () => notesApi.getTrash(),
    staleTime: 0,
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
    onSuccess: () => {
      uiActions.success('Note moved to trash.');
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes', 'trash'] });
    },
    onError: uiActions.error,
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => notesApi.deleteAll(),
    onSuccess: () => {
      uiActions.success('All notes moved to trash.');
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes', 'trash'] });
    },
    onError: uiActions.error,
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => notesApi.restore(id),
    onSuccess: () => {
      uiActions.success('Note restored to workspace.');
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes', 'trash'] });
    },
    onError: uiActions.error,
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: (id: string) => notesApi.permanentDelete(id),
    onSuccess: () => {
      uiActions.success('Note permanently deleted.');
      queryClient.invalidateQueries({ queryKey: ['notes', 'trash'] });
    },
    onError: uiActions.error,
  });

  const emptyTrashMutation = useMutation({
    mutationFn: () => notesApi.emptyTrash(),
    onSuccess: () => {
      uiActions.success('Trash emptied successfully.');
      queryClient.invalidateQueries({ queryKey: ['notes', 'trash'] });
    },
    onError: uiActions.error,
  });

  const chatMutation = useMutation({
    mutationFn: (data: { message: string; noteId?: string | null }) => notesApi.chat(data),
    onError: uiActions.error,
  });

  return {
    useGetAll,
    useGetById,
    useGetTrash,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    deleteAll: deleteAllMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    permanentDelete: permanentDeleteMutation.mutateAsync,
    emptyTrash: emptyTrashMutation.mutateAsync,
    chat: chatMutation.mutateAsync,
  };
};
