import { useState, useRef } from 'react';
import { X, HelpCircle, Paperclip, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import uploadApi from '../../../api/uploadApi';

const AskHelpModal = ({ isOpen, onClose, t, onSubmit }) => {
  const [requestText, setRequestText] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetAndClose = () => {
    setRequestText('');
    setFiles([]);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestText.trim()) {
      toast.error('Please enter your request question');
      return;
    }

    setUploading(true);
    try {
      const attachments = [];
      for (const file of files) {
        const { url } = await uploadApi.uploadImage(file);
        attachments.push({ url, name: file.name });
      }

      await onSubmit({ text: requestText.trim(), attachments });
      resetAndClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload attachment(s)');
    } finally {
      setUploading(false);
    }
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
            onClick={resetAndClose}
            className="cursor-pointer rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
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

          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>
              Attach files (optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed py-3 font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: t.border, color: t.textMuted }}
            >
              <Paperclip size={14} />
              Click to attach files
            </button>

            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center justify-between rounded-lg border px-2.5 py-1.5"
                    style={{ borderColor: t.border, backgroundColor: t.pageBg }}
                  >
                    <span className="flex min-w-0 items-center gap-1.5" style={{ color: t.textPrimary }}>
                      <FileText size={12} className="shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="cursor-pointer shrink-0 text-[11px] font-bold text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetAndClose}
              disabled={uploading}
              className="cursor-pointer rounded-xl border px-4 py-2.5 font-bold transition-colors hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
              style={{ borderColor: t.border }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#2f4336] px-5 py-2.5 font-bold text-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {uploading && <Loader2 size={14} className="animate-spin" />}
              {uploading ? 'Uploading...' : 'Post Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AskHelpModal;