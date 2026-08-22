import { useState, useEffect } from 'react';
import {
  Calendar, Plus, Pencil, Trash2, ArrowLeft, Search, MapPin, Clock,
} from 'lucide-react';
import eventsApi from '../../../api/eventsApi';
import ImageUploadField from '../../common/ImageUploadField';
import toast from 'react-hot-toast';

const ORGANIZER_PRESETS = [
  { name: 'BIC', logo: 'https://ik.imagekit.io/ltf9bjszh/logos/bic.png?updatedAt=1787158208751' },
  { name: 'BIC AI Horizon', logo: 'https://ik.imagekit.io/ltf9bjszh/logos/bicaihorizon.jpg?updatedAt=1787158209717' },
  { name: 'BIC Dev Corps', logo: 'https://ik.imagekit.io/ltf9bjszh/logos/bicdevcorps.jpg?updatedAt=1787158209647' },
];

const emptyForm = {
  title: '',
  description: '',
  type: 'college',
  category: '',
  date: '',
  startTime: '',
  endTime: '',
  venue: '',
  eventImage: '',
  organizerPreset: 'custom',
  organizerName: '',
  organizerLogo: '',
  registrationEnabled: true,
  capacity: '',
  status: 'upcoming',
  isPublished: true,
};

const toFormState = (event) => {
  const matchedPreset = ORGANIZER_PRESETS.find(
    (p) => p.name === event.organizer?.name && p.logo === event.organizer?.logo
  );

  return {
    title: event.title || '',
    description: event.description || '',
    type: event.type || 'college',
    category: event.category || '',
    date: event.date ? new Date(event.date).toISOString().slice(0, 10) : '',
    startTime: event.startTime || '',
    endTime: event.endTime || '',
    venue: event.venue || '',
    eventImage: event.eventImage || '',
    organizerPreset: matchedPreset ? matchedPreset.name : 'custom',
    organizerName: event.organizer?.name || '',
    organizerLogo: event.organizer?.logo || '',
    registrationEnabled: event.registrationEnabled !== false,
    capacity: event.capacity === null || event.capacity === undefined ? '' : String(event.capacity),
    status: event.status || 'upcoming',
    isPublished: event.isPublished !== false,
  };
};

const toPayload = (form) => ({
  title: form.title.trim(),
  description: form.description.trim(),
  type: form.type,
  category: form.category.trim(),
  date: form.date,
  startTime: form.startTime,
  endTime: form.endTime,
  venue: form.venue.trim(),
  eventImage: form.eventImage.trim(),
  organizer: { name: form.organizerName.trim(), logo: form.organizerLogo.trim() },
  registrationEnabled: form.registrationEnabled,
  capacity: form.capacity === '' ? null : Number(form.capacity),
  status: form.status,
  isPublished: form.isPublished,
});

const TYPE_BADGE = {
  college: { bg: '#dbeafe', text: '#1d4ed8' },
  community: { bg: '#fce7f3', text: '#be185d' },
};

const STATUS_BADGE = {
  upcoming: { bg: '#dbeafe', text: '#1d4ed8' },
  ongoing: { bg: '#dcfce7', text: '#15803d' },
  completed: { bg: '#f1f5f9', text: '#475569' },
  cancelled: { bg: '#fee2e2', text: '#b91c1c' },
};

const formatDate = (isoDate) => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Shared sizing so every field — text, select, textarea, image — lines up
const FIELD_LABEL = 'mb-2 block text-xs font-bold uppercase tracking-wide sm:text-sm';
const FIELD_INPUT = 'w-full rounded-xl border px-4 py-3 text-sm sm:py-3.5 sm:text-base';

const ManageEventsSection = ({ t }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadEvents = () => {
    setLoading(true);
    eventsApi.getAllEventsAdmin()
      .then((data) => { if (Array.isArray(data)) setEvents(data); })
      .catch(() => toast.error('Failed to load events'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadEvents(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setView('form');
  };

  const openEdit = (event) => {
    setForm(toFormState(event));
    setEditingId(event._id);
    setView('form');
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOrganizerPresetChange = (presetName) => {
    if (presetName === 'custom') {
      setForm((prev) => ({ ...prev, organizerPreset: 'custom' }));
      return;
    }
    const preset = ORGANIZER_PRESETS.find((p) => p.name === presetName);
    if (preset) {
      setForm((prev) => ({
        ...prev,
        organizerPreset: presetName,
        organizerName: preset.name,
        organizerLogo: preset.logo,
      }));
    }
  };

  const validate = () => {
    if (!form.title.trim()) return 'Title is required';
    if (!form.description.trim()) return 'Description is required';
    if (!form.category.trim()) return 'Category is required';
    if (!form.date) return 'Date is required';
    if (!form.startTime) return 'Start time is required';
    if (!form.venue.trim()) return 'Venue is required';
    if (!form.organizerName.trim()) return 'Organizer name is required';
    if (form.capacity !== '' && (Number.isNaN(Number(form.capacity)) || Number(form.capacity) < 0)) {
      return 'Capacity must be a positive number';
    }
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    const payload = toPayload(form);

    try {
      if (editingId) {
        await eventsApi.updateEvent(editingId, payload);
        toast.success('Event updated');
      } else {
        await eventsApi.createEvent(payload);
        toast.success('Event created');
      }
      setView('list');
      loadEvents();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete "${event.title}"? This also removes all registrations for it.`)) return;
    setDeletingId(event._id);
    try {
      await eventsApi.deleteEvent(event._id);
      toast.success('Event deleted');
      loadEvents();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredEvents = events.filter((ev) =>
    ev.title.toLowerCase().includes(search.toLowerCase()) ||
    ev.category.toLowerCase().includes(search.toLowerCase()) ||
    ev.venue.toLowerCase().includes(search.toLowerCase())
  );

  const inputStyle = {
    backgroundColor: t.pageBg,
    borderColor: t.border,
    color: t.textPrimary,
  };

  const Toggle = ({ label, checked, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-xl border px-4 py-3.5 text-left sm:py-4"
      style={{ backgroundColor: t.pageBg, borderColor: t.border }}
    >
      <span className="text-sm font-bold sm:text-base" style={{ color: t.textPrimary }}>{label}</span>
      <span
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
        style={{ backgroundColor: checked ? t.accentEmerald : t.progressTrack }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(4px)' }}
        />
      </span>
    </button>
  );

  // ===================== FORM VIEW =====================
  if (view === 'form') {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setView('list')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border"
            style={{ borderColor: t.border, color: t.textPrimary }}
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
            {editingId ? 'Edit Event' : 'Add New Event'}
          </h2>
        </div>

        <div
          className="space-y-6 rounded-2xl border p-5 sm:p-8"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}
        >
          {/* Title / Category */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={FIELD_INPUT}
                style={inputStyle}
                placeholder="Tech Fest 2026"
              />
            </div>
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={FIELD_INPUT}
                style={inputStyle}
                placeholder="Workshop, Fest, Sports..."
              />
            </div>
          </div>

          <div>
            <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className={FIELD_INPUT}
              style={inputStyle}
              placeholder="What's this event about..."
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Type</label>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className={FIELD_INPUT}
                style={inputStyle}
              >
                <option value="college">College Event</option>
                <option value="community">Community</option>
              </select>
            </div>
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Status</label>
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className={FIELD_INPUT}
                style={inputStyle}
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Date / Times */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={FIELD_INPUT}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className={FIELD_INPUT}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>End Time (optional)</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                className={FIELD_INPUT}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Venue / Event Image */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
<label className={`${FIELD_LABEL} sm:flex sm:min-h-9.5 sm:items-center`} style={{ color: t.textMuted }}>Venue</label>              <input
                type="text"
                value={form.venue}
                onChange={(e) => handleChange('venue', e.target.value)}
                className={FIELD_INPUT}
                style={inputStyle}
                placeholder="Main Auditorium"
              />
            </div>
            <ImageUploadField
              label="Event Image"
              value={form.eventImage}
              onChange={(url) => handleChange('eventImage', url)}
              t={t}
            />
          </div>

          {/* Organizer */}
          <div className="space-y-5">
            <div>
              <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Organizer</label>
              <select
                value={form.organizerPreset}
                onChange={(e) => handleOrganizerPresetChange(e.target.value)}
                className={FIELD_INPUT}
                style={inputStyle}
              >
                <option value="custom">Custom Organizer</option>
                {ORGANIZER_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {form.organizerPreset === 'custom' ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
<label className={`${FIELD_LABEL} sm:flex sm:min-h-9.5 sm:items-center`} style={{ color: t.textMuted }}>Organizer Name</label>                  <input
                    type="text"
                    value={form.organizerName}
                    onChange={(e) => handleChange('organizerName', e.target.value)}
                    className={FIELD_INPUT}
                    style={inputStyle}
                    placeholder="Computer Club"
                  />
                </div>
                <ImageUploadField
                  label="Organizer Logo"
                  value={form.organizerLogo}
                  onChange={(url) => handleChange('organizerLogo', url)}
                  t={t}
                />
              </div>
            ) : (
              <div
                className="flex items-center gap-4 rounded-xl border p-4"
                style={{ borderColor: t.border, backgroundColor: t.pageBg }}
              >
                <img src={form.organizerLogo} alt={form.organizerName} className="h-12 w-12 rounded-lg object-cover sm:h-14 sm:w-14" />
                <p className="text-sm font-bold sm:text-base" style={{ color: t.textPrimary }}>{form.organizerName}</p>
              </div>
            )}
          </div>

          {/* Capacity */}
          <div className="max-w-xs">
            <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Capacity (optional, blank = unlimited)</label>
            <input
              type="number"
              min="0"
              value={form.capacity}
              onChange={(e) => handleChange('capacity', e.target.value)}
              className={FIELD_INPUT}
              style={inputStyle}
              placeholder="e.g. 100"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Toggle
              label="Registration Enabled"
              checked={form.registrationEnabled}
              onChange={(val) => handleChange('registrationEnabled', val)}
            />
            <Toggle
              label={form.isPublished ? 'Published' : 'Draft (hidden from students)'}
              checked={form.isPublished}
              onChange={(val) => handleChange('isPublished', val)}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setView('list')}
              className="rounded-xl border px-6 py-3 text-sm font-bold sm:text-base"
              style={{ borderColor: t.border, color: t.textPrimary }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-black px-6 py-3 text-sm font-bold text-white disabled:opacity-40 sm:text-base"
            >
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== LIST VIEW =====================
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
            <Calendar size={20} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>Manage Events</h2>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white"
        >
          <Plus size={16} />
          Add New Event
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
        <input
          type="text"
          placeholder="Search by title, category, venue..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border py-2.5 pl-11 pr-4 text-sm outline-none"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textPrimary }}
        />
      </div>

      {loading && (
        <div
          className="rounded-2xl border px-4 py-6 text-center text-sm"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}
        >
          Loading events...
        </div>
      )}

      {!loading && filteredEvents.length === 0 && (
        <div
          className="rounded-2xl border px-4 py-6 text-center text-sm"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}
        >
          No events found.
        </div>
      )}

      {/* ===== Desktop / tablet: table ===== */}
      {!loading && filteredEvents.length > 0 && (
        <div
          className="hidden overflow-x-auto rounded-2xl border sm:block"
          style={{ backgroundColor: t.cardBg, borderColor: t.border }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-bold uppercase tracking-wide" style={{ borderColor: t.border, color: t.textMuted }}>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Venue</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev) => {
                const typeBadge = TYPE_BADGE[ev.type] || TYPE_BADGE.college;
                const statusBadge = STATUS_BADGE[ev.status] || STATUS_BADGE.upcoming;
                return (
                  <tr key={ev._id} className="border-b last:border-0 align-top" style={{ borderColor: t.border }}>
                    <td className="px-4 py-3">
                      <p className="font-bold" style={{ color: t.textPrimary }}>{ev.title}</p>
                      <p className="text-xs" style={{ color: t.textMuted }}>{ev.category}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded-full px-2.5 py-1 text-xs font-bold"
                        style={{ backgroundColor: typeBadge.bg, color: typeBadge.text }}
                      >
                        {ev.type === 'college' ? 'College' : 'Community'}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: t.textPrimary }}>
                      <p className="font-semibold">{formatDate(ev.date)}</p>
                      <p className="flex items-center gap-1 text-xs" style={{ color: t.textMuted }}>
                        <Clock size={11} /> {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3" style={{ color: t.textPrimary }}>
                      <p className="flex items-center gap-1"><MapPin size={12} /> {ev.venue}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded-full px-2.5 py-1 text-xs font-bold capitalize"
                        style={{ backgroundColor: statusBadge.bg, color: statusBadge.text }}
                      >
                        {ev.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded-full px-2.5 py-1 text-xs font-bold"
                        style={{
                          backgroundColor: ev.isPublished ? t.accentEmerald + '22' : t.accentAmber + '22',
                          color: ev.isPublished ? t.accentEmerald : t.accentAmber,
                        }}
                      >
                        {ev.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(ev)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border"
                          style={{ borderColor: t.border, color: t.textPrimary }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ev)}
                          disabled={deletingId === ev._id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border disabled:opacity-40"
                          style={{ borderColor: '#fecaca', color: '#dc2626' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Mobile: stacked cards ===== */}
      {!loading && filteredEvents.length > 0 && (
        <div className="space-y-3 sm:hidden">
          {filteredEvents.map((ev) => {
            const typeBadge = TYPE_BADGE[ev.type] || TYPE_BADGE.college;
            const statusBadge = STATUS_BADGE[ev.status] || STATUS_BADGE.upcoming;
            return (
              <div
                key={ev._id}
                className="rounded-2xl border p-4"
                style={{ backgroundColor: t.cardBg, borderColor: t.border }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold" style={{ color: t.textPrimary }}>{ev.title}</p>
                    <p className="truncate text-xs" style={{ color: t.textMuted }}>{ev.category}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                    style={{ backgroundColor: typeBadge.bg, color: typeBadge.text }}
                  >
                    {ev.type === 'college' ? 'College' : 'Community'}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs" style={{ color: t.textMuted }}>
                  <p className="flex items-center gap-1.5">
                    <Calendar size={12} /> {formatDate(ev.date)} · {ev.startTime}{ev.endTime ? `–${ev.endTime}` : ''}
                  </p>
                  <p className="flex items-center gap-1.5"><MapPin size={12} /> {ev.venue}</p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-bold capitalize"
                    style={{ backgroundColor: statusBadge.bg, color: statusBadge.text }}
                  >
                    {ev.status}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-bold"
                    style={{
                      backgroundColor: ev.isPublished ? t.accentEmerald + '22' : t.accentAmber + '22',
                      color: ev.isPublished ? t.accentEmerald : t.accentAmber,
                    }}
                  >
                    {ev.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(ev)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold"
                    style={{ borderColor: t.border, color: t.textPrimary }}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ev)}
                    disabled={deletingId === ev._id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold disabled:opacity-40"
                    style={{ borderColor: '#fecaca', color: '#dc2626' }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageEventsSection;