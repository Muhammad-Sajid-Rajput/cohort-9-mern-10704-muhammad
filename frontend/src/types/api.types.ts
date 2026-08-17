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

export interface AuthResponse extends ApiResponse<{ user: User }> {}

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

export interface PaginatedNotesResponse extends ApiResponse<Note[]> {
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface SingleNoteResponse extends ApiResponse<Note> {}

export interface ChatResponse extends ApiResponse<{ reply: string }> {}

