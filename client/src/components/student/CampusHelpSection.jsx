import React from 'react';
import {
  HelpCircle, Building2, Phone, Mail, MapPin,
  GraduationCap, Clock, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

const CampusHelpSection = ({
  t,
  helpRequests,
  onOpenAskHelpModal,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Official College Header Card with Logo at First */}
      <div
        className="rounded-3xl border p-7 shadow-xs relative overflow-hidden"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b pb-6" style={{ borderColor: t.border }}>
          {/* Logo Prominently at First */}
          <div className="flex items-center gap-4 bg-white dark:bg-white/95 p-3 rounded-2xl border border-gray-200 shadow-xs">
            <img
              src="/bic-logo-full.png"
              alt="Biratnagar International College | ing"
              className="h-14 sm:h-16 w-auto object-contain select-none"
            />
          </div>

          <div className="text-center md:text-right space-y-1">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800">
              Official Help &amp; Student Support Desk
            </span>
            <p className="text-xs font-semibold mt-1" style={{ color: t.textMuted }}>
              Biratnagar International College · In Academic Partnership with University of Wolverhampton, UK
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
              <Building2 size={20} className="text-blue-600" />
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-wide" style={{ color: t.textPrimary }}>
                  Official BIC Campus Contact
                </h3>
                <p className="text-[11px]" style={{ color: t.textMuted }}>
                  General Inquiries, Administration &amp; Academic Affairs
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* PHONE */}
              <div className="flex items-start gap-3 rounded-xl border p-3 bg-white dark:bg-[#1a1f2c]" style={{ borderColor: t.border }}>
                <Phone size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px]" style={{ color: t.textMuted }}>
                    PHONE
                  </p>
                  <p className="font-extrabold text-sm text-[#2f4336] dark:text-emerald-400 mt-0.5">
                    021-500050 / 021-500170 / 9801009090
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Front Desk &amp; Admissions Hotline (07:00 AM – 05:00 PM)
                  </p>
                </div>
              </div>

              {/* EMAIL */}
              <div className="flex items-start gap-3 rounded-xl border p-3 bg-white dark:bg-[#1a1f2c]" style={{ borderColor: t.border }}>
                <Mail size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px]" style={{ color: t.textMuted }}>
                    EMAIL
                  </p>
                  <a
                    href="mailto:info@bicnepal.edu.np"
                    className="font-extrabold text-sm text-blue-600 hover:underline mt-0.5 block"
                  >
                    info@bicnepal.edu.np
                  </a>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Official Institutional Correspondence
                  </p>
                </div>
              </div>

              {/* LOCATION */}
              <div className="flex items-start gap-3 rounded-xl border p-3 bg-white dark:bg-[#1a1f2c]" style={{ borderColor: t.border }}>
                <MapPin size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px]" style={{ color: t.textMuted }}>
                    LOCATION
                  </p>
                  <p className="font-extrabold text-sm" style={{ color: t.textPrimary }}>
                    Biratnagar 5, Bhrikuti Chowk
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
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
              <GraduationCap size={22} className="text-amber-600" />
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-wide" style={{ color: t.textPrimary }}>
                  SSD Department (Student Services)
                </h3>
                <p className="text-[11px]" style={{ color: t.textMuted }}>
                  Attendance, Scholarships, Volunteering &amp; Student Welfare
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* SSD PHONE */}
              <div className="flex items-start gap-3 rounded-xl border p-3 bg-white dark:bg-[#1a1f2c]" style={{ borderColor: t.border }}>
                <Phone size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px]" style={{ color: t.textMuted }}>
                    SSD HELPLINE NUMBER
                  </p>
                  <a
                    href="tel:+9779802747227"
                    className="font-extrabold text-sm text-amber-700 dark:text-amber-300 hover:underline mt-0.5 block"
                  >
                    +977 9802747227
                  </a>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Direct SSD Officer &amp; Student Welfare Coordinator
                  </p>
                </div>
              </div>

              {/* SSD EMAIL */}
              <div className="flex items-start gap-3 rounded-xl border p-3 bg-white dark:bg-[#1a1f2c]" style={{ borderColor: t.border }}>
                <Mail size={18} className="text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px]" style={{ color: t.textMuted }}>
                    SSD DEPARTMENT EMAIL
                  </p>
                  <a
                    href="mailto:studentservices@bicnepal.edu.np"
                    className="font-extrabold text-sm text-purple-700 dark:text-purple-300 hover:underline mt-0.5 block"
                  >
                    studentservices@bicnepal.edu.np
                  </a>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Scholarship Renewals, Leave Requests &amp; Records
                  </p>
                </div>
              </div>

              {/* SSD ROOM & HOURS */}
              <div className="flex items-start gap-3 rounded-xl border p-3 bg-white dark:bg-[#1a1f2c]" style={{ borderColor: t.border }}>
                <Clock size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px]" style={{ color: t.textMuted }}>
                    OFFICE LOCATION &amp; HOURS
                  </p>
                  <p className="font-bold text-xs" style={{ color: t.textPrimary }}>
                    Block A, Room 102 (Administration Floor)
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
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
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
      >
        <div className="flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2">
            <HelpCircle size={20} className="text-blue-600" />
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
            onClick={onOpenAskHelpModal}
            className="rounded-xl bg-[#2f4336] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#25362b] self-start"
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
                  <span className="rounded-md bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
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
                  className="rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ borderColor: t.border, color: t.textPrimary }}
                >
                  Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CampusHelpSection;
