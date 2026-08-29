import { apiClient } from './client';
import { API_CONSTANTS } from '../constants/api';
import type {
  Folder,
  FoldersResponse,
  FolderDetailsResponse,
  ApiResponse,
  SingleFolderResponse,
  Note,
} from '../types/api.types';

export const foldersApi = {
  getTrash: () =>
    apiClient.get<void, FoldersResponse>(API_CONSTANTS.FOLDERS.TRASH),
  restore: (id: string) =>
    apiClient.post<void, ApiResponse<Folder>>(API_CONSTANTS.FOLDERS.RESTORE_TRASH(id)),
  permanentDelete: (id: string) =>
    apiClient.delete<void, ApiResponse<void>>(API_CONSTANTS.FOLDERS.PERMANENT_DELETE_TRASH(id)),
  getFolders: (parentFolderId?: string | null) =>
    apiClient.get<{ parentFolderId?: string }, FoldersResponse>(API_CONSTANTS.FOLDERS.BASE, {
      params: parentFolderId ? { parentFolderId } : undefined,
    }),
  getAllFlat: () =>
    apiClient.get<void, FoldersResponse>(API_CONSTANTS.FOLDERS.ALL),
  getDetails: (id: string) =>
    apiClient.get<void, FolderDetailsResponse>(API_CONSTANTS.FOLDERS.BY_ID(id)),
  create: (data: { name: string; parentFolderId?: string | null }) =>
    apiClient.post<{ name: string; parentFolderId?: string | null }, SingleFolderResponse>(
      API_CONSTANTS.FOLDERS.BASE,
      data,
    ),
  rename: (id: string, data: { name: string }) =>
    apiClient.put<{ name: string }, SingleFolderResponse>(API_CONSTANTS.FOLDERS.BY_ID(id), data),
  delete: (id: string) =>
    apiClient.delete<void, ApiResponse<void>>(API_CONSTANTS.FOLDERS.BY_ID(id)),
  addNote: (folderId: string, noteId: string) =>
    apiClient.post<{ noteId: string }, ApiResponse<Note>>(
      API_CONSTANTS.FOLDERS.NOTES(folderId),
      { noteId },
    ),
  removeNote: (folderId: string, noteId: string) =>
    apiClient.delete<void, ApiResponse<void>>(
      API_CONSTANTS.FOLDERS.REMOVE_NOTE(folderId, noteId),
    ),
};
