import React, { useState } from 'react';
import { X, UserPlus, ShieldCheck, Copy, Check } from 'lucide-react';

import adminUserApi from '../../../api/adminUserApi';
import { DEPARTMENTS } from '../../../data/departmentSemesters';

const ADMIN_SECTIONS = [
  { value: 'super', label: 'Super Admin' },
  { value: 'canteen', label: 'Canteen Admin' },
  { value: 'ssd', label: 'SSD Admin' },
  { value: 'rte', label: 'RTE Admin' },
  { value: 'resources', label: 'Resources Admin' },
];

const COMMUNITY_ROLE = 'staff';

const CreateStaffModal = ({ t, onClose, onCreated }) => {
  const [role, setRole] = useState('teacher');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    department: '',
    adminSection: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null); // holds credentials to show, admin role only
  const [copied, setCopied] = useState(false);

  const inputStyle = {
    borderColor: t.border,
    backgroundColor: t.chipBg,
    color: t.textPrimary,
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setError('Username, email and password are required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (role === 'admin' && !form.adminSection) {
      setError('Please select which admin panel this account belongs to.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
      };
      if (role === 'teacher') {
        payload.department = form.department;
      } else if (role === 'admin') {
        payload.adminSection = form.adminSection;
      }

      await adminUserApi.createStaff(payload);

      if (role === 'admin') {
        // Admin passwords are hashed immediately — this is the only moment
        // the plain credentials can be shown, so show a confirmation
        // screen instead of closing straight away.
        setCreated({
          username: payload.username,
          email: payload.email,
          password: payload.password,
          adminSection: payload.adminSection,
        });
      } else {
        onCreated();
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not create account.');
    } finally {
      setSaving(false);
    }
  };

  const copyCredentials = () => {
    if (!created) return;
    const text = `Username: ${created.username}\nEmail: ${created.email}\nPassword: ${created.password}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // ── Confirmation screen after creating an admin account ──
  if (created) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div
          className="w-full max-w-sm rounded-2xl border p-5"
          style={{ backgroundColor: t.cardBg, borderColor: t.border }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} style={{ color: t.accentPrimary }} />
            <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
              Admin account created
            </h4>
          </div>

          <p className="mt-2 text-xs" style={{ color: t.textMuted }}>
            Save these credentials now — the password won't be visible again.
          </p>

          <div
            className="mt-3 space-y-1.5 rounded-xl border p-3 text-xs"
            style={{ borderColor: t.border, color: t.textPrimary }}
          >
            <p><strong>Username:</strong> {created.username}</p>
            <p><strong>Email:</strong> {created.email}</p>
            <p><strong>Password:</strong> {created.password}</p>
            <p><strong>Panel:</strong> {ADMIN_SECTIONS.find((s) => s.value === created.adminSection)?.label}</p>
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
              onClick={onCreated}
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

  // ── Create form ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-sm rounded-2xl border p-5"
        style={{ backgroundColor: t.cardBg, borderColor: t.border }}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
            Add Staff Account
          </h4>

          <button type="button" onClick={onClose} className="cursor-pointer">
            <X size={16} style={{ color: t.textMuted }} />
          </button>
        </div>

        {/* Role toggle */}
        <div
          className="mt-4 inline-flex w-full items-center gap-1 rounded-full border p-1"
          style={{ borderColor: t.border }}
        >
          {['teacher', COMMUNITY_ROLE, 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className="flex-1 cursor-pointer rounded-full py-1.5 text-xs font-bold capitalize transition-colors"
              style={{
                backgroundColor: role === r ? t.accentPrimary : 'transparent',
                color: role === r ? t.pageBg : t.textPrimary,
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-bold" style={{ color: t.textMuted }}>
              Username
            </label>
            <input
              value={form.username}
              onChange={(e) => updateField('username', e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs font-bold" style={{ color: t.textMuted }}>
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs font-bold" style={{ color: t.textMuted }}>
              Temporary Password
            </label>
            <input
              type="text"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={inputStyle}
            />
          </div>

          {role === 'teacher' && (
            <div>
              <label className="text-xs font-bold" style={{ color: t.textMuted }}>
                Department
              </label>
              <select
                value={form.department}
                onChange={(e) => updateField('department', e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                style={inputStyle}
              >
                <option value="">No department set</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}

          {role === 'admin' && (
            <div>
              <label className="text-xs font-bold" style={{ color: t.textMuted }}>
                Admin Panel
              </label>
              <select
                value={form.adminSection}
                onChange={(e) => updateField('adminSection', e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                style={inputStyle}
              >
                <option value="">Select panel</option>
                {ADMIN_SECTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          )}

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
            <UserPlus size={13} />
            {saving ? 'Creating...' : `Create ${role === 'admin' ? 'Admin' : role === COMMUNITY_ROLE ? 'Community' : 'Teacher'} Account`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStaffModal;