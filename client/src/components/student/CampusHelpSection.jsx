import { useState, useRef } from 'react';
import {
  HelpCircle, Building2, Phone, Mail, GraduationCap,
  CalendarClock, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import AskHelpModal from './modals/AskHelpModal';
import HelpThreadModal from './modals/HelpThreadModal';

const CARD_TINTS = ['pastelBlue', 'pastelPink', 'pastelYellow', 'pastelCyan', 'pastelPurple', 'pastelOrange'];

const ACCENT = {
  blue: '#5b7c99',
  green: '#5c8a72',
};

// ---- Dummy department contact data (Phase 1 — will move to API later) ----
const DEPARTMENTS = [
  {
    id: 'bic',
    icon: Building2,
    title: 'Official BIC Campus Contact',
    phone: '021-500050',
    phoneHref: 'tel:0215000050',
    email: 'info@bicnepal.edu.np',
    emailHref: 'mailto:info@bicnepal.edu.np',
  },
  {
    id: 'ssd',
    icon: GraduationCap,
    title: 'SSD Department',
    phone: '+977 9802747227',
    phoneHref: 'tel:+9779802747227',
    email: 'studentservices@bicnepal.edu.np',
    emailHref: 'mailto:studentservices@bicnepal.edu.np',
  },
  {
    id: 'rte',
    icon: CalendarClock,
    title: 'RTE Department',
    phone: '+977 9802747228',
    phoneHref: 'tel:+9779802747228',
    email: 'registry@bicnepal.edu.np',
    emailHref: 'mailto:registry@bicnepal.edu.np',
  },
];

// ---- Dummy peer help requests with embedded response threads (Phase 1) ----
const INITIAL_HELP_REQUESTS = [
  {
    id: 'ch1',
    request: 'Can someone share today\u2019s DBMS notes?',
    author: 'Ankit Sharma',
    sem: 'CS 5th Sem',
    time: '1h ago',
    responses: [
      {
        id: 'r1',
        author: 'Priya Shrestha',
        time: '45m ago',
        message: 'I have the full chapter scanned, sending it over.',
        attachments: ['dbms-notes-ch4.pdf'],
      },
    ],
  },
  {
    id: 'ch2',
    request: 'Need a scientific calculator for tomorrow\u2019s exam.',
    author: 'Priya Shrestha',
    sem: 'BBA 2nd Sem',
    time: '3h ago',
    responses: [],
  },
  {
    id: 'ch3',
    request: 'Looking for a study partner for AI midterms.',
    author: 'Rohan KC',
    sem: 'BCA 4th Sem',
    time: '5h ago',
    responses: [
      {
        id: 'r2',
        author: 'Suraj Poddar',
        time: '2h ago',
        message: 'Down to study together, free after 4 PM most days.',
        attachments: [],
      },
      {
        id: 'r3',
        author: 'Diya Khadka',
        time: '1h ago',
        message: 'Same here, can we make a group chat?',
        attachments: [],
      },
    ],
  },
];

const DepartmentCard = ({ dept, t }) => {
  const DeptIcon = dept.icon;
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
  const [helpRequests, setHelpRequests] = useState(INITIAL_HELP_REQUESTS);
  const [showAskHelpModal, setShowAskHelpModal] = useState(false);
  const [activeThread, setActiveThread] = useState(null);

  const peerHelpRef = useRef(null);
  const contactInfoRef = useRef(null);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAddHelpRequest = ({ text, attachments }) => {
  const newReq = {
    id: `ch_${Date.now()}`,
    request: text,
    author: user?.username || 'Suraj Poddar',
    sem: user?.semester ? `Sem ${user.semester}` : 'Student',
    time: 'Just now',
    responses: [],
    attachments,
  };
  setHelpRequests((prev) => [newReq, ...prev]);
  toast.success('Help request shared with campus!');
};


  const handleAddResponse = (requestId, { text, files }) => {
    const newResponse = {
      id: `r_${Date.now()}`,
      author: user?.username || 'Roshan Karki',
      time: 'Just now',
      message: text,
      attachments: files.map((f) => f.name),
    };
    setHelpRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, responses: [...req.responses, newResponse] } : req
      )
    );
    setActiveThread((prev) =>
      prev && prev.id === requestId ? { ...prev, responses: [...prev.responses, newResponse] } : prev
    );
    toast.success('Response posted!');
  };

  return (
    <div className="dashboard-playful space-y-6 pb-4 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-[26px]" style={{ color: t.textPrimary }}>
          Campus Help
        </h2>
        <p className="mt-1.5 text-base leading-relaxed" style={{ color: t.textMuted }}>
          Official contacts and peer support, all in one place.
        </p>
      </div>

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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {helpRequests.map((req, i) => (
            <div
              key={req.id}
              className="dashboard-card-lift flex flex-col justify-between rounded-[22px] p-4"
              style={{ backgroundColor: t[CARD_TINTS[i % CARD_TINTS.length]], boxShadow: t.shadowSoft }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-extrabold"
                    style={{ backgroundColor: t.surfaceBg, color: t.textPrimary }}
                  >
                    {req.sem}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: t.textMuted }}>
                    {req.time}
                  </span>
                </div>

                <p className="mt-3 text-sm font-extrabold leading-snug" style={{ color: t.textPrimary }}>
                  &ldquo;{req.request}&rdquo;
                </p>

                <p className="mt-2 text-xs font-semibold" style={{ color: t.textSecondary || t.textMuted }}>
                  by <span className="font-extrabold" style={{ color: t.textPrimary }}>{req.author}</span>
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3">
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: t.textMuted }}>
                  <MessageSquare size={13} /> {req.responses.length} responses
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {DEPARTMENTS.map((dept) => (
            <DepartmentCard key={dept.id} dept={dept} t={t} />
          ))}
        </div>
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
        onReply={(payload) => activeThread && handleAddResponse(activeThread.id, payload)}
      />
    </div>
  );
};

export default CampusHelpSection;