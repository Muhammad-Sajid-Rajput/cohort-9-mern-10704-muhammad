export interface User {
  _id: string;
  username: string;
  email: string;
  isEmailVerified: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  data?: { user: User };
}

export interface Note {
  _id: string;
  title: string;
  body: string;
  content?: string;
  tags: ('work' | 'personal' | 'life')[];
  folder?: string | null;
  user: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedNotesResponse {
  success: boolean;
  message?: string;
  data?: Note[];
  notes?: Note[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SingleNoteResponse {
  success: boolean;
  message?: string;
  data?: Note;
  note?: Note;
}

export interface ChatRequest {
  message: string;
  noteId?: string | null;
}

export interface ChatResponse {
  success: boolean;
  reply?: string;
  data?: { reply: string };
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
}

export interface CreateNoteRequest {
  title: string;
  body: string;
  tags: ('work' | 'personal' | 'life')[];
  folder?: string | null;
}

export interface UpdateNoteRequest {
  title?: string;
  body?: string;
  tags?: ('work' | 'personal' | 'life')[];
  folder?: string | null;
}

export interface NoteQueryParams {
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface TrashResponse {
  success: boolean;
  message?: string;
  notes?: Note[];
  data?: Note[];
}

export interface Folder {
  _id: string;
  name: string;
  user: string;
  parentFolder?: string | null;
  subfolderCount?: number;
  noteCount?: number;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderBreadcrumb {
  _id: string;
  name: string;
}

export interface FolderDetailsResponse extends ApiResponse<Folder> {
  folder: Folder;
  breadcrumbs: FolderBreadcrumb[];
  subfolders: Folder[];
  notes: Note[];
}

export interface SingleFolderResponse extends ApiResponse<Folder> {
  folder?: Folder;
}

export interface FoldersResponse extends ApiResponse<Folder[]> {
  folders: Folder[];
}
