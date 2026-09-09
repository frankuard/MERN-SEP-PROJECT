const mongoose = require('mongoose');

const actionService = require('../services/aiActionService');
const { getGroq } = require('../services/aiGroq');

// All existing models — identical imports to what other controllers use
const Attendance = require('../models/Attendance');
const AttendanceReportRequest = require('../models/AttendanceReportRequest');
const Timetable = require('../models/Timetable');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const CanteenMenu = require('../models/CanteenMenu');
const CanteenCredit = require('../models/CanteenCredit');
const VolunteerRecord = require('../models/VolunteerRecord');
const VolunteerOpportunity = require('../models/VolunteerOpportunity');
const VolunteerApplication = require('../models/VolunteerApplication');
const LostFoundItem = require('../models/LostFoundItem');
const HelpRequest = require('../models/HelpRequest');
const DepartmentContact = require('../models/DepartmentContact');
const ClassroomRequest = require('../models/ClassroomRequest');
const CctvRequest = require('../models/CctvRequest');
const BorrowRequest = require('../models/BorrowRequest');
const Book = require('../models/Book');
const SportsRequest = require('../models/SportsRequest');
const SportsItem = require('../models/SportsItem');
const Coursework = require('../models/Coursework');
const CourseworkSubmission = require('../models/CourseworkSubmission');

