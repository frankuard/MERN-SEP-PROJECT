import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, MapPin, Send, Plus, ArrowLeft, Loader2,
  CheckCircle2, XCircle, Clock3, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import eventsApi from '../../api/eventsApi';
import ImageUploadField from '../common/ImageUploadField';
import { useAuth } from '../../context/AuthContext';

const FIELD_LABEL = 'mb-2 block text-xs font-bold uppercase tracking-wide sm:text-sm';
const FIELD_INPUT = 'w-full rounded-xl border px-4 py-3 text-sm sm:py-3.5 sm:text-base';

const STATUS_BADGE = {
  pending: { bg: '#fef3c7', text: '#b45309', label: 'Pending', Icon: Clock3 },
  approved: { bg: '#dcfce7', text: '#15803d', label: 'Approved', Icon: CheckCircle2 },
  rejected: { bg: '#fee2e2', text: '#b91c1c', label: 'Rejected', Icon: XCircle },
};

const formatDate = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const emptyForm = {
  title: '',
  description: '',
  type: 'community',
  category: '',
  date: '',
  startTime: '',
  endTime: '',
  venue: '',
  eventImage: '',
  organizerName: '',
  organizerLogo: '',
};

const RequestForm = ({ t, onDone }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    organizerName: user?.username || '',
  }));
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!form.title.trim()) return 'Title is required';
    if (!form.description.trim()) return 'Description is required';
    if (!form.category.trim()) return 'Category is required';
    if (!form.date) return 'Date is required';
    if (!form.startTime) return 'Start time is required';
    if (!form.venue.trim()) return 'Venue is required';
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        category: form.category.trim(),
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        venue: form.venue.trim(),
        eventImage: form.eventImage.trim(),
        organizerName: form.organizerName.trim(),
        organizerLogo: form.organizerLogo.trim(),
      };
      await eventsApi.createEventRequest(payload);
      toast.success('Event request submitted for approval');
      onDone?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit request');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    backgroundColor: t.pageBg,
    borderColor: t.border,
    color: t.textPrimary,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDone}
          className="flex h-9 w-9 items-center justify-center rounded-xl border"
          style={{ borderColor: t.border, color: t.textPrimary }}
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
          Submit Event Request
        </h2>
      </div>

      <div
        className="space-y-6 rounded-2xl border p-5 sm:p-8"
        style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}
      >
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
            <input
              type="text"
              value="Community"
              readOnly
              className={FIELD_INPUT}
              style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
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
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={`${FIELD_LABEL} sm:flex sm:min-h-9.5 sm:items-center`} style={{ color: t.textMuted }}>End Time (optional)</label>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
              className={FIELD_INPUT}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={`${FIELD_LABEL} sm:flex sm:min-h-9.5 sm:items-center`} style={{ color: t.textMuted }}>Venue</label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => handleChange('venue', e.target.value)}
              className={FIELD_INPUT}
              style={inputStyle}
              placeholder="Main Auditorium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ImageUploadField
            label="Event Image"
            value={form.eventImage}
            onChange={(url) => handleChange('eventImage', url)}
            t={t}
          />
          <ImageUploadField
            label="Community Logo"
            value={form.organizerLogo}
            onChange={(url) => handleChange('organizerLogo', url)}
            t={t}
          />
        </div>

        <div>
          <label className={FIELD_LABEL} style={{ color: t.textMuted }}>Organizer (Community) Name</label>
          <input
            type="text"
            value={form.organizerName}
            onChange={(e) => handleChange('organizerName', e.target.value)}
            className={FIELD_INPUT}
            style={inputStyle}
            placeholder="Your community name"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDone}
            className="rounded-xl border px-6 py-3 text-sm font-bold sm:text-base"
            style={{ borderColor: t.border, color: t.textPrimary }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-bold text-white disabled:opacity-40 sm:text-base"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
            {saving ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

const EventRequestSection = ({ t }) => {
  const [view, setView] = useState('list');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(() => {
    setLoading(true);
    eventsApi.getMyEventRequests()
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  if (view === 'form') {
    return <RequestForm t={t} onDone={() => { loadRequests(); setView('list'); }} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-[26px]" style={{ color: t.textPrimary }}>
            Event Request
          </h2>
          <p className="mt-1.5 text-base leading-relaxed" style={{ color: t.textMuted }}>
            Submit an event for DevCorps approval, or track your submitted requests.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setView('form')}
          className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          New Event Request
        </button>
      </div>

      {loading && (
        <div
          className="rounded-2xl border px-4 py-6 text-center text-sm"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}
        >
          Loading your requests...
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center"
          style={{ borderColor: t.border }}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
            <Calendar size={20} style={{ color: t.textMuted }} />
          </div>
          <p className="text-sm font-medium" style={{ color: t.textMuted }}>
            No event requests yet. Submit one above.
          </p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((req) => {
            const badge = STATUS_BADGE[req.status] || STATUS_BADGE.pending;
            const BadgeIcon = badge.Icon;
            return (
              <div
                key={req._id}
                className="rounded-2xl border p-4 sm:p-5"
                style={{ backgroundColor: t.cardBg, borderColor: t.border }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold" style={{ color: t.textPrimary }}>{req.title}</p>
                    <p className="mt-0.5 text-xs" style={{ color: t.textMuted }}>{req.category}</p>
                  </div>
                  <span
                    className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                    style={{ backgroundColor: badge.bg, color: badge.text }}
                  >
                    <BadgeIcon size={13} />
                    {badge.label}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-sm" style={{ color: t.textMuted }}>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="shrink-0" />
                    <span className="font-semibold" style={{ color: t.textPrimary }}>{formatDate(req.date)}</span>
                  </div>
                  {req.startTime && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="shrink-0" />
                      <span>{req.startTime}{req.endTime ? ` – ${req.endTime}` : ''}</span>
                    </div>
                  )}
                  {req.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate">{req.venue}</span>
                    </div>
                  )}
                </div>

                {req.reviewNote && (
                  <div
                    className="mt-3 rounded-xl border px-3 py-2 text-xs"
                    style={{ borderColor: t.border, backgroundColor: t.pageBg, color: t.textMuted }}
                  >
                    <span className="font-bold" style={{ color: t.textPrimary }}>DevCorps note: </span>
                    {req.reviewNote}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs" style={{ borderColor: t.border }}>
                  <RefreshCw size={12} style={{ color: t.textMuted }} />
                  <span style={{ color: t.textMuted }}>
                    {req.status === 'approved'
                      ? 'Approved — this event will appear on the Event Board shortly.'
                      : req.status === 'rejected'
                      ? 'Rejected — please review the note above.'
                      : 'Awaiting DevCorps review.'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventRequestSection;
