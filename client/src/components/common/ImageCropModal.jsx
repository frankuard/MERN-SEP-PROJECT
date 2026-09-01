import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Loader2, X } from 'lucide-react';

// Crops the image to the visible area using canvas, returns a Blob.
const getCroppedBlob = (imageSrc, cropPixels) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = cropPixels.width;
      canvas.height = cropPixels.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
        0, 0, cropPixels.width, cropPixels.height
      );
      canvas.toBlob((blob) => {
        if (blob) resolve(blob); else reject(new Error('Crop failed'));
      }, 'image/jpeg', 0.92);
    };
    img.onerror = reject;
    img.src = imageSrc;
  });

// shape: 'round' for avatar, 'rect' for cover
const ImageCropModal = ({ t, file, shape = 'round', aspect = 1, onCancel, onConfirm }) => {
  const [imageSrc] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-[24px]" style={{ backgroundColor: t.cardBg }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: t.border }}>
          <h3 className="text-sm font-extrabold" style={{ color: t.textPrimary }}>
            {shape === 'round' ? 'Adjust profile photo' : 'Adjust cover photo'}
          </h3>
          <button type="button" onClick={onCancel} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ color: t.textMuted }}>
            <X size={16} />
          </button>
        </div>

        <div className="relative h-72 w-full" style={{ backgroundColor: '#111' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={shape}
            showGrid={shape === 'rect'}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-5 py-4">
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-xs font-bold" style={{ color: t.textMuted }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2 text-xs font-extrabold text-white disabled:opacity-60"
            >
              {saving && <Loader2 size={13} className="animate-spin" />} Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;