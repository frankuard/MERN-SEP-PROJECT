import React, { useState, useMemo } from 'react';
import { BookOpen, Trophy, Wallet, Wrench, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ResourcesSection = ({
  t,
  libraryBooks,
  pendingBookApprovals,
  onToggleBorrowBook,
  sportsGearRequests,
  onSportsRequestSubmit,
  budgetClaims,
  onBudgetClaimSubmit,
  complaintTickets,
  onComplaintSubmit,
  onNavigateTab,
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

  // Budget Form State
  const [budgetForm, setBudgetForm] = useState({
    title: '',
    amount: '',
    category: 'Club Event & Project',
    justification: '',
  });

  // Complaint Form State
  const [complaintForm, setComplaintForm] = useState({
    issue: 'Breakage of Door',
    room: 'Block A, 1st Floor',
    urgency: 'Medium',
    description: '',
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
    onSportsRequestSubmit(sportsForm);
  };

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    if (!budgetForm.title || !budgetForm.amount) {
      toast.error('Please enter title and claim amount');
      return;
    }
    onBudgetClaimSubmit(budgetForm);
    setBudgetForm({ title: '', amount: '', category: 'Club Event & Project', justification: '' });
  };

  const handleComplaintTicketSubmit = (e) => {
    e.preventDefault();
    if (!complaintForm.description.trim()) {
      toast.error('Please describe the problem');
      return;
    }
    onComplaintSubmit(complaintForm);
    setComplaintForm({ issue: 'Breakage of Door', room: 'Block A, 1st Floor', urgency: 'Medium', description: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
              Campus Resources &amp; Student Services
            </h2>
          </div>
          <p className="mt-0.5 text-xs" style={{ color: t.textMuted }}>
            Central hub for library book borrowing, sports equipment requisition, budget claims, and facility maintenance.
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

      {/* Prominent Horizontal Navbar for the 4 Sections in One Single Row with Big Text */}
      <nav
        className="flex w-full items-center justify-between overflow-x-auto rounded-2xl border p-2 shadow-xs"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
      >
        <button
          type="button"
          onClick={() => setResourcesActiveCategory('library')}
          className={`flex flex-1 min-w-[200px] items-center justify-center gap-2.5 rounded-xl py-3.5 px-4 text-sm font-extrabold transition-all ${
            resourcesActiveCategory === 'library'
              ? 'bg-[#2f4336] text-white shadow-sm'
              : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <BookOpen size={18} />
          <span>1. Library Books System</span>
        </button>

        <button
          type="button"
          onClick={() => setResourcesActiveCategory('sports')}
          className={`flex flex-1 min-w-[200px] items-center justify-center gap-2.5 rounded-xl py-3.5 px-4 text-sm font-extrabold transition-all ${
            resourcesActiveCategory === 'sports'
              ? 'bg-[#2f4336] text-white shadow-sm'
              : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Trophy size={18} />
          <span>2. Sports Items Needed</span>
        </button>

        <button
          type="button"
          onClick={() => setResourcesActiveCategory('others')}
          className={`flex flex-1 min-w-[200px] items-center justify-center gap-2.5 rounded-xl py-3.5 px-4 text-sm font-extrabold transition-all ${
            resourcesActiveCategory === 'others'
              ? 'bg-[#2f4336] text-white shadow-sm'
              : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Wallet size={18} />
          <span>3. Budget Claim &amp; Others</span>
        </button>

        <button
          type="button"
          onClick={() => setResourcesActiveCategory('complaints')}
          className={`flex flex-1 min-w-[200px] items-center justify-center gap-2.5 rounded-xl py-3.5 px-4 text-sm font-extrabold transition-all ${
            resourcesActiveCategory === 'complaints'
              ? 'bg-[#2f4336] text-white shadow-sm'
              : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Wrench size={18} />
          <span>4. Facility Complaints</span>
        </button>
      </nav>

      {/* ----------------- CATEGORY 1: LIBRARY BOOK MANAGEMENT (BIMALA MAM APPROVAL) ----------------- */}
      {resourcesActiveCategory === 'library' && (
        <div className="space-y-6">
          <div
            className="rounded-3xl border p-6 shadow-xs"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center" style={{ borderColor: t.border }}>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                    Library Book Management System
                  </h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                    Bimala Mam (In-Charge)
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                  Search catalog, check shelf locations, and borrow/submit books with instant 5-second Bimala Mam verification
                </p>
              </div>

              {/* Search Book */}
              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by book name, author, shelf..."
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  className="w-full rounded-xl border pl-9 pr-3 py-2 text-xs outline-none"
                  style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBooks.map((book) => {
                const isPending = !!pendingBookApprovals[book.id];
                const pendingType = pendingBookApprovals[book.id];
                return (
                  <div
                    key={book.id}
                    className="flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all hover:shadow-md"
                    style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="rounded-md bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                          Shelf {book.shelf}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            book.available
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {book.available ? 'Available' : 'Issued'}
                        </span>
                      </div>

                      <h4 className="mt-3 text-sm font-bold leading-snug" style={{ color: t.textPrimary }}>
                        {book.name}
                      </h4>
                      <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
                        by {book.author}
                      </p>

                      {!book.available && book.issuedTo && (
                        <p className="mt-2 text-[11px] font-semibold text-amber-600">
                          Status: {book.issuedTo}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onToggleBorrowBook(book.id)}
                      className={`mt-4 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white transition-all shadow-xs ${
                        isPending
                          ? 'bg-amber-600 animate-pulse cursor-not-allowed'
                          : book.available
                          ? 'bg-[#2f4336] hover:bg-[#25362b]'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
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
                className="rounded-3xl border p-6 shadow-xs"
                style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
              >
                <h3 className="text-base font-bold mb-1" style={{ color: t.textPrimary }}>
                  Request Sports Equipment
                </h3>
                <p className="text-xs mb-4" style={{ color: t.textMuted }}>
                  Select item from college sports room inventory for practice or recess matches
                </p>

                <form onSubmit={handleSportsSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: t.textPrimary }}>
                      Select Sports Item Needed
                    </label>
                    <select
                      value={sportsForm.item}
                      onChange={(e) => setSportsForm({ ...sportsForm, item: e.target.value })}
                      className="w-full rounded-xl border p-2.5 text-xs outline-none font-semibold"
                      style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
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
                      <label className="block text-xs font-bold mb-1" style={{ color: t.textPrimary }}>
                        Quantity
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={sportsForm.qty}
                        onChange={(e) => setSportsForm({ ...sportsForm, qty: Number(e.target.value) })}
                        className="w-full rounded-xl border p-2.5 text-xs outline-none"
                        style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1" style={{ color: t.textPrimary }}>
                        Time / Slot Needed
                      </label>
                      <select
                        value={sportsForm.slot}
                        onChange={(e) => setSportsForm({ ...sportsForm, slot: e.target.value })}
                        className="w-full rounded-xl border p-2.5 text-xs outline-none"
                        style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                      >
                        <option value="Lunch Break (01:00 PM - 02:00 PM)">Lunch Break (01:00 PM)</option>
                        <option value="Sports Hour (04:00 PM - 05:30 PM)">Sports Hour (04:00 PM)</option>
                        <option value="Inter-Department Match">Inter-Department Match</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[#2f4336] py-3 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
                  >
                    Submit Sports Equipment Request
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Issued & Requested Gear */}
            <div className="lg:col-span-6">
              <div
                className="rounded-3xl border p-6 shadow-xs"
                style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
              >
                <h3 className="text-base font-bold mb-1" style={{ color: t.textPrimary }}>
                  My Sports Equipment Requisitions
                </h3>
                <p className="text-xs mb-4" style={{ color: t.textMuted }}>
                  Pick up approved equipment from Ground Floor Sports In-charge desk
                </p>

                <div className="space-y-3">
                  {sportsGearRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-2xl border p-4 text-xs"
                      style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                    >
                      <div>
                        <h4 className="font-bold text-sm" style={{ color: t.textPrimary }}>
                          {req.item} (Qty: {req.qty})
                        </h4>
                        <p className="text-[11px] mt-0.5" style={{ color: t.textMuted }}>
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

      {/* ----------------- CATEGORY 3: BUDGET CLAIM & OTHERS ----------------- */}
      {resourcesActiveCategory === 'others' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Budget Claim Form */}
            <div className="lg:col-span-6">
              <div
                className="rounded-3xl border p-6 shadow-xs"
                style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
              >
                <h3 className="text-base font-bold mb-1" style={{ color: t.textPrimary }}>
                  Student Budget &amp; Event Fund Claim
                </h3>
                <p className="text-xs mb-4" style={{ color: t.textMuted }}>
                  Submit reimbursement or advance funding claim for club fests, workshops, and project components
                </p>

                <form onSubmit={handleBudgetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: t.textPrimary }}>
                      Event / Project Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AI Horizon Workshop Materials & Refreshments"
                      value={budgetForm.title}
                      onChange={(e) => setBudgetForm({ ...budgetForm, title: e.target.value })}
                      className="w-full rounded-xl border p-2.5 text-xs outline-none"
                      style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1" style={{ color: t.textPrimary }}>
                        Claim Amount (NPR)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 4500"
                        value={budgetForm.amount}
                        onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                        className="w-full rounded-xl border p-2.5 text-xs outline-none font-bold"
                        style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1" style={{ color: t.textPrimary }}>
                        Category
                      </label>
                      <select
                        value={budgetForm.category}
                        onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                        className="w-full rounded-xl border p-2.5 text-xs outline-none"
                        style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                      >
                        <option value="Club Event & Project">Club Event &amp; Project</option>
                        <option value="Hackathon Material">Hackathon Hardware Kit</option>
                        <option value="Print / Banner Materials">Print &amp; Promotion</option>
                        <option value="Student Welfare">Student Welfare / Health</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: t.textPrimary }}>
                      Justification &amp; Receipt Note
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Attach invoice numbers, bill details and advisor approval note..."
                      value={budgetForm.justification}
                      onChange={(e) => setBudgetForm({ ...budgetForm, justification: e.target.value })}
                      className="w-full rounded-xl border p-2.5 text-xs outline-none"
                      style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[#2f4336] py-3 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
                  >
                    Submit Budget Claim to SSD
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Special Resource Requisition & Past Claims */}
            <div className="lg:col-span-6 space-y-6">
              <div
                className="rounded-3xl border p-6 shadow-xs"
                style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
              >
                <h3 className="text-base font-bold mb-1" style={{ color: t.textPrimary }}>
                  Special Resource Requisition
                </h3>
                <p className="text-xs mb-4" style={{ color: t.textMuted }}>
                  Request campus equipment for presentations, seminars, and club activities
                </p>

                <div className="space-y-3 text-xs">
                  <div className="rounded-xl border p-3 flex items-center justify-between" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
                    <span>🎤 Portable PA Sound System &amp; 2 Wireless Mics</span>
                    <button
                      type="button"
                      onClick={() => toast.success('Sound System reserved for next event!')}
                      className="rounded-lg bg-[#2f4336] px-3 py-1 font-bold text-white shadow-xs"
                    >
                      Request
                    </button>
                  </div>
                  <div className="rounded-xl border p-3 flex items-center justify-between" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
                    <span>🔌 Multi-plug Extension Cords (20m)</span>
                    <button
                      type="button"
                      onClick={() => toast.success('Extension cord booked from Lab 3!')}
                      className="rounded-lg bg-[#2f4336] px-3 py-1 font-bold text-white shadow-xs"
                    >
                      Request
                    </button>
                  </div>
                  <div className="rounded-xl border p-3 flex items-center justify-between" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
                    <span>📹 Tripod &amp; Streaming Camera for Sessions</span>
                    <button
                      type="button"
                      onClick={() => toast.success('Camera kit requested from Media Dept!')}
                      className="rounded-lg bg-[#2f4336] px-3 py-1 font-bold text-white shadow-xs"
                    >
                      Request
                    </button>
                  </div>
                </div>
              </div>

              {/* Past Claims */}
              <div
                className="rounded-3xl border p-6 shadow-xs"
                style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
              >
                <h4 className="text-sm font-bold mb-3" style={{ color: t.textPrimary }}>
                  Submitted Budget Claims
                </h4>
                <div className="space-y-2.5">
                  {budgetClaims.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-xl border p-3 text-xs"
                      style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                    >
                      <div>
                        <p className="font-bold" style={{ color: t.textPrimary }}>
                          {c.title}
                        </p>
                        <p className="text-[11px] text-emerald-600 font-extrabold">
                          NPR {c.amount} ({c.category})
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- CATEGORY 4: COMPLAINING & FACILITY MAINTENANCE ----------------- */}
      {resourcesActiveCategory === 'complaints' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Log Complaint Form */}
            <div className="lg:col-span-6">
              <div
                className="rounded-3xl border p-6 shadow-xs"
                style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
              >
                <h3 className="text-base font-bold mb-1" style={{ color: t.textPrimary }}>
                  Report Campus Facility Issue / Complaint
                </h3>
                <p className="text-xs mb-4" style={{ color: t.textMuted }}>
                  Direct ticket dispatch to Campus Facilities &amp; Maintenance Staff
                </p>

                <form onSubmit={handleComplaintTicketSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: t.textPrimary }}>
                      Select Issue Type
                    </label>
                    <select
                      value={complaintForm.issue}
                      onChange={(e) => setComplaintForm({ ...complaintForm, issue: e.target.value })}
                      className="w-full rounded-xl border p-2.5 text-xs outline-none font-semibold"
                      style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                    >
                      <option value="Breakage of Door">🚪 Breakage of Door</option>
                      <option value="Bench Management">🪑 Bench Management / Broken Desks</option>
                      <option value="AC Problem">❄️ AC Problem / Heating</option>
                      <option value="Projector Issue">📽️ Projector Issue / HDMI</option>
                      <option value="Sports Item Needed">⚽ Sports Item Needed / Damaged</option>
                      <option value="Water Leakage">🚰 Water Leakage / Restroom Issue</option>
                      <option value="Others">🔧 Others / Electrical</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1" style={{ color: t.textPrimary }}>
                        Location / Classroom
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Block A, Room 202 or LT01"
                        value={complaintForm.room}
                        onChange={(e) => setComplaintForm({ ...complaintForm, room: e.target.value })}
                        className="w-full rounded-xl border p-2.5 text-xs outline-none"
                        style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1" style={{ color: t.textPrimary }}>
                        Urgency Level
                      </label>
                      <select
                        value={complaintForm.urgency}
                        onChange={(e) => setComplaintForm({ ...complaintForm, urgency: e.target.value })}
                        className="w-full rounded-xl border p-2.5 text-xs outline-none"
                        style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                      >
                        <option value="Low">Low (Within 48 hrs)</option>
                        <option value="Medium">Medium (Same day)</option>
                        <option value="High">High / Urgent (Immediate)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: t.textPrimary }}>
                      Problem Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe the damage, specific bench numbers, or malfunction..."
                      value={complaintForm.description}
                      onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                      className="w-full rounded-xl border p-2.5 text-xs outline-none"
                      style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[#2f4336] py-3 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
                  >
                    Dispatch Complaint Ticket to Maintenance
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Tracked Complaints */}
            <div className="lg:col-span-6">
              <div
                className="rounded-3xl border p-6 shadow-xs"
                style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
              >
                <h3 className="text-base font-bold mb-1" style={{ color: t.textPrimary }}>
                  Campus Maintenance Issue Tracker
                </h3>
                <p className="text-xs mb-4" style={{ color: t.textMuted }}>
                  Real-time resolution status of logged student tickets
                </p>

                <div className="space-y-3.5">
                  {complaintTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="rounded-2xl border p-4 space-y-2 text-xs"
                      style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm" style={{ color: t.textPrimary }}>
                            {ticket.issue}
                          </span>
                          <span className="rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                            {ticket.room}
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            ticket.status === 'Resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>

                      <p className="leading-relaxed" style={{ color: t.textMuted }}>
                        {ticket.description}
                      </p>

                      <div className="flex items-center justify-between border-t pt-2 text-[11px]" style={{ borderColor: t.border }}>
                        <span className="font-semibold text-red-500">Urgency: {ticket.urgency}</span>
                        <span style={{ color: t.textMuted }}>{ticket.time}</span>
                      </div>
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
