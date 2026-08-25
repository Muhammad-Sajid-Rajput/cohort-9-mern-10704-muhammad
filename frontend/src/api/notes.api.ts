import { apiClient } from './client';
import { API_CONSTANTS } from '../constants/api';
import type {
  PaginatedNotesResponse,
  SingleNoteResponse,
  ChatResponse,
  ApiResponse,
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteQueryParams,
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
    apiClient.delete<void, ApiResponse<void>>(`${API_CONSTANTS.NOTES.BASE}/${id}`),
  deleteAll: () =>
    apiClient.delete<void, ApiResponse<void>>(API_CONSTANTS.NOTES.BASE),
  chat: (data: { message: string }) =>
    apiClient.post<{ message: string }, ChatResponse>(API_CONSTANTS.NOTES.CHAT, data),
};
