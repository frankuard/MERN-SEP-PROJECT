import React, { useState } from 'react';
import { X, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AskHelpModal = ({ isOpen, onClose, t, onSubmit }) => {
  const [requestText, setRequestText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!requestText.trim()) {
      toast.error('Please enter your request question');
      return;
    }
    onSubmit(requestText);
    setRequestText('');
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
            <HelpCircle size={18} className="text-blue-600" />
            <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
              Ask for Campus Help
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
              What do you need help with?
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Can someone share handwritten notes for Operating Systems Chapter 4?"
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              className="mt-1 w-full rounded-xl border p-3 outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
              required
            />
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
              Post Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AskHelpModal;
