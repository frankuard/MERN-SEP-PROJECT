import { useState, useRef } from 'react';
import { Link2, Upload, Loader2, X, ImageIcon } from 'lucide-react';
import uploadApi from '../../api/uploadApi';
import toast from 'react-hot-toast';

const ImageUploadField = ({ label, value, onChange, t, placeholder = 'https://...' }) => {
  const [mode, setMode] = useState('url'); // 'url' | 'upload'
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url } = await uploadApi.uploadImage(file);
      onChange(url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
<div className="mb-2 flex flex-col gap-2 sm:min-h-9.5 sm:flex-row sm:items-center sm:justify-between">        <label className="block text-xs font-bold uppercase tracking-wide sm:text-sm" style={{ color: t.textMuted }}>
          {label}
        </label>
        <div className="flex overflow-hidden rounded-xl border self-start" style={{ borderColor: t.border }}>
          <button
            type="button"
            onClick={() => setMode('url')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold sm:px-4 sm:text-sm"
            style={{
              backgroundColor: mode === 'url' ? t.accentPrimary : 'transparent',
              color: mode === 'url' ? '#fff' : t.textMuted,
            }}
          >
            <Link2 size={14} /> URL
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold sm:px-4 sm:text-sm"
            style={{
              backgroundColor: mode === 'upload' ? t.accentPrimary : 'transparent',
              color: mode === 'upload' ? '#fff' : t.textMuted,
            }}
          >
            <Upload size={14} /> Upload
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border px-4 py-3 text-sm sm:py-3.5 sm:text-base"
          style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
        />
      ) : (
        <div>
          <label
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors sm:py-8"
            style={{ borderColor: t.border, backgroundColor: t.pageBg }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? (
              <>
                <Loader2 size={24} className="animate-spin" style={{ color: t.textMuted }} />
                <p className="text-xs font-semibold sm:text-sm" style={{ color: t.textMuted }}>Uploading...</p>
              </>
            ) : (
              <>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12"
                  style={{ backgroundColor: t.chipBg }}
                >
                  <ImageIcon size={18} style={{ color: t.textMuted }} />
                </div>
                <p className="text-xs font-bold sm:text-sm" style={{ color: t.textPrimary }}>
                  Click to choose an image
                </p>
                <p className="text-[11px] sm:text-xs" style={{ color: t.textMuted }}>
                  JPEG, PNG, WEBP, or GIF · up to 5MB
                </p>
              </>
            )}
          </label>
        </div>
      )}

      {value && (
        <div
          className="mt-3 flex items-center gap-3 rounded-xl border p-3"
          style={{ borderColor: t.border, backgroundColor: t.pageBg }}
        >
          <img
            src={value}
            alt="Preview"
            className="h-16 w-16 shrink-0 rounded-lg border object-cover sm:h-20 sm:w-20"
            style={{ borderColor: t.border }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold sm:text-sm" style={{ color: t.textPrimary }}>
              Image set
            </p>
            <p className="truncate text-[11px] sm:text-xs" style={{ color: t.textMuted }}>{value}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
            style={{ borderColor: t.border, color: t.textMuted }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploadField;