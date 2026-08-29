import { apiClient } from './client';
import { API_CONSTANTS } from '../constants/api';
import type {
  PaginatedNotesResponse,
  SingleNoteResponse,
  ChatRequest,
  ChatResponse,
  BaseResponse,
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteQueryParams,
  TrashResponse,
} from '../types/api.types';

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
    apiClient.delete<void, BaseResponse>(`${API_CONSTANTS.NOTES.BASE}/${id}`),
  deleteAll: () =>
    apiClient.delete<void, BaseResponse>(API_CONSTANTS.NOTES.BASE),
  chat: (data: ChatRequest) =>
    apiClient.post<ChatRequest, ChatResponse>(API_CONSTANTS.NOTES.CHAT, data),
  getTrash: () =>
    apiClient.get<void, TrashResponse>(API_CONSTANTS.NOTES.TRASH),
  restore: (id: string) =>
    apiClient.post<void, SingleNoteResponse>(API_CONSTANTS.NOTES.RESTORE(id)),
  permanentDelete: (id: string) =>
    apiClient.delete<void, SingleNoteResponse>(API_CONSTANTS.NOTES.PERMANENT_DELETE(id)),
  emptyTrash: () =>
    apiClient.delete<void, BaseResponse>(API_CONSTANTS.NOTES.EMPTY_TRASH),
};
