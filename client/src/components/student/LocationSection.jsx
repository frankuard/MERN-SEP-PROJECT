import React from 'react';
import { MapPin, Navigation, Building2, ExternalLink } from 'lucide-react';

const LocationSection = ({ t, onNavigateTab }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="text-red-500" size={24} />
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
              Campus Locations &amp; Facilities Guide
            </h2>
          </div>
          <p className="mt-0.5 text-xs" style={{ color: t.textMuted }}>
            Official college address: Biratnagar 5, Bhrikuti Chowk · Department and classroom mapping
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('dashboard')}
          className="rounded-xl border px-3.5 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 self-start"
          style={{ borderColor: t.border, color: t.textPrimary }}
        >
          ← Dashboard
        </button>
      </div>

      {/* Campus Address Card */}
      <div
        className="rounded-3xl border p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700 shadow-xs shrink-0">
            <Navigation size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
              Biratnagar International College (BIC)
            </h3>
            <p className="text-sm font-semibold text-emerald-600 mt-0.5">
              📍 Biratnagar 5, Bhrikuti Chowk, Morang, Koshi Province, Nepal
            </p>
            <p className="text-xs mt-1" style={{ color: t.textMuted }}>
              Phone: 021-500050 / 021-500170 / 9801009090 · Email: info@bicnepal.edu.np
            </p>
          </div>
        </div>

        <a
          href="https://maps.google.com/?q=Biratnagar+International+College"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-[#2f4336] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#25362b] shrink-0 flex items-center gap-1.5"
        >
          <ExternalLink size={14} /> Open in Google Maps
        </a>
      </div>

      {/* Campus Blocks Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-3xl border p-6 shadow-xs space-y-3" style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}>
          <div className="flex items-center gap-2 text-blue-600">
            <Building2 size={20} />
            <h4 className="text-base font-bold" style={{ color: t.textPrimary }}>Block A (Administrative)</h4>
          </div>
          <ul className="space-y-2 text-xs" style={{ color: t.textMuted }}>
            <li>• <strong>Room 102</strong>: Student Services Department (SSD)</li>
            <li>• <strong>1st Floor</strong>: SR01 Wolves Lecture Theatre</li>
            <li>• <strong>2nd Floor</strong>: SR02 Compton Class</li>
            <li>• <strong>Ground Floor</strong>: Reception &amp; Admissions Desk</li>
          </ul>
        </div>

        <div className="rounded-3xl border p-6 shadow-xs space-y-3" style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}>
          <div className="flex items-center gap-2 text-emerald-600">
            <Building2 size={20} />
            <h4 className="text-base font-bold" style={{ color: t.textPrimary }}>Block B (Tech &amp; Labs)</h4>
          </div>
          <ul className="space-y-2 text-xs" style={{ color: t.textMuted }}>
            <li>• <strong>Ground Floor</strong>: Mechi Room &amp; Computer Lab 1</li>
            <li>• <strong>1st Floor</strong>: Kankai Room &amp; AI Robotics Lab</li>
            <li>• <strong>2nd Floor</strong>: Computer Lab 2 &amp; 3</li>
            <li>• <strong>Tech Hall</strong>: Innovation Exhibition Lounge</li>
          </ul>
        </div>

        <div className="rounded-3xl border p-6 shadow-xs space-y-3" style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}>
          <div className="flex items-center gap-2 text-amber-600">
            <Building2 size={20} />
            <h4 className="text-base font-bold" style={{ color: t.textPrimary }}>Block C &amp; Central</h4>
          </div>
          <ul className="space-y-2 text-xs" style={{ color: t.textMuted }}>
            <li>• <strong>Main Auditorium</strong>: LT01 Wulfurana (120 Seats)</li>
            <li>• <strong>2nd Floor</strong>: Central Library &amp; Reading Hub</li>
            <li>• <strong>Ground Floor</strong>: Campus Canteen &amp; Dining Hall</li>
            <li>• <strong>Sports Desk</strong>: Table Tennis, Cricket &amp; Indoor Games</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LocationSection;
