import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Trophy, Inbox, Plus, Pencil, Trash2, Check, X as XIcon, CornerDownLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import resourcesApi from '../../../api/resourcesApi';
import ImageUploadField from '../../common/ImageUploadField';
import ConfirmDeleteModal from '../../common/ConfirmDeleteModal';

const FIELD_LABEL = 'mb-2 block text-xs font-bold uppercase tracking-wide sm:text-sm';
const FIELD_INPUT = 'w-full rounded-xl border px-4 py-3 text-sm sm:py-3.5 sm:text-base';

const STATUS_BADGE = {
  pending: { bg: '#fef3c7', text: '#b45309' },
  approved: { bg: '#dbeafe', text: '#1d4ed8' },
  returned: { bg: '#d1fae5', text: '#047857' },
  rejected: { bg: '#fee2e2', text: '#b91c1c' },
};

/* ============================================================ */
/* BOOKS TAB — unchanged from before                            */
/* ============================================================ */

const emptyBookForm = { name: '', author: '', shelf: '', category: '', cover: '' };

const toBookFormState = (b) => ({
  name: b.name || '',
  author: b.author || '',
  shelf: b.shelf || '',
  category: b.category || '',
  cover: b.cover || '',
});

const BooksTab = ({ t }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyBookForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    resourcesApi.getBooksAdmin()
      .then((data) => { if (Array.isArray(data)) setBooks(data); })
      .catch(() => toast.error('Failed to load books'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyBookForm); setEditingId(null); setView('form'); };
  const openEdit = (b) => { setForm(toBookFormState(b)); setEditingId(b._id); setView('form'); };
  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!form.name.trim()) return 'Title is required';
    if (!form.author.trim()) return 'Author is required';
    if (!form.shelf.trim()) return 'Shelf code is required';
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) { toast.error(error); return; }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      author: form.author.trim(),
      shelf: form.shelf.trim(),
      category: form.category.trim() || 'General',
      cover: form.cover.trim(),
    };

    try {
      if (editingId) {
        await resourcesApi.updateBook(editingId, payload);
        toast.success('Book updated');
      } else {
        await resourcesApi.createBook(payload);
        toast.success('Book added');
      }
      setView('list');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save book');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await resourcesApi.deleteBook(deleteTarget._id);
      toast.success('Book deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete book');
    } finally {
      setDeleting(false);
    }
  };

  const inputStyle = { backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary };

  if (view === 'form') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
          {editingId ? 'Edit Book' : 'Add New Book'}
        </h3>
        <div className="space-y-5 rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Title</label>
              <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={FIELD_INPUT} style={inputStyle} placeholder="Database System Concepts" />
            </div>
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Author</label>
              <input type="text" value={form.author} onChange={(e) => handleChange('author', e.target.value)} className={FIELD_INPUT} style={inputStyle} placeholder="Silberschatz, Korth & Sudarshan" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Shelf Code</label>
              <input type="text" value={form.shelf} onChange={(e) => handleChange('shelf', e.target.value)} className={FIELD_INPUT} style={inputStyle} placeholder="CS-12" />
            </div>
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Category</label>
              <input type="text" value={form.category} onChange={(e) => handleChange('category', e.target.value)} className={FIELD_INPUT} style={inputStyle} placeholder="Computer Science" />
            </div>
          </div>

          <ImageUploadField label="Book Cover (optional)" value={form.cover} onChange={(url) => handleChange('cover', url)} t={t} />

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setView('list')} className="cursor-pointer rounded-xl border px-6 py-3 text-sm font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: t.border, color: t.textPrimary }}>Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className="cursor-pointer rounded-xl bg-black px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Book'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>Books</h3>
        <button type="button" onClick={openCreate} className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
          <Plus size={16} /> Add Book
        </button>
      </div>

      {loading && <p className="text-sm" style={{ color: t.textMuted }}>Loading books...</p>}
      {!loading && books.length === 0 && <p className="text-sm" style={{ color: t.textMuted }}>No books yet.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <div key={book._id} className="rounded-2xl border p-4" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{book.name}</p>
              <span className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: t.pageBg, color: t.textMuted }}>{book.shelf}</span>
            </div>
            <p className="mt-1 truncate text-xs" style={{ color: t.textMuted }}>{book.author}</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => openEdit(book)} className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: t.border, color: t.textPrimary }}>
                <Pencil size={13} /> Edit
              </button>
              <button type="button" onClick={() => setDeleteTarget(book)} className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold transition-colors hover:bg-red-50 dark:hover:bg-red-950/30" style={{ borderColor: '#fecaca', color: '#dc2626' }}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {deleteTarget && (
        <ConfirmDeleteModal
          title={`Delete "${deleteTarget.name}"?`}
          message="This removes it from the library catalog. This cannot be undone."
          confirmLabel="Delete Book"
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          t={t}
        />
      )}
    </div>
  );
};

/* ============================================================ */
/* BORROW REQUESTS TAB (books) — unchanged from before          */
/* ============================================================ */

const RequestsTab = ({ t }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    resourcesApi.getBorrowRequests(statusFilter === 'All' ? {} : { status: statusFilter })
      .then((data) => { if (Array.isArray(data)) setRequests(data); })
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await resourcesApi.approveBorrowRequest(id);
      toast.success('Request approved');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      await resourcesApi.rejectBorrowRequest(id);
      toast.success('Request rejected');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReturn = async (id) => {
    setProcessingId(id);
    try {
      await resourcesApi.markReturned(id);
      toast.success('Marked as returned');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to mark returned');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {['pending', 'approved', 'returned', 'rejected', 'All'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className="cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition-all"
            style={{
              backgroundColor: statusFilter === s ? t.accentPrimary : t.cardBg,
              color: statusFilter === s ? t.pageBg : t.textPrimary,
              border: statusFilter === s ? 'none' : `1px solid ${t.border}`,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm" style={{ color: t.textMuted }}>Loading requests...</p>}
      {!loading && requests.length === 0 && <p className="text-sm" style={{ color: t.textMuted }}>No requests found.</p>}

      <div className="space-y-3">
        {requests.map((r) => {
          const badge = STATUS_BADGE[r.status];
          return (
            <div key={r._id} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold" style={{ color: t.textPrimary }}>{r.book?.name}</p>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-bold capitalize" style={{ backgroundColor: badge.bg, color: badge.text }}>{r.status}</span>
                </div>
                <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
                  {r.requestedBy?.username} ({r.requestedBy?.email}) · Student ID: {r.studentIdNumber}
                </p>
                <p className="mt-0.5 text-xs font-semibold" style={{ color: t.textPrimary }}>
                  Return by: {new Date(r.returnBy).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleApprove(r._id)} disabled={processingId === r._id} className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5" style={{ borderColor: t.border, color: t.textPrimary }}>
                    <Check size={13} /> Approve
                  </button>
                  <button type="button" onClick={() => handleReject(r._id)} disabled={processingId === r._id} className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/30" style={{ borderColor: '#fecaca', color: '#dc2626' }}>
                    <XIcon size={13} /> Reject
                  </button>
                </div>
              )}
              {r.status === 'approved' && (
                <button type="button" onClick={() => handleReturn(r._id)} disabled={processingId === r._id} className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5" style={{ borderColor: t.border, color: t.textPrimary }}>
                    <CornerDownLeft size={13} /> Mark Returned
                  </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================ */
/* SPORTS ITEMS TAB — new, mirrors BooksTab                     */
/* ============================================================ */

const emptySportsItemForm = { name: '', icon: '🏐', totalQuantity: '' };

const toSportsItemFormState = (item) => ({
  name: item.name || '',
  icon: item.icon || '🏐',
  totalQuantity: item.totalQuantity != null ? String(item.totalQuantity) : '',
});

const SportsItemsTab = ({ t }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptySportsItemForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    resourcesApi.getSportsItems()
      .then((data) => { if (Array.isArray(data)) setItems(data); })
      .catch(() => toast.error('Failed to load sports items'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptySportsItemForm); setEditingId(null); setView('form'); };
  const openEdit = (item) => { setForm(toSportsItemFormState(item)); setEditingId(item._id); setView('form'); };
  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!form.name.trim()) return 'Item name is required';
    if (!form.totalQuantity || Number.isNaN(Number(form.totalQuantity)) || Number(form.totalQuantity) < 1) {
      return 'Total quantity must be at least 1';
    }
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) { toast.error(error); return; }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      icon: form.icon.trim() || '🏐',
      totalQuantity: Number(form.totalQuantity),
    };

    try {
      if (editingId) {
        await resourcesApi.updateSportsItem(editingId, payload);
        toast.success('Item updated');
      } else {
        await resourcesApi.createSportsItem(payload);
        toast.success('Item added');
      }
      setView('list');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await resourcesApi.deleteSportsItem(deleteTarget._id);
      toast.success('Item deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  const inputStyle = { backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary };

  if (view === 'form') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
          {editingId ? 'Edit Sports Item' : 'Add New Sports Item'}
        </h3>
        <div className="space-y-5 rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Item Name</label>
              <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={FIELD_INPUT} style={inputStyle} placeholder="Cricket Bat" />
            </div>
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Icon (emoji)</label>
              <input type="text" value={form.icon} onChange={(e) => handleChange('icon', e.target.value)} className={FIELD_INPUT} style={inputStyle} placeholder="🏏" />
            </div>
          </div>

          <div className="max-w-xs">
            <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Total Quantity Owned</label>
            <input type="number" min="1" value={form.totalQuantity} onChange={(e) => handleChange('totalQuantity', e.target.value)} className={FIELD_INPUT} style={inputStyle} placeholder="4" />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setView('list')} className="cursor-pointer rounded-xl border px-6 py-3 text-sm font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: t.border, color: t.textPrimary }}>Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className="cursor-pointer rounded-xl bg-black px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>Sports Items</h3>
        <button type="button" onClick={openCreate} className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {loading && <p className="text-sm" style={{ color: t.textMuted }}>Loading sports items...</p>}
      {!loading && items.length === 0 && <p className="text-sm" style={{ color: t.textMuted }}>No sports items yet.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item._id} className="rounded-2xl border p-4" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
            <div className="flex items-start justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-bold" style={{ color: t.textPrimary }}>
                <span className="text-lg leading-none">{item.icon}</span> {item.name}
              </p>
              <span className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: t.pageBg, color: t.textMuted }}>
                Qty: {item.totalQuantity}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => openEdit(item)} className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: t.border, color: t.textPrimary }}>
                <Pencil size={13} /> Edit
              </button>
              <button type="button" onClick={() => setDeleteTarget(item)} className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold transition-colors hover:bg-red-50 dark:hover:bg-red-950/30" style={{ borderColor: '#fecaca', color: '#dc2626' }}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {deleteTarget && (
        <ConfirmDeleteModal
          title={`Delete "${deleteTarget.name}"?`}
          message="This removes it from the sports equipment catalog. This cannot be undone."
          confirmLabel="Delete Item"
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          t={t}
        />
      )}
    </div>
  );
};

