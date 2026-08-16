import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDashboardPath, useAuth } from '../context/AuthContext';
import { DevAuthError } from '../utils/devAuth';

const Login = () => {
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const inputClass =
    'w-full rounded-xl border border-[#e5e7eb] bg-white py-3 pl-11 pr-4 text-sm text-[#1a2b4c] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#1a2b4c] focus:ring-2 focus:ring-[#1a2b4c]/10';

  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-[#eef2f7] px-4 py-8 sm:px-6">
      <div className="flex w-full max-w-[980px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(26,43,76,0.12)] md:min-h-[620px] md:flex-row">
        {/* Branding panel — mobile top */}
        <section className="flex h-44 w-full shrink-0 items-center justify-center bg-[#eef2f7] px-6 sm:h-52 md:hidden">
          <img
            src="/chautari-logo.png"
            alt="Chautari"
            className="h-auto max-h-full w-auto max-w-full object-contain"
          />
        </section>

        {/* Form panel */}
        <section className="flex w-full flex-1 flex-col justify-center px-6 py-10 sm:px-10 md:px-12 lg:px-14">
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

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a2b4c] px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#15233d] focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {loading ? 'Logging in...' : 'Sign in'}
              </button>
            </form>

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
        <section className="hidden w-full flex-1 items-center justify-center bg-[#eef2f7] px-8 py-10 md:flex">
          <img
            src="/chautari-logo.png"
            alt="Chautari"
            className="h-auto max-h-[320px] w-auto max-w-full object-contain lg:max-h-[360px]"
          />
        </section>
      </div>
    </div>
  );
};

export default Login;
