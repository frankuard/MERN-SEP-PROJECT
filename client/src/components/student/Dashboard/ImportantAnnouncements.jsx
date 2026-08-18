import React, { useState } from 'react';
import { ArrowRight, Megaphone } from 'lucide-react';
import AnnouncementsModal from '../modals/AnnouncementsModal';

const ITEM_TINTS = ['#e8f4fd', '#fce7f3', '#fef9c3'];
const BADGE_COLORS = ['#f472b6', '#a78bfa', '#fbbf24'];

const ImportantAnnouncements = ({ t, announcements }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <section className="flex h-full flex-col">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
              <Megaphone size={18} strokeWidth={2.5} />
            </div>
            <h2 className="text-base font-extrabold" style={{ color: t.textPrimary }}>Important Announcements</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-xs font-extrabold text-white transition-transform hover:scale-105"
          >
            View all
            <ArrowRight size={12} />
          </button>
        </div>

        <ul className="flex flex-1 flex-col gap-3">
          {announcements.slice(0, 3).map((item, i) => (
            <li
              key={item.id}
              className="dashboard-card-lift rounded-[20px] p-4"
              style={{
                backgroundColor: ITEM_TINTS[i % ITEM_TINTS.length],
                border: item.urgent ? '2px solid #fbbf24' : '2px solid transparent',
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold text-white"
                  style={{ backgroundColor: item.urgent ? '#f59e0b' : BADGE_COLORS[i % BADGE_COLORS.length] }}
                >
                  {item.urgent ? '!' : 'i'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-snug ${item.urgent ? 'font-extrabold' : 'font-bold'}`} style={{ color: t.textPrimary }}>
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs font-semibold" style={{ color: t.textMuted }}>
                    {item.source || item.tag} · {item.date}
                  </p>
                  {item.urgent && (
                    <span className="mt-2 inline-block rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-900">
                      High priority
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <AnnouncementsModal isOpen={showModal} onClose={() => setShowModal(false)} t={t} announcements={announcements} />
    </>
  );
};

export default ImportantAnnouncements;