/* ============================================================ */
/* SPORTS REQUESTS TAB — new, mirrors RequestsTab                */
/* ============================================================ */

const SportsRequestsTab = ({ t }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    resourcesApi.getSportsRequests(statusFilter === 'All' ? {} : { status: statusFilter })
      .then((data) => { if (Array.isArray(data)) setRequests(data); })
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await resourcesApi.approveSportsRequest(id);
      toast.success('Request approved');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      await resourcesApi.rejectSportsRequest(id);
      toast.success('Request rejected');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReturn = async (id) => {
    setProcessingId(id);
    try {
      await resourcesApi.markSportsReturned(id);
      toast.success('Marked as returned');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to mark returned');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {['pending', 'approved', 'returned', 'rejected', 'All'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className="cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition-all"
            style={{
              backgroundColor: statusFilter === s ? t.accentPrimary : t.cardBg,
              color: statusFilter === s ? t.pageBg : t.textPrimary,
              border: statusFilter === s ? 'none' : `1px solid ${t.border}`,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm" style={{ color: t.textMuted }}>Loading requests...</p>}
      {!loading && requests.length === 0 && <p className="text-sm" style={{ color: t.textMuted }}>No requests found.</p>}

      <div className="space-y-3">
        {requests.map((r) => {
          const badge = STATUS_BADGE[r.status];
          return (
            <div key={r._id} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="flex items-center gap-1.5 font-bold" style={{ color: t.textPrimary }}>
                    <span className="text-base leading-none">{r.item?.icon}</span> {r.item?.name} (Qty: {r.quantity})
                  </p>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-bold capitalize" style={{ backgroundColor: badge.bg, color: badge.text }}>{r.status}</span>
                </div>
                <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
                  {r.requestedBy?.username} ({r.requestedBy?.email})
                </p>
                <p className="mt-0.5 text-xs font-semibold" style={{ color: t.textPrimary }}>
                  Slot: {r.slot}{r.note ? ` · Note: ${r.note}` : ''}
                </p>
              </div>

              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleApprove(r._id)} disabled={processingId === r._id} className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5" style={{ borderColor: t.border, color: t.textPrimary }}>
                    <Check size={13} /> Approve
                  </button>
                  <button type="button" onClick={() => handleReject(r._id)} disabled={processingId === r._id} className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/30" style={{ borderColor: '#fecaca', color: '#dc2626' }}>
                    <XIcon size={13} /> Reject
                  </button>
                </div>
              )}
              {r.status === 'approved' && (
                <button type="button" onClick={() => handleReturn(r._id)} disabled={processingId === r._id} className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5" style={{ borderColor: t.border, color: t.textPrimary }}>
                  <CornerDownLeft size={13} /> Mark Returned
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================ */
/* MAIN — 4 tabs total: Books, Sports Items, Borrow Requests, Sports Requests */
/* ============================================================ */

const TABS = [
  { id: 'books', label: 'Books', icon: BookOpen },
  { id: 'sports-items', label: 'Sports Items', icon: Trophy },
  { id: 'requests', label: 'Book Requests', icon: Inbox },
  { id: 'sports-requests', label: 'Sports Requests', icon: Inbox },
];

const ManageResourcesSection = ({ t }) => {
  const [tab, setTab] = useState('books');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
          <BookOpen size={20} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>Manage Resources</h2>
      </div>

      <div className="inline-flex flex-wrap items-center gap-1 rounded-full border p-1" style={{ borderColor: t.border }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all hover:opacity-80"
            style={{ backgroundColor: tab === id ? t.accentPrimary : 'transparent', color: tab === id ? t.pageBg : t.textPrimary }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'books' && <BooksTab t={t} />}
      {tab === 'sports-items' && <SportsItemsTab t={t} />}
      {tab === 'requests' && <RequestsTab t={t} />}
      {tab === 'sports-requests' && <SportsRequestsTab t={t} />}
    </div>
  );
};

export default ManageResourcesSection;