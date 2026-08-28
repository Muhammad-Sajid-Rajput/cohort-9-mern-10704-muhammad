import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

const schema = z.object({
    username: z.string().min(2, 'Username too short').max(255),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(5, 'Password too short')
});

type RegisterFormData = z.infer<typeof schema>;

export const RegisterPage = () => {
    const { signup } = useAuth();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        resolver: zodResolver(schema),
    });

    if (isAuthenticated) {
        return <Navigate to="/notes" replace />;
    }

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await signup(data);
            navigate('/verify-email', { state: { email: data.email } });
        } catch (error) {
            console.error('Registration failed', error);
        }
    };

    return (
        <div className="h-screen w-full bg-white flex overflow-hidden selection:bg-black selection:text-white">
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary-tint/30 items-center justify-center p-12 border-r border-outline-variant">
                <img
                    src="/registerImage.png"
                    alt="NotesHub Registration Illustration"
                    className="max-w-lg w-full h-auto object-contain animate-in fade-in duration-700"
                />
            </div>
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center h-full p-12 sm:p-24 lg:p-32 bg-white">
                <div className="w-full max-w-100 space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">

                    <div className="space-y-2 text-left">
                        <h1 className="text-[32px] font-extrabold tracking-tight text-neutral-900 leading-tight">Create account</h1>
                        <p className="text-neutral-500 font-medium text-base">Join NotesHub and start organizing today.</p>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left">
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="username" className="text-sm font-bold text-neutral-800 ml-1">Username</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 group-focus-within:text-black transition-colors" />
                                    <input
                                        id="username"
                                        {...register('username')}
                                        type="text"
                                        placeholder="johndoe"
                                        className="w-full bg-neutral-50 border border-neutral-100 px-12 py-3.5 rounded-2xl text-[14px] font-semibold focus:outline-none focus:border-black focus:ring-0 transition-all shadow-sm"
                                    />
                                </div>
                                {errors.username && <p className="text-xs font-bold text-red-500 ml-1">{errors.username.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-bold text-neutral-800 ml-1">Email address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 group-focus-within:text-black transition-colors" />
                                    <input
                                        id="email"
                                        {...register('email')}
                                        type="email"
                                        placeholder="name@example.com"
                                        className="w-full bg-neutral-50 border border-neutral-100 px-12 py-3.5 rounded-2xl text-[14px] font-semibold focus:outline-none focus:border-black focus:ring-0 transition-all shadow-sm"
                                    />
                                </div>
                                {errors.email && <p className="text-xs font-bold text-red-500 ml-1">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" title="password" className="text-sm font-bold text-neutral-800 ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 group-focus-within:text-black transition-colors" />
                                    <input
                                        id="password"
                                        {...register('password')}
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-neutral-50 border border-neutral-100 px-12 py-3.5 rounded-2xl text-[14px] font-semibold focus:outline-none focus:border-black focus:ring-0 transition-all shadow-sm"
                                    />
                                </div>
                                {errors.password && <p className="text-xs font-bold text-red-500 ml-1">{errors.password.message}</p>}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            className="w-full h-12 rounded-2xl font-extrabold transition-all active:scale-[0.98] shadow-sm"
                            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-semantic)' }}
                        >
                            Create account <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </form>

                    <div className="pt-6">
                        <p className="text-sm font-semibold text-neutral-500">
                            Already have an account? <Link to="/login" className="text-black font-extrabold hover:underline underline-offset-4">Sign in here</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
