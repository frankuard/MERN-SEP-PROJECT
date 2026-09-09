import { useEffect, useState } from 'react';
import {
  Calendar,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Presentation,
  RefreshCw,
  Rocket,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import communityPortalApi from '../../api/communityPortalApi';
import ImageUploadField from '../common/ImageUploadField';

const ACCENT = '#9333ea';

const WorkspaceCard = ({ workshop, t, onDelete }) => (
  <div
    className="flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-md"
    style={{ backgroundColor: t.cardBg, borderColor: t.border }}
  >
    {workshop.image ? (
      <div className="aspect-[16/7] w-full overflow-hidden">
        <img src={workshop.image} alt={workshop.title} className="h-full w-full object-cover" loading="lazy" />
      </div>
    ) : (
      <div
        className="flex aspect-[16/7] w-full items-center justify-center"
        style={{ backgroundColor: `${ACCENT}0F` }}
      >
        <Presentation size={28} style={{ color: ACCENT }} />
      </div>
    )}
    <div className="flex flex-1 flex-col p-4">
      <h4 className="text-lg font-extrabold leading-snug" style={{ color: t.textPrimary }}>
        {workshop.title}
      </h4>
      {workshop.description && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed" style={{ color: t.textMuted }}>
          {workshop.description}
        </p>
      )}
      <div className="mt-4 space-y-1.5 text-sm" style={{ color: t.textMuted }}>
        {workshop.date && (
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="shrink-0" />
            <span className="font-semibold" style={{ color: t.textPrimary }}>{workshop.date}</span>
          </div>
        )}
        {workshop.time && (
          <div className="flex items-center gap-2">
            <Clock size={14} className="shrink-0" />
            <span>{workshop.time}{workshop.duration ? ` (${workshop.duration})` : ''}</span>
          </div>
        )}
        {workshop.venue && (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{workshop.venue}</span>
          </div>
        )}
        {workshop.instructor && (
          <div className="flex items-center gap-2">
            <UserRound size={14} className="shrink-0" />
            <span>{workshop.instructor}</span>
          </div>
        )}
        {workshop.capacity > 0 && (
          <div className="flex items-center gap-2">
            <Users size={14} className="shrink-0" />
            <span>Capacity: {workshop.capacity}</span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDelete(workshop)}
        className="mt-4 flex w-fit items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors"
        style={{ color: '#dc2626', backgroundColor: '#fee2e2' }}
      >
        <Trash2 size={13} /> Remove Workshop
      </button>
    </div>
  </div>
);

const CommunityPortalWorkshopRelease = ({ community, t }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    image: '',
    instructor: '',
    capacity: '',
    duration: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [workshops, setWorkshops] = useState([]);
  const [listStatus, setListStatus] = useState('loading');

  const loadWorkshops = () => {
    setListStatus('loading');
    communityPortalApi
      .getCommunityWorkshops(community.id)
      .then((data) => {
        setWorkshops(Array.isArray(data?.workshops) ? data.workshops : []);
        setListStatus('success');
      })
      .catch(() => setListStatus('error'));
  };

  useEffect(loadWorkshops, [community.id]);

  if (!community) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center"
        style={{ borderColor: t.border }}
      >
        <Presentation size={26} style={{ color: t.textMuted }} />
        <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>
          No community account resolved.
        </p>
        <p className="text-sm" style={{ color: t.textMuted }}>
          Workshop Release is only available to the five member community accounts.
        </p>
      </div>
    );
  }

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Workshop title is required');
      return;
    }
    setSubmitting(true);
    try {
      const data = await communityPortalApi.createCommunityWorkshop(community.id, {
        title: form.title,
        description: form.description,
        date: form.date,
        time: form.time,
        venue: form.venue,
        image: form.image,
        instructor: form.instructor,
        capacity: Number(form.capacity) || 0,
        duration: form.duration,
      });
      toast.success(data?.message || 'Workshop released');
      setForm({
        title: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        image: '',
        instructor: '',
        capacity: '',
        duration: '',
      });
      loadWorkshops();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not release workshop');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (workshop) => {
    try {
      await communityPortalApi.deleteCommunityWorkshop(community.id, workshop._id);
      toast.success('Workshop removed');
      loadWorkshops();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not remove workshop');
    }
  };

  const inputClass =
    'w-full rounded-xl border px-4 py-3 text-sm sm:py-3.5 sm:text-base';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-extrabold"
          style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
        >
          {community.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-[26px]" style={{ color: t.textPrimary }}>
            Workshop Release
          </h2>
          <p className="mt-0.5 text-sm" style={{ color: t.textMuted }}>
            {community.name} · release a workshop for your community members
          </p>
        </div>
      </div>

      {/* Release form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border p-5 sm:p-6"
        style={{ backgroundColor: t.cardBg, borderColor: t.border }}
      >
        <h3 className="flex items-center gap-2 text-lg font-extrabold" style={{ color: t.textPrimary }}>
          <Rocket size={18} style={{ color: ACCENT }} />
          Create a new workshop
        </h3>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide sm:text-sm" style={{ color: t.textMuted }}>
              Workshop title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. React Crash Course for Beginners"
              className={inputClass}
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide sm:text-sm" style={{ color: t.textMuted }}>
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={3}
              placeholder="What will members learn in this workshop?"
              className={`${inputClass} resize-none`}
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide sm:text-sm" style={{ color: t.textMuted }}>
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
              className={inputClass}
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide sm:text-sm" style={{ color: t.textMuted }}>
              Time
            </label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setField('time', e.target.value)}
              className={inputClass}
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide sm:text-sm" style={{ color: t.textMuted }}>
              Venue
            </label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => setField('venue', e.target.value)}
              placeholder="e.g. LT02 Mechi"
              className={inputClass}
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide sm:text-sm" style={{ color: t.textMuted }}>
              Instructor / Facilitator
            </label>
            <input
              type="text"
              value={form.instructor}
              onChange={(e) => setField('instructor', e.target.value)}
              placeholder="e.g. Community Coordinator"
              className={inputClass}
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide sm:text-sm" style={{ color: t.textMuted }}>
              Duration
            </label>
            <input
              type="text"
              value={form.duration}
              onChange={(e) => setField('duration', e.target.value)}
              placeholder="e.g. 2 hours"
              className={inputClass}
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide sm:text-sm" style={{ color: t.textMuted }}>
              Capacity
            </label>
            <input
              type="number"
              min={0}
              value={form.capacity}
              onChange={(e) => setField('capacity', e.target.value)}
              placeholder="e.g. 50"
              className={inputClass}
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
          </div>

          <div className="sm:col-span-2">
            <ImageUploadField
              label="Workshop banner"
              t={t}
              value={form.image}
              onChange={(url) => setField('image', url)}
              placeholder="https://.../workshop-banner.png"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !form.title.trim()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          style={{ backgroundColor: ACCENT }}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
          Release Workshop
        </button>
      </form>

      {/* Released workshops */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-extrabold" style={{ color: t.textPrimary }}>
          <Calendar size={17} style={{ color: ACCENT }} />
          Released Workshops
        </h3>

        {listStatus === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12" style={{ borderColor: t.border }}>
            <Loader2 size={20} className="animate-spin" style={{ color: t.textMuted }} />
            <p className="text-sm font-semibold" style={{ color: t.textMuted }}>Loading workshops...</p>
          </div>
        )}

        {listStatus === 'error' && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center" style={{ borderColor: t.border }}>
            <RefreshCw size={20} style={{ color: t.textMuted }} />
            <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Unable to load workshops</p>
            <button
              type="button"
              onClick={loadWorkshops}
              className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {listStatus === 'success' && (
          workshops.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center" style={{ borderColor: t.border }}>
              <Presentation size={22} style={{ color: t.textMuted }} />
              <p className="text-sm font-semibold" style={{ color: t.textMuted }}>
                No workshops released yet. Create your first one above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {workshops.map((workshop) => (
                <WorkspaceCard key={workshop._id} workshop={workshop} t={t} onDelete={handleDelete} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default CommunityPortalWorkshopRelease;