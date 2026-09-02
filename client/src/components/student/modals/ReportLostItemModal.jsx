import { useState } from 'react';
import { X, Search, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../../api/axiosInstance';

const ACCENT = '#2f4336';
const CATEGORIES = ['Bags', 'Electronics', 'Keys', 'Books', 'General'];

// NOTE: confirm this matches your real upload route/field name from uploadController.js
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await axiosInstance.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
};

const ReportLostItemModal = ({ isOpen, onClose, t, onSubmit }) => {
  const [form, setForm] = useState({
    type: 'lost',
    title: '',
    description: '',
    location: '',
    category: 'General',
    contactInfo: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetAndClose = () => {
    setForm({ type: 'lost', title: '', description: '', location: '', category: 'General', contactInfo: '' });
    setImageFile(null);
    setImagePreview(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.location.trim()) {
      toast.error('Please enter the item name and location');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      await onSubmit({ ...form, image: imageUrl });
      resetAndClose();
    } catch {
      // errors already toasted by parent's onSubmit / upload failure
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[28px] border p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border, boxShadow: t.shadowCard }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2">
            <Search size={18} style={{ color: ACCENT }} />
            <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>Report an Item</h3>
          </div>
          <button type="button" onClick={resetAndClose} className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-sm">
          <div className="inline-flex items-center gap-1 rounded-full border p-1" style={{ borderColor: t.border }}>
            {['lost', 'found'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setForm({ ...form, type: opt })}
                className="rounded-full px-4 py-1.5 text-xs font-bold capitalize transition-all"
                style={{
                  backgroundColor: form.type === opt ? ACCENT : 'transparent',
                  color: form.type === opt ? '#ffffff' : t.textMuted,
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>Item Title</label>
            <input
              type="text"
              placeholder="e.g. Blue Dell Laptop Charger"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
              required
            />
          </div>

          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>Description</label>
            <textarea
              rows={2}
              placeholder="Any identifying details..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
          </div>

          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>Location</label>
            <input
              type="text"
              placeholder="e.g. Lecture Hall, Compton, Wolves.."
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
              required
            />
          </div>

          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none font-semibold"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>Contact Info (optional)</label>
            <input
              type="text"
              placeholder="Phone or alternate email"
              value={form.contactInfo}
              onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
          </div>

          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>Photo (optional)</label>
            <label
              className="mt-1 flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed"
              style={{ borderColor: t.border, backgroundColor: t.pageBg }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full rounded-xl object-cover" />
              ) : (
                <>
                  <Upload size={22} style={{ color: t.textMuted }} />
                  <span className="text-xs font-semibold" style={{ color: t.textMuted }}>Click to upload a photo</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={resetAndClose} className="rounded-xl border px-4 py-2.5 font-bold" style={{ borderColor: t.border, color: t.textPrimary }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: ACCENT }}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportLostItemModal;