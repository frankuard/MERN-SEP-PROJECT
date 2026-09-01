import { useState, useEffect } from 'react';
import {
  FileText, HeartHandshake, CalendarCheck2, Search,
  CheckCircle2, XCircle, Clock, Users, Mail, Plus, Trash2, Lock, Unlock, Link2,
} from 'lucide-react';
import attendanceApi from '../../../api/attendanceApi';
import eventsApi from '../../../api/eventsApi';
import volunteerApi from '../../../api/volunteerApi';
import volunteerOpportunityApi from '../../../api/volunteerOpportunityApi';
import toast from 'react-hot-toast';

const SUB_TABS = [
  { id: 'reports', label: 'Report Requests', icon: FileText },
  { id: 'registrants', label: 'Event Registrants', icon: CalendarCheck2 },
  { id: 'opportunities', label: 'Volunteer Opportunities', icon: Plus },
  { id: 'volunteering', label: 'Volunteer Hours', icon: HeartHandshake },
];

// Exported so a parent (the SSD dept sidebar) can filter this list —
// e.g. drop 'reports' since it becomes its own separate sidebar item
// there — without duplicating the id/label/icon mapping.
export const SSD_SUB_TABS = SUB_TABS;

// Optional subTabs override: a parent can pass a filtered list (e.g.
// everything except Report Requests) so this component only shows
// those tabs. Used standalone (main admin dashboard, no prop passed)
// it behaves exactly as before with all 4 tabs.
const ManageSSDSection = ({ t, subTabs }) => {
  const tabs = subTabs || SUB_TABS;
  const [activeSubTab, setActiveSubTab] = useState(tabs[0].id);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
          <Users size={20} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>Manage SSD</h2>
      </div>

      <div className="inline-flex flex-wrap items-center gap-1 rounded-full border p-1" style={{ borderColor: t.border }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSubTab(id)}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors sm:text-sm"
            style={{
              backgroundColor: activeSubTab === id ? t.accentPrimary : 'transparent',
              color: activeSubTab === id ? t.pageBg : t.textPrimary,
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {activeSubTab === 'reports' && <ReportRequestsPanel t={t} />}
      {activeSubTab === 'registrants' && <EventRegistrantsPanel t={t} />}
      {activeSubTab === 'opportunities' && <VolunteerOpportunitiesPanel t={t} />}
      {activeSubTab === 'volunteering' && <VolunteerHoursPanel t={t} />}
    </div>
  );
};

// ============================================================
// PANEL 1 — Report Requests
// ============================================================
export const ReportRequestsPanel = ({ t }) => {
  const [requests, setRequests] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const load = () => {
    setRequests(null);
    attendanceApi.getAllReportRequestsAdmin()
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => { setRequests([]); toast.error('Failed to load report requests'); });
  };

  useEffect(() => { load(); }, []);

  const updateDraft = (id, field, value) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleAction = async (request, status) => {
    setActioningId(request._id);
    const draft = drafts[request._id] || {};
    try {
      await attendanceApi.updateReportRequest(request._id, {
        status,
        adminNote: draft.adminNote || '',
        reportFileUrl: draft.reportFileUrl || '',
      });
      toast.success(status === 'fulfilled' ? 'Report marked as fulfilled' : 'Request rejected');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setActioningId(null);
    }
  };

  const pending = (requests || []).filter((r) => r.status === 'pending');
  const resolved = (requests || []).filter((r) => r.status !== 'pending');

  const statusStyle = {
    pending: { bg: '#fef3c7', color: '#b45309' },
    fulfilled: { bg: '#dcfce7', color: '#15803d' },
    rejected: { bg: '#fee2e2', color: '#dc2626' },
  };

  return (
    <div className="space-y-5">
      {requests === null && (
        <div className="rounded-2xl border p-6 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
          Loading report requests...
        </div>
      )}

      {requests !== null && requests.length === 0 && (
        <div className="rounded-2xl border p-6 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
          No report requests yet.
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
            Pending ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((r) => {
              const draft = drafts[r._id] || {};
              return (
                <div key={r._id} className="rounded-2xl border p-4" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold" style={{ color: t.textPrimary }}>{r.studentName}</p>
                      <p className="mt-0.5 text-sm" style={{ color: t.textMuted }}>{r.reason || 'No reason provided'}</p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                      style={{ backgroundColor: statusStyle.pending.bg, color: statusStyle.pending.color }}
                    >
                      Pending
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Admin note (optional)"
                      value={draft.adminNote || ''}
                      onChange={(e) => updateDraft(r._id, 'adminNote', e.target.value)}
                      className="rounded-lg border px-3 py-2 text-sm"
                      style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                    />
                    <input
                      type="text"
                      placeholder="Report file URL (optional, for approve)"
                      value={draft.reportFileUrl || ''}
                      onChange={(e) => updateDraft(r._id, 'reportFileUrl', e.target.value)}
                      className="rounded-lg border px-3 py-2 text-sm"
                      style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                    />
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={actioningId === r._id}
                      onClick={() => handleAction(r, 'fulfilled')}
                      className="flex items-center gap-1.5 rounded-xl bg-black px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      <CheckCircle2 size={13} /> Approve
                    </button>
                    <button
                      type="button"
                      disabled={actioningId === r._id}
                      onClick={() => handleAction(r, 'rejected')}
                      className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
                      style={{ borderColor: t.border, color: t.textPrimary }}
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
            Resolved ({resolved.length})
          </h3>
          <div className="space-y-2.5">
            {resolved.map((r) => {
              const style = statusStyle[r.status] || statusStyle.pending;
              return (
                <div key={r._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3.5" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: t.textPrimary }}>{r.studentName}</p>
                    {r.adminNote && <p className="mt-0.5 text-xs" style={{ color: t.textMuted }}>{r.adminNote}</p>}
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-xs font-bold capitalize" style={{ backgroundColor: style.bg, color: style.color }}>
                    {r.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// PANEL 2 — Event Registrants
// ============================================================
const EventRegistrantsPanel = ({ t }) => {
  const [events, setEvents] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrantsData, setRegistrantsData] = useState(null);
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);

  useEffect(() => {
    eventsApi.getAllEventsAdmin()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => { setEvents([]); toast.error('Failed to load events'); });
  }, []);

  useEffect(() => {
    if (!selectedEventId) { setRegistrantsData(null); return; }
    setLoadingRegistrants(true);
    eventsApi.getEventRegistrations(selectedEventId)
      .then((data) => setRegistrantsData(data))
      .catch(() => { setRegistrantsData(null); toast.error('Failed to load registrants'); })
      .finally(() => setLoadingRegistrants(false));
  }, [selectedEventId]);

  return (
    <div className="space-y-5">
      <div className="max-w-md">
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
          Select an event
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full rounded-2xl border px-4 py-2.5 text-sm outline-none"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textPrimary }}
        >
          <option value="">
            {events === null ? 'Loading events...' : '-- Choose an event --'}
          </option>
          {(events || []).map((ev) => (
            <option key={ev._id} value={ev._id}>
              {ev.title} — {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </option>
          ))}
        </select>
      </div>

      {!selectedEventId && (
        <div className="rounded-2xl border p-6 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
          Pick an event above to see who's registered.
        </div>
      )}

      {selectedEventId && loadingRegistrants && (
        <div className="rounded-2xl border p-6 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
          Loading registrants...
        </div>
      )}

      {selectedEventId && !loadingRegistrants && registrantsData && (
        <div className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b pb-3" style={{ borderColor: t.border }}>
            <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>{registrantsData.event.title}</h3>
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: t.chipBg, color: t.textMuted }}>
              {registrantsData.count} registered
            </span>
          </div>

          {registrantsData.registrants.length === 0 && (
            <p className="py-4 text-center text-sm" style={{ color: t.textMuted }}>No one has registered yet.</p>
          )}

          <div className="space-y-2">
            {registrantsData.registrants.map((r) => (
              <div key={r.registrationId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3.5" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: t.textPrimary }}>{r.student?.username || 'Unknown student'}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: t.textMuted }}>
                    <Mail size={11} /> {r.student?.email}
                    {r.student?.department ? ` · ${r.student.department}` : ''}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: t.textMuted }}>
                  <Clock size={11} />
                  {new Date(r.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// PANEL 3 — Volunteer Opportunities (link to real event OR manual, + organizer)
// ============================================================
const VolunteerOpportunitiesPanel = ({ t }) => {
  const [opportunities, setOpportunities] = useState(null);
  const [allEvents, setAllEvents] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [linkedEventId, setLinkedEventId] = useState(''); // '' = manual entry
  const [form, setForm] = useState({
    eventTitle: '', role: '', date: '', slotsAvailable: '', description: '',
    organizerName: '', organizerLogo: '',
  });
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [applicantsById, setApplicantsById] = useState({});
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setOpportunities(null);
    volunteerOpportunityApi.getAllOpportunitiesAdmin()
      .then((data) => setOpportunities(Array.isArray(data) ? data : []))
      .catch(() => { setOpportunities([]); toast.error('Failed to load opportunities'); });
  };

  useEffect(() => { load(); }, []);

  // Populates the "link to existing event" dropdown
  useEffect(() => {
    eventsApi.getAllEventsAdmin()
      .then((data) => setAllEvents(Array.isArray(data) ? data : []))
      .catch(() => setAllEvents([]));
  }, []);

  const resetForm = () => {
    setForm({ eventTitle: '', role: '', date: '', slotsAvailable: '', description: '', organizerName: '', organizerLogo: '' });
    setLinkedEventId('');
  };

  // Picking an existing event auto-fills title/date/organizer from it
  const handleLinkedEventChange = (eventId) => {
    setLinkedEventId(eventId);
    if (!eventId) return;
    const ev = (allEvents || []).find((e) => e._id === eventId);
    if (!ev) return;
    setForm((f) => ({
      ...f,
      eventTitle: ev.title,
      date: new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      organizerName: ev.organizer?.name || '',
      organizerLogo: ev.organizer?.logo || '',
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.role.trim()) {
      toast.error('Role is required');
      return;
    }
    if (!linkedEventId && (!form.eventTitle.trim() || !form.date.trim())) {
      toast.error('Event title and date are required when not linking to an event');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        role: form.role.trim(),
        slotsAvailable: form.slotsAvailable === '' ? null : Number(form.slotsAvailable),
        description: form.description.trim(),
      };

      if (linkedEventId) {
        payload.eventId = linkedEventId;
      } else {
        payload.eventTitle = form.eventTitle.trim();
        payload.date = form.date.trim();
        payload.organizer = { name: form.organizerName.trim(), logo: form.organizerLogo.trim() };
      }

      await volunteerOpportunityApi.createOpportunity(payload);
      toast.success('Opportunity created');
      resetForm();
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create opportunity');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleOpen = async (opp) => {
    setBusyId(opp._id);
    try {
      await volunteerOpportunityApi.updateOpportunity(opp._id, { isOpen: !opp.isOpen });
      load();
    } catch {
      toast.error('Failed to update opportunity');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (opp) => {
    setBusyId(opp._id);
    try {
      await volunteerOpportunityApi.deleteOpportunity(opp._id);
      toast.success('Opportunity deleted');
      load();
    } catch {
      toast.error('Failed to delete opportunity');
    } finally {
      setBusyId(null);
    }
  };

  const toggleApplicants = async (oppId) => {
    if (expandedId === oppId) { setExpandedId(null); return; }
    setExpandedId(oppId);
    if (!applicantsById[oppId]) {
      try {
        const data = await volunteerOpportunityApi.getOpportunityApplicants(oppId);
        setApplicantsById((prev) => ({ ...prev, [oppId]: data }));
      } catch {
        toast.error('Failed to load applicants');
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: t.textMuted }}>Link an opportunity to an existing event, or create one manually.</p>
        <button
          type="button"
          onClick={() => { setShowForm((s) => !s); if (showForm) resetForm(); }}
          className="flex items-center gap-1.5 rounded-xl bg-black px-3.5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
        >
          <Plus size={14} /> {showForm ? 'Cancel' : 'New Opportunity'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border p-4" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
              <Link2 size={12} /> Link to an existing event (optional)
            </label>
            <select
              value={linkedEventId}
              onChange={(e) => handleLinkedEventChange(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            >
              <option value="">-- Manual entry (no linked event) --</option>
              {(allEvents || []).map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title} — {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Event title (e.g. XPERIA 2026)"
              value={form.eventTitle}
              onChange={(e) => setForm((f) => ({ ...f, eventTitle: e.target.value }))}
              disabled={!!linkedEventId}
              className="rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
            <input
              type="text"
              placeholder="Role (e.g. Registration Desk)"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
            <input
              type="text"
              placeholder="Date (e.g. Aug 26 - Aug 27)"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              disabled={!!linkedEventId}
              className="rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
            <input
              type="number"
              min="0"
              placeholder="Slots available (blank = unlimited)"
              value={form.slotsAvailable}
              onChange={(e) => setForm((f) => ({ ...f, slotsAvailable: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
            <input
              type="text"
              placeholder="Organizer name"
              value={form.organizerName}
              onChange={(e) => setForm((f) => ({ ...f, organizerName: e.target.value }))}
              disabled={!!linkedEventId}
              className="rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
            <input
              type="text"
              placeholder="Organizer logo URL"
              value={form.organizerLogo}
              onChange={(e) => setForm((f) => ({ ...f, organizerLogo: e.target.value }))}
              disabled={!!linkedEventId}
              className="rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
          </div>

          {linkedEventId && (
            <p className="text-xs" style={{ color: t.textMuted }}>
              Title, date, and organizer are pulled from the linked event — unlink to enter them manually.
            </p>
          )}

          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-black px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Opportunity'}
          </button>
        </form>
      )}

      {opportunities === null && (
        <div className="rounded-2xl border p-6 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
          Loading opportunities...
        </div>
      )}
      {opportunities !== null && opportunities.length === 0 && (
        <div className="rounded-2xl border p-6 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
          No opportunities created yet.
        </div>
      )}

      <div className="space-y-3">
        {opportunities?.map((opp) => (
          <div key={opp._id} className="rounded-2xl border p-4" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                {opp.organizer?.logo ? (
                  <img src={opp.organizer.logo} alt={opp.organizer.name} className="h-9 w-9 shrink-0 rounded-lg object-cover" style={{ border: `1px solid ${t.border}` }} />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: t.chipBg }}>
                    <Users size={14} style={{ color: t.textMuted }} />
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold" style={{ color: t.textPrimary }}>{opp.eventTitle}</h4>
                    <span className="rounded-md px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: t.chipBg, color: t.textMuted }}>
                      {opp.role}
                    </span>
                    {opp.event && (
                      <span className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                        <Link2 size={10} /> Linked event
                      </span>
                    )}
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: opp.isOpen ? '#dcfce7' : '#fee2e2', color: opp.isOpen ? '#15803d' : '#dc2626' }}
                    >
                      {opp.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
                    {opp.date}{opp.slotsAvailable != null ? ` · ${opp.slotsAvailable} slots` : ''}
                    {opp.organizer?.name ? ` · ${opp.organizer.name}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => toggleApplicants(opp._id)}
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold"
                  style={{ borderColor: t.border, color: t.textPrimary }}
                >
                  <Users size={12} /> Applicants
                </button>
                <button
                  type="button"
                  disabled={busyId === opp._id}
                  onClick={() => handleToggleOpen(opp)}
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold disabled:opacity-40"
                  style={{ borderColor: t.border, color: t.textPrimary }}
                >
                  {opp.isOpen ? <Lock size={12} /> : <Unlock size={12} />} {opp.isOpen ? 'Close' : 'Reopen'}
                </button>
                <button
                  type="button"
                  disabled={busyId === opp._id}
                  onClick={() => handleDelete(opp)}
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold text-red-500 disabled:opacity-40"
                  style={{ borderColor: t.border }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {expandedId === opp._id && (
              <div className="mt-3 border-t pt-3" style={{ borderColor: t.border }}>
                {!applicantsById[opp._id] && (
                  <p className="text-xs" style={{ color: t.textMuted }}>Loading applicants...</p>
                )}
                {applicantsById[opp._id] && applicantsById[opp._id].applicants.length === 0 && (
                  <p className="text-xs" style={{ color: t.textMuted }}>No applicants yet.</p>
                )}
                {applicantsById[opp._id] && applicantsById[opp._id].applicants.length > 0 && (
                  <div className="space-y-2">
                    {applicantsById[opp._id].applicants.map((a) => (
                      <div key={a.applicationId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg p-2.5 text-sm" style={{ backgroundColor: t.pageBg }}>
                        <div>
                          <span className="font-semibold" style={{ color: t.textPrimary }}>{a.student?.username}</span>
                          <span className="ml-2 text-xs" style={{ color: t.textMuted }}>{a.student?.email}</span>
                        </div>
                        <span className="text-xs" style={{ color: t.textMuted }}>
                          {new Date(a.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// PANEL 4 — Volunteer Hours (grouped by student, verified records)
// ============================================================
const VolunteerHoursPanel = ({ t }) => {
  const [records, setRecords] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    volunteerApi.getAllVolunteerRecordsAdmin()
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => { setRecords([]); toast.error('Failed to load volunteer records'); });
  }, []);

  const grouped = {};
  (records || []).forEach((rec) => {
    const key = rec.student?._id || 'unknown';
    if (!grouped[key]) {
      grouped[key] = { student: rec.student, totalHours: 0, recordCount: 0, records: [] };
    }
    grouped[key].totalHours += rec.hours || 0;
    grouped[key].recordCount += 1;
    grouped[key].records.push(rec);
  });

  const studentList = Object.values(grouped)
    .filter((g) =>
      g.student?.username?.toLowerCase().includes(search.toLowerCase()) ||
      g.student?.email?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.totalHours - a.totalHours);

  return (
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border py-2.5 pl-11 pr-4 text-sm outline-none"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textPrimary }}
        />
      </div>

      {records === null && (
        <div className="rounded-2xl border p-6 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
          Loading volunteer records...
        </div>
      )}

      {records !== null && studentList.length === 0 && (
        <div className="rounded-2xl border p-6 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
          No volunteer records found.
        </div>
      )}

      <div className="space-y-3">
        {studentList.map((g) => (
          <details key={g.student?._id || Math.random()} className="rounded-2xl border p-4" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold" style={{ color: t.textPrimary }}>{g.student?.username || 'Unknown student'}</p>
                <p className="text-xs" style={{ color: t.textMuted }}>{g.student?.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: t.chipBg, color: t.textMuted }}>
                  {g.recordCount} {g.recordCount === 1 ? 'entry' : 'entries'}
                </span>
                <span className="rounded-full px-3 py-1 text-sm font-bold" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                  {g.totalHours} hrs
                </span>
              </div>
            </summary>

            <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: t.border }}>
              {g.records.map((rec) => (
                <div key={rec._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg p-2.5 text-sm" style={{ backgroundColor: t.pageBg }}>
                  <div>
                    <span className="font-semibold" style={{ color: t.textPrimary }}>{rec.role}</span>
                    <span className="ml-2 text-xs" style={{ color: t.textMuted }}>{rec.eventTitle} · {rec.date}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: t.textMuted }}>+{rec.hours} hrs</span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};

export default ManageSSDSection;