import React, { useState } from 'react';
import { X, KeyRound, Copy, Check } from 'lucide-react';
import adminUserApi from '../../../api/adminUserApi';

const ResetPasswordModal = ({ t, targetUser, onClose, onDone }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const inputStyle = {
    borderColor: t.border,
    backgroundColor: t.chipBg,
    color: t.textPrimary,
  };

  const handleSubmit = async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await adminUserApi.resetPassword(targetUser.id, password);
      setResult({ username: targetUser.username, email: targetUser.email, password });
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not reset password.');
    } finally {
      setSaving(false);
    }
  };

  const copyCredentials = () => {
    if (!result) return;
    const text = `Username: ${result.username}\nEmail: ${result.email}\nPassword: ${result.password}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div
          className="w-full max-w-sm rounded-2xl border p-5"
          style={{ backgroundColor: t.cardBg, borderColor: t.border }}
        >
          <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
            Password reset
          </h4>

          <p className="mt-2 text-xs" style={{ color: t.textMuted }}>
            Save these now — the password won't be visible again.
          </p>

          <div
            className="mt-3 space-y-1.5 rounded-xl border p-3 text-xs"
            style={{ borderColor: t.border, color: t.textPrimary }}
          >
            <p><strong>Username:</strong> {result.username}</p>
            <p><strong>Email:</strong> {result.email}</p>
            <p><strong>Password:</strong> {result.password}</p>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={copyCredentials}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold"
              style={{ borderColor: t.border, color: t.textPrimary }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              type="button"
              onClick={onDone}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white"
              style={{ backgroundColor: t.accentPrimary }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-sm rounded-2xl border p-5"
        style={{ backgroundColor: t.cardBg, borderColor: t.border }}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
            Reset Password — {targetUser.username}
          </h4>

          <button type="button" onClick={onClose} className="cursor-pointer">
            <X size={16} style={{ color: t.textMuted }} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-bold" style={{ color: t.textMuted }}>
              New Password
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={inputStyle}
            />
          </div>

          {error && (
            <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-70"
            style={{ backgroundColor: t.accentPrimary }}
          >
            <KeyRound size={13} />
            {saving ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordModal;