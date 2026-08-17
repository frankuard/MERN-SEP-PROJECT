import React, { useState } from 'react';
import {
  Calendar, Clock, MapPin, Search, School, HelpCircle,
  UtensilsCrossed, Users, Trophy, Megaphone, Flame, RefreshCw,
  Phone, Mic2, Cpu, BrainCircuit, Code, Palette
} from 'lucide-react';
import { CANTEEN_SPECIALS_LIST } from '../../data/studentDashboardData';
import AnnouncementsModal from './modals/AnnouncementsModal';

const DashboardHome = ({
  t,
  greeting,
  studentName,
  collegeEvents,
  communityEvents,
  announcements,
  lostFoundItems,
  helpRequests,
  currentRandomRoom,
  currentRandomStatus,
  onShuffleRandomRoom,
  onTakeClassPermission,
  onToggleCollegeEvent,
  onToggleCommunityEvent,
  onNavigateTab,
  renderEventIcon,
}) => {
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);

  return (
    <>
      {/* 1. Header Section with Real-Time Greeting */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: t.textPrimary }}>
            {greeting}, {studentName} 👋
          </h2>
          <p className="mt-1 text-sm font-medium italic" style={{ color: t.textMuted }}>
            Here’s what’s happening on campus
          </p>
        </div>
      </div>

      {/* 2. Quick Overview Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Attendance Card -> Connected to SSD Help */}
        <div
          className="group relative flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all hover:shadow-md cursor-pointer"
          onClick={() => onNavigateTab('ssd-help')}
          style={{
            backgroundColor: t.cardBg || '#ffffff',
            borderColor: t.border,
          }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                Attendance (SSD)
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span> On Track
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-4xl font-extrabold tracking-tight" style={{ color: t.textPrimary }}>
                87%
              </span>
              <div className="text-xs font-medium" style={{ color: t.textMuted }}>
                <span className="font-bold text-emerald-600">42 Present</span> ·{' '}
                <span className="font-bold text-red-500">6 Absent</span>
              </div>
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: '87%' }}
              ></div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateTab('ssd-help');
            }}
            className="mt-5 flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            View Attendance in SSD →
          </button>
        </div>

        {/* Upcoming Events Overview Card -> Connected to Events Hub */}
        <div
          className="group relative flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all hover:shadow-md cursor-pointer"
          onClick={() => onNavigateTab('events')}
          style={{
            backgroundColor: t.cardBg || '#ffffff',
            borderColor: t.border,
          }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                Upcoming Events
              </span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                3 Next
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-2">
                <Mic2 size={16} className="text-blue-600 shrink-0" />
                <p className="text-lg font-bold truncate" style={{ color: t.textPrimary }}>
                  Devfest Program
                </p>
              </div>
              <p className="mt-1 text-xs font-medium" style={{ color: t.textMuted }}>
                Aug 26 · 10:00 AM · Main Auditorium
              </p>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: t.textMuted }}>
              <Clock size={13} />
              <span>Nearest event in 10 days</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateTab('events');
            }}
            className="mt-5 flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            View Schedule in Events Hub →
          </button>
        </div>

        {/* Today Canteen Special Overview Card */}
        <div
          className="group relative flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all hover:shadow-md cursor-pointer"
          onClick={() => onNavigateTab('canteen')}
          style={{
            backgroundColor: t.cardBg || '#ffffff',
            borderColor: t.border,
          }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                Today Canteen Special
              </span>
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                <Flame size={12} className="text-amber-600" /> Specials
              </span>
            </div>

            {/* 3 Food Item Point-Wise List with Diya Ko Royal Biryani Bold */}
            <div className="mt-3 space-y-2">
              {CANTEEN_SPECIALS_LIST.map((food) => (
                <div
                  key={food.id}
                  className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-all ${
                    food.isBold
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-950 dark:text-amber-200'
                      : 'bg-black/5 dark:bg-white/5'
                  }`}
                >
                  <span className={`flex items-center gap-1.5 ${food.isBold ? 'font-black text-sm tracking-tight' : 'font-medium'}`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${food.isBold ? 'bg-amber-600 text-white font-bold' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                      {food.id}
                    </span>
                    <strong className={food.isBold ? 'font-extrabold text-amber-900 dark:text-amber-200' : 'font-semibold'} style={{ color: food.isBold ? undefined : t.textPrimary }}>
                      {food.name}
                    </strong>
                  </span>
                  <span className={`font-extrabold ${food.isBold ? 'text-amber-700 dark:text-amber-300 text-xs' : 'text-emerald-600'}`}>
                    NPR {food.price}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateTab('canteen');
            }}
            className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Order Food in Canteen →
          </button>
        </div>
      </div>

      {/* 3. Row: College Events (Left) | Community Events (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* College Events Section */}
        <div
          id="college-events"
          className="flex flex-col justify-between rounded-2xl border p-6 shadow-xs"
          style={{
            backgroundColor: t.cardBg || '#ffffff',
            borderColor: t.border,
          }}
        >
          <div>
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-600" />
                <div>
                  <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                    Upcoming College Events
                  </h3>
                  <p className="text-xs" style={{ color: t.textMuted }}>
                    Official campus ceremonies, fests &amp; conferences
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('events')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View in Events Hub →
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              {collegeEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border p-4 transition-all hover:border-gray-300 dark:hover:border-gray-700 sm:flex-row sm:items-center"
                  style={{
                    backgroundColor: t.pageBg,
                    borderColor: t.border,
                  }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                        {renderEventIcon(ev.iconType)}
                      </div>
                      <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                        {ev.name}
                      </h4>
                      <span className="rounded-md bg-white/80 dark:bg-black/40 px-2 py-0.5 text-[10px] font-bold" style={{ color: t.textMuted }}>
                        {ev.badge}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: t.textMuted }}>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {ev.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {ev.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {ev.venue}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleCollegeEvent(ev.id)}
                    className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      ev.registered
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-[#2f4336] text-white hover:bg-[#25362b] shadow-xs'
                    }`}
                  >
                    {ev.registered ? 'Registered' : 'Register'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Community Events Section */}
        <div
          className="flex flex-col justify-between rounded-2xl border p-6 shadow-xs"
          style={{
            backgroundColor: t.cardBg || '#ffffff',
            borderColor: t.border,
          }}
        >
          <div>
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-2">
                <Users size={18} className="text-purple-600" />
                <div>
                  <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                    Community Events
                  </h3>
                  <p className="text-xs" style={{ color: t.textMuted }}>
                    Organized by AI Horizon, Coding Clubs &amp; Student Groups
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('events')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View in Events Hub →
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              {communityEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border p-4 transition-all hover:border-gray-300 dark:hover:border-gray-700 sm:flex-row sm:items-center"
                  style={{
                    backgroundColor: t.pageBg,
                    borderColor: t.border,
                  }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/50">
                        {renderEventIcon(ev.iconType)}
                      </div>
                      <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                        {ev.name}
                      </h4>
                      <span className="rounded-md bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                        {ev.org}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: t.textMuted }}>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {ev.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {ev.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {ev.venue}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleCommunityEvent(ev.id)}
                    className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      ev.joined
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-[#2f4336] text-white hover:bg-[#25362b] shadow-xs'
                    }`}
                  >
                    {ev.joined ? 'Joined' : 'Join Event'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Row: Important Announcements (Left) | Canteen Quick Overview (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Important Announcements Card */}
        <div
          className="flex flex-col justify-between rounded-2xl border p-6 shadow-xs"
          style={{
            backgroundColor: t.cardBg || '#ffffff',
            borderColor: t.border,
          }}
        >
          <div>
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-2">
                <Megaphone size={18} className="text-blue-600" />
                <div>
                  <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                    Important Announcements
                  </h3>
                  <p className="text-xs" style={{ color: t.textMuted }}>
                    Official notices and deadline alerts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAnnouncementsModal(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View All →
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {announcements.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-xl border p-3.5 transition-all hover:bg-black/5 dark:hover:bg-white/5"
                  style={{
                    backgroundColor: t.pageBg,
                    borderColor: t.border,
                  }}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-800">
                    <Megaphone size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="truncate text-xs font-bold" style={{ color: t.textPrimary }}>
                        {a.title}
                      </h4>
                      <span className="shrink-0 rounded-md bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                        {a.date}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs" style={{ color: t.textMuted }}>
                      {a.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Canteen Dashboard Section */}
        <div
          id="canteen-section"
          className="flex flex-col justify-between rounded-2xl border p-6 shadow-xs"
          style={{
            backgroundColor: t.cardBg || '#ffffff',
            borderColor: t.border,
          }}
        >
          <div>
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-2">
                <UtensilsCrossed size={18} className="text-amber-600" />
                <div>
                  <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                    Today&apos;s Canteen
                  </h3>
                  <p className="text-xs" style={{ color: t.textMuted }}>
                    Fresh menu, live ordering &amp; crowd status
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                <span>Current Crowd:</span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span> Medium
                </span>
              </div>
            </div>

            {/* Featured Special Banner */}
            <div className="mt-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                    <Flame size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Today&apos;s Special
                    </span>
                    <h4 className="text-base font-extrabold" style={{ color: t.textPrimary }}>
                      Diya Ko Royal Biryani
                    </h4>
                    <p className="text-xs" style={{ color: t.textMuted }}>
                      Aromatic basmati rice cooked with secret spices &amp; tender chicken
                    </p>
                  </div>
                </div>
                <span className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-extrabold text-white shadow-xs">
                  NPR 220
                </span>
              </div>
            </div>

            {/* Quick Ordering CTA with Credit Balance Status */}
            <div className="mt-4 rounded-xl border p-4" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold" style={{ color: t.textPrimary }}>
                    Order Online &amp; Skip The Queue
                  </p>
                  <p className="text-[11px]" style={{ color: t.textMuted }}>
                    12 fresh items available · Cash, Online QR or Credit Khata
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('canteen')}
                  className="rounded-xl bg-[#2f4336] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
                >
                  Open Menu &amp; Order →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Row: Vacant Class Card (Left) | Lost & Found (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Vacant Class Dashboard Card */}
        <div
          className="flex flex-col justify-between rounded-2xl border p-6 shadow-xs"
          style={{
            backgroundColor: t.cardBg || '#ffffff',
            borderColor: t.border,
          }}
        >
          <div>
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-2">
                <School size={18} className="text-emerald-600" />
                <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                  Vacant Classroom
                </h3>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Live Room
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onShuffleRandomRoom}
                  className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ borderColor: t.border, color: t.textMuted }}
                  title="Check another random vacant classroom"
                >
                  <RefreshCw size={12} /> Shuffle
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('vacant-classes')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  View All (6) →
                </button>
              </div>
            </div>

            {/* Display Selected Room */}
            <div className="mt-5 rounded-2xl border p-5" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                    Available Class
                  </p>
                  <h4 className="mt-1 text-xl font-extrabold" style={{ color: t.textPrimary }}>
                    {currentRandomRoom.name}
                  </h4>
                  <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
                    {currentRandomRoom.block} · {currentRandomRoom.facilities}
                  </p>
                </div>

                {currentRandomStatus === 'vacant' && (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Vacant
                  </span>
                )}
                {currentRandomStatus === 'pending' && (
                  <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span> Pending
                  </span>
                )}
                {currentRandomStatus === 'approved' && (
                  <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                    <span className="h-2 w-2 rounded-full bg-blue-600"></span> Approved
                  </span>
                )}
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => onTakeClassPermission(currentRandomRoom.id)}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all shadow-xs ${
                    currentRandomStatus === 'vacant'
                      ? 'bg-[#2f4336] text-white hover:bg-[#25362b]'
                      : currentRandomStatus === 'pending'
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {currentRandomStatus === 'vacant' && 'Take Permission'}
                  {currentRandomStatus === 'pending' && 'Permission Pending (Click to Approve)'}
                  {currentRandomStatus === 'approved' && 'Approved (Release Room)'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lost & Found Dashboard Section */}
        <div
          className="flex flex-col justify-between rounded-2xl border p-6 shadow-xs"
          style={{
            backgroundColor: t.cardBg || '#ffffff',
            borderColor: t.border,
          }}
        >
          <div>
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-2">
                <Search size={18} className="text-blue-600" />
                <div>
                  <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                    Lost &amp; Found
                  </h3>
                  <p className="text-xs" style={{ color: t.textMuted }}>
                    Recently reported campus belongings &amp; CCTV
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('lost-found')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View All in Portal →
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {lostFoundItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border p-3.5 transition-all hover:border-gray-300 dark:hover:border-gray-700"
                  style={{
                    backgroundColor: t.pageBg,
                    borderColor: t.border,
                  }}
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold" style={{ color: t.textPrimary }}>
                      {item.title}
                    </h4>
                    <p className="flex items-center gap-1 text-[11px]" style={{ color: t.textMuted }}>
                      <MapPin size={11} /> {item.location} · {item.time}
                    </p>
                  </div>

                  <span
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      item.status === 'Claimed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        item.status === 'Claimed' ? 'bg-emerald-600' : 'bg-amber-600'
                      }`}
                    ></span>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Row: Campus Help Section & Official Directory Quick Link */}
      <div
        className="rounded-2xl border p-6 shadow-xs space-y-5"
        style={{
          backgroundColor: t.cardBg || '#ffffff',
          borderColor: t.border,
        }}
      >
        <div className="flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2">
            <HelpCircle size={20} className="text-blue-600" />
            <div>
              <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                Campus Help &amp; Official Contact Directory
              </h3>
              <p className="text-xs" style={{ color: t.textMuted }}>
                BIC Campus Helpline: 021-500050 / 9801009090 · SSD Helpline: +977 9802747227
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('campus-help')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Open Full Help Directory →
            </button>
          </div>
        </div>

        {/* Contact Summary Strip */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border p-3 flex items-center gap-3" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
            <Phone size={16} className="text-emerald-600" />
            <div>
              <p className="font-bold text-[11px]" style={{ color: t.textPrimary }}>BIC Front Desk</p>
              <p className="text-[11px] font-semibold text-emerald-600">021-500050 / 9801009090</p>
            </div>
          </div>

          <div className="rounded-xl border p-3 flex items-center gap-3" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
            <Phone size={16} className="text-amber-600" />
            <div>
              <p className="font-bold text-[11px]" style={{ color: t.textPrimary }}>SSD Direct Helpline</p>
              <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">+977 9802747227</p>
            </div>
          </div>

          <div className="rounded-xl border p-3 flex items-center gap-3" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
            <MapPin size={16} className="text-red-500" />
            <div>
              <p className="font-bold text-[11px]" style={{ color: t.textPrimary }}>Campus Address</p>
              <p className="text-[11px]" style={{ color: t.textMuted }}>Biratnagar 5, Bhrikuti Chowk</p>
            </div>
          </div>
        </div>

        {/* Peer Requests */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {helpRequests.map((req) => (
            <div
              key={req.id}
              className="flex flex-col justify-between rounded-xl border p-4 shadow-xs transition-all hover:shadow-md"
              style={{
                backgroundColor: t.pageBg,
                borderColor: t.border,
              }}
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
                  <Users size={13} /> {req.replies} responses
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('campus-help')}
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

      {/* Announcements Modal */}
      <AnnouncementsModal
        isOpen={showAnnouncementsModal}
        onClose={() => setShowAnnouncementsModal(false)}
        t={t}
        announcements={announcements}
      />
    </>
  );
};

export default DashboardHome;
