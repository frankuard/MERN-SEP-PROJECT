import { useState, useEffect } from 'react';
import { UtensilsCrossed, Wallet, Plus, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import canteenApi from '../../../api/canteenApi';
import ImageUploadField from '../../common/ImageUploadField';
import ConfirmDeleteModal from '../../common/ConfirmDeleteModal';

import CreditDetailsModal from './CreditDetailsModal';

const CATEGORIES = ['Meals', 'Snacks', 'Momo & Noodles', 'Beverages'];
const FIELD_LABEL = 'mb-2 block text-xs font-bold uppercase tracking-wide sm:text-sm';
const FIELD_INPUT = 'w-full rounded-xl border px-4 py-3 text-sm sm:py-3.5 sm:text-base';

const emptyMenuForm = { name: '', description: '', price: '', category: 'Meals', image: '', availability: true, isSpecialOfTheDay: false, isPopular: false };

const toMenuFormState = (item) => ({
  name: item.name || '',
  description: item.description || '',
  price: String(item.price ?? ''),
  category: item.category || 'Meals',
  image: item.image || '',
  availability: item.availability !== false,
  isSpecialOfTheDay: !!item.isSpecialOfTheDay,
  isPopular: !!item.isPopular,
});

// ---------- MENU SUB-TAB ----------

const MenuTab = ({ t }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyMenuForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    canteenApi.getMenu()
      .then((data) => { if (Array.isArray(data)) setItems(data); })
      .catch(() => toast.error('Failed to load menu'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyMenuForm); setEditingId(null); setView('form'); };
  const openEdit = (item) => { setForm(toMenuFormState(item)); setEditingId(item._id); setView('form'); };
  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!form.name.trim()) return 'Food name is required';
    if (form.price === '' || Number.isNaN(Number(form.price)) || Number(form.price) < 0) return 'Enter a valid price';
    if (!form.image.trim()) return 'Image is required';
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) { toast.error(error); return; }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      image: form.image.trim(),
      availability: form.availability,
      isSpecialOfTheDay: form.isSpecialOfTheDay,
      isPopular: form.isPopular,
    };

    try {
      if (editingId) {
        await canteenApi.updateMenuItem(editingId, payload);
        toast.success('Food item updated');
      } else {
        await canteenApi.createMenuItem(payload);
        toast.success('Food item added');
      }
      setView('list');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save food item');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await canteenApi.deleteMenuItem(deleteTarget._id);
      toast.success('Food item deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete food item');
    } finally {
      setDeleting(false);
    }
  };

  const inputStyle = { backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary };

  if (view === 'form') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
          {editingId ? 'Edit Food Item' : 'Add New Food Item'}
        </h3>
        <div className="space-y-5 rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Title</label>
              <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={FIELD_INPUT} style={inputStyle} placeholder="Chicken Biryani" />
            </div>
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Price (NPR)</label>
              <input type="number" min="0" value={form.price} onChange={(e) => handleChange('price', e.target.value)} className={FIELD_INPUT} style={inputStyle} placeholder="220" />
            </div>
          </div>

          <div>
            <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Short Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => handleChange('description', e.target.value)} className={FIELD_INPUT} style={inputStyle} placeholder="Aromatic layered basmati rice..." />
          </div>

          <div>
            <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Category</label>
            <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className={FIELD_INPUT} style={inputStyle}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <ImageUploadField label="Food Picture" value={form.image} onChange={(url) => handleChange('image', url)} t={t} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { key: 'availability', label: 'Available' },
              { key: 'isSpecialOfTheDay', label: 'Special of the Day' },
              { key: 'isPopular', label: 'Popular' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleChange(key, !form[key])}
                className="flex items-center justify-between rounded-xl border px-4 py-3 text-left"
                style={{ backgroundColor: t.pageBg, borderColor: t.border }}
              >
                <span className="text-sm font-bold" style={{ color: t.textPrimary }}>{label}</span>
                <span
                  className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
                  style={{ backgroundColor: form[key] ? t.accentEmerald : t.progressTrack }}
                >
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" style={{ transform: form[key] ? 'translateX(22px)' : 'translateX(4px)' }} />
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setView('list')} className="rounded-xl border px-6 py-3 text-sm font-bold" style={{ borderColor: t.border, color: t.textPrimary }}>Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className="rounded-xl bg-black px-6 py-3 text-sm font-bold text-white disabled:opacity-40">
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Food Item'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>Menu Items</h3>
        <button type="button" onClick={openCreate} 
        className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
          <Plus size={16} /> Add Food Item
        </button>
      </div>

      {loading && <p className="text-sm" style={{ color: t.textMuted }}>Loading menu...</p>}
      {!loading && items.length === 0 && <p className="text-sm" style={{ color: t.textMuted }}>No food items yet.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item._id} className="overflow-hidden rounded-2xl border" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
            <div className="relative h-32 w-full overflow-hidden" style={{ backgroundColor: t.pageBg }}>
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{item.name}</p>
                <span className="shrink-0 rounded-lg px-2 py-1 text-xs font-black" style={{ backgroundColor: t.accentPrimary, color: t.pageBg }}>NPR {item.price}</span>
              </div>
              <p className="mt-1 truncate text-xs" style={{ color: t.textMuted }}>{item.description || item.category}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => openEdit(item)} className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
