import React, { useState } from 'react';
import {
  HelpCircle, Building2, Phone, Mail, MapPin,
  GraduationCap, Clock, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import campusHelpApi from '../../api/campusHelpApi';
import AskHelpModal from './modals/AskHelpModal';

// Fixed, calm accent colors — same muted palette used across Resources —
// applied via inline style instead of Tailwind's dark: variants, so they
// render correctly regardless of theme rather than depending on a stray
// dark-mode class.
const ACCENT = {
  blue: '#5b7c99',
  green: '#5c8a72',
  amber: '#b08a5a',
  purple: '#8a72a8',
  rose: '#b5636b',
};

const CampusHelpSection = ({
  t,
  user,
  helpRequests,
  setHelpRequests,
}) => {
  const [showAskHelpModal, setShowAskHelpModal] = useState(false);

  const handleAddHelpRequest = async (requestText) => {
    const newReq = await campusHelpApi.submitHelpRequest(requestText, user?.username || 'Suraj Poddar');
    setHelpRequests((prev) => [newReq, ...prev]);
    toast.success('Help request shared with campus!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Official College Header Card with Logo at First */}
      <div
        className="rounded-3xl border p-7 shadow-xs relative overflow-hidden"
        style={{ backgroundColor: t.cardBg, borderColor: t.border }}
      >
        <div className="flex flex-col items-center gap-5 border-b pb-6 text-center md:flex-row md:text-left" style={{ borderColor: t.border }}>
          {/* Logo Prominently at First — kept on a fixed white plate since the
              logo artwork itself needs a light background regardless of theme */}
          <div className="flex shrink-0 items-center gap-4 rounded-2xl border p-3 shadow-xs" style={{ backgroundColor: '#ffffff', borderColor: t.border }}>
            <img
              src="/bic-logo-full.png"
              alt="Biratnagar International College | ing"
              className="h-14 sm:h-16 w-auto object-contain select-none"
            />
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl" style={{ color: t.textPrimary }}>
              Biratnagar International College
            </h1>
            <p className="mt-1 text-sm font-semibold" style={{ color: t.textMuted }}>
              In Academic Partnership with University of Wolverhampton, UK
            </p>
          </div>
        </div>

        {/* 2 Contact Hubs Side-by-Side: Official BIC Contacts (Left) | SSD Help Department (Right) */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Official BIC General Contact Details */}
          <div
            className="rounded-2xl border p-5 shadow-xs space-y-4"
            style={{ backgroundColor: t.pageBg, borderColor: t.border }}
          >
            <div className="flex items-center gap-2.5 border-b pb-3" style={{ borderColor: t.border }}>
              <Building2 size={20} style={{ color: ACCENT.blue }} />
              <div>
                <h3 className="text-lg font-extrabold uppercase tracking-wide" style={{ color: t.textPrimary }}>
                  Official BIC Campus Contact
                </h3>
                <p className="text-[12.5px]" style={{ color: t.textMuted }}>
                  General Inquiries, Administration &amp; Academic Affairs
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* PHONE */}
              <div className="flex items-start gap-3.5 rounded-xl border p-4" style={{ backgroundColor: t.surfaceBg, borderColor: t.border }}>
                <Phone size={18} className="shrink-0 mt-0.5" style={{ color: ACCENT.green }} />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[11px]" style={{ color: t.textMuted }}>
                    PHONE
                  </p>
                  <p className="font-extrabold text-[15px] mt-0.5" style={{ color: ACCENT.green }}>
                    021-500050 / 021-500170 / 9801009090
                  </p>
                  <p className="text-[12.5px] mt-0.5" style={{ color: t.textMuted }}>
                    Front Desk &amp; Admissions Hotline (07:00 AM – 05:00 PM)
                  </p>
                </div>
              </div>

              {/* EMAIL */}
              <div className="flex items-start gap-3.5 rounded-xl border p-4" style={{ backgroundColor: t.surfaceBg, borderColor: t.border }}>
                <Mail size={18} className="shrink-0 mt-0.5" style={{ color: ACCENT.blue }} />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[11px]" style={{ color: t.textMuted }}>
                    EMAIL
                  </p>
                  <a
                    href="mailto:info@bicnepal.edu.np"
                    className="font-extrabold text-[15px] hover:underline mt-0.5 block"
                    style={{ color: ACCENT.blue }}
                  >
                    info@bicnepal.edu.np
                  </a>
                  <p className="text-[12.5px] mt-0.5" style={{ color: t.textMuted }}>
                    Official Institutional Correspondence
                  </p>
                </div>
              </div>

              {/* LOCATION */}
              <div className="flex items-start gap-3.5 rounded-xl border p-4" style={{ backgroundColor: t.surfaceBg, borderColor: t.border }}>
                <MapPin size={18} className="shrink-0 mt-0.5" style={{ color: ACCENT.rose }} />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[11px]" style={{ color: t.textMuted }}>
                    LOCATION
                  </p>
                  <p className="font-extrabold text-[15px]" style={{ color: t.textPrimary }}>
                    Biratnagar 5, Bhrikuti Chowk
                  </p>
                  <p className="text-[12.5px] mt-0.5" style={{ color: t.textMuted }}>
                    Morang, Koshi Province, Nepal
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Services Department (SSD) Specific Contact */}
          <div
            className="rounded-2xl border p-5 shadow-xs space-y-4"
            style={{ backgroundColor: t.pageBg, borderColor: t.border }}
          >
            <div className="flex items-center gap-2.5 border-b pb-3" style={{ borderColor: t.border }}>
              <GraduationCap size={22} style={{ color: ACCENT.amber }} />
              <div>
                <h3 className="text-lg font-extrabold uppercase tracking-wide" style={{ color: t.textPrimary }}>
                  SSD Department (Student Services)
                </h3>
                <p className="text-[12.5px]" style={{ color: t.textMuted }}>
                  Attendance, Scholarships, Volunteering &amp; Student Welfare
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* SSD PHONE */}
              <div className="flex items-start gap-3.5 rounded-xl border p-4" style={{ backgroundColor: t.surfaceBg, borderColor: t.border }}>
                <Phone size={18} className="shrink-0 mt-0.5" style={{ color: ACCENT.amber }} />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[11px]" style={{ color: t.textMuted }}>
                    SSD HELPLINE NUMBER
                  </p>
                  <a
                    href="tel:+9779802747227"
                    className="font-extrabold text-[15px] hover:underline mt-0.5 block"
                    style={{ color: ACCENT.amber }}
                  >
                    +977 9802747227
                  </a>
                  <p className="text-[12.5px] mt-0.5" style={{ color: t.textMuted }}>
                    Direct SSD Officer &amp; Student Welfare Coordinator
                  </p>
                </div>
              </div>

              {/* SSD EMAIL */}
              <div className="flex items-start gap-3.5 rounded-xl border p-4" style={{ backgroundColor: t.surfaceBg, borderColor: t.border }}>
                <Mail size={18} className="shrink-0 mt-0.5" style={{ color: ACCENT.purple }} />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[11px]" style={{ color: t.textMuted }}>
                    SSD DEPARTMENT EMAIL
                  </p>
                  <a
                    href="mailto:studentservices@bicnepal.edu.np"
                    className="font-extrabold text-[15px] hover:underline mt-0.5 block"
                    style={{ color: ACCENT.purple }}
                  >
                    studentservices@bicnepal.edu.np
                  </a>
                  <p className="text-[12.5px] mt-0.5" style={{ color: t.textMuted }}>
                    Scholarship Renewals, Leave Requests &amp; Records
                  </p>
                </div>
              </div>

              {/* SSD ROOM & HOURS */}
              <div className="flex items-start gap-3.5 rounded-xl border p-4" style={{ backgroundColor: t.surfaceBg, borderColor: t.border }}>
                <Clock size={18} className="shrink-0 mt-0.5" style={{ color: ACCENT.blue }} />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[11px]" style={{ color: t.textMuted }}>
                    OFFICE LOCATION &amp; HOURS
                  </p>
                  <p className="font-bold text-xs" style={{ color: t.textPrimary }}>
                    Block A, Room 102 (Administration Floor)
                  </p>
                  <p className="text-[12.5px] mt-0.5" style={{ color: t.textMuted }}>
                    Sunday – Friday: 07:00 AM – 04:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Peer Help & Student Requests Community Board */}
      <div
        className="rounded-3xl border p-6 shadow-xs space-y-5"
        style={{ backgroundColor: t.cardBg, borderColor: t.border }}
      >
        <div className="flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2">
            <HelpCircle size={20} style={{ color: ACCENT.blue }} />
            <div>
              <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                Campus Peer Help &amp; Study Requests
              </h3>
              <p className="text-xs" style={{ color: t.textMuted }}>
                Ask fellow students for course notes, equipment sharing, or peer tutoring
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAskHelpModal(true)}
            className="rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs self-start transition-opacity hover:opacity-90"
            style={{ backgroundColor: ACCENT.green }}
          >
            + Ask Campus Help
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {helpRequests.map((req) => (
            <div
              key={req.id}
              className="flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all hover:shadow-md"
              style={{ backgroundColor: t.pageBg, borderColor: t.border }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: t.surfaceBg, color: ACCENT.blue }}
                  >
                    {req.sem}
                  </span>
                  <span className="text-[10px]" style={{ color: t.textMuted }}>
                    {req.time}
                  </span>
                </div>

                <p className="mt-3 text-sm font-bold leading-snug" style={{ color: t.textPrimary }}>
                  “{req.request}”
                </p>

                <p className="mt-2 text-xs" style={{ color: t.textMuted }}>
                  by <span className="font-semibold" style={{ color: t.textPrimary }}>{req.author}</span>
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: t.border }}>
                <span className="flex items-center gap-1 text-xs" style={{ color: t.textMuted }}>
                  <MessageSquare size={13} /> {req.replies} responses
                </span>
                <button
                  type="button"
                  onClick={() => toast.success(`Replying to ${req.author}...`)}
                  className="rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors"
                  style={{ borderColor: t.border, color: t.textPrimary }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.hoverBg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ask Help Modal */}
      <AskHelpModal
        isOpen={showAskHelpModal}
        onClose={() => setShowAskHelpModal(false)}
        t={t}
        onSubmit={handleAddHelpRequest}
      />
    </div>
  );
};

export default CampusHelpSection;