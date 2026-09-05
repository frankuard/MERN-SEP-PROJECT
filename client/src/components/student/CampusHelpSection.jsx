import { useState, useRef, useEffect, useCallback } from 'react';
import {
  HelpCircle, Building2, Phone, Mail, GraduationCap,
  CalendarClock, MessageSquare, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AskHelpModal from './modals/AskHelpModal';
import HelpThreadModal from './modals/HelpThreadModal';
import campusHelpApi from '../../api/campusHelpApi';

const CARD_TINTS = ['pastelBlue', 'pastelPink', 'pastelYellow', 'pastelCyan', 'pastelPurple', 'pastelOrange'];

const ACCENT = {
  blue: '#5b7c99',
  green: '#5c8a72',
};

// Backend stores department.icon as a string (e.g. "Building2") — map it
// to the actual Lucide component here. Add more as new departments/icons
// are created from the admin side.
const ICON_MAP = {
  Building2,
  GraduationCap,
  CalendarClock,
};

// Backend only gives us createdAt timestamps — this renders the same
// relative "Xh ago" style the old dummy data had.
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const DepartmentCard = ({ dept, t }) => {
  const DeptIcon = ICON_MAP[dept.icon] || Building2;
  return (
    <div
      className="dashboard-card-lift rounded-[24px] p-5"
      style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black text-white">
          <DeptIcon size={18} strokeWidth={2.5} />
        </div>
        <h3 className="text-sm font-extrabold" style={{ color: t.textPrimary }}>{dept.title}</h3>
      </div>

      <div className="flex flex-col gap-2.5">
        <a href={dept.phoneHref}
          className="flex items-center gap-2 text-sm hover:underline"
          style={{ color: t.textPrimary }}
        >
          <Phone size={15} style={{ color: ACCENT.green }} />
          <span className="font-bold" style={{ color: t.textMuted }}>Phone:</span>
          <span className="font-extrabold">{dept.phone}</span>
        </a>

        <a href={dept.emailHref}
          className="flex items-center gap-2 text-sm hover:underline"
          style={{ color: t.textPrimary }}
        >
          <Mail size={15} style={{ color: ACCENT.blue }} />
          <span className="font-bold" style={{ color: t.textMuted }}>Email:</span>
          <span className="font-extrabold">{dept.email}</span>
        </a>
      </div>
    </div>
  );
};

const CampusHelpSection = ({ t, user }) => {
  const [helpRequests, setHelpRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [showAskHelpModal, setShowAskHelpModal] = useState(false);
  const [activeThread, setActiveThread] = useState(null);

  const peerHelpRef = useRef(null);
  const contactInfoRef = useRef(null);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fetchHelpRequests = useCallback(() => {
    setLoadingRequests(true);
    campusHelpApi.getHelpRequests()
      .then((data) => setHelpRequests(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Could not load peer help requests'))
      .finally(() => setLoadingRequests(false));
  }, []);

  const fetchDepartments = useCallback(() => {
    setLoadingDepartments(true);
    campusHelpApi.getDepartments()
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Could not load department contacts'))
      .finally(() => setLoadingDepartments(false));
  }, []);

  useEffect(() => {
    fetchHelpRequests();
    fetchDepartments();
  }, [fetchHelpRequests, fetchDepartments]);

  // AskHelpModal is expected to call this with { text, attachments }, where
  // attachments is already the final array to submit (e.g. uploaded URLs).
  const handleAddHelpRequest = async ({ text, attachments }) => {
    try {
      const created = await campusHelpApi.submitHelpRequest({ request: text, attachments });
      setHelpRequests((prev) => [created, ...prev]);
      toast.success('Help request shared with campus!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not submit request');
    }
  };

  // HelpThreadModal is expected to call this with { text, files }, where
  // files is an array of raw File objects — upload each first, then submit
  // the resulting URLs as attachments.
  const handleAddResponse = async (requestId, { text, files }) => {
    try {
      let attachmentUrls = [];
      if (Array.isArray(files) && files.length > 0) {
        const uploaded = await Promise.all(files.map((f) => campusHelpApi.uploadAttachment(f)));
        attachmentUrls = uploaded.map((u) => u.url);
      }

      const updated = await campusHelpApi.addResponse(requestId, { message: text, attachments: attachmentUrls });
      setHelpRequests((prev) => prev.map((req) => (req._id === requestId ? updated : req)));
      setActiveThread((prev) => (prev && prev._id === requestId ? updated : prev));
      toast.success('Response posted!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not post response');
    }
  };

  return (
    <div className="dashboard-playful space-y-6 pb-4 animate-in fade-in duration-200">

      {/* Jump-link buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => scrollTo(peerHelpRef)}
          className="cursor-pointer flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: ACCENT.green }}
        >
          <HelpCircle size={16} />
          Peer Help
        </button>
        <button
          type="button"
          onClick={() => scrollTo(contactInfoRef)}
          className="cursor-pointer flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-extrabold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ borderColor: t.border, color: t.textPrimary }}
        >
          <Building2 size={16} />
          Contact Info
        </button>
      </div>

      {/* ---- SECTION 1: Peer Help & Study Requests (TOP) ---- */}
      <div
        ref={peerHelpRef}
        className="dashboard-card-lift scroll-mt-6 rounded-[28px] p-5 sm:p-7"
        style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-white">
              <HelpCircle size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>
                Campus Peer Help &amp; Study Requests
              </h3>
              <p className="text-xs font-semibold" style={{ color: t.textMuted }}>
                Ask fellow students for course notes, equipment sharing, or peer tutoring
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAskHelpModal(true)}
            className="dashboard-btn-bounce mb-5 flex cursor-pointer items-center justify-center gap-2 self-start rounded-full py-2.5 px-5 text-xs font-extrabold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: ACCENT.green, boxShadow: t.shadowSoft }}
          >
            + Ask Campus Help
          </button>
        </div>

        {loadingRequests && (
          <div className="flex items-center justify-center gap-2 py-10" style={{ color: t.textMuted }}>
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm font-semibold">Loading requests...</span>
          </div>
        )}

        {!loadingRequests && helpRequests.length === 0 && (
          <div className="py-10 text-center">
            <MessageSquare size={26} className="mx-auto mb-2" style={{ color: t.textMuted }} />
            <p className="text-sm font-semibold" style={{ color: t.textMuted }}>
              No peer help requests yet — be the first to ask.
            </p>
          </div>
        )}

        {!loadingRequests && helpRequests.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {helpRequests.map((req, i) => (
              <div
                key={req._id}
                className="dashboard-card-lift flex flex-col justify-between rounded-[22px] p-4"
                style={{ backgroundColor: t[CARD_TINTS[i % CARD_TINTS.length]], boxShadow: t.shadowSoft }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-extrabold"
                      style={{ backgroundColor: t.surfaceBg, color: t.textPrimary }}
                    >
                      {req.requesterSem || req.requester?.department || 'Student'}
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color: t.textMuted }}>
                      {timeAgo(req.createdAt)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-extrabold leading-snug" style={{ color: t.textPrimary }}>
                    &ldquo;{req.request}&rdquo;
                  </p>

                  <p className="mt-2 text-xs font-semibold" style={{ color: t.textSecondary || t.textMuted }}>
                    by <span className="font-extrabold" style={{ color: t.textPrimary }}>
                      {req.requesterName || req.requester?.username || 'Student'}
                    </span>
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3">
                  <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: t.textMuted }}>
                    <MessageSquare size={13} /> {req.responses?.length || 0} responses
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveThread(req)}
                    className="cursor-pointer rounded-full px-3 py-1 text-xs font-extrabold transition-all hover:opacity-80"
                    style={{ backgroundColor: t.surfaceBg, color: t.textPrimary }}
                  >
                    View &amp; Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- SECTION 2: Contact Info (BOTTOM) ---- */}
      <div ref={contactInfoRef} className="scroll-mt-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-white">
            <Building2 size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>Contact Info</h3>
            <p className="text-xs font-semibold" style={{ color: t.textMuted }}>
              Reach out to campus departments directly
            </p>
          </div>
        </div>

        {loadingDepartments && (
          <div className="flex items-center justify-center gap-2 py-10" style={{ color: t.textMuted }}>
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm font-semibold">Loading departments...</span>
          </div>
        )}

        {!loadingDepartments && departments.length === 0 && (
          <div className="py-10 text-center">
            <Building2 size={26} className="mx-auto mb-2" style={{ color: t.textMuted }} />
            <p className="text-sm font-semibold" style={{ color: t.textMuted }}>
              No department contacts have been added yet.
            </p>
          </div>
        )}

        {!loadingDepartments && departments.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {departments.map((dept) => (
              <DepartmentCard key={dept._id} dept={dept} t={t} />
            ))}
          </div>
        )}
      </div>

      <AskHelpModal
        isOpen={showAskHelpModal}
        onClose={() => setShowAskHelpModal(false)}
        t={t}
        onSubmit={handleAddHelpRequest}
      />

      <HelpThreadModal
        isOpen={!!activeThread}
        onClose={() => setActiveThread(null)}
        t={t}
        request={activeThread}
        onReply={(payload) => activeThread && handleAddResponse(activeThread._id, payload)}
      />
    </div>
  );
};

export default CampusHelpSection;