import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDashboardPath, useAuth } from '../context/AuthContext';
import { DevAuthError } from '../utils/devAuth';
import { triggerGoogleAuth } from '../utils/googleAuth';

const GoogleIcon = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const Login = () => {
  const { login, loginWithGoogle, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef2f7] text-sm text-[#6b7280]">
        Loading...
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  const validate = () => {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getErrorMessage = (error) => {
    if (error instanceof DevAuthError) {
      return error.message;
    }
    const message = error?.response?.data?.message;
    if (message) return message;
    if (error?.message === 'Network Error') {
      return 'Unable to reach the server. Please check your connection and try again.';
    }
    return 'Something went wrong. Please try again.';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate() || loading) return;

    setLoading(true);
    setErrors({});

    try {
      const data = await login(email.trim(), password);

      toast.success(data.message || 'Login successful');
      const redirectTo = location.state?.from || getDashboardPath(data.user.role);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = getErrorMessage(error);
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setErrors({});
      const googleAuthPayload = await triggerGoogleAuth();
      const data = await loginWithGoogle(googleAuthPayload);
      toast.success(data.message || 'Google sign-in successful');
      const redirectTo = location.state?.from || getDashboardPath(data.user.role);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      if (error?.isCancelled) {
        toast('Google sign-in was cancelled', {
          icon: 'ℹ️',
          style: {
            borderRadius: '12px',
            background: '#1a2b4c',
            color: '#fff',
          },
        });
        return;
      }
      const message = error.response?.data?.message || error.message || 'Google sign-in failed. Please try again.';
      setErrors({ form: message });
      toast.error(message, { duration: 6000 });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (email.trim()) {
      toast.success(`Password reset instructions sent to ${email.trim()}`);
    } else {
      toast('Please enter your email above to reset password.', {
        icon: 'ℹ️',
        style: {
          borderRadius: '12px',
          background: '#1a2b4c',
          color: '#fff',
        },
      });
    }
  };

  const inputClass =
    'w-full rounded-xl border border-[#e5e7eb] bg-white py-3 pl-11 pr-4 text-sm text-[#1a2b4c] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#1a2b4c] focus:ring-2 focus:ring-[#1a2b4c]/10';

  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-[#eef2f7] px-4 py-8 sm:px-6">
      <div className="flex w-full max-w-[980px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(26,43,76,0.12)] md:min-h-[620px] md:flex-row">
        {/* Branding panel — mobile top */}
        <section className="relative flex h-48 w-full shrink-0 items-center justify-center bg-[#f8fafc] p-6 sm:h-56 sm:p-8 md:hidden">
          <img
            src="/chautari-logo.png"
            alt="Chautari"
            className="h-auto max-h-[170px] w-auto max-w-[85%] object-contain select-none sm:max-h-[190px]"
            loading="eager"
            decoding="sync"
          />
        </section>

        {/* Form panel */}
        <section className="flex w-full flex-1 flex-col justify-center px-6 py-10 sm:px-10 md:w-1/2 md:px-12 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-[#1a2b4c] sm:text-4xl">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-[#6b7280] sm:text-base">
                Sign in to access your dashboard, campus updates, and community tools.
              </p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#1a2b4c]">Sign in</h2>
              <p className="mt-1 text-sm text-[#6b7280]">
                Use the email and password associated with your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {errors.form && (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600"
                  role="alert"
                >
                  {errors.form}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#374151]">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                    aria-hidden="true"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={`${inputClass} ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="mt-1.5 text-xs text-red-500">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#374151]">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`${inputClass} pr-11 ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-[#9ca3af] transition-colors hover:text-[#6b7280]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-1.5 text-xs text-red-500">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer select-none items-center gap-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-[#d1d5db] text-[#1a2b4c] focus:ring-2 focus:ring-[#1a2b4c]/20 accent-[#1a2b4c] cursor-pointer"
                  />
                  <span className="text-sm font-medium text-[#4b5563]">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-semibold text-[#3b82f6] transition-colors hover:text-[#2563eb] hover:underline focus:outline-none focus:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a2b4c] px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#15233d] focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {loading ? 'Logging in...' : 'Sign in'}
              </button>
            </form>

            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full border-t border-[#e5e7eb]"></div>
              <span className="absolute bg-white px-3 text-xs font-medium text-[#6b7280]">or</span>
            </div>

            <button
              type="button"
              disabled={loading || googleLoading}
              onClick={handleGoogleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#f9fafb] hover:border-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 size={18} className="animate-spin text-[#1a2b4c]" aria-hidden="true" />
              ) : (
                <GoogleIcon />
              )}
              {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </button>

            <p className="mt-8 text-center text-sm text-[#6b7280]">
              Don&apos;t have an account?{' '}
              <Link
                to="/signup"
                className="font-semibold text-[#3b82f6] transition-colors hover:text-[#2563eb] focus:outline-none focus:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </section>

        {/* Branding panel */}
        <section className="relative hidden w-full flex-1 items-center justify-center bg-[#f8fafc] p-8 md:flex md:w-1/2 lg:p-12">
          <div className="flex h-full w-full items-center justify-center">
            <img
              src="/chautari-logo.png"
              alt="Chautari"
              className="h-auto max-h-[440px] w-full max-w-[380px] object-contain select-none lg:max-h-[480px] lg:max-w-[420px]"
              loading="eager"
              decoding="sync"
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
