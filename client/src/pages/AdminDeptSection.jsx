import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const SECTION_LABELS = {
  super: 'Super Admin',
  canteen: 'Canteen Admin',
  ssd: 'SSD Admin',
  rte: 'RTE Admin',
  resources: 'Resources Admin',
};

const VALID_SECTIONS = Object.keys(SECTION_LABELS);

const AdminDeptSection = () => {
  const { section } = useParams();
  const { user, loading, login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValidSection = VALID_SECTIONS.includes(section);

  // super counts as authorized for every card; everyone else must match
  // their own adminSection exactly.
  // Accounts with no adminSection set (your original admin accounts,
  // before this department system existed) are treated as super — same
  // as 'super' explicitly, full access to every card.
  const isSuperAccount = (u) => !u?.adminSection || u.adminSection === 'super';

  const isAuthorized =
    user?.role === 'admin' &&
    (isSuperAccount(user) || user.adminSection === section);

  // The super panel already exists at /admin/dashboard — once authorized
  // here, bounce straight there instead of rendering anything in this file.
  useEffect(() => {
    if (section === 'super' && isAuthorized) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [section, isAuthorized, navigate]);
  // Also true for a super account clicking any *other* card by mistake —
  // they're authorized, but the super panel itself only lives at
  // /admin/dashboard, so route them there for consistency.

  if (!isValidSection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>Unknown admin section.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-sm text-neutral-400">
        Loading...
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await login(email, password);
      const loggedInUser = data?.user;

      const authorized =
        loggedInUser?.role === 'admin' &&
        (isSuperAccount(loggedInUser) || loggedInUser?.adminSection === section);

      if (!authorized) {
        toast.error("This account doesn't have access to this department");
        await logout();
      }
      // if authorized, `user` in context updates and this component
      // re-renders straight into the panel branch below (or the effect
      // above redirects, for super).
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-neutral-700 bg-neutral-900 p-8">
          <h1 className="text-xl font-bold text-white">{SECTION_LABELS[section]}</h1>
          <p className="mt-1 text-sm text-neutral-400">Sign in to continue</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-400">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-white"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-white py-2 text-sm font-bold text-black disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authorized, and this isn't 'super' (that case already redirected away).
  switch (section) {
    case 'canteen':
      return <div className="min-h-screen bg-black p-8 text-white">Canteen panel goes here.</div>;
    default:
      return <div className="min-h-screen bg-black p-8 text-white">{SECTION_LABELS[section]} panel coming soon.</div>;
  }
};

export default AdminDeptSection;