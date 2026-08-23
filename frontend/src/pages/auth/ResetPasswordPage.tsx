import { uiActions } from '../../utils/uiActions';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Lock, ArrowRight } from 'lucide-react';

const schema = z.object({
    password: z.string().min(5, 'Password must be at least 5 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordData = z.infer<typeof schema>;

export const ResetPasswordPage = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { resetPassword } = useAuth();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: ResetPasswordData) => {
        if (!token) return;
        try {
            await resetPassword({ token, data });
            navigate('/login');
        } catch (error) {
            uiActions.error(error instanceof Error ? error.message : 'Password reset failed. Token may be invalid or expired.');
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 selection:bg-black selection:text-white">
            <div className="w-full max-w-130 bg-white rounded-2xl p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-neutral-100 space-y-12 animate-in fade-in zoom-in-95 duration-500">

                <div className="space-y-3 text-left">
                    <h1 className="text-[32px] font-extrabold tracking-tight text-neutral-900 leading-tight">Reset Password</h1>
                    <p className="text-neutral-500 font-medium text-base leading-relaxed">Securely update your workspace credentials.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-5">
                        <div className="space-y-2 text-left">
                            <label className="text-sm font-bold text-neutral-800 ml-1">New Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-300 group-focus-within:text-black transition-colors" />
                                <input
                                    {...register('password')}
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-neutral-50 border border-neutral-100 px-12 py-3.5 rounded-2xl text-[14px] font-semibold focus:outline-none focus:border-black focus:ring-0 transition-all shadow-sm"
                                />
                            </div>
                            {errors.password && <p className="text-xs font-bold text-red-500 ml-1">{errors.password.message}</p>}
                        </div>

                        <div className="space-y-2 text-left">
                            <label className="text-sm font-bold text-neutral-800 ml-1">Confirm New Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-300 group-focus-within:text-black transition-colors" />
                                <input
                                    {...register('confirmPassword')}
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-neutral-50 border border-neutral-100 px-12 py-3.5 rounded-2xl text-[14px] font-semibold focus:outline-none focus:border-black focus:ring-0 transition-all shadow-sm"
                                />
                            </div>
                            {errors.confirmPassword && <p className="text-xs font-bold text-red-500 ml-1">{errors.confirmPassword.message}</p>}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        className="w-full h-12 rounded-2xl font-extrabold transition-all active:scale-[0.98] shadow-sm"
                        style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-semantic)' }}
                    >
                        Update Password <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </form>

                <div className="pt-4 text-center border-t border-neutral-100">
                    <Link to="/login" className="text-sm font-bold text-neutral-400 hover:text-black transition-colors">
                        Return to Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};
