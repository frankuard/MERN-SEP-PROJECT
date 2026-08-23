import React, { useState } from 'react';
import {
  HelpCircle, Building2, Phone, Mail, MapPin,
  GraduationCap, Clock, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import campusHelpApi from '../../api/campusHelpApi';
import AskHelpModal from './modals/AskHelpModal';

// Same rotating pastel tints used across the Dashboard (CanteenSpecial,
// ImportantAnnouncements) and Resources, so every card-based section in the
// app shares the same rhythm of colors.
const CARD_TINTS = ['pastelBlue', 'pastelPink', 'pastelYellow', 'pastelCyan', 'pastelPurple', 'pastelOrange'];

// Fixed, calm accent colors for icons/values — applied via inline style so
// they render correctly in both themes regardless of any dark-mode class.
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

  // Each contact detail rendered as its own small "item card" — matching the
  // book-card / gear-card pattern from Resources — instead of a plain row.
  const ContactCard = ({ icon, tint, label, value, note, href }) => (
    <div
      className="dashboard-card-lift flex items-start gap-3 rounded-[22px] p-4"
      style={{ backgroundColor: tint, boxShadow: t.shadowSoft }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: t.surfaceBg }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: t.textMuted }}>
          {label}
        </p>
        {href ? (
          <a href={href} className="mt-1 block text-sm font-extrabold hover:underline" style={{ color: t.textPrimary }}>
            {value}
          </a>
        ) : (
          <p className="mt-1 text-sm font-extrabold" style={{ color: t.textPrimary }}>
            {value}
          </p>
        )}
        <p className="mt-1 text-xs font-semibold" style={{ color: t.textSecondary || t.textMuted }}>
          {note}
        </p>
      </div>
    </div>
  );

  return (
    <div className="dashboard-playful space-y-6 pb-4 animate-in fade-in duration-200">
      {/* CARD 1: College Header */}
      <div
        className="dashboard-card-lift flex flex-col items-center gap-5 rounded-[28px] p-5 text-center sm:p-7 md:flex-row md:text-left"
        style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}
      >
        {/* Logo kept on a fixed white plate since the artwork itself needs a
            light background regardless of theme */}
        <div className="flex shrink-0 items-center gap-4 rounded-2xl border p-3" style={{ backgroundColor: '#ffffff', borderColor: t.border }}>
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
          <p className="mt-1 text-xs font-semibold sm:text-sm" style={{ color: t.textMuted }}>
            In Academic Partnership with University of Wolverhampton, UK
          </p>
        </div>
      </div>

      {/* CARD 2: Official BIC Campus Contact */}
      <div
        className="dashboard-card-lift rounded-[28px] p-5 sm:p-7"
        style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-white">
            <Building2 size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>
              Official BIC Campus Contact
            </h3>
            <p className="text-xs font-semibold" style={{ color: t.textMuted }}>
              General inquiries, administration &amp; academic affairs
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ContactCard
            icon={<Phone size={18} style={{ color: ACCENT.green }} />}
            tint={t[CARD_TINTS[0]]}
            label="Phone"
            value="021-500050 / 021-500170 / 9801009090"
            note="Front Desk & Admissions Hotline (07:00 AM – 05:00 PM)"
            href="tel:0215000050"
          />
          <ContactCard
            icon={<Mail size={18} style={{ color: ACCENT.blue }} />}
            tint={t[CARD_TINTS[1]]}
            label="Email"
            value="info@bicnepal.edu.np"
            note="Official institutional correspondence"
            href="mailto:info@bicnepal.edu.np"
          />
          <ContactCard
            icon={<MapPin size={18} style={{ color: ACCENT.rose }} />}
            tint={t[CARD_TINTS[2]]}
            label="Location"
            value="Biratnagar 5, Bhrikuti Chowk"
            note="Morang, Koshi Province, Nepal"
          />
        </div>
      </div>

      {/* CARD 3: SSD Department (Student Services) */}
      <div
        className="dashboard-card-lift rounded-[28px] p-5 sm:p-7"
        style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-white">
            <GraduationCap size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>
              SSD Department (Student Services)
            </h3>
            <p className="text-xs font-semibold" style={{ color: t.textMuted }}>
              Attendance, scholarships, volunteering &amp; student welfare
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ContactCard
            icon={<Phone size={18} style={{ color: ACCENT.amber }} />}
            tint={t[CARD_TINTS[3]]}
            label="SSD Helpline"
            value="+977 9802747227"
            note="Direct SSD officer & student welfare coordinator"
            href="tel:+9779802747227"
          />
          <ContactCard
            icon={<Mail size={18} style={{ color: ACCENT.purple }} />}
            tint={t[CARD_TINTS[4]]}
            label="SSD Email"
            value="studentservices@bicnepal.edu.np"
            note="Scholarship renewals, leave requests & records"
            href="mailto:studentservices@bicnepal.edu.np"
          />
          <ContactCard
            icon={<Clock size={18} style={{ color: ACCENT.blue }} />}
            tint={t[CARD_TINTS[5]]}
            label="Office & Hours"
            value="Block A, Room 102 (Admin Floor)"
            note="Sunday – Friday: 07:00 AM – 04:00 PM"
          />
        </div>
      </div>

      {/* CARD 4: Peer Help & Student Requests Community Board */}
      <div
        className="dashboard-card-lift rounded-[28px] p-5 sm:p-7"
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
            className="dashboard-btn-bounce mb-5 flex items-center justify-center gap-2 self-start rounded-full py-2.5 px-5 text-xs font-extrabold text-white transition-all hover:opacity-90"
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
                  “{req.request}”
                </p>

                <p className="mt-2 text-xs font-semibold" style={{ color: t.textSecondary || t.textMuted }}>
                  by <span className="font-extrabold" style={{ color: t.textPrimary }}>{req.author}</span>
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3">
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: t.textMuted }}>
                  <MessageSquare size={13} /> {req.replies} responses
                </span>
                <button
                  type="button"
                  onClick={() => toast.success(`Replying to ${req.author}...`)}
                  className="rounded-full px-3 py-1 text-xs font-extrabold transition-all hover:opacity-80"
                  style={{ backgroundColor: t.surfaceBg, color: t.textPrimary }}
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