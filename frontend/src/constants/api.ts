export const API_CONSTANTS = {
	BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
	AUTH: {
		SIGNUP: '/auth/signup',
		LOGIN: '/auth/signin',
		LOGOUT: '/auth/logout',
		VERIFY: (token: string) => `/auth/verify/${token}`,
		REFRESH: '/auth/refreshToken',
		FORGOT_PASSWORD: '/auth/forgotPassword',
		RESET_PASSWORD: (token: string) => `/auth/resetPassword/${token}`,
		ME: '/auth/me',
		DELETE_USER: '/auth/deleteUser',
	},
	NOTES: {
		BASE: '/notes',
		BY_ID: (id: string) => `/notes/${id}`,
		CHAT: '/notes/chat',
	},
} as const;
