import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout';
import { getDashboardPath, useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../data/themes';
import { DevAuthError } from '../utils/devAuth';

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'staff', label: 'Staff' },
];

const Signup = () => {
  const { register, login, isAuthenticated, user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const t = themes[theme];
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: '',
    semester: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.username.trim()) {
      nextErrors.username = 'Username is required.';
    } else if (formData.username.trim().length < 3) {
      nextErrors.username = 'Username must be at least 3 characters.';
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
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

    const payload = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role,
    };

    if (formData.department.trim()) {
      payload.department = formData.department.trim();
    }
    if (formData.semester.trim()) {
      payload.semester = formData.semester.trim();
    }

    try {
      const data = await register(payload);
      toast.success(data.message || 'Account created successfully');

      if (data.devMode && data.user) {
        navigate(getDashboardPath(data.user.role), { replace: true });
        return;
      }

      try {
        const loginData = await login(formData.email.trim(), formData.password);
        navigate(getDashboardPath(loginData.user.role), { replace: true });
      } catch (loginError) {
        const loginMessage = getErrorMessage(loginError);
        toast.error(loginMessage);
        navigate('/login', { replace: true });
      }
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
      title="Join your campus community"
      subtitle="Create an account to access campus services, connect with peers, and stay updated."
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold" style={{ color: t.textPrimary }}>
          Create account
        </h2>
        <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
          Teacher and staff accounts require admin approval before you can sign in.
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
          <label htmlFor="username" className="mb-1.5 block text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={formData.username}
            onChange={(event) => updateField('username', event.target.value)}
            className={inputClass}
            style={{
              backgroundColor: t.pageBg,
              borderColor: errors.username ? '#ef4444' : t.border,
              color: t.textPrimary,
            }}
          />
          {errors.username && <p className="mt-1.5 text-xs text-red-400">{errors.username}</p>}
        </div>

        <div>
          <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(event) => updateField('email', event.target.value)}
            className={inputClass}
            style={{
              backgroundColor: t.pageBg,
              borderColor: errors.email ? '#ef4444' : t.border,
              color: t.textPrimary,
            }}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="role" className="mb-1.5 block text-sm font-medium">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={(event) => updateField('role', event.target.value)}
            className={inputClass}
            style={{
              backgroundColor: t.pageBg,
              borderColor: t.border,
              color: t.textPrimary,
            }}
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="department" className="mb-1.5 block text-sm font-medium">
              Department <span style={{ color: t.textMuted }}>(optional)</span>
            </label>
            <input
              id="department"
              name="department"
              type="text"
              value={formData.department}
              onChange={(event) => updateField('department', event.target.value)}
              className={inputClass}
              style={{
                backgroundColor: t.pageBg,
                borderColor: t.border,
                color: t.textPrimary,
              }}
            />
          </div>

          <div>
            <label htmlFor="semester" className="mb-1.5 block text-sm font-medium">
              Semester <span style={{ color: t.textMuted }}>(optional)</span>
            </label>
            <input
              id="semester"
              name="semester"
              type="text"
              value={formData.semester}
              onChange={(event) => updateField('semester', event.target.value)}
              className={inputClass}
              style={{
                backgroundColor: t.pageBg,
                borderColor: t.border,
                color: t.textPrimary,
              }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={formData.password}
              onChange={(event) => updateField('password', event.target.value)}
              className={`${inputClass} pr-11`}
              style={{
                backgroundColor: t.pageBg,
                borderColor: errors.password ? '#ef4444' : t.border,
                color: t.textPrimary,
              }}
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
          {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(event) => updateField('confirmPassword', event.target.value)}
              className={`${inputClass} pr-11`}
              style={{
                backgroundColor: t.pageBg,
                borderColor: errors.confirmPassword ? '#ef4444' : t.border,
                color: t.textPrimary,
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3"
              style={{ color: t.textMuted }}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: t.textMuted }}>
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-blue-400 transition-colors hover:text-blue-300 focus:outline-none focus:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Signup;
