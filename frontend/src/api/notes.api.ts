import { apiClient } from './client';
import { API_CONSTANTS } from '../constants/api';
import type {
  Note,
  PaginatedNotesResponse,
  SingleNoteResponse,
  ChatResponse,
  ApiResponse,
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteQueryParams,
  TrashResponse,
} from '../types/api.types';

/**
 * Notes API client for CRUD operations, batch deletion, AI chat, and trash management.
 */
export const notesApi = {
  getAll: (params?: NoteQueryParams) =>
    apiClient.get<NoteQueryParams, PaginatedNotesResponse>(API_CONSTANTS.NOTES.BASE, { params }),
  getById: (id: string) =>
    apiClient.get<void, SingleNoteResponse>(API_CONSTANTS.NOTES.BY_ID(id)),
  create: (data: CreateNoteRequest) =>
    apiClient.post<CreateNoteRequest, SingleNoteResponse>(API_CONSTANTS.NOTES.BASE, data),
  update: (id: string, data: UpdateNoteRequest) =>
    apiClient.put<UpdateNoteRequest, SingleNoteResponse>(API_CONSTANTS.NOTES.BY_ID(id), data),
  delete: (id: string) =>
    apiClient.delete<void, ApiResponse<void>>(`${API_CONSTANTS.NOTES.BASE}/${id}`),
  deleteAll: () =>
    apiClient.delete<void, ApiResponse<void>>(API_CONSTANTS.NOTES.BASE),
  chat: (data: { message: string; noteId?: string | null }) =>
    apiClient.post<{ message: string; noteId?: string | null }, ChatResponse>(API_CONSTANTS.NOTES.CHAT, data),
  getTrash: () =>
    apiClient.get<void, TrashResponse>(API_CONSTANTS.NOTES.TRASH),
  restore: (id: string) =>
    apiClient.post<void, ApiResponse<Note>>(API_CONSTANTS.NOTES.RESTORE(id)),
  permanentDelete: (id: string) =>
    apiClient.delete<void, ApiResponse<void>>(API_CONSTANTS.NOTES.PERMANENT_DELETE(id)),
  emptyTrash: () =>
    apiClient.delete<void, ApiResponse<void>>(API_CONSTANTS.NOTES.EMPTY_TRASH),
};
