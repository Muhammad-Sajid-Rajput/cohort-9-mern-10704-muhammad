import toast from 'react-hot-toast';
import { parseError } from './errorHandler';

const toastStyle = {
	borderRadius: '16px',
	background: 'var(--color-text-heading, #171717)',
	color: 'var(--color-bg-surface, #ffffff)',
	fontWeight: 'bold',
};

export const uiActions = {
	success: (message: string) => toast.success(message, { style: toastStyle }),
	error: (error: unknown) => {
		const err = parseError(error);
		toast.error(err.message);
		return err;
	},
};
