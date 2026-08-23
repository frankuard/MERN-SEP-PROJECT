import { useState, useRef } from 'react';
import { X, MessageSquare, Paperclip, FileText, Send, Loader2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import uploadApi from '../../../api/uploadApi';

const HelpThreadModal = ({ isOpen, onClose, t, request, onReply }) => {
  const [replyText, setReplyText] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !request) return null;

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error('Write a response before sending');
      return;
    }

    setUploading(true);
    try {
      const attachments = [];
      for (const file of files) {
        const { url } = await uploadApi.uploadImage(file);
        attachments.push({ url, name: file.name });
      }

      await onReply({ text: replyText.trim(), attachments });
      setReplyText('');
      setFiles([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload attachment(s)');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div
        className="flex w-full max-w-lg flex-col rounded-2xl border shadow-2xl animate-in zoom-in-95 duration-150"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border, maxHeight: '85vh' }}
      >
        <div className="flex items-center justify-between border-b p-5" style={{ borderColor: t.border }}>
          <div className="flex min-w-0 items-center gap-2">
            <MessageSquare size={18} className="shrink-0 text-blue-600" />
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold" style={{ color: t.textPrimary }}>
                {request.request}
              </h3>
              <p className="text-xs font-semibold" style={{ color: t.textMuted }}>
                Asked by {request.author} · {request.time}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer shrink-0 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {/* Original request's own attachments, if any */}
          {request.attachments?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {request.attachments.map((att) => (
                
                 <a key={att.url}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={att.name}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ borderColor: t.border, color: t.textPrimary }}
                >
                  <FileText size={13} />
                  {att.name}
                  <Download size={12} style={{ color: t.textMuted }} />
                </a>
              ))}
            </div>
          )}

          {request.responses.length === 0 ? (
            <p className="py-6 text-center text-sm font-semibold" style={{ color: t.textMuted }}>
              No responses yet. Be the first to help!
            </p>
          ) : (
            request.responses.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border p-3.5"
                style={{ borderColor: t.border, backgroundColor: t.pageBg }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold" style={{ color: t.textPrimary }}>{r.author}</span>
                  <span className="text-[11px] font-semibold" style={{ color: t.textMuted }}>{r.time}</span>
                </div>
                <p className="mt-1.5 text-sm" style={{ color: t.textPrimary }}>{r.message}</p>
                {r.attachments?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.attachments.map((att) => (
                      
                       <a key={att.url}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={att.name}
                        className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: t.border, color: t.textMuted }}
                      >
                        <FileText size={11} />
                        {att.name}
                        <Download size={10} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t p-5" style={{ borderColor: t.border }}>
          <textarea
            rows={2}
            placeholder="Write a response..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full rounded-xl border p-3 text-sm outline-none"
            style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {files.map((file, i) => (
                <span
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                  style={{ borderColor: t.border, color: t.textPrimary }}
                >
                  <FileText size={11} />
                  {file.name}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="cursor-pointer text-red-500"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
              style={{ borderColor: t.border, color: t.textMuted }}
            >
              <Paperclip size={13} />
              Attach
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#2f4336] px-5 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {uploading ? 'Uploading...' : 'Send Response'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HelpThreadModal;