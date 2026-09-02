const mongoose                = require('mongoose');
const Groq                    = require('groq-sdk');

// All existing models — identical imports to what other controllers use
const Attendance              = require('../models/Attendance');
const AttendanceReportRequest = require('../models/AttendanceReportRequest');
const Timetable               = require('../models/Timetable');
const Announcement            = require('../models/Announcement');
const Event                   = require('../models/Event');
const EventRegistration       = require('../models/EventRegistration');
const CanteenMenu             = require('../models/CanteenMenu');
const CanteenCredit           = require('../models/CanteenCredit');
const VolunteerRecord         = require('../models/VolunteerRecord');
const VolunteerOpportunity    = require('../models/VolunteerOpportunity');
const VolunteerApplication    = require('../models/VolunteerApplication');
const LostFoundItem           = require('../models/LostFoundItem');
const HelpRequest             = require('../models/HelpRequest');
const ClassroomRequest        = require('../models/ClassroomRequest');
const CctvRequest             = require('../models/CctvRequest');
const BorrowRequest           = require('../models/BorrowRequest');
const Book                    = require('../models/Book');
const SportsRequest           = require('../models/SportsRequest');

const ALL_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// ─────────────────────────────────────────────────────────
//  buildContext — mirrors EXACT same queries as existing
//  controllers so results always match what the UI shows
// ─────────────────────────────────────────────────────────
const buildContext = async (user) => {
  // Explicitly cast to ObjectId — same as Mongoose does internally
  // This prevents any Document vs plain-object _id mismatch
  const uid = new mongoose.Types.ObjectId(user._id.toString());
  const today = ALL_DAYS[new Date().getDay()];
  const p = [];

  // ── 1. Profile ────────────────────────────────────────
  p.push(`USER: ${user.username} | Role: ${user.role} | Dept: ${user.department || 'N/A'} | Semester: ${user.semester || 'N/A'}`);

  // ── 2. Attendance — mirrors getMyAttendance + getMyAttendanceLog exactly ──
  p.push(`\nATTENDANCE (SSD):`);
  try {
    // Same query as attendanceController.getMyAttendance
    const records = await Attendance.find({ student: uid }).sort({ createdAt: -1 });
    const totalDays = records.length;
    const present   = records.filter(r => r.status === 'Present').length;
    const absent    = totalDays - present;
    const percentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    console.log(`[ChautariAI] Attendance for ${user.username} (${uid}): total=${totalDays}, present=${present}, absent=${absent}`);

    p.push(`  Overall Attendance : ${percentage}%`);
    p.push(`  Present Days       : ${present}`);
    p.push(`  Absent Days        : ${absent}`);
    p.push(`  Total Classes      : ${totalDays}`);
    p.push(`  Status             : ${percentage >= 75 ? 'Good — above 75% requirement' : totalDays === 0 ? 'No classes recorded yet' : 'LOW — below 75% requirement'}`);

    if (records.length > 0) {
      p.push(`  Recent Records:`);
      records.slice(0, 15).forEach(r =>
        p.push(`    ${r.date}${r.time ? ' '+r.time : ''}${r.room ? ' ('+r.room+')' : ''} - ${r.status}`)
      );
    }

    // Also include report requests (same as getMyReportRequests)
    const reportRequests = await AttendanceReportRequest.find({ student: uid }).sort({ createdAt: -1 });
    if (reportRequests.length > 0) {
      p.push(`  Report Requests: ${reportRequests.length}`);
      reportRequests.slice(0, 3).forEach(r =>
        p.push(`    [${r.status}] ${r.reason || 'No reason'}${r.adminNote ? ' — Admin: '+r.adminNote : ''}`)
      );
    }
  } catch (err) {
    console.error('[ChautariAI] Attendance query error:', err.message);
    p.push(`  Attendance data error: ${err.message}`);
  }

  // ── 3. Full weekly timetable ─────────────────────────
  p.push(`\nWEEKLY TIMETABLE (today=${today}):`);
  try {
    const slots = await Timetable.find({}).sort({ order: 1 }).lean();
    if (!slots.length) {
      p.push('  No timetable entries.');
    } else {
      const byDay = {};
      ALL_DAYS.forEach(d => { byDay[d] = []; });
      slots.forEach(s => { if (byDay[s.day]) byDay[s.day].push(s); });
      ALL_DAYS.forEach(day => {
        const list = byDay[day];
        if (!list.length) return;
        p.push(`  ${day}${day === today ? ' (TODAY)' : ''}:`);
        list.forEach(s =>
          p.push(`    ${s.startTime}-${s.endTime} | ${s.moduleName} (${s.moduleCode}) | ${s.classType} | Room: ${s.roomName} | ${s.lecturer}`)
        );
      });
    }
  } catch (err) { p.push('  Timetable error: ' + err.message); }

  // ── 4. Canteen menu with real NPR prices ─────────────
  p.push(`\nCANTEEN MENU (NPR prices):`);
  try {
    const menu = await CanteenMenu.find({}).sort({ category: 1, name: 1 }).lean();
    if (!menu.length) {
      p.push('  No menu items.');
    } else {
      const grp = {};
      menu.forEach(i => { if (!grp[i.category]) grp[i.category] = []; grp[i.category].push(i); });
      Object.entries(grp).forEach(([cat, items]) => {
        p.push(`  ${cat}:`);
        items.forEach(i =>
          p.push(`    ${i.name}: NPR ${i.price}${!i.availability ? ' [Unavailable]' : ''}${i.isSpecialOfTheDay ? ' [Special]' : ''}${i.isPopular ? ' [Popular]' : ''}`)
        );
      });
    }
  } catch (err) { p.push('  Menu error: ' + err.message); }

  // ── 5. Canteen credit ─────────────────────────────────
  p.push(`\nCANTEEN CREDIT:`);
  try {
    const credit = await CanteenCredit.findOne({ user: uid }).lean();
    if (!credit) {
      p.push('  No canteen credit record.');
    } else {
      p.push(`  Due: NPR ${credit.amountDue} | Paid: NPR ${credit.amountPaid} | Remaining: NPR ${credit.remainingBalance} | Status: ${credit.paymentStatus}`);
    }
  } catch (err) { p.push('  Canteen credit error: ' + err.message); }

  // ── 6. Events ─────────────────────────────────────────
  p.push(`\nEVENTS:`);
  try {
    const [events, myRegs] = await Promise.all([
      Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(6).lean(),
      EventRegistration.find({ user: uid, status: 'registered' }).lean(),
    ]);
    const myIds = new Set(myRegs.map(r => r.event.toString()));
    if (!events.length) {
      p.push('  No upcoming events.');
    } else {
      events.forEach(ev => {
        const d = ev.date ? new Date(ev.date).toLocaleDateString() : 'TBD';
        p.push(`  ${ev.title} | ${d}${ev.location ? ' @ '+ev.location : ''}${myIds.has(ev._id.toString()) ? ' [Registered]' : ''}`);
      });
    }
  } catch (err) { p.push('  Events error: ' + err.message); }

  // ── 7. Announcements ─────────────────────────────────
  p.push(`\nANNOUNCEMENTS:`);
  try {
    const ann = await Announcement.find({}).sort({ publishedAt: -1 }).limit(5).lean();
    if (!ann.length) p.push('  None.');
    else ann.forEach(a => p.push(`  [${a.priority}] ${a.title} (${a.department}): ${(a.message||'').slice(0,80)}`));
  } catch (err) { p.push('  Announcements error: ' + err.message); }

  // ── 8. SSD Help Requests ─────────────────────────────
  p.push(`\nSSD HELP REQUESTS:`);
  try {
    const helps = await HelpRequest.find({ requester: uid }).sort({ createdAt: -1 }).limit(5).lean();
    if (!helps.length) p.push('  None submitted.');
    else helps.forEach(h => {
      const d = h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '';
      p.push(`  [${d}] "${h.request.slice(0,70)}" | Responses: ${h.responses?.length || 0}`);
    });
  } catch (err) { p.push('  SSD error: ' + err.message); }

  // ── 9. Volunteering ───────────────────────────────────
  p.push(`\nVOLUNTEERING:`);
  try {
    const [records, openOpps, myApps] = await Promise.all([
      VolunteerRecord.find({ student: uid }).lean(),
      VolunteerOpportunity.find({ isOpen: true }).sort({ date: 1 }).limit(5).lean(),
      VolunteerApplication.find({ student: uid, status: 'applied' }).lean(),
    ]);
    const totalHrs = records.reduce((s, r) => s + (r.hours || 0), 0);
    if (records.length) {
      p.push(`  Confirmed hours: ${totalHrs}`);
      records.forEach(r => p.push(`  ${r.eventTitle} | ${r.date} | ${r.role} | ${r.hours}h`));
    } else {
      p.push(`  No volunteer records yet.`);
    }
    if (openOpps.length) {
      p.push(`  Open Opportunities:`);
      openOpps.forEach(op => {
        const applied = myApps.some(a => a.opportunity.toString() === op._id.toString());
        p.push(`    ${op.eventTitle} | ${op.date} | ${op.role}${applied ? ' [Applied]' : ''}`);
      });
    }
  } catch (err) { p.push('  Volunteering error: ' + err.message); }

  // ── 10. Lost & Found ──────────────────────────────────
  p.push(`\nLOST & FOUND:`);
  try {
    const items = await LostFoundItem.find({}).sort({ createdAt: -1 }).limit(6).lean();
    if (!items.length) p.push('  No items.');
    else items.forEach(i => p.push(`  [${i.type.toUpperCase()}] ${i.title} | ${i.location} | ${i.status}`));
  } catch (err) { p.push('  Lost & Found error: ' + err.message); }

  // ── 11. Classroom Requests ────────────────────────────
  p.push(`\nCLASSROOM REQUESTS:`);
  try {
    const cr = await ClassroomRequest.find({ requestedBy: uid }).sort({ createdAt: -1 }).limit(5).lean();
    if (!cr.length) p.push('  None.');
    else cr.forEach(r => p.push(`  ${r.roomName} | ${r.day} ${r.startTime}-${r.endTime} | ${r.status}`));
  } catch (err) { p.push('  Classroom error: ' + err.message); }

  // ── 12. CCTV Requests ─────────────────────────────────
  p.push(`\nCCTV REQUESTS:`);
  try {
    const cctv = await CctvRequest.find({ user: uid }).sort({ createdAt: -1 }).limit(5).lean();
    if (!cctv.length) p.push('  None.');
    else cctv.forEach(r => p.push(`  ${r.location} | ${r.date} | ${r.status}`));
  } catch (err) { p.push('  CCTV error: ' + err.message); }

  // ── 13. Library ───────────────────────────────────────
  p.push(`\nLIBRARY:`);
  try {
    const [borrows, books] = await Promise.all([
      BorrowRequest.find({ requestedBy: uid }).sort({ createdAt: -1 }).limit(5).lean(),
      Book.find({}).sort({ name: 1 }).lean(),
    ]);
    if (borrows.length) borrows.forEach(b => p.push(`  My borrow: ${b.status} | Return by: ${b.returnBy ? new Date(b.returnBy).toLocaleDateString() : 'N/A'}`));
    else p.push('  No borrow requests.');
    if (books.length) {
      p.push(`  Books (${books.length} total):`);
      books.slice(0, 12).forEach(b => p.push(`    "${b.name}" by ${b.author} | Shelf: ${b.shelf}`));
    }
  } catch (err) { p.push('  Library error: ' + err.message); }

  // ── 14. Sports ────────────────────────────────────────
  p.push(`\nSPORTS:`);
  try {
    const sports = await SportsRequest.find({ requestedBy: uid }).sort({ createdAt: -1 }).limit(5).lean();
    if (!sports.length) p.push('  No requests.');
    else sports.forEach(s => p.push(`  Qty: ${s.quantity} | Slot: ${s.slot} | Status: ${s.status}`));
  } catch (err) { p.push('  Sports error: ' + err.message); }

  return p.join('\n');
};

