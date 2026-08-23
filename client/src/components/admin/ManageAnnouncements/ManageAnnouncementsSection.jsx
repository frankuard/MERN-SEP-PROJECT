import { useState, useEffect } from 'react';
import { Megaphone, Plus, Pencil, Trash2, ArrowLeft, Search } from 'lucide-react';
import announcementApi from '../../../api/announcementApi';
import toast from 'react-hot-toast';
import ConfirmDeleteModal from '../../common/ConfirmDeleteModal';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

const PRIORITY_BADGE = {
  Low: { bg: '#e0f2fe', text: '#0369a1' },
  Medium: { bg: '#fef3c7', text: '#b45309' },
  High: { bg: '#ffedd5', text: '#c2410c' },
  Urgent: { bg: '#fee2e2', text: '#b91c1c' },
};

const emptyForm = {
  title: '',
  message: '',
  priority: 'Medium',
  department: '',
  publishedAt: new Date().toISOString().slice(0, 10),
};

const toFormState = (a) => ({
  title: a.title || '',
  message: a.message || '',
  priority: a.priority || 'Medium',
  department: a.department || '',
  publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString().slice(0, 10) : '',
});

const toPayload = (form) => ({
  title: form.title.trim(),
  message: form.message.trim(),
  priority: form.priority,
  department: form.department.trim(),
  publishedAt: form.publishedAt,
});

const formatDate = (isoDate) => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const FIELD_LABEL = 'mb-2 block text-xs font-bold uppercase tracking-wide sm:text-sm';
const FIELD_INPUT = 'w-full rounded-xl border px-4 py-3 text-sm sm:py-3.5 sm:text-base';

const ManageAnnouncementsSection = ({ t }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadAnnouncements = () => {
    setLoading(true);
    announcementApi.getAnnouncements()
      .then((data) => { if (Array.isArray(data)) setAnnouncements(data); })
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAnnouncements(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setView('form');
  };

  const openEdit = (a) => {
    setForm(toFormState(a));
    setEditingId(a._id);
    setView('form');
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.title.trim()) return 'Title is required';
    if (!form.message.trim()) return 'Message is required';
    if (!form.department.trim()) return 'Department is required';
    if (!form.publishedAt) return 'Published date is required';
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    const payload = toPayload(form);

    try {
      if (editingId) {
        await announcementApi.updateAnnouncement(editingId, payload);
        toast.success('Announcement updated');
      } else {
        await announcementApi.createAnnouncement(payload);
        toast.success('Announcement created');
      }
      setView('list');
      loadAnnouncements();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (a) => setDeleteTarget(a);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await announcementApi.deleteAnnouncement(deleteTarget._id);
      toast.success('Announcement deleted');
      setDeleteTarget(null);
      loadAnnouncements();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete announcement');
    } finally {
      setDeleting(false);
    }
  };

  const filteredAnnouncements = announcements.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.department.toLowerCase().includes(search.toLowerCase()) ||
    (a.message || '').toLowerCase().includes(search.toLowerCase())
  );

  const inputStyle = {
    backgroundColor: t.pageBg,
    borderColor: t.border,
    color: t.textPrimary,
  };

  // ===================== FORM VIEW =====================
  if (view === 'form') {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setView('list')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border"
            style={{ borderColor: t.border, color: t.textPrimary }}
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
            {editingId ? 'Edit Announcement' : 'New Announcement'}
          </h2>
        </div>

        <div
          className="space-y-6 rounded-2xl border p-5 sm:p-8"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}
        >
          <div>
            <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={FIELD_INPUT}
              style={inputStyle}
              placeholder="Mid-term Exam Schedule Released"
            />
          </div>

          <div>
            <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Message</label>
            <textarea
              value={form.message}
              onChange={(e) => handleChange('message', e.target.value)}
              rows={4}
              className={FIELD_INPUT}
              style={inputStyle}
              placeholder="Full announcement text..."
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className={FIELD_INPUT}
                style={inputStyle}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className={FIELD_INPUT}
                style={inputStyle}
                placeholder="Examination Department"
              />
            </div>
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Published Date</label>
              <input
                type="date"
                value={form.publishedAt}
                onChange={(e) => handleChange('publishedAt', e.target.value)}
                className={FIELD_INPUT}
                style={inputStyle}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setView('list')}
              className="rounded-xl border px-6 py-3 text-sm font-bold sm:text-base"
              style={{ borderColor: t.border, color: t.textPrimary }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-black px-6 py-3 text-sm font-bold text-white disabled:opacity-40 sm:text-base"
            >
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Announcement'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== LIST VIEW =====================
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
            <Megaphone size={20} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>Manage Announcements</h2>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white"
        >
          <Plus size={16} />
          New Announcement
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
        <input
          type="text"
          placeholder="Search by title, department, message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border py-2.5 pl-11 pr-4 text-sm outline-none"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textPrimary }}
        />
      </div>

      {loading && (
        <div
          className="rounded-2xl border px-4 py-6 text-center text-sm"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}
        >
          Loading announcements...
        </div>
      )}

      {!loading && filteredAnnouncements.length === 0 && (
        <div
          className="rounded-2xl border px-4 py-6 text-center text-sm"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}
        >
          No announcements found.
        </div>
      )}

      {!loading && filteredAnnouncements.length > 0 && (
        <div className="space-y-3">
          {filteredAnnouncements.map((a) => {
            const badge = PRIORITY_BADGE[a.priority] || PRIORITY_BADGE.Medium;
            return (
              <div
                key={a._id}
                className="rounded-2xl border p-5"
                style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold" style={{ color: t.textPrimary }}>{a.title}</p>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {a.priority}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm" style={{ color: t.textMuted }}>{a.message}</p>
                    <p className="mt-2 text-xs font-semibold" style={{ color: t.textMuted }}>
                      {a.department} · {formatDate(a.publishedAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border"
                      style={{ borderColor: t.border, color: t.textPrimary }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(a)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border"
                      style={{ borderColor: '#fecaca', color: '#dc2626' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title={`Delete "${deleteTarget.title}"?`}
          message="This announcement will be removed for all students. This action cannot be undone."
          confirmLabel="Delete Announcement"
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          t={t}
        />
      )}
    </div>
  );
};

export default ManageAnnouncementsSection;