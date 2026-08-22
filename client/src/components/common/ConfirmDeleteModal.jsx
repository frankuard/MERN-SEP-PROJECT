import { Loader2, AlertTriangle, X } from 'lucide-react';

const ConfirmDeleteModal = ({
  title = 'Delete this item?',
  message,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
  deleting = false,
  t,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="w-full max-w-sm rounded-2xl border p-6"
        style={{ backgroundColor: t.cardBg, borderColor: t.border }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: '#fee2e2' }}
            >
              <AlertTriangle size={18} style={{ color: '#dc2626' }} />
            </div>
            <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
          >
            <X size={16} style={{ color: t.textMuted }} />
          </button>
        </div>

        {message && (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: t.textMuted }}>
            {message}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-xl px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-50"
            style={{ backgroundColor: t.pageBg, color: t.textPrimary, border: `1px solid ${t.border}` }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: '#dc2626' }}
          >
            {deleting && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;