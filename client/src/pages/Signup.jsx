import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDashboardPath, useAuth } from '../context/AuthContext';
import { DevAuthError } from '../utils/devAuth';

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'staff', label: 'Staff' },
];

const Signup = () => {
  const { register, login, isAuthenticated, user, loading: authLoading } = useAuth();
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
      <div className="flex min-h-screen items-center justify-center bg-[#eef2f7] text-sm text-[#6b7280]">
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
    'w-full rounded-xl border border-[#e5e7eb] bg-white py-3 pl-11 pr-4 text-sm text-[#1a2b4c] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#1a2b4c] focus:ring-2 focus:ring-[#1a2b4c]/10';

  const selectClass =
    'w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#1a2b4c] outline-none transition-colors focus:border-[#1a2b4c] focus:ring-2 focus:ring-[#1a2b4c]/10';

  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-[#eef2f7] px-4 py-8 sm:px-6">
      <div className="flex w-full max-w-245 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(26,43,76,0.12)] md:min-h-155 md:flex-row">
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
        <section className="flex w-full flex-1 flex-col justify-center px-6 py-10 sm:px-10 md:max-h-[90vh] md:overflow-y-auto md:px-12 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-[#1a2b4c] sm:text-4xl">
                Join your campus community
              </h1>
              <p className="mt-2 text-sm text-[#6b7280] sm:text-base">
                Create an account to access campus services, connect with peers, and stay updated.
              </p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#1a2b4c]">Create account</h2>
              <p className="mt-1 text-sm text-[#6b7280]">
                Teacher and staff accounts require admin approval before you can sign in.
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
                <label htmlFor="username" className="mb-2 block text-sm font-semibold text-[#374151]">
                  Username
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                    aria-hidden="true"
                  />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    onChange={(event) => updateField('username', event.target.value)}
                    className={`${inputClass} ${errors.username ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  />
                </div>
                {errors.username && <p className="mt-1.5 text-xs text-red-500">{errors.username}</p>}
              </div>

              <div>
                <label htmlFor="signup-email" className="mb-2 block text-sm font-semibold text-[#374151]">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                    aria-hidden="true"
                  />
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    className={`${inputClass} ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="role" className="mb-2 block text-sm font-semibold text-[#374151]">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={(event) => updateField('role', event.target.value)}
                  className={selectClass}
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
                  <label htmlFor="department" className="mb-2 block text-sm font-semibold text-[#374151]">
                    Department <span className="font-normal text-[#6b7280]">(optional)</span>
                  </label>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    value={formData.department}
                    onChange={(event) => updateField('department', event.target.value)}
                    className={`${inputClass} pl-4!`}
                  />
                </div>

                <div>
                  <label htmlFor="semester" className="mb-2 block text-sm font-semibold text-[#374151]">
                    Semester <span className="font-normal text-[#6b7280]">(optional)</span>
                  </label>
                  <input
                    id="semester"
                    name="semester"
                    type="text"
                    value={formData.semester}
                    onChange={(event) => updateField('semester', event.target.value)}
                    className={`${inputClass} pl-4!`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-password" className="mb-2 block text-sm font-semibold text-[#374151]">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                    aria-hidden="true"
                  />
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    className={`${inputClass} pr-11 ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
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
                {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-[#374151]">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                    aria-hidden="true"
                  />
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(event) => updateField('confirmPassword', event.target.value)}
                    className={`${inputClass} pr-11 ${errors.confirmPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-[#9ca3af] transition-colors hover:text-[#6b7280]"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a2b4c] px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#15233d] focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[#6b7280]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-[#3b82f6] transition-colors hover:text-[#2563eb] focus:outline-none focus:underline"
              >
                Sign in
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

export default Signup;