style={{ borderColor: t.border, color: t.textPrimary }}>
                  <Pencil size={13} /> Edit
                </button>
                <button type="button" onClick={() => setDeleteTarget(item)} className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold transition-colors hover:bg-red-50 dark:hover:bg-red-950/30" style={{ borderColor: '#fecaca', color: '#dc2626' }}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {deleteTarget && (
        <ConfirmDeleteModal
          title={`Delete "${deleteTarget.name}"?`}
          message="This removes it from the student menu permanently."
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

// ---------- CREDIT DUE SUB-TAB ----------

const AdjustModal = ({ target, mode, onClose, onSaved, t }) => {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const val = Number(amount);
    if (!amount || Number.isNaN(val) || val <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      if (mode === 'increase') {
        await canteenApi.createOrUpdateCredit({ userId: target.user._id, studentName: target.studentName, amountDue: val });
        toast.success('Credit due increased');
      } else {
        await canteenApi.recordCreditPayment(target._id, { amount: val, method: 'Cash', note: 'Adjusted by admin' });
        toast.success('Payment recorded');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl border p-6" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowCard }}>
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold" style={{ color: t.textPrimary }}>
            {mode === 'increase' ? 'Increase Due' : 'Record Payment'} — {target.studentName}
          </h4>
          <button type="button" onClick={onClose}><X size={18} style={{ color: t.textMuted }} /></button>
        </div>
        <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Amount (NPR)</label>
        <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className={FIELD_INPUT} style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }} placeholder="e.g. 150" autoFocus />
        <button type="button" onClick={handleSubmit} disabled={saving} className="mt-4 w-full rounded-xl bg-black py-3 text-sm font-bold text-white disabled:opacity-40">
          {saving ? 'Saving...' : 'Confirm'}
        </button>
      </div>
    </div>
  );
};

const CreditTab = ({ t }) => {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustMode, setAdjustMode] = useState('increase');
    const [detailsId, setDetailsId] = useState(null);
  const load = () => {
    setLoading(true);
    canteenApi.getAllCredits()
      .then((data) => { if (Array.isArray(data)) setCredits(data); })
      .catch(() => toast.error('Failed to load credit records'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>Credit Due (Khata)</h3>

      {loading && <p className="text-sm" style={{ color: t.textMuted }}>Loading credit records...</p>}
      {!loading && credits.length === 0 && <p className="text-sm" style={{ color: t.textMuted }}>No credit records yet.</p>}

      <div className="space-y-3">
        {credits.map((c) => (
          <div key={c._id} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
            <div>
              <p className="text-sm font-bold" style={{ color: t.textPrimary }}>{c.user?.username || c.studentName}</p>
              <p className="text-xs" style={{ color: t.textMuted }}>{c.user?.email}</p>
              {c.remainingBalance > 0 ? (
                <p className="mt-1 text-sm font-extrabold" style={{ color: t.textPrimary }}>NPR {c.remainingBalance} due</p>
              ) : c.remainingBalance < 0 ? (
                <p className="mt-1 text-sm font-extrabold" style={{ color: t.accentEmerald }}>+NPR {Math.abs(c.remainingBalance)} credit</p>
              ) : (
                <p className="mt-1 text-sm font-extrabold" style={{ color: t.textMuted }}>Cleared</p>
              )}            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setDetailsId(c._id)} className="cursor-pointer rounded-lg border px-3 py-2 text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
style={{ borderColor: t.border, color: t.textPrimary }}>
                View Details
              </button>
              <button type="button" onClick={() => { setAdjustMode('increase'); setAdjustTarget(c); }} className="rounded-lg border px-3 py-2 text-xs font-bold" style={{ borderColor: t.border, color: t.textPrimary }}>
                + Increase Due
              </button>
              <button type="button" onClick={() => { setAdjustMode('pay'); setAdjustTarget(c); }} className="rounded-lg border px-3 py-2 text-xs font-bold" style={{ borderColor: t.border, color: t.textPrimary }}>
                − Record Payment
              </button>
            </div>
          </div>
        ))}
      </div>

      {adjustTarget && (
        <AdjustModal target={adjustTarget} mode={adjustMode} onClose={() => setAdjustTarget(null)} onSaved={load} t={t} />
      )}

            {detailsId && (
        <CreditDetailsModal creditId={detailsId} onClose={() => setDetailsId(null)} t={t} />
      )}
    </div>
  );
};

// ---------- MAIN ----------

const ManageCanteenSection = ({ t }) => {
  const [tab, setTab] = useState('menu');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
          <UtensilsCrossed size={20} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>Manage Canteen</h2>
      </div>

      <div className="inline-flex items-center gap-1 rounded-full border p-1" style={{ borderColor: t.border }}>
        {[{ id: 'menu', label: 'Menu', icon: UtensilsCrossed }, { id: 'credit', label: 'Credit Due', icon: Wallet }].map(({ id, label, icon: Icon }) => (
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

      {tab === 'menu' ? <MenuTab t={t} /> : <CreditTab t={t} />}
    </div>
  );
};

export default ManageCanteenSection;