import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Check, X, Loader2, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { uiActions } from '../../utils/uiActions';

export const VerifyEmailPage = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { verify } = useAuth();

    const initialEmail = (location.state as { email?: string })?.email || '';
    const [email] = useState(initialEmail);
    const [verificationCode, setVerificationCode] = useState(token || '');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(token ? 'loading' : 'idle');
    const [message, setMessage] = useState('');
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);
    const hasCalled = useRef(false);
  const lastTokenRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        const performVerification = async () => {
            if (!token) return;
            if (lastTokenRef.current !== token) {
                lastTokenRef.current = token;
                hasCalled.current = false;
                setStatus('loading');
                setVerificationCode(token);
            }
            if (!token || hasCalled.current) return;
            hasCalled.current = true;

            try {
                const res = await verify(token);
                setStatus('success');
                setMessage((res as unknown as { message?: string }).message || 'Email verified successfully. Redirecting to login...');
                uiActions.success('Account verified! Redirecting to login...');
                setTimeout(() => navigate('/login'), 1500);
            } catch (err: unknown) {
                setStatus('error');
                setMessage((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Verification link expired or invalid.');
            }
        };

        performVerification();
    }, [token, verify, navigate]);

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const codeToVerify = verificationCode.trim();
        if (!codeToVerify) {
            uiActions.error('Please enter your verification code.');
            return;
        }

        setIsVerifyingCode(true);
        setStatus('loading');

        try {
            const res = await verify(codeToVerify);
            setStatus('success');
            setMessage((res as unknown as { message?: string }).message || 'Email verified successfully.');
            uiActions.success('Account verified! Redirecting to login...');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err: unknown) {
            setStatus('error');
            setMessage((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Invalid or expired verification code.');
            uiActions.error('Verification failed. Please check your code.');
        } finally {
            setIsVerifyingCode(false);
        }
    };

    return (
        <div className="h-screen w-full bg-white flex overflow-hidden selection:bg-black selection:text-white">
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary-tint/30 items-center justify-center p-12 border-r border-outline-variant">
                <img
                    src="/register.png"
                    alt="NotesHub Verify Email Illustration"
                    className="max-w-lg w-full h-auto object-contain animate-in fade-in duration-700"
                />
            </div>

            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center h-full p-8 sm:p-16 lg:p-24 bg-white">
                <div className="w-full max-w-100 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">

                    <div className="space-y-2 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-tint text-primary font-bold text-xs">
                            <ShieldCheck className="w-4 h-4" /> Account Verification
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface leading-tight">Verify Your Email</h1>
                        <p className="text-on-surface-variant font-medium text-sm">
                            {email ? (
                                <>Enter the verification code sent to <strong className="text-on-surface">{email}</strong> to activate your account.</>
                            ) : (
                                <>Copy the verification code sent to your email and paste it below.</>
                            )}
                        </p>
                    </div>

                    <div className="space-y-6">
                        {status === 'loading' && (
                            <div className="flex flex-col items-center justify-center space-y-4 py-8 bg-background rounded-2xl border border-outline-variant">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <p className="text-on-surface font-bold text-sm">Verifying code with server...</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md bg-primary text-on-primary">
                                    <Check className="w-8 h-8" />
                                </div>
                                <div className="space-y-2 text-left">
                                    <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">Email Verified!</h2>
                                    <p className="text-on-surface-variant font-medium text-sm leading-relaxed">
                                        {message || 'Your account is active. Redirecting to login page...'}
                                    </p>
                                </div>

                                <Link to="/login" className="block pt-2">
                                    <Button className="w-full h-12 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 bg-primary text-on-primary hover:bg-primary-hover shadow-md">
                                        Proceed to Login <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-50 text-red-600 border border-red-200">
                                    <X className="w-7 h-7" />
                                </div>
                                <div className="space-y-2 text-left">
                                    <h2 className="text-xl font-extrabold text-on-surface">Verification Failed</h2>
                                    <p className="text-on-surface-variant font-medium text-sm">
                                        {message || 'Verification link or code expired.'}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 pt-2">
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="w-full h-11 rounded-xl font-bold text-xs bg-background border border-outline-variant text-on-surface hover:bg-neutral-50 transition-colors"
                                    >
                                        Try Entering Code Again
                                    </button>
                                    <Link to="/register">
                                        <button className="w-full text-xs font-bold text-primary hover:underline py-2">
                                            Return to Sign up
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {status === 'idle' && (
                            <form onSubmit={handleCodeSubmit} className="space-y-5 text-left">
                                <div className="space-y-2">
                                    <label className="text-xs font-extrabold text-on-surface uppercase tracking-wider">
                                        Enter Verification Code / Token
                                    </label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                                        <input
                                            type="text"
                                            required
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            placeholder="Paste your verification code here..."
                                            className="w-full bg-background border border-outline-variant rounded-xl pl-11 pr-4 py-3.5 text-xs font-semibold placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:bg-white transition-all shadow-xs"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isVerifyingCode}
                                    className="w-full h-12 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 bg-primary text-on-primary hover:bg-primary-hover shadow-md"
                                >
                                    Verify Email Code <ArrowRight className="w-4 h-4" />
                                </Button>
                            </form>
                        )}
                    </div>

                    <div className="pt-6 border-t border-outline-variant/60 text-left">
                        <Link to="/login" className="text-xs font-extrabold text-primary hover:underline">
                            Already verified? Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
