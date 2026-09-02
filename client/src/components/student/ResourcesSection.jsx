import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { BookOpen, Trophy, Search, Clock, CheckCircle2, Hourglass } from 'lucide-react';
import resourcesApi from '../../api/resourcesApi';
import BorrowRequestModal from './modals/BorrowRequestModal';
import toast from 'react-hot-toast';

const CARD_TINTS = ['pastelBlue', 'pastelPink', 'pastelYellow', 'pastelCyan', 'pastelPurple', 'pastelOrange'];
const ACCENT = '#5c8a72';

// Preferred display order for known categories. Anything else found in the data
// (e.g. a brand-new category added straight in Compass) gets appended alphabetically,
// with 'General' (the fallback for books with no category set) always shown last.
const CATEGORY_ORDER = ['Computer Science', 'Business', 'Philosophy', 'Self Help', 'Fantasy'];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const daysRemaining = (returnBy) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(returnBy);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
};

/* ------------------------------------------------------------------ */
/* Book cover — Event-card style: portrait image, themed fallback     */
/* ------------------------------------------------------------------ */
const BookCover = ({ book, tint }) => {
  if (book.cover) {
    return (
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl">
        <img src={book.cover} alt={book.name} className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }
  return (
    <div
      className="relative flex aspect-[2/3] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl p-4 text-center"
      style={{ backgroundColor: tint }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
        <BookOpen size={20} style={{ color: ACCENT }} />
      </div>
      <span className="line-clamp-3 text-xs font-extrabold leading-snug" style={{ color: '#111111' }}>
        {book.name}
      </span>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Book card                                                           */
/* ------------------------------------------------------------------ */
const BookCard = ({ book, tint, onRequestBorrow, t }) => {
  const status = book.status; // 'none' | 'pending' | 'borrowed'
  const record = book.myRequest;

  return (
    <div
      className="flex h-full flex-col rounded-2xl border p-4 transition-all duration-200 hover:shadow-md"
      style={{ backgroundColor: t.cardBg, borderColor: t.border }}
    >
      <BookCover book={book} tint={tint} />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: t.pageBg, color: t.textMuted }}>
          Shelf {book.shelf}
        </span>
        {status === 'pending' && (
          <span className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
            <Hourglass size={11} />
            Pending Approval
          </span>
        )}
        {status === 'borrowed' && (
          <span className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
            <Clock size={11} />
            Borrowed
          </span>
        )}
      </div>

      <h4 className="mt-2.5 text-sm font-extrabold leading-snug" style={{ color: t.textPrimary }}>
        {book.name}
      </h4>
      <p className="mt-1 text-xs font-semibold" style={{ color: t.textMuted }}>by {book.author}</p>

      {status === 'borrowed' && record?.returnBy && (
        <p className="mt-2 text-[11px] font-bold" style={{ color: '#1d4ed8' }}>
          Due in {daysRemaining(record.returnBy)} day{daysRemaining(record.returnBy) === 1 ? '' : 's'} ({formatDate(record.returnBy)})
        </p>
      )}

      <div className="mt-4 border-t pt-3" style={{ borderColor: t.border }}>
        {status === 'none' && (
          <button
            type="button"
            onClick={() => onRequestBorrow(book)}
            className="w-full cursor-pointer rounded-xl py-2.5 text-xs font-extrabold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            Request to Borrow
          </button>
        )}
        {status === 'pending' && (
          <div className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold" style={{ backgroundColor: t.pageBg, color: '#b45309' }}>
            <Hourglass size={13} />
            Waiting for admin approval
          </div>
        )}
        {status === 'borrowed' && (
          <div className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold" style={{ backgroundColor: t.pageBg, color: '#1d4ed8' }}>
            <CheckCircle2 size={13} />
            Currently with you
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Your Books — request/borrow log                                     */
/* ------------------------------------------------------------------ */
const YourBooksLog = ({ myBorrows, t }) => {
  const entries = myBorrows.filter((r) => r.status !== 'rejected');
  if (entries.length === 0) return null;

  return (
    <div className="rounded-[28px] p-5 sm:p-7" style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}>
      <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>Your Books</h3>
      <p className="mt-0.5 text-xs font-semibold" style={{ color: t.textMuted }}>Requests and current borrows</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <div key={entry._id} className="rounded-2xl border p-4" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
            <div className="flex items-center justify-between gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase"
                style={{
                  backgroundColor: entry.status === 'pending' ? '#fef3c7' : entry.status === 'returned' ? '#d1fae5' : '#dbeafe',
                  color: entry.status === 'pending' ? '#b45309' : entry.status === 'returned' ? '#047857' : '#1d4ed8',
                }}
              >
                {entry.status === 'pending' ? 'Pending' : entry.status === 'returned' ? 'Returned' : 'Borrowed'}
              </span>
              <span className="text-[11px] font-semibold" style={{ color: t.textMuted }}>{formatDate(entry.createdAt)}</span>
            </div>
            <p className="mt-1.5 text-sm font-bold" style={{ color: t.textPrimary }}>{entry.book?.name}</p>
            <p className="mt-0.5 text-xs" style={{ color: t.textMuted }}>Student ID: {entry.studentIdNumber}</p>
            <p className="mt-1 text-xs font-semibold" style={{ color: t.textPrimary }}>
              Return by: {formatDate(entry.returnBy)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
const ResourcesSection = ({ t, sportsGearRequests, onSportsRequestSubmit }) => {
  const [resourcesActiveCategory, setResourcesActiveCategory] = useState('library');
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [activeBookCategory, setActiveBookCategory] = useState('All');

  const [books, setBooks] = useState([]);
  const [myBorrows, setMyBorrows] = useState([]);
  const [modalBook, setModalBook] = useState(null);
  const [loadingBooks, setLoadingBooks] = useState(true);

  const loadBooks = useCallback(() => {
    setLoadingBooks(true);
    resourcesApi.getBooks()
      .then((data) => { if (Array.isArray(data)) setBooks(data); })
      .catch(() => toast.error('Failed to load books'))
      .finally(() => setLoadingBooks(false));
  }, []);

  const loadMyBorrows = useCallback(() => {
    resourcesApi.getMyBorrows()
      .then((data) => { if (Array.isArray(data)) setMyBorrows(data); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadBooks(); loadMyBorrows(); }, [loadBooks, loadMyBorrows]);

  const [sportsForm, setSportsForm] = useState({
    item: 'Cricket Bat',
    qty: 1,
    slot: '',
    note: '',
  });

  // All categories present in the data right now, in a sensible order:
  // known categories first (CATEGORY_ORDER), then any new ones alphabetically,
  // then 'General' (books with no category set) last.
  const availableCategories = useMemo(() => {
    const set = new Set();
    books.forEach((b) => set.add((b.category || '').trim() || 'General'));
    const known = CATEGORY_ORDER.filter((c) => set.has(c));
    const rest = [...set].filter((c) => c !== 'General' && !CATEGORY_ORDER.includes(c)).sort();
    return [...known, ...rest, ...(set.has('General') ? ['General'] : [])];
  }, [books]);

  const filteredBooks = useMemo(() => {
    let result = books;

    if (activeBookCategory !== 'All') {
      result = result.filter((b) => ((b.category || '').trim() || 'General') === activeBookCategory);
    }

    if (bookSearchQuery.trim()) {
      const q = bookSearchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.shelf.toLowerCase().includes(q)
      );
    }

    return result;
  }, [books, bookSearchQuery, activeBookCategory]);

  const handleBorrowRequestSubmit = async ({ returnBy, studentId }) => {
    try {
      await resourcesApi.requestBorrow(modalBook._id, { returnBy, studentIdNumber: studentId });
      toast.success('Borrow request sent!');
      loadBooks();
      loadMyBorrows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
      throw err;
    }
  };

  const handleSportsSubmit = (e) => {
    e.preventDefault();
    if (!sportsForm.slot.trim()) {
      toast.error('Please enter a time slot');
      return;
    }
    const qty = sportsForm.qty === '' ? 1 : sportsForm.qty;
    onSportsRequestSubmit({ ...sportsForm, qty });
  };

  return (
    <div className="dashboard-playful space-y-6 pb-4 animate-in fade-in duration-200">
      <nav
        className="dashboard-card-lift flex w-full flex-wrap items-center gap-2 overflow-x-auto rounded-[28px] p-2"
        style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}
      >
        <button
          type="button"
          onClick={() => setResourcesActiveCategory('library')}
          className="dashboard-btn-bounce flex cursor-pointer items-center justify-center gap-2.5 rounded-full py-3.5 px-6 text-sm font-extrabold transition-all"
          style={{
            backgroundColor: resourcesActiveCategory === 'library' ? '#111111' : 'transparent',
            color: resourcesActiveCategory === 'library' ? '#ffffff' : t.textSecondary,
          }}
        >
          <BookOpen size={18} />
          <span>1. Library Books System</span>
        </button>

        <button
          type="button"
          onClick={() => setResourcesActiveCategory('sports')}
          className="dashboard-btn-bounce flex cursor-pointer items-center justify-center gap-2.5 rounded-full py-3.5 px-6 text-sm font-extrabold transition-all"
          style={{
            backgroundColor: resourcesActiveCategory === 'sports' ? '#111111' : 'transparent',
            color: resourcesActiveCategory === 'sports' ? '#ffffff' : t.textSecondary,
          }}
        >
          <Trophy size={18} />
          <span>2. Sports Items Needed</span>
        </button>
      </nav>

      {resourcesActiveCategory === 'library' && (
        <div className="space-y-6">
          <div className="rounded-[28px] p-5 sm:p-7" style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-white">
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

            {/* Category filter pills — "All" + one per category found in the data */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4" style={{ borderColor: t.border }}>
              <button
                type="button"
                onClick={() => setActiveBookCategory('All')}
                className="cursor-pointer rounded-full px-4 py-2 text-xs font-extrabold transition-all"
                style={{
                  backgroundColor: activeBookCategory === 'All' ? '#111111' : t.pageBg,
                  color: activeBookCategory === 'All' ? '#ffffff' : t.textSecondary,
                  border: activeBookCategory === 'All' ? 'none' : `1px solid ${t.border}`,
                }}
              >
                All
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveBookCategory(cat)}
                  className="cursor-pointer rounded-full px-4 py-2 text-xs font-extrabold transition-all"
                  style={{
                    backgroundColor: activeBookCategory === cat ? '#111111' : t.pageBg,
                    color: activeBookCategory === cat ? '#ffffff' : t.textSecondary,
                    border: activeBookCategory === cat ? 'none' : `1px solid ${t.border}`,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {loadingBooks && (
                <p className="py-6 text-center text-sm font-semibold" style={{ color: t.textMuted }}>Loading books...</p>
              )}

              {!loadingBooks && filteredBooks.length === 0 && (
                <p className="py-6 text-center text-sm font-semibold" style={{ color: t.textMuted }}>No books found.</p>
              )}

              {!loadingBooks && filteredBooks.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredBooks.map((book, i) => (
                    <BookCard
                      key={book._id}
                      book={book}
                      tint={t[CARD_TINTS[i % CARD_TINTS.length]]}
                      onRequestBorrow={setModalBook}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <YourBooksLog myBorrows={myBorrows} t={t} />
        </div>
      )}

      {resourcesActiveCategory === 'sports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="rounded-[28px] p-5 sm:p-7" style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-white">
                    <Trophy size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>Request Sports Equipment</h3>
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
                      <label className="block text-xs font-extrabold mb-1.5" style={{ color: t.textPrimary }}>Quantity</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={sportsForm.qty}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '') { setSportsForm({ ...sportsForm, qty: '' }); return; }
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
                      <label className="block text-xs font-extrabold mb-1.5" style={{ color: t.textPrimary }}>Time / Slot Needed</label>
                      <input
                        type="text"
                        placeholder="e.g. 1:00 PM to 2:30 PM"
                        value={sportsForm.slot}
                        onChange={(e) => setSportsForm({ ...sportsForm, slot: e.target.value })}
                        className="w-full rounded-2xl p-3 text-xs outline-none font-semibold"
                        style={{ backgroundColor: t.pageBg, border: `1px solid ${t.border}`, color: t.textPrimary }}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="dashboard-btn-bounce w-full cursor-pointer rounded-full bg-black py-3.5 text-xs font-extrabold text-white"
                    style={{ boxShadow: t.shadowSoft }}
                  >
                    Submit Sports Equipment Request
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-[28px] p-5 sm:p-7" style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}>
                <h3 className="text-base font-extrabold mb-1" style={{ color: t.textPrimary }}>My Sports Equipment Requisitions</h3>
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
                        <h4 className="font-extrabold text-sm" style={{ color: t.textPrimary }}>{req.item} (Qty: {req.qty})</h4>
                        <p className="text-[11px] font-semibold mt-0.5" style={{ color: t.textSecondary }}>Slot: {req.slot}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold text-emerald-800">{req.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BorrowRequestModal
        isOpen={!!modalBook}
        onClose={() => setModalBook(null)}
        t={t}
        book={modalBook}
        onSubmit={handleBorrowRequestSubmit}
      />
    </div>
  );
};

export default ResourcesSection;