// ─────────────────────────────────────────────────────────
//  POST /api/ai/chat
// ─────────────────────────────────────────────────────────
const chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.includes('your_')) {
      return res.status(503).json({ error: 'AI not configured. Add GROQ_API_KEY to server/.env.' });
    }

    const context = await buildContext(req.user);

    const now = new Date();
    const currentDateTime = now.toLocaleString('en-US', {
      timeZone: 'Asia/Kathmandu',
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });

    const systemPrompt = `You are Chauttari AI, the campus assistant for Chauttari college.
You have real live data fetched directly from the campus database for the logged-in user.

CURRENT DATE AND TIME (Nepal Standard Time): ${currentDateTime}

${context}

Rules:
- Answer using only the real data above.
- For attendance: state the exact Overall Attendance %, Present Days, Absent Days, Total Classes exactly as shown.
- For canteen: give the exact NPR price from the menu.
- Write in plain, simple, everyday words — explain things the way you'd explain them to a friend, not like a report. Avoid stiff or technical phrasing.
- Keep answers short and direct.
- No asterisks, no bold, no markdown headers, no markdown symbols.
- If a section shows 0 or no records, say so honestly and suggest the student check with admin.

Table formatting:
- When an answer naturally has TWO OR MORE related data points (e.g. an attendance breakdown, canteen prices for several items, a timetable, a credit balance breakdown), do NOT write them as one dense sentence. Instead:
  1. Start with ONE short, plain-language sentence giving the headline takeaway (e.g. "You're doing well, your attendance is solid.").
  2. Then output the details as a compact table using EXACTLY this format, nothing else around it:
[TABLE]
Label | Value
Label | Value
[/TABLE]
  3. Keep each label short (1-3 words). Keep each value short (a number, a percentage, a short phrase).
  4. Do not add any other symbols, pipes, or dashes anywhere outside a [TABLE]...[/TABLE] block.
- For a single simple fact or a yes/no answer, just answer in one plain sentence — do not force a table.`;

    const groq = new Groq({ apiKey });

    const safeHistory = Array.isArray(history)
      ? history.slice(-6).filter(h => h && ['user','assistant'].includes(h.role) && typeof h.parts === 'string' && h.parts.trim()).map(h => ({ role: h.role, content: h.parts }))
      : [];

    const messages = [
      { role: 'system', content: systemPrompt },
      ...safeHistory,
      { role: 'user', content: message.trim() },
    ];

    let reply = '';
    try {
      const r = await groq.chat.completions.create({ model: 'qwen/qwen3.8-27b', messages, max_tokens: 400, temperature: 0.3 });
      reply = r.choices[0]?.message?.content || '';
    } catch (primaryErr) {
      if (primaryErr?.status === 429 || primaryErr?.status === 503) {
        const r2 = await groq.chat.completions.create({ model: 'allam-2-7b', messages, max_tokens: 400, temperature: 0.3 });
        reply = r2.choices[0]?.message?.content || '';
      } else {
        throw primaryErr;
      }
    }

    // Strip any markdown that still slips through — but leave [TABLE]...[/TABLE]
    // blocks and their pipe characters untouched, since the frontend parses those.
    reply = reply.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '').trim();

    if (!reply) reply = 'I could not generate a response. Please try again.';
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('[ChautariAI] Error:', error?.message || error);
    let msg = 'Something went wrong. Please try again.';
    if (error?.status === 401)  msg = 'Invalid GROQ_API_KEY. Get a free key at console.groq.com.';
    else if (error?.status === 404) msg = 'AI model unavailable. Please contact the administrator.';
    else if (error?.status === 429) msg = 'Too many requests. Please wait a moment.';
    return res.status(500).json({ error: msg });
  }
};

module.exports = { chat };
