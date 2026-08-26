import React, { useState, useEffect, useMemo } from 'react';

import {
  Users,
  Search,
  Pencil,
  X,
  Save,
  GraduationCap,
  Building2,
  Trash2,
} from 'lucide-react';

import adminUserApi from '../../../api/adminUserApi';

const ROLE_FILTERS = ['All', 'student', 'teacher', 'staff', 'admin'];

const ROLE_BADGE = {
  student: { bg: '#dbeafe', text: '#1d4ed8' },
  teacher: { bg: '#ede9fe', text: '#6d28d9' },
  staff: { bg: '#fef3c7', text: '#b45309' },
  admin: { bg: '#dcfce7', text: '#15803d' },
};

const ManageUsersSection = ({ t }) => {
  const [users, setUsers] = useState(null);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [editModal, setEditModal] = useState(null);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadUsers = () => {
    setUsers(null);

    adminUserApi
      .getAllUsers()
      .then(setUsers)
      .catch(() => setUsers([]));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!users) return [];

    const q = search.trim().toLowerCase();

    return users.filter((u) => {
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;

      const matchesSearch =
        !q ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);

      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, search]);

  const openEdit = (u) => {
    setEditModal({
      userId: u.id,
      form: {
        username: u.username || '',
        department: u.department || '',
        semester: u.semester || '',
      },
    });

    setEditError('');
  };

  const saveEdit = async () => {
    const f = editModal.form;

    if (!f.username.trim()) {
      setEditError('Username cannot be empty.');
      return;
    }

    setSaving(true);
    setEditError('');

    try {
      await adminUserApi.updateUser(editModal.userId, {
        username: f.username.trim(),
        department: f.department.trim(),
        semester: f.semester.trim(),
      });

      setEditModal(null);
      loadUsers();
    } catch (err) {
      setEditError(
        err?.response?.data?.message || 'Could not update user.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;

    setDeleting(true);
    setDeleteError('');

    try {
      await adminUserApi.deleteUser(deleteModal.id);
      setDeleteModal(null);
      loadUsers();
    } catch (err) {
      setDeleteError(
        err?.response?.data?.message || 'Could not delete user.'
      );
    } finally {
      setDeleting(false);
    }
  };

  // Slightly darker input background
  const inputStyle = {
    borderColor: t.border,
    backgroundColor: t.chipBg,
    color: t.textPrimary,
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: t.chipBg }}
        >
          <Users size={19} style={{ color: t.textPrimary }} />
        </div>

        <div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: t.textPrimary }}
          >
            Manage Users
          </h2>

          <p
            className="mt-0.5 text-sm font-semibold"
            style={{ color: t.textMuted }}
          >
            Edit username, department &amp; semester for any user
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="inline-flex flex-wrap items-center gap-1 rounded-full border p-1"
          style={{ borderColor: t.border }}
        >
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className="cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition-colors"
              style={{
                backgroundColor:
                  roleFilter === r ? t.accentPrimary : 'transparent',
                color: roleFilter === r ? t.pageBg : t.textPrimary,
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: t.textMuted }}
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm"
            style={inputStyle}
          />
        </div>
      </div>

      {/* User list */}
      {users === null && (
        <div
          className="rounded-2xl border px-4 py-8 text-center text-sm"
          style={{
            backgroundColor: t.cardBg,
            borderColor: t.border,
            color: t.textMuted,
          }}
        >
          Loading users...
        </div>
      )}

      {users !== null && filteredUsers.length === 0 && (
        <div
          className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm"
          style={{
            borderColor: t.border,
            color: t.textMuted,
          }}
        >
          No users match this filter.
        </div>
      )}

      {users !== null && filteredUsers.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((u) => {
            const badge =
              ROLE_BADGE[u.role] || {
                bg: t.chipBg,
                text: t.textMuted,
              };

            return (
              <div
                key={u.id}
                className="rounded-2xl border p-5"
                style={{
                  backgroundColor: t.cardBg,
                  borderColor: t.border,
                  boxShadow: t.shadowSoft,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-bold"
                      style={{ color: t.textPrimary }}
                    >
                      {u.username}
                    </p>

                    <p
                      className="truncate text-xs"
                      style={{ color: t.textMuted }}
                    >
                      {u.email}
                    </p>
                  </div>

                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize"
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.text,
                    }}
                  >
                    {u.role}
                  </span>
                </div>

                <div
                  className="mt-3 space-y-1.5 border-t pt-3 text-xs"
                  style={{
                    borderColor: t.border,
                    color: t.textMuted,
                  }}
                >
                  <p className="flex items-center gap-1.5">
                    <Building2 size={12} />
                    {u.department || 'No department set'}
                  </p>

                  <p className="flex items-center gap-1.5">
                    <GraduationCap size={12} />
                    {u.semester
                      ? `Semester ${u.semester}`
                      : 'No semester set'}
                  </p>
                </div>

                {/* Edit and Delete buttons */}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition-colors"
                    style={{
                      borderColor: t.border,
                      color: t.textPrimary,
                    }}
                  >
                    <Pencil size={12} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteModal(u);
                      setDeleteError('');
                    }}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition-colors"
                    style={{
                      borderColor: '#dc2626',
                      color: '#dc2626',
                    }}
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-sm rounded-2xl border p-5"
            style={{
              backgroundColor: t.cardBg,
              borderColor: t.border,
            }}
          >
            <div className="flex items-center justify-between">
              <h4
                className="text-sm font-bold"
                style={{ color: t.textPrimary }}
              >
                Edit User
              </h4>

              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="cursor-pointer"
              >
                <X size={16} style={{ color: t.textMuted }} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label
                  className="text-xs font-bold"
                  style={{ color: t.textMuted }}
                >
                  Username
                </label>

                <input
                  value={editModal.form.username}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      form: {
                        ...editModal.form,
                        username: e.target.value,
                      },
                    })
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  className="text-xs font-bold"
                  style={{ color: t.textMuted }}
                >
                  Department
                </label>

                <input
                  value={editModal.form.department}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      form: {
                        ...editModal.form,
                        department: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. Computer Science"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  className="text-xs font-bold"
                  style={{ color: t.textMuted }}
                >
                  Semester
                </label>

                <input
                  value={editModal.form.semester}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      form: {
                        ...editModal.form,
                        semester: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. 5"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>

              {editError && (
                <p
                  className="text-xs font-semibold"
                  style={{ color: '#dc2626' }}
                >
                  {editError}
                </p>
              )}

              <button
                type="button"
                disabled={saving}
                onClick={saveEdit}
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-70"
                style={{ backgroundColor: t.accentPrimary }}
              >
                <Save size={13} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-sm rounded-2xl border p-5"
            style={{
              backgroundColor: t.cardBg,
              borderColor: t.border,
            }}
          >
            <div className="flex items-center justify-between">
              <h4
                className="text-sm font-bold"
                style={{ color: t.textPrimary }}
              >
                Delete User
              </h4>

              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModal(null)}
                className="cursor-pointer"
              >
                <X size={16} style={{ color: t.textMuted }} />
              </button>
            </div>

            <p className="mt-4 text-sm" style={{ color: t.textMuted }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: t.textPrimary }}>
                {deleteModal.username}
              </strong>?
            </p>

            <p className="mt-2 text-xs" style={{ color: '#dc2626' }}>
              This action cannot be undone.
            </p>

            {deleteError && (
              <p
                className="mt-3 text-xs font-semibold"
                style={{ color: '#dc2626' }}
              >
                {deleteError}
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModal(null)}
                className="flex-1 cursor-pointer rounded-xl border py-2.5 text-xs font-bold"
                style={{
                  borderColor: t.border,
                  color: t.textPrimary,
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-70"
                style={{ backgroundColor: '#dc2626' }}
              >
                <Trash2 size={13} />
                {deleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsersSection;