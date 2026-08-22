import React, { useState, useMemo } from 'react';
import { BookOpen, Trophy, Search, Loader2 } from 'lucide-react';

// Rotating pastel tints for list/item cards — pulled from the same theme tokens
// the Dashboard uses (CanteenSpecial, ImportantAnnouncements, etc.)
const CARD_TINTS = ['pastelBlue', 'pastelPink', 'pastelYellow', 'pastelCyan', 'pastelPurple', 'pastelOrange'];

const ResourcesSection = ({
  t,
  libraryBooks,
  pendingBookApprovals,
  onToggleBorrowBook,
  sportsGearRequests,
  onSportsRequestSubmit,
}) => {
  const [resourcesActiveCategory, setResourcesActiveCategory] = useState('library');
  const [bookSearchQuery, setBookSearchQuery] = useState('');

  // Sports Form State
  const [sportsForm, setSportsForm] = useState({
    item: 'Cricket Bat',
    qty: 1,
    slot: 'Lunch Break (01:00 PM - 02:00 PM)',
    note: '',
  });

  const filteredBooks = useMemo(() => {
    if (!bookSearchQuery.trim()) return libraryBooks;
    return libraryBooks.filter(
      (b) =>
        b.name.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
        b.shelf.toLowerCase().includes(bookSearchQuery.toLowerCase())
    );
  }, [libraryBooks, bookSearchQuery]);

  const handleSportsSubmit = (e) => {
    e.preventDefault();
    // Guard against submitting while the quantity field is mid-edit/empty
    const qty = sportsForm.qty === '' ? 1 : sportsForm.qty;
    onSportsRequestSubmit({ ...sportsForm, qty });
  };

  return (
    <div className="dashboard-playful space-y-6 pb-4 animate-in fade-in duration-200">
      {/* Prominent Horizontal Navbar for the 4 Sections in One Single Row with Big Text */}
      <nav
        className="dashboard-card-lift flex w-full flex-wrap items-center gap-2 overflow-x-auto rounded-[28px] p-2"
        style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}
      >
        <button
          type="button"
          onClick={() => setResourcesActiveCategory('library')}
          className={`dashboard-btn-bounce flex items-center justify-center gap-2.5 rounded-full py-3.5 px-6 text-sm font-extrabold transition-all ${
            resourcesActiveCategory === 'library' ? 'shadow-sm' : ''
          }`}
          style={{
            backgroundColor: resourcesActiveCategory === 'library' ? '#111111' : 'transparent',
            color: resourcesActiveCategory === 'library' ? '#ffffff' : t.textSecondary,
          }}
          onMouseEnter={(e) => {
            if (resourcesActiveCategory !== 'library') e.currentTarget.style.backgroundColor = t.hoverBg;
          }}
          onMouseLeave={(e) => {
            if (resourcesActiveCategory !== 'library') e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <BookOpen size={18} />
          <span>1. Library Books System</span>
        </button>

        <button
          type="button"
          onClick={() => setResourcesActiveCategory('sports')}
          className={`dashboard-btn-bounce flex items-center justify-center gap-2.5 rounded-full py-3.5 px-6 text-sm font-extrabold transition-all ${
            resourcesActiveCategory === 'sports' ? 'shadow-sm' : ''
          }`}
          style={{
            backgroundColor: resourcesActiveCategory === 'sports' ? '#111111' : 'transparent',
            color: resourcesActiveCategory === 'sports' ? '#ffffff' : t.textSecondary,
          }}
          onMouseEnter={(e) => {
            if (resourcesActiveCategory !== 'sports') e.currentTarget.style.backgroundColor = t.hoverBg;
          }}
          onMouseLeave={(e) => {
            if (resourcesActiveCategory !== 'sports') e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Trophy size={18} />
          <span>2. Sports Items Needed</span>
        </button>

      </nav>

      {/* ----------------- CATEGORY 1: LIBRARY BOOK MANAGEMENT (BIMALA MAM APPROVAL) ----------------- */}
      {resourcesActiveCategory === 'library' && (
        <div className="space-y-6">
          <div
            className="rounded-[28px] p-5 sm:p-7"
            style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}
          >
            <div className="flex items-center gap-3 pb-5">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-white"
                aria-hidden="true"
              >
                <BookOpen size={20} strokeWidth={2.5} />
              </div>

              <div className="relative flex-1">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
                <input
                  type="text"
                  placeholder="Search by book name, author, shelf..."
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  className="w-full rounded-2xl py-3 pl-10 pr-4 text-sm font-semibold outline-none"
                  style={{ backgroundColor: t.pageBg, border: `1px solid ${t.border}`, color: t.textPrimary }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBooks.map((book, i) => {
                const isPending = !!pendingBookApprovals[book.id];
                const pendingType = pendingBookApprovals[book.id];
                const tint = t[CARD_TINTS[i % CARD_TINTS.length]];
                return (
                  <div
                    key={book.id}
                    className="dashboard-card-lift flex flex-col justify-between rounded-[22px] p-4"
                    style={{ backgroundColor: tint, boxShadow: t.shadowSoft }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className="rounded-full px-2.5 py-1 text-[10px] font-extrabold"
                          style={{ backgroundColor: t.surfaceBg, color: t.textPrimary }}
                        >
                          Shelf {book.shelf}
                        </span>
                        <span
                          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
                          style={{
                            backgroundColor: t.surfaceBg,
                            color: book.available ? '#15803d' : '#b45309',
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: book.available ? '#22c55e' : '#f59e0b' }}
                          />
                          {book.available ? 'Available' : 'Issued'}
                        </span>
                      </div>

                      <h4 className="mt-3 text-sm font-extrabold leading-snug" style={{ color: t.textPrimary }}>
                        {book.name}
                      </h4>
                      <p className="mt-1 text-xs font-semibold" style={{ color: t.textSecondary }}>
                        by {book.author}
                      </p>

                      {!book.available && book.issuedTo && (
                        <p className="mt-2 text-[11px] font-extrabold text-amber-600">
                          Status: {book.issuedTo}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onToggleBorrowBook(book.id)}
                      className="dashboard-btn-bounce mt-4 flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-extrabold text-white transition-all hover:opacity-90"
                      style={{
                        backgroundColor: isPending ? '#b08a5a' : book.available ? '#5c8a72' : '#5b7c99',
                        boxShadow: t.shadowSoft,
                        cursor: isPending ? 'not-allowed' : 'pointer',
                        opacity: isPending ? 0.9 : 1,
                      }}
                    >
                      {isPending && <Loader2 size={13} className="animate-spin" />}
                      {pendingType === 'borrowing' && '⏳ Waiting Bimala Mam Approval (5s)...'}
                      {pendingType === 'returning' && '⏳ Bimala Mam Checking Condition (5s)...'}
                      {!isPending && (book.available ? 'Borrow Book (Bimala Mam Approval)' : 'Return to Library (Submit)')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- CATEGORY 2: SPORTS ITEMS NEEDED ----------------- */}
      {resourcesActiveCategory === 'sports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Sports Item Requisition Form */}
            <div className="lg:col-span-6">
              <div
                className="rounded-[28px] p-5 sm:p-7"
                style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-white">
                    <Trophy size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>
                      Request Sports Equipment
                    </h3>
                    <p className="text-xs font-semibold" style={{ color: t.textMuted }}>
                      Select item from college sports room inventory for practice or recess matches
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSportsSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold mb-1.5" style={{ color: t.textPrimary }}>
                      Select Sports Item Needed
                    </label>
                    <select
                      value={sportsForm.item}
                      onChange={(e) => setSportsForm({ ...sportsForm, item: e.target.value })}
                      className="w-full rounded-2xl p-3 text-xs outline-none font-semibold"
                      style={{ backgroundColor: t.pageBg, border: `1px solid ${t.border}`, color: t.textPrimary }}
                    >
                      <option value="Cricket Bat">🏏 Cricket Bat</option>
                      <option value="Football">⚽ Football</option>
                      <option value="Basketball">🏀 Basketball</option>
                      <option value="Table Tennis">🏓 Table Tennis (Rackets &amp; Balls)</option>
                      <option value="Chess">♟️ Chess Set</option>
                      <option value="Ludo">🎲 Ludo Board</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold mb-1.5" style={{ color: t.textPrimary }}>
                        Quantity
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={sportsForm.qty}
                        onChange={(e) => {
                          const raw = e.target.value;
                          // Allow the field to be genuinely empty while the user is
                          // editing, instead of coercing it to 0 (which caused the
                          // "05, 06..." bug when typing right after clearing it).
                          if (raw === '') {
                            setSportsForm({ ...sportsForm, qty: '' });
                            return;
                          }
                          const num = Number(raw);
                          if (Number.isNaN(num)) return;
                          setSportsForm({ ...sportsForm, qty: num });
                        }}
                        onBlur={() => {
                          setSportsForm((prev) => {
                            const num = prev.qty === '' ? 1 : Number(prev.qty);
                            const clamped = Math.min(5, Math.max(1, Number.isNaN(num) ? 1 : num));
                            return { ...prev, qty: clamped };
                          });
                        }}
                        className="w-full rounded-2xl p-3 text-xs outline-none font-semibold"
                        style={{ backgroundColor: t.pageBg, border: `1px solid ${t.border}`, color: t.textPrimary }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold mb-1.5" style={{ color: t.textPrimary }}>
                        Time / Slot Needed
                      </label>
                      <select
                        value={sportsForm.slot}
                        onChange={(e) => setSportsForm({ ...sportsForm, slot: e.target.value })}
                        className="w-full rounded-2xl p-3 text-xs outline-none font-semibold"
                        style={{ backgroundColor: t.pageBg, border: `1px solid ${t.border}`, color: t.textPrimary }}
                      >
                        <option value="Lunch Break (01:00 PM - 02:00 PM)">Lunch Break (01:00 PM)</option>
                        <option value="Sports Hour (04:00 PM - 05:30 PM)">Sports Hour (04:00 PM)</option>
                        <option value="Inter-Department Match">Inter-Department Match</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="dashboard-btn-bounce w-full rounded-full bg-black py-3.5 text-xs font-extrabold text-white"
                    style={{ boxShadow: t.shadowSoft }}
                  >
                    Submit Sports Equipment Request
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Issued & Requested Gear */}
            <div className="lg:col-span-6">
              <div
                className="rounded-[28px] p-5 sm:p-7"
                style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}
              >
                <h3 className="text-base font-extrabold mb-1" style={{ color: t.textPrimary }}>
                  My Sports Equipment Requisitions
                </h3>
                <p className="text-xs font-semibold mb-4" style={{ color: t.textMuted }}>
                  Pick up approved equipment from Ground Floor Sports In-charge desk
                </p>

                <div className="space-y-3">
                  {sportsGearRequests.map((req, i) => (
                    <div
                      key={req.id}
                      className="dashboard-card-lift flex items-center justify-between rounded-[20px] p-4 text-xs"
                      style={{ backgroundColor: t[CARD_TINTS[i % CARD_TINTS.length]], boxShadow: t.shadowSoft }}
                    >
                      <div>
                        <h4 className="font-extrabold text-sm" style={{ color: t.textPrimary }}>
                          {req.item} (Qty: {req.qty})
                        </h4>
                        <p className="text-[11px] font-semibold mt-0.5" style={{ color: t.textSecondary }}>
                          Slot: {req.slot}
                        </p>
                      </div>

                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold text-emerald-800">
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesSection;