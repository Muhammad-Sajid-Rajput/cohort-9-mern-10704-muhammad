import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { foldersApi } from '../api/folders.api';
import { uiActions } from '../utils/uiActions';

export const useFolders = () => {
  const queryClient = useQueryClient();

  const useGetFolders = (parentFolderId?: string | null) =>
    useQuery({
      queryKey: ['folders', parentFolderId || 'root'],
      queryFn: () => foldersApi.getFolders(parentFolderId),
      staleTime: 0,
    });

  const useGetAllFoldersFlat = () =>
    useQuery({
      queryKey: ['folders', 'flat'],
      queryFn: () => foldersApi.getAllFlat(),
      staleTime: 0,
    });

  const useGetFolderDetails = (folderId: string) =>
    useQuery({
      queryKey: ['folders', 'details', folderId],
      queryFn: () => foldersApi.getDetails(folderId),
      staleTime: 0,
      enabled: Boolean(folderId),
    });

  const createFolderMutation = useMutation({
    mutationFn: (data: { name: string; parentFolderId?: string | null }) =>
      foldersApi.create(data),
    onSuccess: (_, vars) => {
      uiActions.success('Folder created successfully.');
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      if (vars.parentFolderId) {
        queryClient.invalidateQueries({ queryKey: ['folders', 'details', vars.parentFolderId] });
      }
    },
    onError: uiActions.error,
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      foldersApi.rename(id, { name }),
    onSuccess: (_, vars) => {
      uiActions.success('Folder renamed successfully.');
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['folders', 'details', vars.id] });
    },
    onError: uiActions.error,
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => foldersApi.delete(id),
    onSuccess: () => {
      uiActions.success('Folder deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: uiActions.error,
  });

  const addNoteToFolderMutation = useMutation({
    mutationFn: ({ folderId, noteId }: { folderId: string; noteId: string }) =>
      foldersApi.addNote(folderId, noteId),
    onSuccess: (_, vars) => {
      uiActions.success('Note added to folder.');
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['folders', 'details', vars.folderId] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.refetchQueries({ queryKey: ['folders', 'details', vars.folderId] });
    },
    onError: uiActions.error,
  });

  const removeNoteFromFolderMutation = useMutation({
    mutationFn: ({ folderId, noteId }: { folderId: string; noteId: string }) =>
      foldersApi.removeNote(folderId, noteId),
    onSuccess: (_, vars) => {
      uiActions.success('Note removed from folder.');
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['folders', 'details', vars.folderId] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.refetchQueries({ queryKey: ['folders', 'details', vars.folderId] });
    },
    onError: uiActions.error,
  });

  const useGetTrashFolders = () =>
    useQuery({
      queryKey: ['folders', 'trash'],
      queryFn: () => foldersApi.getTrash(),
      staleTime: 0,
    });

  const restoreFolderMutation = useMutation({
    mutationFn: (id: string) => foldersApi.restore(id),
    onSuccess: () => {
      uiActions.success('Folder restored successfully.');
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['folders', 'trash'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes', 'trash'] });
    },
    onError: uiActions.error,
  });

  const permanentDeleteFolderMutation = useMutation({
    mutationFn: (id: string) => foldersApi.permanentDelete(id),
    onSuccess: () => {
      uiActions.success('Folder permanently deleted.');
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['folders', 'trash'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: uiActions.error,
  });

  return {
    useGetFolders,
    useGetAllFoldersFlat,
    useGetFolderDetails,
    createFolder: createFolderMutation.mutateAsync,
    renameFolder: renameFolderMutation.mutateAsync,
    deleteFolder: deleteFolderMutation.mutateAsync,
    addNoteToFolder: addNoteToFolderMutation.mutateAsync,
    removeNoteFromFolder: removeNoteFromFolderMutation.mutateAsync,
    useGetTrashFolders,
    restoreFolder: restoreFolderMutation.mutateAsync,
    permanentDeleteFolder: permanentDeleteFolderMutation.mutateAsync,
  };
};
