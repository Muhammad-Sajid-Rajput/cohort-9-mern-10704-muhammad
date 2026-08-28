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
  user: string;
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
}

export interface UpdateNoteRequest {
  title?: string;
  body?: string;
  tags?: ('work' | 'personal' | 'life')[];
}

export interface NoteQueryParams {
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sort?: string;
}
