import { uiActions } from '../../utils/uiActions';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Mail, ChevronLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordData = z.infer<typeof schema>;

export const ForgotPasswordPage = () => {
    const { forgotPassword } = useAuth();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordData>({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data: ForgotPasswordData) => {
        try {
            await forgotPassword(data);
            setIsSubmitted(true);
        } catch (error) {
            uiActions.error(error instanceof Error ? error.message : 'Password recovery request failed.');
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 selection:bg-black selection:text-white">
            <div className="w-full max-w-130 bg-white rounded-2xl p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-neutral-100 space-y-12 animate-in fade-in zoom-in-95 duration-500">

                <div className="space-y-3 text-left">
                    <h1 className="text-[32px] font-extrabold tracking-tight text-neutral-900 leading-tight">Forgot Password?</h1>
                    <p className="text-neutral-500 font-medium text-base leading-relaxed">
                        {isSubmitted
                            ? "We've sent a recovery link to your registered email address."
                            : "Enter your email address and we'll send you a secure link to reset your password."
                        }
                    </p>
                </div>

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-4 text-left">
                            <div className="space-y-2">
                                <label htmlFor="forgot-email-input" className="text-sm font-bold text-neutral-800 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-300 group-focus-within:text-black transition-colors" />
                                    <input
                                        {...register('email')}
                                        id="forgot-email-input"
                                        type="email"
                                        placeholder="name@example.com"
                                        className="w-full bg-neutral-50 border border-neutral-100 px-12 py-3.5 rounded-2xl text-[14px] font-semibold focus:outline-none focus:border-black focus:ring-0 transition-all shadow-sm"
                                    />
                                </div>
                                {errors.email && <p className="text-xs font-bold text-red-500 ml-1">{errors.email.message}</p>}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            className="w-full h-12 rounded-2xl font-extrabold transition-all active:scale-[0.98] shadow-sm"
                            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-semantic)' }}
                        >
                            Send Reset Link <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </form>
                ) : (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-semantic)' }}>
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-neutral-900 font-extrabold text-2xl tracking-tight leading-tight">Check your inbox</p>
                            <p className="text-neutral-500 font-medium">If an account exists for that email, you'll receive reset instructions shortly.</p>
                        </div>
                    </div>
                )}

                <div className="pt-4 text-center border-t border-neutral-100">
                    <Link to="/login" className="inline-flex items-center gap-2 text-neutral-400 hover:text-black font-extrabold text-sm transition-colors group">
                        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};