const ALL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─────────────────────────────────────────────────────────
//  buildContext — mirrors EXACT same queries as existing
//  controllers so results always match what the UI shows
// ─────────────────────────────────────────────────────────
const buildContext = async (user) => {
  const uid = new mongoose.Types.ObjectId(user._id.toString());
  const today = ALL_DAYS[new Date().getDay()];
  const p = [];

  // ── 1. Profile ──
  p.push(`USER: ${user.username} | Role: ${user.role} | Dept: ${user.department || 'N/A'} | Semester: ${user.semester || 'N/A'} | Cohort Group: ${user.group || 'N/A'}`);

  // ── 2. Attendance ──
  p.push(`\nATTENDANCE (SSD):`);
  try {
    const records = await Attendance.find({ student: uid }).sort({ createdAt: -1 });
    const totalDays = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const absent = totalDays - present;
    const percentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    p.push(`  Overall Attendance : ${percentage}%`);
    p.push(`  Present Days       : ${present}`);
    p.push(`  Absent Days        : ${absent}`);
    p.push(`  Total Classes      : ${totalDays}`);
    p.push(`  Status             : ${percentage >= 75 ? 'Good — above 75% requirement' : totalDays === 0 ? 'No classes recorded yet' : 'LOW — below 75% requirement'}`);

    if (records.length > 0) {
      p.push(`  Recent Classes:`);
      records.slice(0, 6).forEach(r =>
        p.push(`    ${r.date}${r.time ? ' ' + r.time : ''}${r.room ? ' (' + r.room + ')' : ''} - ${r.status}`)
      );
    }

    const reportRequests = await AttendanceReportRequest.find({ student: uid }).sort({ createdAt: -1 });
    if (reportRequests.length > 0) {
      p.push(`  Report Requests: ${reportRequests.length}`);
      reportRequests.slice(0, 3).forEach(r =>
        p.push(`    [${r.status}] ${r.reason || 'No reason'}${r.adminNote ? ' — Admin: ' + r.adminNote : ''}`)
      );
    }
  } catch (err) {
    p.push(`  Attendance data error: ${err.message}`);
  }

  // ── 3. Weekly Timetable ──
  p.push(`\nTIMETABLE (today=${today}, cohort=${user.group || 'All'}):`);
  try {
    let slots = [];
    if (user.group) {
      slots = await Timetable.find({
        $or: [{ groupNames: user.group }, { groupNames: { $size: 0 } }, { groupNames: null }]
      }).sort({ order: 1 }).lean();
    }
    if (!slots.length) {
      slots = await Timetable.find({}).sort({ order: 1 }).limit(25).lean();
    }
    if (!slots.length) {
      p.push('  No timetable entries scheduled.');
    } else {
      const byDay = {};
      ALL_DAYS.forEach(d => { byDay[d] = []; });
      slots.forEach(s => { if (byDay[s.day]) byDay[s.day].push(s); });
      ALL_DAYS.forEach(day => {
        const list = byDay[day];
        if (!list.length) return;
        p.push(`  ${day}${day === today ? ' (TODAY)' : ''}:`);
        list.forEach(s =>
          p.push(`    ${s.startTime}-${s.endTime} | ${s.moduleName} (${s.moduleCode}) | ${s.classType} | Room ${s.roomName} | ${s.lecturer}`)
        );
      });
    }
  } catch (err) { p.push('  Timetable error: ' + err.message); }

  // ── 4. Coursework & Assignments ──
  p.push(`\nCOURSEWORK & ASSIGNMENTS (cohort=${user.group || 'All'}):`);
  try {
    const cwFilter = user.group ? { targetGroup: user.group } : {};
    const [cws, mySubs] = await Promise.all([
      Coursework.find(cwFilter).sort({ dueDate: 1 }).limit(6).lean(),
      CourseworkSubmission.find({ student: uid }).lean(),
    ]);
    const subMap = new Map(mySubs.map(s => [s.coursework.toString(), s]));
    if (!cws.length) {
      p.push('  No active coursework assigned.');
    } else {
      cws.forEach(cw => {
        const sub = subMap.get(cw._id.toString());
        const due = cw.dueDate ? new Date(cw.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';
        let status = 'Not Submitted';
        if (sub?.status === 'graded') status = `Graded: ${sub.grade}/${cw.totalMarks}`;
        else if (sub) status = 'Submitted';
        else if (new Date() > new Date(cw.dueDate)) status = 'Overdue';
        p.push(`  ${cw.moduleCode}: "${cw.title}" | Due: ${due} | Marks: ${cw.totalMarks} | Status: ${status}${sub?.feedback ? ' | Feedback: ' + sub.feedback.slice(0, 60) : ''}`);
      });
    }
  } catch (err) { p.push('  Coursework error: ' + err.message); }

  // ── 5. Canteen menu with NPR prices ──
  p.push(`\nCANTEEN MENU (NPR prices):`);
  try {
    const menu = await CanteenMenu.find({}).sort({ category: 1, name: 1 }).lean();
    if (!menu.length) {
      p.push('  No menu items.');
    } else {
      const grp = {};
      menu.forEach(i => { if (!grp[i.category]) grp[i.category] = []; grp[i.category].push(i); });
      Object.entries(grp).forEach(([cat, items]) => {
        const itemStrs = items.map(i => `${i.name}: NPR ${i.price}${!i.availability ? ' [Unavailable]' : ''}${i.isPopular ? ' [Popular]' : ''}`);
        p.push(`  ${cat}: ${itemStrs.join(', ')}`);
      });
    }
  } catch (err) { p.push('  Menu error: ' + err.message); }

  // ── 6. Canteen credit ──
  p.push(`\nCANTEEN CREDIT:`);
  try {
    const credit = await CanteenCredit.findOne({ user: uid }).lean();
    if (!credit) {
      p.push('  No canteen credit record.');
    } else {
      p.push(`  Due: NPR ${credit.amountDue} | Paid: NPR ${credit.amountPaid} | Remaining Balance: NPR ${credit.remainingBalance} | Status: ${credit.paymentStatus}`);
    }
  } catch (err) { p.push('  Canteen credit error: ' + err.message); }

  // ── 7. Events ──
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
        const d = ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD';
        p.push(`  ${ev.title} | ${d}${ev.venue ? ' @ ' + ev.venue : ''}${myIds.has(ev._id.toString()) ? ' [Registered]' : ''}`);
      });
    }
  } catch (err) { p.push('  Events error: ' + err.message); }

  // ── 8. Announcements ──
  p.push(`\nANNOUNCEMENTS:`);
  try {
    const ann = await Announcement.find({}).sort({ publishedAt: -1 }).limit(5).lean();
    if (!ann.length) p.push('  None.');
    else ann.forEach(a => p.push(`  [${a.priority}] ${a.title} (${a.department}): ${(a.message || '').slice(0, 80)}`));
  } catch (err) { p.push('  Announcements error: ' + err.message); }

  // ── 9. SSD Help Requests ──
  p.push(`\nSSD HELP REQUESTS:`);
  try {
    const helps = await HelpRequest.find({ requester: uid }).sort({ createdAt: -1 }).limit(4).lean();
    if (!helps.length) p.push('  None submitted.');
    else helps.forEach(h => {
      const d = h.createdAt ? new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      p.push(`  [${d}] "${h.request.slice(0, 60)}" | Responses: ${h.responses?.length || 0}`);
    });
  } catch (err) { p.push('  SSD error: ' + err.message); }

  // ── 10. Department Contacts ──
  p.push(`\nDEPARTMENT CONTACTS:`);
  try {
    const departments = await DepartmentContact.find({}).sort({ order: 1 }).lean();
    if (!departments.length) {
      p.push('  No department contacts on file.');
    } else {
      departments.forEach(d =>
        p.push(`  ${d.title} | Phone: ${d.phone} | Email: ${d.email}`)
      );
    }
  } catch (err) { p.push('  Department contacts error: ' + err.message); }

  // ── 11. Volunteering ──
  p.push(`\nVOLUNTEERING:`);
  try {
    const [records, openOpps, myApps] = await Promise.all([
      VolunteerRecord.find({ student: uid }).lean(),
      VolunteerOpportunity.find({ isOpen: true }).sort({ date: 1 }).limit(5).lean(),
      VolunteerApplication.find({ student: uid, status: 'applied' }).lean(),
    ]);
    const totalHrs = records.reduce((s, r) => s + (r.hours || 0), 0);
    if (records.length) {
      p.push(`  Confirmed volunteer hours: ${totalHrs}`);
      records.slice(0, 4).forEach(r => p.push(`    ${r.eventTitle} | ${r.date} | ${r.role} | ${r.hours}h`));
    } else {
      p.push(`  Confirmed volunteer hours: 0`);
    }
    if (openOpps.length) {
      p.push(`  Open Opportunities:`);
      openOpps.forEach(op => {
        const applied = myApps.some(a => a.opportunity.toString() === op._id.toString());
        p.push(`    ${op.eventTitle} | ${op.date} | ${op.role}${applied ? ' [Applied]' : ''}`);
      });
    }
  } catch (err) { p.push('  Volunteering error: ' + err.message); }

  // ── 12. Lost & Found ──
  p.push(`\nLOST & FOUND:`);
  try {
    const items = await LostFoundItem.find({}).sort({ createdAt: -1 }).limit(5).lean();
    if (!items.length) p.push('  No items.');
    else items.forEach(i => p.push(`  [${i.type.toUpperCase()}] ${i.title} | ${i.location} | ${i.status}`));
  } catch (err) { p.push('  Lost & Found error: ' + err.message); }

  // ── 13. Classroom Requests ──
  p.push(`\nCLASSROOM REQUESTS:`);
  try {
    const cr = await ClassroomRequest.find({ requestedBy: uid }).sort({ createdAt: -1 }).limit(4).lean();
    if (!cr.length) p.push('  None.');
    else cr.forEach(r => p.push(`  ${r.roomName} | ${r.day} ${r.startTime}-${r.endTime} | ${r.status}`));
  } catch (err) { p.push('  Classroom error: ' + err.message); }

  // ── 14. CCTV Requests ──
  p.push(`\nCCTV REQUESTS:`);
  try {
    const cctv = await CctvRequest.find({ user: uid }).sort({ createdAt: -1 }).limit(4).lean();
    if (!cctv.length) p.push('  None.');
    else cctv.forEach(r => p.push(`  ${r.location} | ${r.date} | ${r.status}`));
  } catch (err) { p.push('  CCTV error: ' + err.message); }

  // ── 15. Library ──
  p.push(`\nLIBRARY:`);
  try {
    const [borrows, books] = await Promise.all([
      BorrowRequest.find({ requestedBy: uid }).sort({ createdAt: -1 }).limit(5).lean(),
      Book.find({}).sort({ name: 1 }).lean(),
    ]);
    if (borrows.length) borrows.forEach(b => p.push(`  My borrow: ${b.status} | Return by: ${b.returnBy ? new Date(b.returnBy).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}`));
    else p.push('  No active borrow requests.');
    if (books.length) {
      const bookStrs = books.slice(0, 12).map(b => `"${b.name}" (${b.shelf})`);
      p.push(`  Available Books (${books.length} total): ${bookStrs.join('; ')}`);
    }
  } catch (err) { p.push('  Library error: ' + err.message); }

  // ── 16. Sports ──
  p.push(`\nSPORTS:`);
  try {
    const [sports, items] = await Promise.all([
      SportsRequest.find({ requestedBy: uid }).sort({ createdAt: -1 }).limit(4).lean(),
      SportsItem.find({}).sort({ name: 1 }).lean(),
    ]);
    if (sports.length) sports.forEach(s => p.push(`  My request: Qty ${s.quantity} | Slot ${s.slot} | Status: ${s.status}`));
    else p.push('  No active sports requests.');
    if (items.length) {
      const itemStrs = items.map(i => `${i.name} (${i.totalQuantity} avail)`).join(', ');
      p.push(`  Available Items: ${itemStrs}`);
    }
  } catch (err) { p.push('  Sports error: ' + err.message); }

  return p.join('\n');
};

