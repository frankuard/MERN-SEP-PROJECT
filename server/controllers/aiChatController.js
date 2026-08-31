const Groq = require('groq-sdk');

// ── Existing models (no new models created) ──────────────
const Timetable      = require('../models/Timetable');
const Announcement   = require('../models/Announcement');
const Event          = require('../models/Event');
const CanteenMenu    = require('../models/CanteenMenu');
const CanteenCredit  = require('../models/CanteenCredit');
const Attendance     = require('../models/Attendance');
const VolunteerRecord= require('../models/VolunteerRecord');
const LostFoundItem  = require('../models/LostFoundItem');

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// ─────────────────────────────────────────────────────────
//  Build context from actual DB — all queries scoped to
//  req.user so a student can never see another student's data
// ─────────────────────────────────────────────────────────
const buildContext = async (user) => {
  const uid   = user._id;
  const today = DAY_NAMES[new Date().getDay()];
  const parts = [];

  // ── 1. User identity ──────────────────────────────────
  parts.push(`=== MY PROFILE ===`);
  parts.push(`Name: ${user.username}`);
  parts.push(`Role: ${user.role}`);
  parts.push(`Department: ${user.department || 'Not set'}`);
  parts.push(`Semester: ${user.semester || 'Not set'}`);

  // ── 2. Today's timetable ──────────────────────────────
  parts.push(`\n=== TODAY'S TIMETABLE (${today}) ===`);
  try {
    const slots = await Timetable.find({ day: today }).sort({ order: 1 }).limit(12).lean();
    if (!slots.length) {
      parts.push('No classes scheduled today.');
    } else {
      slots.forEach(s =>
        parts.push(`  ${s.startTime}–${s.endTime} | ${s.moduleName} (${s.moduleCode}) | ${s.classType} | Room: ${s.roomName} | Lecturer: ${s.lecturer}${s.groupName ? ' | Group: ' + s.groupName : ''}`)
      );
    }
  } catch (_) { parts.push('  Timetable data unavailable.'); }

  // ── 3. My attendance records ──────────────────────────
  parts.push(`\n=== MY ATTENDANCE RECORDS ===`);
  try {
    const records = await Attendance.find({ student: uid }).sort({ createdAt: -1 }).limit(20).lean();
    if (!records.length) {
      parts.push('No attendance records found.');
    } else {
      const present = records.filter(r => r.status === 'Present').length;
      const absent  = records.filter(r => r.status === 'Absent').length;
      const pct     = records.length ? Math.round((present / records.length) * 100) : 0;
      parts.push(`  Total recorded classes: ${records.length}`);
      parts.push(`  Present: ${present} | Absent: ${absent} | Attendance: ${pct}%`);
      parts.push(`  Recent records (latest first):`);
      records.slice(0, 10).forEach(r =>
        parts.push(`    - ${r.date}${r.time ? ' ' + r.time : ''}${r.room ? ' | ' + r.room : ''} → ${r.status}`)
      );
    }
  } catch (_) { parts.push('  Attendance data unavailable.'); }

  // ── 4. Canteen menu (all items with prices) ───────────
  parts.push(`\n=== CANTEEN MENU (with prices) ===`);
  try {
    const menuItems = await CanteenMenu.find({ availability: true }).sort({ category: 1, name: 1 }).lean();
    if (!menuItems.length) {
      parts.push('  No menu items found.');
    } else {
      const grouped = {};
      menuItems.forEach(item => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
      });
      Object.entries(grouped).forEach(([cat, items]) => {
        parts.push(`  ${cat}:`);
        items.forEach(item =>
          parts.push(`    - ${item.name}: NPR ${item.price}${item.isSpecialOfTheDay ? ' ⭐ Special of the Day' : ''}${item.isPopular ? ' 🔥 Popular' : ''}${item.description ? ' — ' + item.description : ''}`)
        );
      });
    }
  } catch (_) { parts.push('  Canteen menu unavailable.'); }

  // ── 5. My canteen credit / due balance ────────────────
  parts.push(`\n=== MY CANTEEN CREDIT / DUE ===`);
  try {
    const credit = await CanteenCredit.findOne({ user: uid }).lean();
    if (!credit) {
      parts.push('  No canteen credit record found.');
    } else {
      parts.push(`  Amount Due: NPR ${credit.amountDue}`);
      parts.push(`  Amount Paid: NPR ${credit.amountPaid}`);
      parts.push(`  Remaining Balance: NPR ${credit.remainingBalance}`);
      parts.push(`  Payment Status: ${credit.paymentStatus}`);
    }
  } catch (_) { parts.push('  Canteen credit data unavailable.'); }

  // ── 6. Recent announcements ───────────────────────────
  parts.push(`\n=== RECENT ANNOUNCEMENTS ===`);
  try {
    const ann = await Announcement.find({}).sort({ publishedAt: -1 }).limit(5).lean();
    if (!ann.length) {
      parts.push('  No announcements.');
    } else {
      ann.forEach(a => {
        const d = a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '';
        parts.push(`  [${a.priority}] ${a.title} (${a.department}${d ? ', ' + d : ''}): ${a.message || ''}`);
      });
    }
  } catch (_) { parts.push('  Announcements unavailable.'); }

  // ── 7. Upcoming events ────────────────────────────────
  parts.push(`\n=== UPCOMING EVENTS ===`);
  try {
    const events = await Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(6).lean();
    if (!events.length) {
      parts.push('  No upcoming events.');
    } else {
      events.forEach(ev => {
        const d = ev.date ? new Date(ev.date).toLocaleDateString() : 'TBD';
        parts.push(`  - ${ev.title} | ${d}${ev.location ? ' @ ' + ev.location : ''}${ev.description ? ' | ' + ev.description.slice(0, 80) : ''}`);
      });
    }
  } catch (_) { parts.push('  Events unavailable.'); }

  // ── 8. My volunteering history ────────────────────────
  parts.push(`\n=== MY VOLUNTEERING HISTORY ===`);
  try {
    const vol = await VolunteerRecord.find({ student: uid }).sort({ createdAt: -1 }).limit(10).lean();
    if (!vol.length) {
      parts.push('  No volunteering records found.');
    } else {
      const totalHours = vol.reduce((sum, v) => sum + (v.hours || 0), 0);
      parts.push(`  Total volunteer hours: ${totalHours}`);
      vol.forEach(v =>
        parts.push(`  - ${v.eventTitle} | ${v.date} | Role: ${v.role} | Hours: ${v.hours}`)
      );
    }
  } catch (_) { parts.push('  Volunteering data unavailable.'); }

  // ── 9. Recent lost & found items ─────────────────────
  parts.push(`\n=== RECENT LOST & FOUND ===`);
  try {
    const lf = await LostFoundItem.find({}).sort({ createdAt: -1 }).limit(8).lean();
    if (!lf.length) {
      parts.push('  No lost & found items.');
    } else {
      lf.forEach(item =>
        parts.push(`  [${item.type.toUpperCase()}] ${item.title} | Location: ${item.location} | Status: ${item.status} | Posted by: ${item.authorName}`)
      );
    }
  } catch (_) { parts.push('  Lost & Found data unavailable.'); }

  return parts.join('\n');
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
      return res.status(503).json({
        error: 'AI not configured. Get a free key at console.groq.com → API Keys, add GROQ_API_KEY=gsk_... to server/.env and restart.',
      });
    }

    // Pull real data from DB for this user
    const context = await buildContext(req.user);

    const systemPrompt = `You are Chauttari AI, the smart campus assistant for the Chauttari college management system.

You have been given LIVE, REAL data from the campus database for the currently logged-in student. Use this data to give accurate, specific answers.

${context}

Rules:
- Always answer based on the real data above first.
- For canteen prices: use the exact prices from the CANTEEN MENU section.
- For attendance: use the exact numbers from MY ATTENDANCE RECORDS section.
- For timetable: use the exact schedule from TODAY'S TIMETABLE section.
- For canteen credit/due: use MY CANTEEN CREDIT / DUE section.
- For lost & found, events, announcements: use those sections.
- If data shows "No records found" or "unavailable", say so honestly.
- For questions about things not in the data, give a helpful general answer.
- Be concise, friendly, and use bullet points for lists.
- Never expose system credentials or internal config.`;

    const groq = new Groq({ apiKey });

    const safeHistory = Array.isArray(history)
      ? history
          .slice(-8)
          .filter(h => h && ['user', 'assistant'].includes(h.role) && typeof h.parts === 'string' && h.parts.trim())
          .map(h => ({ role: h.role, content: h.parts }))
      : [];

    const messages = [
      { role: 'system', content: systemPrompt },
      ...safeHistory,
      { role: 'user', content: message.trim() },
    ];

    const completion = await groq.chat.completions.create({
      model: 'groq/compound-mini',
      messages,
      max_tokens: 600,
      temperature: 0.5,
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, no response was generated.';
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('[ChautariAI] Error:', error?.message || error);

    let userMessage = 'Something went wrong. Please try again.';
    if (error?.status === 401 || error?.message?.includes('401')) {
      userMessage = 'Invalid GROQ_API_KEY. Get a free key at console.groq.com → API Keys.';
    } else if (error?.status === 404 || error?.message?.includes('model_not_found')) {
      userMessage = 'AI model not available. Please contact the administrator.';
    } else if (error?.status === 429) {
      userMessage = 'Too many requests. Please wait a moment and try again.';
    }

    return res.status(500).json({ error: userMessage });
  }
};

module.exports = { chat };
