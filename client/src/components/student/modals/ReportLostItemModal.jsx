import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const ReportLostItemModal = ({ isOpen, onClose, t, onSubmit }) => {
  const [form, setForm] = useState({ title: '', location: '', category: 'General' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.location.trim()) {
      toast.error('Please enter the item name and location');
      return;
    }
    onSubmit(form);
    setForm({ title: '', location: '', category: 'General' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2">
            <Search size={18} className="text-blue-600" />
            <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
              Report Lost Item
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>
              Item Name
            </label>
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
            <label className="block font-bold" style={{ color: t.textPrimary }}>
              Where was it seen/lost?
            </label>
            <input
              type="text"
              placeholder="e.g. Block B, Ground floor Lab 2"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
              required
            />
          </div>

          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none font-semibold"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            >
              <option value="Bags">Bags &amp; Wallets</option>
              <option value="Electronics">Electronics &amp; Gadgets</option>
              <option value="Keys">Keys &amp; IDs</option>
              <option value="Books">Books &amp; Notebooks</option>
              <option value="General">Other</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2.5 font-bold"
              style={{ borderColor: t.border }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#2f4336] px-5 py-2.5 font-bold text-white shadow-xs hover:bg-[#25362b]"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportLostItemModal;
