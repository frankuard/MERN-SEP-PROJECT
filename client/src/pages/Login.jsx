import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout';
import { getDashboardPath, useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../data/themes';

const Login = () => {
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const t = themes[theme];
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c10] text-sm text-[#8b8894]">
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
    'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500/30';

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your dashboard, campus updates, and community tools."
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold" style={{ color: t.textPrimary }}>
          Sign in
        </h2>
        <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
          Use the email and password associated with your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.form && (
          <div
            className="rounded-lg border px-3 py-2.5 text-sm"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.35)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: '#fca5a5',
            }}
            role="alert"
          >
            {errors.form}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            style={{
              backgroundColor: t.pageBg,
              borderColor: errors.email ? '#ef4444' : t.border,
              color: t.textPrimary,
            }}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-xs text-red-400">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${inputClass} pr-11`}
              style={{
                backgroundColor: t.pageBg,
                borderColor: errors.password ? '#ef4444' : t.border,
                color: t.textPrimary,
              }}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3"
              style={{ color: t.textMuted }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="mt-1.5 text-xs text-red-400">
              {errors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {loading ? 'Logging in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: t.textMuted }}>
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="font-medium text-blue-400 transition-colors hover:text-blue-300 focus:outline-none focus:underline"
        >
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
