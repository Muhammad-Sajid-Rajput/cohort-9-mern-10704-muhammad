import { AxiosError } from 'axios';

export interface AppError {
	message: string;
	success: boolean;
	errorCode: string;
	fields?: Record<string, string>;
}

export function parseError(error: unknown): AppError {
	if (error instanceof AxiosError && error.response?.data) {
		const data = error.response.data;
		return {
			message: data.message || 'An unexpected error occurred.',
			success: false,
			errorCode: data.errorCode || 'UNKNOWN_ERROR',
			fields: data.errors,
		};
	}

	if (error instanceof Error) {
		return {
			message: error.message,
			success: false,
			errorCode: 'CLIENT_ERROR',
		};
	}

	return {
		message: 'An unknown error occurred.',
		success: false,
		errorCode: 'UNKNOWN_ERROR',
	};
}
