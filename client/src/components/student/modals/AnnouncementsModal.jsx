import React from 'react';
import { X } from 'lucide-react';

const AnnouncementsModal = ({ isOpen, onClose, t, announcements }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
          <div>
            <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
              All Important Announcements
            </h3>
            <p className="text-xs" style={{ color: t.textMuted }}>
              Campus updates and deadlines
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border p-4 space-y-1.5"
              style={{ backgroundColor: t.pageBg, borderColor: t.border }}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                  {a.tag}
                </span>
                <span className="text-xs font-semibold text-amber-600">{a.date}</span>
              </div>
              <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                {a.title}
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: t.textMuted }}>
                {a.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#2f4336] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsModal;