// ─────────────────────────────────────────────────────────
//  POST /api/ai/chat — action flow first, then context chat
// ─────────────────────────────────────────────────────────
const chat = async (req, res) => {
  try {
    const { message, attachment } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    const safeAttachment = attachment && typeof attachment === 'object' && typeof attachment.url === 'string' && attachment.url.trim()
      ? { url: attachment.url.trim(), name: typeof attachment.name === 'string' ? attachment.name.trim() : '' }
      : null;

    const apiKey = (process.env.GROQ_API_KEY || '').trim();
    if (!apiKey || apiKey.includes('your_')) {
      return res.status(503).json({ error: 'AI not configured. Add GROQ_API_KEY to server/.env.' });
    }

    // 1) Action engine: server-side conversation sessions. Returns
    //    {reply, card} when an action is active or a new one is detected,
    //    null when this message is a normal campus Q&A.
    try {
      const safeHistoryForAction = Array.isArray(req.body.history)
        ? req.body.history.slice(-6).filter(h => h && ['user', 'assistant'].includes(h.role) && typeof h.parts === 'string' && h.parts.trim()).map(h => ({ role: h.role, content: h.parts }))
        : [];
      const actionResult = await actionService.handleTurn(req.user, message, safeHistoryForAction, safeAttachment);
      if (actionResult) return res.json(actionResult);
    } catch (err) {
      if (err?.status === 503) {
        return res.status(503).json({ error: 'AI is busy right now. Please try again in a moment.' });
      }
      if (err?.status === 401) {
        return res.status(401).json({ error: 'Invalid GROQ_API_KEY. Get a free key at console.groq.com.' });
      }
      throw err;
    }

    // 2) Plain campus Q&A with real database context.
    const context = await buildContext(req.user);

    const now = new Date();
    const currentDateTime = now.toLocaleString('en-US', {
      timeZone: 'Asia/Kathmandu',
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });

    const systemPrompt = `You are Chauttari AI, the intelligent, helpful campus assistant for Chauttari College in Nepal.
You have real-time live data fetched directly from the campus database for the logged-in student.

CURRENT DATE & TIME (Nepal Standard Time): ${currentDateTime}

=== LIVE CAMPUS DATABASE CONTEXT ===
${context}
=== END DATABASE CONTEXT ===

CORE OBJECTIVE:
Assist the student with accuracy, clarity, and a friendly, encouraging tone. Make their college life smoother and inform them promptly about attendance, coursework, timetable, canteen, events, library, and campus requests.

CAPABILITIES & DOMAIN RULES:
1. GREETINGS & CASUAL CHAT:
   - When greeted ("hi", "hello", "good morning", "how are you", "who are you"), reply warmly and politely.
   - Mention 2-3 specific things you can do (e.g. check attendance, show today's classes, canteen prices, coursework due dates, library books).
   - NEVER say "No records found" or refuse to chat on a greeting!

2. CAMPUS DATABASE ANSWERS:
   - ATTENDANCE: State exact Overall Attendance %, Present Days, Absent Days, Total Classes. Note if they meet the mandatory 75% college threshold.
   - TIMETABLE & CLASSES: Tell them what classes they have today or this week for their cohort group. State start-end time, module name, room, and lecturer. If there are no classes today, state that clearly and mention the next day with scheduled classes.
   - COURSEWORK & ASSIGNMENTS: State pending, submitted, or graded coursework, due dates, marks, and teacher feedback if available.
   - CANTEEN & CREDIT: Give exact NPR prices from the menu. Mention if an item is popular or unavailable. State their credit balance or due amount if asked.
   - EVENTS & VOLUNTEERING: List upcoming events, registration status, confirmed volunteer hours, and open volunteer opportunities.
   - LIBRARY & SPORTS: Share book shelf locations, active borrow statuses with return deadlines, and available sports gear.
   - SSD / CCTV / DEPARTMENTS: Provide department contact phone/emails, lost & found status, and CCTV request updates.

3. GENERAL ACADEMIC & CAMPUS GUIDANCE:
   - If a student asks a general academic question (study advice, programming concepts, math, GPA calculation, exam preparation tips, campus navigation) that is not in the database dump, answer helpfully, accurately, and encouragingly using your general knowledge.

4. ACTION REQUEST GUIDANCE:
   - If a student asks how to report lost items, request CCTV footage, apply for volunteering, borrow a book, or request sports equipment, tell them they can simply say so right here in chat (e.g. "I lost my wallet in LT01", "Borrow Mindset", "Request a basketball") or use the respective portal tab.

FORMATTING RULES:
- Write in plain, friendly, conversational English (or Nepali/Romanized Nepali if addressed in Nepali).
- Plain text only: DO NOT use markdown headers (###), bold asterisks (**text**), or decorative markdown symbols.
- TABLE FORMAT: When an answer naturally presents two or more related data items (e.g. attendance breakdown, canteen price list, class schedule, assignment list, credit breakdown):
  1. Start with ONE clear, friendly headline sentence.
  2. Then render the data in this exact compact table format:
[TABLE]
Label | Value
Label | Value
[/TABLE]
  3. Keep Labels short (1-3 words) and Values concise (numbers, short phrases, NPR amounts).
  4. Never use pipe (|) characters anywhere outside of a [TABLE]...[/TABLE] block.
- For simple questions, single facts, or greetings, answer in 1-2 direct sentences without a table.
- Be honest: If a database category has no records for the student, say so simply and politely.`;

    const groq = new (require('groq-sdk'))({ apiKey });

    const safeHistory = Array.isArray(req.body.history)
      ? req.body.history.slice(-8).filter(h => h && ['user', 'assistant'].includes(h.role) && typeof h.parts === 'string' && h.parts.trim()).map(h => ({ role: h.role, content: h.parts }))
      : [];

    const messages = [
      { role: 'system', content: systemPrompt },
      ...safeHistory,
      { role: 'user', content: message.trim() },
    ];

    let reply = '';
    try {
      const r = await groq.chat.completions.create({ model: 'qwen/qwen3.8-27b', messages, max_tokens: 800, temperature: 0.3 });
      reply = r.choices[0]?.message?.content || '';
    } catch (primaryErr) {
      if (primaryErr?.status === 429 || primaryErr?.status === 503 || primaryErr?.status === 404) {
        try {
          const r2 = await groq.chat.completions.create({ model: 'llama-3.3-70b-versatile', messages, max_tokens: 800, temperature: 0.3 });
          reply = r2.choices[0]?.message?.content || '';
        } catch (fallbackErr) {
          const r3 = await groq.chat.completions.create({ model: 'allam-2-7b', messages, max_tokens: 800, temperature: 0.3 });
          reply = r3.choices[0]?.message?.content || '';
        }
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
    if (error?.status === 401) msg = 'Invalid GROQ_API_KEY. Get a free key at console.groq.com.';
    else if (error?.status === 404) msg = 'AI model unavailable. Please contact the administrator.';
    else if (error?.status === 429) msg = 'Too many requests. Please wait a moment.';
    return res.status(500).json({ error: msg });
  }
};

// ─────────────────────────────────────────────────────────
//  POST /api/ai/confirm — submit the pending request
// ─────────────────────────────────────────────────────────
const confirmAction = async (req, res) => {
  try {
    const result = await actionService.confirmAction(req.user);
    return res.json(result);
  } catch (error) {
    console.error('[ChautariAI] confirm error:', error?.message || error);
    return res.status(200).json({
      reply: error?.message || 'The request could not be submitted. Please try again.',
      card: null,
    });
  }
};

// ─────────────────────────────────────────────────────────
//  POST /api/ai/cancel — abort the pending request
// ─────────────────────────────────────────────────────────
const cancelAction = async (req, res) => {
  try {
    const result = await actionService.cancelAction(req.user);
    return res.json(result);
  } catch (error) {
    console.error('[ChautariAI] cancel error:', error?.message || error);
    return res.status(500).json({ reply: 'Could not cancel the request right now.', card: null });
  }
};

// ─────────────────────────────────────────────────────────
//  POST /api/ai/choose — pick a claim match by index
// ─────────────────────────────────────────────────────────
const chooseAction = async (req, res) => {
  try {
    const { index } = req.body;
    const result = await actionService.chooseMatch(req.user, Number(index));
    return res.json(result);
  } catch (error) {
    console.error('[ChautariAI] choose error:', error?.message || error);
    return res.status(200).json({ reply: 'Something went wrong while selecting that item. Please try again.', card: null });
  }
};

// ─────────────────────────────────────────────────────────
//  POST /api/ai/transcribe — voice → text via Groq whisper
// ─────────────────────────────────────────────────────────
const transcribe = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required.' });
    }
    const client = getGroq();
    const extension = (req.file.originalname || 'audio.webm').split('.').pop() || 'webm';
    const audioFile = new File([req.file.buffer], `voice-${Date.now()}.${extension}`, { type: req.file.mimetype });
    const transcription = await client.audio.transcriptions.create({
      model: 'whisper-large-v3-turbo',
      file: audioFile,
    });
    return res.json({ text: transcription?.text || '' });
  } catch (error) {
    console.error('[ChautariAI] transcribe error:', error?.message || error);
    if (error?.status === 503) return res.status(503).json({ error: 'AI is busy right now. Please try again.' });
    if (error?.status === 401) return res.status(401).json({ error: 'Invalid GROQ_API_KEY.' });
    return res.status(500).json({ error: 'Voice transcription failed. Please try again.' });
  }
};

module.exports = { chat, confirmAction, cancelAction, chooseAction, transcribe };