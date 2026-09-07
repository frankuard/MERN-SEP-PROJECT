const mongoose = require('mongoose');
const LostFoundItem = require('../models/LostFoundItem');
const VolunteerOpportunity = require('../models/VolunteerOpportunity');
const VolunteerApplication = require('../models/VolunteerApplication');
const { groqJson } = require('./aiGroq');
const { getSession, setSession, clearSession } = require('./aiActionSession');
const { createNotification, createNotificationForRole } = require('../utils/createNotification');




const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');

const lostFoundController = require('../controllers/lostFoundController');
const helpController = require('../controllers/helpController');
const attendanceController = require('../controllers/attendanceController');
const eventController = require('../controllers/eventController');
const resourceController = require('../controllers/resourceController');

const Book = require('../models/Book');
const BorrowRequest = require('../models/BorrowRequest');
const SportsItem = require('../models/SportsItem');

const runController = (handler, user, body, params = {}) =>
  new Promise((resolve, reject) => {
    const req = { user, body, params, query: {}, cookies: {} };
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (payload) => { res.body = payload; res.responded = true; };
    res.set = () => res;
    Promise.resolve(handler(req, res))
      .then(() => {
        if (res.responded) resolve({ statusCode: res.statusCode || 200, body: res.body });
        else resolve({ statusCode: 200, body: null });
      })
      .catch(reject);
  });


const ACTIONS = {
  lost_found_report: {
    label: 'Lost & Found Report',
    cardTitle: 'Lost & Found Report',
    fields: ['type', 'item', 'description', 'location', 'category', 'contactInfo'],
    required: ['type', 'item', 'description', 'location', 'category'],
    questions: {
      type: "Did you lose this item or did you find it?",
      item: (d) => (d.type === 'found' ? 'What item did you find?' : 'What item did you lose?'),
      description: "Could you describe it a bit — color, brand, or any identifying details?",
      location: (d) => (d.type === 'found' ? 'Where did you find it?' : 'Where did you last see it?'),
      category: "What category does this fall under — Bags, Electronics, Keys, Books, or General?",
    },
    optionalQuestion: "Would you like to add contact info for this report? (You can say skip.)",
    optionalSatisfied: (d) => Boolean(d.contactInfo),
  },
  cctv_request: {
    label: 'CCTV Footage Request',
    cardTitle: 'CCTV Request',
    fields: ['location', 'date', 'timeFrom', 'timeTo', 'reason', 'additionalDetails'],
    required: ['location', 'date', 'timeFrom', 'timeTo', 'reason'],
    questions: {
      location: 'What location or camera zone should the CCTV request cover?',
      date: 'What date should the CCTV request cover?',
      timeFrom: 'What time range should the footage cover? (e.g. 2:00 PM to 3:00 PM)',
      timeTo: 'What time range should the footage cover? (e.g. 2:00 PM to 3:00 PM)',
      reason: 'What is the reason for the request?',
    },
    optionalQuestion: null,
    optionalSatisfied: () => true,
  },
  attendance_report: {
    label: 'Attendance Report Request',
    cardTitle: 'Attendance Report Request',
    fields: ['reason'],
    required: ['reason'],
    questions: {
      reason: 'What do you need the attendance report for? (e.g. scholarship renewal, visa verification)',
    },
    optionalQuestion: null,
    optionalSatisfied: () => true,
  },
  campus_help: {
    label: 'Campus Help Request',
    cardTitle: 'Campus Help Request',
    fields: ['problem', 'location', 'category', 'priority', 'details'],
    required: ['problem', 'location'],
    questions: {
      problem: 'What do you need help with?',
      location: 'Which classroom, lab, or location is this about?',
    },
    optionalQuestion: 'Is this a technical issue (equipment, Wi-Fi, projector) or something else? (You can say skip.)',
    optionalSatisfied: (d) => Boolean(d.category),
  },

  peer_help: {
    label: 'Peer Help Request',
    cardTitle: 'Peer Help Request',
    fields: ['request', 'details'],
    required: ['request'],
    questions: {
      request: 'What do you need help with? Describe it in a sentence or two.',
    },
    optionalQuestion: 'Want to add any extra detail so other students can help better? (You can say skip.)',
    optionalSatisfied: (d) => Boolean(d.details),
  },

  volunteer_application: {
    label: 'Volunteer Application',
    cardTitle: 'Volunteer Application',
    fields: [],
    required: [],
    questions: {},
    optionalQuestion: null,
    optionalSatisfied: () => true,
  },

  event_registration: {
    label: 'Event Registration',
    cardTitle: 'Event Registration',
    fields: [],
    required: [],
    questions: {},
    optionalQuestion: null,
    optionalSatisfied: () => true,
  },

  book_borrow: {
    label: 'Book Borrow Request',
    cardTitle: 'Book Borrow Request',
    fields: [],
    required: [],
    questions: {},
    optionalQuestion: null,
    optionalSatisfied: () => true,
  },

  sports_request: {
    label: 'Sports Item Request',
    cardTitle: 'Sports Item Request',
    fields: [],
    required: [],
    questions: {},
    optionalQuestion: null,
    optionalSatisfied: () => true,
  },
};

const ALLOWED_UPDATES = {
  lost_found_report: ['type', 'item', 'description', 'location', 'category', 'contactInfo'],
  cctv_request: ['location', 'date', 'timeFrom', 'timeTo', 'reason', 'additionalDetails'],
  attendance_report: ['reason'],
  campus_help: ['problem', 'location', 'category', 'priority', 'details'],
  peer_help: ['request', 'details'],
};


const todayNP = () => {
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kathmandu' }); // YYYY-MM-DD
};

const clean = (value, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const mapCategory = (item) => {
  const s = ` ${String(item || '').toLowerCase()} `;
  if (/bag|backpack|purse|rucksack|pouch|laptop bag/.test(s)) return 'Bags';
  if (/phone|laptop|headphone|earbud|airpod|charger|cable|power\s?bank|tablet|speaker|calculator|watch|usb|pen\s?drive|kindle|ipad/.test(s)) return 'Electronics';
  if (/key|keychain/.test(s)) return 'Keys';
  if (/book|notebook|textbook|folder|sketch|diary/.test(s)) return 'Books';
  return 'General';
};

const composeReport = (draft) => {
  const item = clean(draft.item) || 'item';
  const description = draft.description || '';
  const category = draft.category || mapCategory(item);
  return { title: item, description, category };
};

const claimKeywords = (message) => {
  let text = String(message || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(
      /\b(i|i'd|i would|want to|wanna|would like to|like to|can you|please|claim|claimed|reclaim|it's|that is|that's|is|mine|the|my|this|so|very|found|lost|item|back)\b/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
  return text.split(' ').filter((w) => w.length > 1 && !['and', 'with', 'from', 'near', 'about', 'one'].includes(w));
};

const CONFIRM_RE = /^(yes|yeah|yep|confirm|ok|okay|sure|submit|submit it|go\s*ahead|correct|that's right|agree)$/i;
const CANCEL_RE = /\b(cancel|cancel the request|abort|stop|never\s*mind|forget\s*it|scratch that|nevermind|drop it)\b/i;
const RESTART_RE = /^(start\s*over|start\s*again|restart|clear it|begin\s*again|let's\s*start\s*over|reset)$/i;
const SKIP_RE = /^(skip|skip it|don'?t\s*know|dont\s*know|not\s*sure|no\s*idea|i\s?don'?t\s*know|unknown|n\/a|\bna\b|none|whatever|anything)[.!]*$/i;

const baseDateHint = `TODAY (Nepal time, YYYY-MM-DD): ${todayNP()}`;

const mergePrompt = ({ action, message, draft }) => {
  const def = ACTIONS[action];
  const pendingField = def.required.find((f) => !clean(draft[f]));
  return `You are the action-understanding engine of Chauttari, a campus assistant for a college in Nepal.
${baseDateHint}

The student is completing a ${def.label}. Latest message:
"${message}"

Available fields: ${def.fields.join(', ')}.
${pendingField ? `The field currently being asked for is "${pendingField}". If the message is a short or bare reply that doesn't clearly belong to a different field, treat it as the value for "${pendingField}".` : ''}

Rules for parsing (STRICT):
- "updates" must contain ONLY fields the message actually provides or corrects. Never invent values.
- If the message changes or overrides a previously collected field, include the corrected value.
- Normalize date fields to YYYY-MM-DD using TODAY (resolve today, yesterday, last Monday, "on the 3rd").
- Normalize time fields to 12-hour form like "2:00 PM".
- If a "type" field exists, normalize it to exactly "lost" or "found" (e.g. "find it", "i found it" → "found"; "lost it", "i lost it" → "lost"). Never output anything else for "type".
- Keep other values in the student's own words with natural casing.
- "control" is "cancel" if the student is cancelling/stopping, "restart" if starting over, otherwise "none".

Return ONLY a JSON object:
{"control":"none|cancel|restart","updates":{ }}`;
};

const intentPrompt = (message) => `You are Chauttari, a campus assistant for a college in Nepal. ${baseDateHint}
Classify the student's latest message into exactly ONE action intent.
Return ONLY a JSON object: {"action":"..."}
Allowed actions:
- "lost_found_report": student is REPORTING they lost or found an item. e.g. "I lost my wallet", "I found a black bag", "I lost my AirPods in LT01 yesterday".
- "lost_found_claim": student wants to CLAIM an item already in lost & found. e.g. "I want to claim the black wallet", "that backpack is mine", "I found my lost phone in lost and found".
- "attendance_report": student is REQUESTING an attendance report document. e.g. "I need my attendance report", "request my attendance report", "send me my attendance report".
- "cctv_request": student is REQUESTING CCTV/camera footage. e.g. "I need cctv footage from LT01", "can you request cctv footage near the canteen".
- "campus_help": student reports a campus FACILITY/EQUIPMENT problem needing admin action. e.g. "the projector in LT01 isn't working", "there is no wifi in lab 2", "the AC is broken in SR01". Only classify as this if a facility/equipment word is present (wifi, projector, AC, broken, etc.) or it is clearly about a physical room/equipment.
- "peer_help": student wants to post a request on the Campus Peer Help board — asking OTHER STUDENTS for help with a topic, subject, or task, OR simply says they want to ask for peer/campus help without giving a topic yet. e.g. "I need help with calculus", "can someone help me understand thermodynamics", "does anyone have notes for DBMS", "I'm stuck on this assignment, can someone help me", "I need peer help", "I want to ask for campus help", "I want to post a help request", "can someone help me". If the message mentions "peer help" or "campus help" by name, or is a vague help request with no facility/equipment keyword, classify it as peer_help — the next turn will ask what they need help with.
- "volunteer_application": student wants to apply as a VOLUNTEER (helping run/staff an event). e.g. "I want to volunteer", "apply me for volunteering", "register me as a volunteer".
- "event_registration": student wants to REGISTER/SIGN UP to ATTEND an event (not volunteer for it). e.g. "register me for the tech fest", "sign me up for the next event", "I want to attend the cultural night", "book me a spot for the hackathon", "register me for the upcoming event".
- "book_borrow": student wants to BORROW a book from the library. e.g. "borrow Mindset by Carol Dweck", "I want to borrow that book", "can I check out this book", "borrow it for me" (when a specific book was already mentioned in the conversation).
- "sports_request": student wants to REQUEST/CHECK OUT a sports item or equipment. e.g. "I want to request a football", "can I get a badminton racket", "request a volleyball for tomorrow", "borrow a cricket bat".
- "none": everything else (questions about attendance percentages, canteen menu, timetable, events, greetings, chit-chat).

Message: "${message}"
Return {"action":"none|lost_found_report|lost_found_claim|attendance_report|cctv_request|campus_help|peer_help|volunteer_application|event_registration|book_borrow|sports_request"}`;

// ACTION_HINTS: fast regex pre-filter before calling the LLM for intent detection.
// Must include keywords that could signal any of the 6 supported actions.
const ACTION_HINTS =
  /\b(lost|lose|losing|found|claim|claiming|reclaim|cctv|camera|footage|attendance report|report request|projector|wifi|wi-fi|internet|not working|isn't working|isn\'t working|broken|problem with|issue with|help with|need help|need help with|can someone help|can you help|anyone help|does anyone know|i'm stuck|im stuck|help me understand|help me with|can you request|need.*report|wallet|airpod|earbud|passport|id card|charger|backpack|volunteer|volunteering|apply.*volunteer|register.*volunteer|volunteer.*event|i want to volunteer|peer help|campus help|need.*help|want.*help|wanna.*help|ask.*help|get help|get some help|raise a help|post a help|help request|need assistance|want assistance|register.*event|register me|sign me up|sign up for|book.*spot|attend.*event|going to the event|count me in|reserve.*spot|join the event|register for|borrow|borrowing|lend me|check out.*book|library book|sports item|sports equipment|football|basketball|volleyball|badminton|cricket bat|racket|racquet|request.*ball|need.*ball)\b/i;

const detectIntent = async (message) => {
  const parsed = await groqJson([{ role: 'user', content: intentPrompt(message) }], { maxTokens: 100 });
  const action = parsed?.action;
  // volunteer_application is valid even though its ACTIONS entry has no fields
  if (action === 'volunteer_application') return 'volunteer_application';
  return ACTIONS[action] ? action : null;
};

// Deterministic safety net — used only when the LLM classifier fails
// to return usable JSON (rare, but silent when it happens). Deliberately
// narrow: only covers actions with unambiguous keyword signals, so it
// never mis-fires on the more nuanced actions (lost & found, CCTV, etc.)
const VOLUNTEER_FALLBACK_RE = /\bvolunteer(ing)?\b/i;
const EVENT_REG_FALLBACK_RE = /\b(register|sign\s*up|signup|book|reserve)\b.*\b(event|fest|hackathon|workshop|seminar|program)\b|\b(register|sign\s*up|signup)\s*(me)?\s*for\b/i;
const BOOK_BORROW_FALLBACK_RE = /\bborrow\b|\blend\b.*\bbook\b/i;
const SPORTS_REQUEST_FALLBACK_RE = /\b(football|basketball|volleyball|badminton|cricket bat|racket|racquet)\b|\bsports (item|equipment)\b/i;

const guessIntentFallback = (message) => {
  const m = message.toLowerCase();
  if (VOLUNTEER_FALLBACK_RE.test(m)) return 'volunteer_application';
  if (EVENT_REG_FALLBACK_RE.test(m)) return 'event_registration';
  if (BOOK_BORROW_FALLBACK_RE.test(m)) return 'book_borrow';
  if (SPORTS_REQUEST_FALLBACK_RE.test(m)) return 'sports_request';
  return null;
};

const CATEGORY_OPTIONS = ['Bags', 'Electronics', 'Keys', 'Books', 'General'];
const normalizeCategory = (value) => {
  const v = String(value || '').trim().toLowerCase();
  return CATEGORY_OPTIONS.find((c) => c.toLowerCase() === v || v.includes(c.toLowerCase())) || null;
};

const normalizeType = (value) => {
  const v = String(value || '').trim().toLowerCase();
  if (/\b(found|finding|find)\b/.test(v)) return 'found';
  if (/\b(lost|losing|lose)\b/.test(v)) return 'lost';
  return null;
};

const sanitizeUpdates = (action, updates) => {
  const allowed = new Set(ALLOWED_UPDATES[action] || []);
  const out = {};
  for (const [key, value] of Object.entries(updates || {})) {
    if (!allowed.has(key)) continue;
    let v = clean(value, key === 'details' || key === 'reason' || key === 'description' ? 1000 : 200);
    if (!v) continue;
    if (key === 'type') {
      const normalized = normalizeType(v);
      if (!normalized) continue;
      v = normalized;
    }
    if (key === 'category') {
      const normalized = normalizeCategory(v);
      if (!normalized) continue;
      v = normalized;
    }
    out[key] = v;
  }
  return out;
};


//  Lost & Found claim — search + selection + details

const searchFoundItems = async (user, keywords) => {
  const terms = [...new Set((Array.isArray(keywords) ? keywords : [keywords]).filter(Boolean))];
  if (!terms.length) return [];
  const and = terms.map((t) => {
    const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return { $or: [{ title: re }, { location: re }, { description: re }, { category: re }, { authorName: re }] };
  });
  return LostFoundItem.find({
    $and: and,
    status: { $in: ['Unclaimed', 'open', 'Claim Pending'] },
    createdBy: { $ne: user._id },
  })
    .populate('createdBy', 'username')
    .limit(10)
    .lean();
};

const itemLabel = (item) =>
  `${item.title} — ${item.location}${item.authorName ? ` (reported by ${item.authorName})` : ''}`;

const claimSearchTurn = async (user, message, session) => {
  const keywords = claimKeywords(message);
  if (!keywords.length) {
    return {
      reply: "Just to make sure — tell me a bit about the item you'd like to claim (e.g. \"the black wallet\", \"the Nike backpack\").",
      card: null,
    };
  }
  const matches = await searchFoundItems(user, keywords);
  if (!matches.length) {
    return {
      reply: "I couldn't find a matching item in the Lost & Found list. Try more details (color, location, brand) or say \"cancel\" to stop. Would you like to report it as lost instead?",
      card: null,
    };
  }
  if (matches.length === 1) {
    session.itemId = matches[0]._id.toString();
    session.step = 'details';
    setSession(user._id, session);
    return {
      reply: `Found it: ${itemLabel(matches[0])}. To verify ownership, please provide an identifying detail (e.g. something only the owner would know).`,
      card: null,
    };
  }
  if (matches.length > 5) {
    return {
      reply: `I found ${matches.length} matches. Could you narrow it down a bit more — color, brand, or exact location?`,
      card: null,
    };
  }
  session.step = 'choose';
  session.matches = matches.map((i) => ({ id: i._id.toString(), label: itemLabel(i) }));
  setSession(user._id, session);
  return {
    reply: `I found ${matches.length} possible matches. Please pick the right one:`,
    card: {
      title: 'Select the Item You Want to Claim',
      action: 'lost_found_claim',
      choices: session.matches.map((m, idx) => ({ index: idx, label: m.label })),
    },
  };
};

const claimChooseTurn = async (user, message, session) => {
  const num = (message.match(/\b([1-9]|10)\b/) || [])[1];
  const index = num ? Number(num) - 1 : -1;
  if (!session.matches || session.matches[index] === undefined) {
    return {
      reply: 'Please reply with the number of the item you want to claim (1, 2, 3...).',
      card: {
        title: 'Select the Item You Want to Claim',
        action: 'lost_found_claim',
        choices: session.matches.map((m, idx) => ({ index: idx, label: m.label })),
      },
    };
  }
  session.itemId = session.matches[index].id;
  session.step = 'details';
  setSession(user._id, session);
  return {
    reply: 'To verify ownership, please provide an identifying detail — e.g. a colour, a mark, or something only the owner would know.',
    card: null,
  };
};

const claimDetailsTurn = async (user, message, session) => {
  const details = clean(message, 500);
  if (!details) {
    return { reply: 'Could you describe the identifying detail?', card: null };
  }
  const item = await LostFoundItem.findById(session.itemId).lean();
  if (!item) {
    clearSession(user._id);
    return { reply: 'That item no longer exists in the Lost & Found list. Sorry about that.', card: null };
  }
  session.draft = { itemId: session.itemId, details };
  session.step = 'confirm';
  setSession(user._id, session);
  return {
    reply: 'Here is the claim summary before I submit it:',
    card: {
      title: 'Lost Item Claim',
      action: 'lost_found_claim',
      confirm: true,
      rows: [
        { label: 'Item', value: item.title },
        { label: 'Location', value: item.location },
        { label: 'Reported by', value: item.authorName || 'Student' },
        { label: 'Your identifying detail', value: details },
      ],
    },
  };
};

// ─────────────────────────────────────────────────────────────
//  Volunteer application — search open opportunities, select,
//  confirm, then call applyToOpportunity for each one.
// ─────────────────────────────────────────────────────────────

// How many events the student wants — extracted from the message.
// "next event" → 1, "next two events" → 2, "next 3 events" → 3, etc.
const parseVolunteerCount = (message) => {
  const m = message.toLowerCase();
  if (/\b(two|2)\b/.test(m)) return 2;
  if (/\b(three|3)\b/.test(m)) return 3;
  if (/\b(four|4)\b/.test(m)) return 4;
  if (/\b(five|5)\b/.test(m)) return 5;
  const numMatch = m.match(/\b([1-9])\b/);
  if (numMatch) return Number(numMatch[1]);
  return 1; // default: next single event
};

const opportunityLabel = (op) =>
  `${op.eventTitle}${op.role ? ` — ${op.role}` : ''}${op.date ? ` (${op.date})` : ''}`;

// ─────────────────────────────────────────────────────────────
//  Event registration — search + selection + confirm, then call
//  the real registerForEvent controller for durable registration.
// ─────────────────────────────────────────────────────────────
const eventKeywords = (message) => {
  let text = String(message || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(
      /\b(register|registration|sign|signup|up|for|me|to|the|a|an|next|upcoming|event|events|please|can|you|i|want|would|like|apply|book|reserve|attend|attending|going|go|spot|count|in|join)\b/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
  return text.split(' ').filter((w) => w.length > 1);
};

const eventLabel = (ev) =>
  `${ev.title}${ev.date ? ' (' + new Date(ev.date).toLocaleDateString() : ''}${ev.date ? ')' : ''}${ev.venue ? ' @ ' + ev.venue : ''}`;

const eventConfirmCard = (ev) => ({
  title: 'Event Registration',
  action: 'event_registration',
  confirm: true,
  rows: [
    { label: 'Event', value: ev.title },
    { label: 'Date', value: ev.date ? new Date(ev.date).toLocaleDateString() : 'TBD' },
    { label: 'Venue', value: ev.venue || '—' },
  ],
});

const eventSearchTurn = async (user, message, session) => {
  const keywords = eventKeywords(message);
  const filter = { isPublished: true, date: { $gte: new Date() } };

  let events;
  if (keywords.length) {
    const and = keywords.map((k) => {
      const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      return { $or: [{ title: re }, { venue: re }, { category: re }] };
    });
    events = await Event.find({ ...filter, $and: and }).sort({ date: 1 }).limit(10).lean();
  } else {
    events = await Event.find(filter).sort({ date: 1 }).limit(10).lean();
  }

  // Exclude events the student is already registered for
  const myRegs = await EventRegistration.find({ user: user._id, status: 'registered' }).select('event').lean();
  const registeredIds = new Set(myRegs.map((r) => r.event.toString()));
  events = events.filter((e) => !registeredIds.has(e._id.toString()));

  if (!events.length) {
    clearSession(user._id);
    return {
      reply: keywords.length
        ? "I couldn't find an upcoming event matching that. Check the Events section for the full list."
        : "There are no upcoming events open for registration right now, or you're already registered for all of them.",
      card: null,
    };
  }

  // No specific name given, or only one match — auto-pick the nearest one
  if (events.length === 1 || !keywords.length) {
    const ev = events[0];
    session.eventId = ev._id.toString();
    session.step = 'confirm';
    setSession(user._id, session);
    return { reply: 'Here is the event I found:', card: eventConfirmCard(ev) };
  }

  if (events.length > 6) {
    return { reply: `I found ${events.length} matching events. Could you narrow it down with the event name?`, card: null };
  }

  session.step = 'choose';
  session.matches = events.map((e) => ({ id: e._id.toString(), label: eventLabel(e) }));
  setSession(user._id, session);
  return {
    reply: `I found ${events.length} matching events. Please pick one:`,
    card: {
      title: 'Select the Event to Register For',
      action: 'event_registration',
      choices: session.matches.map((m, idx) => ({ index: idx, label: m.label })),
    },
  };
};

const eventChooseTurn = async (user, message, session) => {
  const num = (message.match(/\b([1-9]|10)\b/) || [])[1];
  const index = num ? Number(num) - 1 : -1;
  if (!session.matches || session.matches[index] === undefined) {
    return {
      reply: 'Please reply with the number of the event you want to register for (1, 2, 3...).',
      card: {
        title: 'Select the Event to Register For',
        action: 'event_registration',
        choices: session.matches.map((m, idx) => ({ index: idx, label: m.label })),
      },
    };
  }
  session.eventId = session.matches[index].id;
  session.step = 'confirm';
  setSession(user._id, session);
  const ev = await Event.findById(session.eventId).lean();
  if (!ev) {
    clearSession(user._id);
    return { reply: 'That event no longer exists. Please try again.', card: null };
  }
  return { reply: 'Here is the event you selected:', card: eventConfirmCard(ev) };
};

// ─────────────────────────────────────────────────────────────
//  Book borrow — search + selection + return-date/ID collection
//  + confirm, then call the real requestBorrow controller.
// ─────────────────────────────────────────────────────────────
const bookKeywords = (message) => {
  let text = String(message || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(
      /\b(i|want|to|borrow|it|for|me|please|can|you|would|like|the|a|an|get|book|library|request|reserve|this|that|from)\b/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
  return text.split(' ').filter((w) => w.length > 1);
};

const bookLabel = (b) => `${b.name} by ${b.author} (Shelf ${b.shelf})`;

const resolveBookFromHistory = async (history) => {
  if (!Array.isArray(history) || !history.length) return null;
  const recentText = history
    .slice(-6)
    .map((h) => h.content || h.message || h.text || '')
    .join(' ')
    .toLowerCase();
  if (!recentText.trim()) return null;

  const books = await Book.find({}).select('name author shelf').lean();
  return books.find((b) => recentText.includes(b.name.toLowerCase())) || null;
};

const addDaysToDateStr = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const NUM_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

const parseReturnDate = (message) => {
  const m = message.trim().toLowerCase();
  const today = todayNP();

  // Explicit ISO date, e.g. 2026-09-20
  const iso = m.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  if (/\btomorrow\b/.test(m)) return addDaysToDateStr(today, 1);
  if (/\bnext week\b/.test(m)) return addDaysToDateStr(today, 7);
  if (/\bnext month\b/.test(m)) return addDaysToDateStr(today, 30);
  if (/\ba\s+week\b/.test(m)) return addDaysToDateStr(today, 7);
  if (/\ba\s+month\b/.test(m)) return addDaysToDateStr(today, 30);

  // "N day(s)/week(s)/month(s)" — with digits or number words, e.g.
  // "1 week from now", "in 5 days", "two weeks later"
  const relMatch = m.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(day|days|week|weeks|month|months)\b/);
  if (relMatch) {
    const n = NUM_WORDS[relMatch[1]] !== undefined ? NUM_WORDS[relMatch[1]] : parseInt(relMatch[1], 10);
    const unit = relMatch[2];
    let days = n;
    if (unit.startsWith('week')) days = n * 7;
    if (unit.startsWith('month')) days = n * 30;
    return addDaysToDateStr(today, days);
  }

  // Fallback: native parsing for things like "September 20" or "20 Sept 2026"
  const parsed = new Date(message);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

  return null;
};

const selectBook = async (user, session, book) => {
  const active = await BorrowRequest.findOne({ book: book._id, status: { $in: ['pending', 'approved'] } });
  if (active) {
    clearSession(user._id);
    const who = active.requestedBy.toString() === user._id.toString() ? 'You already have' : 'Someone already has';
    return {
      reply: `${who} an active request for "${book.name}" — it's currently ${active.status === 'approved' ? 'borrowed' : 'pending approval'}, so it can't be requested again right now.`,
      card: null,
    };
  }
  session.bookId = book._id.toString();
  session.bookTitle = book.name;
  session.bookAuthor = book.author;
  session.bookShelf = book.shelf;
  session.step = 'ask_return';
  setSession(user._id, session);
  return {
    reply: `Great — "${book.name}" by ${book.author} (Shelf ${book.shelf}). When would you like to return it? (give a date after today, e.g. 2026-09-20)`,
    card: null,
  };
};

const bookSearchTurn = async (user, message, session, history) => {
  const keywords = bookKeywords(message);
  let books = [];

  if (keywords.length) {
    const and = keywords.map((k) => {
      const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      return { $or: [{ name: re }, { author: re }, { category: re }] };
    });
    books = await Book.find({ $and: and }).limit(10).lean();
  }

  if (!books.length) {
    const fromHistory = await resolveBookFromHistory(history);
    if (fromHistory) books = [fromHistory];
  }

  if (!books.length) {
    return { reply: 'Which book would you like to borrow? Tell me the title or author.', card: null };
  }

  if (books.length > 6) {
    return { reply: `I found ${books.length} matching books. Could you narrow it down with the exact title?`, card: null };
  }

  if (books.length > 1) {
    session.step = 'choose';
    session.matches = books.map((b) => ({ id: b._id.toString(), label: bookLabel(b) }));
    setSession(user._id, session);
    return {
      reply: `I found ${books.length} matching books. Please pick one:`,
      card: {
        title: 'Select the Book to Borrow',
        action: 'book_borrow',
        choices: session.matches.map((m, idx) => ({ index: idx, label: m.label })),
      },
    };
  }

  return selectBook(user, session, books[0]);
};

const bookChooseTurn = async (user, message, session) => {
  const num = (message.match(/\b([1-9]|10)\b/) || [])[1];
  const index = num ? Number(num) - 1 : -1;
  if (!session.matches || session.matches[index] === undefined) {
    return {
      reply: 'Please reply with the number of the book you want to borrow (1, 2, 3...).',
      card: {
        title: 'Select the Book to Borrow',
        action: 'book_borrow',
        choices: session.matches.map((m, idx) => ({ index: idx, label: m.label })),
      },
    };
  }
  const book = await Book.findById(session.matches[index].id).lean();
  if (!book) {
    clearSession(user._id);
    return { reply: 'That book no longer exists. Please try again.', card: null };
  }
  return selectBook(user, session, book);
};

const bookAskReturnTurn = async (user, message, session) => {
  const returnBy = parseReturnDate(message.trim());
  const today = todayNP();
  if (!returnBy || returnBy <= today) {
    return { reply: 'Please give a valid return date after today, in YYYY-MM-DD format (e.g. 2026-09-20).', card: null };
  }
  session.draft = { ...session.draft, returnBy };
  session.step = 'ask_id';
  setSession(user._id, session);
  return { reply: "What's your student ID? (e.g. BIC-2026-0142)", card: null };
};

const bookAskIdTurn = async (user, message, session) => {
  const studentIdNumber = clean(message, 50);
  if (!studentIdNumber) {
    return { reply: 'Please enter your student ID.', card: null };
  }
  session.draft = { ...session.draft, studentIdNumber };
  session.step = 'confirm';
  setSession(user._id, session);
  return {
    reply: 'Here is the summary — submit this borrow request?',
    card: {
      title: 'Book Borrow Request',
      action: 'book_borrow',
      confirm: true,
      rows: [
        { label: 'Book', value: session.bookTitle },
        { label: 'Author', value: session.bookAuthor },
        { label: 'Shelf', value: session.bookShelf },
        { label: 'Return By', value: session.draft.returnBy },
        { label: 'Student ID', value: studentIdNumber },
      ],
    },
  };
};

const volunteerSearchTurn = async (user, message, session) => {
  const count = parseVolunteerCount(message);
  session.volunteerCount = count;

  // Fetch open opportunities the student has not already applied to
  const allOpen = await VolunteerOpportunity.find({ isOpen: true }).sort({ createdAt: 1 }).lean();
  const myApps = await VolunteerApplication.find({ student: user._id, status: 'applied' }).select('opportunity').lean();
  const appliedIds = new Set(myApps.map((a) => a.opportunity.toString()));

  const available = allOpen.filter((op) => !appliedIds.has(op._id.toString()));

  if (!available.length) {
    clearSession(user._id);
    return {
      reply: "There are no open volunteer opportunities right now, or you have already applied to all of them. Check back later.",
      card: null,
    };
  }

  // If the student asks for more than what's available, cap it
  const slots = available.slice(0, Math.min(count, available.length));

  if (count > 1 && slots.length < count) {
    session.volunteerCount = slots.length;
  }

  if (slots.length === 1 && count === 1) {
    // Auto-select the single next opportunity — skip the pick screen
    session.selectedOpportunities = slots.map((op) => ({ id: op._id.toString(), label: opportunityLabel(op) }));
    session.step = 'confirm';
    setSession(user._id, session);
    return {
      reply: 'Here is the volunteer opportunity I found:',
      card: {
        title: 'Volunteer Application',
        action: 'volunteer_application',
        confirm: true,
        rows: slots.map((op) => ({
          label: op.eventTitle,
          value: `${op.role || 'Volunteer'}${op.date ? ' · ' + op.date : ''}${op.slotsAvailable !== null ? ` · ${op.slotsAvailable} slots` : ''}`,
        })),
      },
    };
  }

  // Multiple or ambiguous — show all available so user can confirm
  session.selectedOpportunities = slots.map((op) => ({ id: op._id.toString(), label: opportunityLabel(op) }));
  session.step = 'confirm';
  setSession(user._id, session);
  return {
    reply: `Here ${slots.length === 1 ? 'is the opportunity' : `are the next ${slots.length} opportunities`} I will apply you for — confirm to submit:`,
    card: {
      title: 'Volunteer Application',
      action: 'volunteer_application',
      confirm: true,
      rows: slots.map((op, i) => ({
        label: `#${i + 1} ${op.eventTitle}`,
        value: `${op.role || 'Volunteer'}${op.date ? ' · ' + op.date : ''}`,
      })),
    },
  };
};

// ─────────────────────────────────────────────────────────────
//  Sports item request — search + selection + quantity/slot
//  collection + confirm, then call the real requestSportsItem
//  controller.
// ─────────────────────────────────────────────────────────────
const sportsKeywords = (message) => {
  let text = String(message || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(
      /\b(i|want|to|request|borrow|get|need|it|for|me|please|can|you|would|like|the|a|an|item|equipment|sports|reserve|this|that|from)\b/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
  return text.split(' ').filter((w) => w.length > 1);
};

const sportsItemLabel = (item) => `${item.icon || '🏐'} ${item.name}`;

const resolveSportsItemFromHistory = async (history) => {
  if (!Array.isArray(history) || !history.length) return null;
  const recentText = history
    .slice(-6)
    .map((h) => h.content || h.message || h.text || '')
    .join(' ')
    .toLowerCase();
  if (!recentText.trim()) return null;

  const items = await SportsItem.find({}).select('name icon').lean();
  return items.find((i) => recentText.includes(i.name.toLowerCase())) || null;
};

const parseQuantity = (message) => {
  const m = message.toLowerCase();
  const numMatch = m.match(/\b(\d+)\b/);
  if (numMatch) return Number(numMatch[1]);
  if (NUM_WORDS[m.trim()] !== undefined) return NUM_WORDS[m.trim()];
  for (const [word, val] of Object.entries(NUM_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(m)) return val;
  }
  if (/\bjust one\b|\ba single\b|\bone\b/.test(m)) return 1;
  return null;
};

const selectSportsItem = async (user, session, item) => {
  session.itemId = item._id.toString();
  session.itemName = item.name;
  session.itemIcon = item.icon || '🏐';
  session.step = 'ask_quantity';
  setSession(user._id, session);
  return {
    reply: `Great — ${sportsItemLabel(item)}. How many would you like?`,
    card: null,
  };
};

const ASK_OPTIONS_RE = /\b(what|which)\b.*\b(options|items|available|have|got)\b|\bshow\b.*\b(options|items|list)\b|\boptions\b|\bavailable\b|\bwhat.*have\b|\bwhat.*got\b/i;

const sportsSearchTurn = async (user, message, session, history) => {
  const keywords = sportsKeywords(message);
  let items = [];

  if (keywords.length) {
    const and = keywords.map((k) => {
      const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      return { name: re };
    });
    items = await SportsItem.find({ $and: and }).limit(10).lean();
  }

  if (!items.length) {
    const fromHistory = await resolveSportsItemFromHistory(history);
    if (fromHistory) items = [fromHistory];
  }

  // No keyword match, or the student is explicitly asking what's available —
  // show the full catalog instead of repeating the same question.
  if (!items.length && (!keywords.length || ASK_OPTIONS_RE.test(message))) {
    const all = await SportsItem.find({}).sort({ name: 1 }).limit(20).lean();
    if (!all.length) {
      clearSession(user._id);
      return { reply: 'There are no sports items available to request right now.', card: null };
    }
    session.step = 'choose';
    session.matches = all.map((i) => ({ id: i._id.toString(), label: sportsItemLabel(i) }));
    setSession(user._id, session);
    return {
      reply: `Here's what's available:`,
      card: {
        title: 'Select the Sports Item',
        action: 'sports_request',
        choices: session.matches.map((m, idx) => ({ index: idx, label: m.label })),
      },
    };
  }

  if (!items.length) {
    return { reply: 'Which sports item would you like to request?', card: null };
  }

  if (items.length > 6) {
    return { reply: `I found ${items.length} matching items. Could you narrow it down with the exact name?`, card: null };
  }

  if (items.length > 1) {
    session.step = 'choose';
    session.matches = items.map((i) => ({ id: i._id.toString(), label: sportsItemLabel(i) }));
    setSession(user._id, session);
    return {
      reply: `I found ${items.length} matching items. Please pick one:`,
      card: {
        title: 'Select the Sports Item',
        action: 'sports_request',
        choices: session.matches.map((m, idx) => ({ index: idx, label: m.label })),
      },
    };
  }

  return selectSportsItem(user, session, items[0]);
};

const normalizeLabel = (s) =>
  String(s || '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const findChoiceIndexByText = (matches, message) => {
  const num = (message.match(/\b([1-9]|10)\b/) || [])[1];
  if (num) {
    const idx = Number(num) - 1;
    if (matches[idx]) return idx;
  }
  const typed = normalizeLabel(message);
  if (!typed) return -1;
  return matches.findIndex((m) => {
    const label = normalizeLabel(m.label);
    return label.includes(typed) || typed.includes(label);
  });
};

const sportsChooseTurn = async (user, message, session) => {
  const index = findChoiceIndexByText(session.matches || [], message);
  if (!session.matches || session.matches[index] === undefined) {
    return {
      reply: 'Please reply with the number or name of the item you want to request.',
      card: {
        title: 'Select the Sports Item',
        action: 'sports_request',
        choices: session.matches.map((m, idx) => ({ index: idx, label: m.label })),
      },
    };
  }
  const item = await SportsItem.findById(session.matches[index].id).lean();
  if (!item) {
    clearSession(user._id);
    return { reply: 'That item no longer exists. Please try again.', card: null };
  }
  return selectSportsItem(user, session, item);
};

const sportsAskQuantityTurn = async (user, message, session) => {
  const quantity = parseQuantity(message.trim());
  if (!quantity || quantity < 1) {
    return { reply: 'Please tell me how many you need — a number like 1, 2, or 3.', card: null };
  }
  session.draft = { ...session.draft, quantity };
  session.step = 'ask_slot';
  setSession(user._id, session);
  return { reply: 'What time slot do you need it for? (e.g. "Today 3-4 PM", "Tomorrow morning")', card: null };
};

const sportsAskSlotTurn = async (user, message, session) => {
  const slot = clean(message, 100);
  if (!slot) {
    return { reply: 'Please tell me the time slot you need it for.', card: null };
  }
  session.draft = { ...session.draft, slot };
  session.step = 'ask_note';
  setSession(user._id, session);
  return { reply: 'Any additional note? (You can say skip.)', card: null };
};

const sportsAskNoteTurn = async (user, message, session) => {
  const note = SKIP_RE.test(message.trim()) ? '' : clean(message, 300);
  session.draft = { ...session.draft, note };
  session.step = 'confirm';
  setSession(user._id, session);
  return {
    reply: 'Here is the summary — submit this request?',
    card: {
      title: 'Sports Item Request',
      action: 'sports_request',
      confirm: true,
      rows: [
        { label: 'Item', value: session.itemName },
        { label: 'Quantity', value: String(session.draft.quantity) },
        { label: 'Slot', value: session.draft.slot },
        { label: 'Note', value: session.draft.note || '—' },
      ],
    },
  };
};

// ─────────────────────────────────────────────────────────────
//  Collect-type actions (report / cctv / attendance / help)
// ─────────────────────────────────────────────────────────────
const questionFor = (action, field, draft) => {
  const def = ACTIONS[action];
  const q = def.questions[field];
  return typeof q === 'function' ? q(draft) : q;
};

const buildConfirmCard = (action, draft, user) => {
  switch (action) {
    case 'lost_found_report': {
      const { title, description, category } = composeReport(draft);
      return {
        title: ACTIONS.lost_found_report.cardTitle,
        action,
        rows: [
          { label: 'Type', value: draft.type === 'found' ? 'Found Item' : 'Lost Item' },
          { label: 'Item', value: title },
          { label: 'Description', value: description || '—' },
          { label: 'Location', value: draft.location },
          { label: 'Category', value: category },
          { label: 'Contact Info', value: draft.contactInfo || user.email || '—' },
          { label: 'Photo', value: draft.image ? 'Attached ✓' : '—' },
        ],
      };
    }
    case 'cctv_request':
      return {
        title: ACTIONS.cctv_request.cardTitle,
        action,
        rows: [
          { label: 'Location', value: draft.location },
          { label: 'Date', value: draft.date },
          { label: 'Time', value: `${draft.timeFrom} – ${draft.timeTo}` },
          { label: 'Reason', value: draft.reason },
        ],
      };
    case 'attendance_report':
      return {
        title: ACTIONS.attendance_report.cardTitle,
        action,
        rows: [
          { label: 'Student', value: user.username || 'Student' },
          { label: 'Email', value: user.email || '—' },
          { label: 'Semester', value: user.semester ? `Semester ${user.semester}` : '—' },
          { label: 'Reason', value: draft.reason },
        ],
      };
    case 'campus_help':
      return {
        title: ACTIONS.campus_help.cardTitle,
        action,
        rows: [
          { label: 'Problem', value: draft.problem },
          { label: 'Location', value: draft.location },
          { label: 'Category', value: draft.category || 'General' },
          { label: 'Priority', value: draft.priority || 'Normal' },
        ],
      };
    case 'peer_help':
      return {
        title: ACTIONS.peer_help.cardTitle,
        action,
        rows: [
          { label: 'Request', value: draft.request },
          { label: 'Extra Details', value: draft.details || '—' },
        ],
      };
    default:
      return null;
  }
};

const handleCollectTurn = async (user, message, session) => {
  const action = session.action;

  let parsed;
  try {
    parsed = await groqJson([{ role: 'user', content: mergePrompt({ action, message, draft: session.draft }) }], { maxTokens: 250 });
  } catch (err) {
    if (err?.status === 503 || err?.status === 401) throw err;
    parsed = {};
  }
  if (!parsed || !parsed.control || !parsed.updates) {
    parsed = { control: parsed?.control || 'none', updates: parsed?.updates || {} };
  }

  const updates = sanitizeUpdates(action, parsed.updates);
  session.draft = { ...session.draft, ...updates };

  return evaluateCollectDraft(user, session, message);
};

// Deterministic gate: decide next prompt, optional detail question,
// or confirmation card. LLM never decides whether collection is complete.
const evaluateCollectDraft = async (user, session, lastMessage = '') => {
  const action = session.action;
  const def = ACTIONS[action];

  const missing = def.required.filter((f) => !clean(session.draft[f]));

  // Allow "skip" twice on a required field before auto-filling "Unknown"
  if (missing.length && SKIP_RE.test(lastMessage)) {
    session.skipHits = (session.skipHits || 0) + 1;
    if (session.skipHits >= 2) {
      session.draft[missing[0]] = 'Unknown';
      setSession(user._id, session);
      return { reply: `No problem — I'll note that as "Unknown" and continue.`, card: null };
    }
    setSession(user._id, session);
    return {
      reply: "I understand you're not sure, but I still need that detail to submit this. Give your best guess, or say \"cancel\" to stop.",
      card: null,
    };
  }

  if (missing.length) {
    setSession(user._id, session);
    return { reply: questionFor(action, missing[0], session.draft), card: null };
  }

  // Optional descriptive question — asked exactly once per session
  if (!session.optionalAsked && def.optionalQuestion && !def.optionalSatisfied(session.draft)) {
    session.optionalAsked = true;
    setSession(user._id, session);
    return { reply: def.optionalQuestion, card: null };
  }

  // Photo prompt — lost_found_report only, skippable, satisfied by an attached image
  if (action === 'lost_found_report' && !session.photoAsked && !session.draft.image) {
    session.photoAsked = true;
    setSession(user._id, session);
    return { reply: 'Would you like to attach a photo? Tap the 📎 icon to upload one, or say skip.', card: null };
  }

  const card = buildConfirmCard(action, session.draft, user);
  card.confirm = true;
  session.step = 'confirm';
  setSession(user._id, session);
  return { reply: 'Here is the summary — submit this request?', card };
};

// ─────────────────────────────────────────────────────────────
//  Orchestrator
// ─────────────────────────────────────────────────────────────
const handleTurn = async (user, message, history = [], attachment = null) => {
  const trimmed = clean(message, 2000);
  if (!trimmed) return null;

  let session = getSession(user._id);

  // In-confirmation phase: typed yes/no works like the card buttons
  if (session && session.step === 'confirm') {
    if (CONFIRM_RE.test(trimmed)) return confirmAction(user);
    if (CANCEL_RE.test(trimmed)) {
      clearSession(user._id);
      return { reply: 'Request cancelled. Type or ask me for anything else anytime.', card: null };
    }
  }

  if (CANCEL_RE.test(trimmed)) {
    clearSession(user._id);
    return { reply: 'Request cancelled. Type or ask me for anything else anytime.', card: null };
  }

  if (RESTART_RE.test(trimmed)) {
    if (session) {
      session.draft = {};
      session.step = (session.action === 'lost_found_claim' || session.action === 'volunteer_application' || session.action === 'event_registration' || session.action === 'book_borrow' || session.action === 'sports_request')
        ? 'search'
        : 'collect';
      session.optionalAsked = false;
      session.photoAsked = false;
      session.matches = null;
      session.itemId = null;
      session.eventId = null;
      session.bookId = null;
      session.selectedOpportunities = null;
      setSession(user._id, session);
      if (session.action === 'lost_found_claim') {
        return { reply: "Okay, let's start again. What item are you trying to claim?", card: null };
      }
      if (session.action === 'volunteer_application') {
        return { reply: "Okay, let's start again. How many events would you like to volunteer for?", card: null };
      }
      if (session.action === 'event_registration') {
        return { reply: "Okay, let's start again. Which event would you like to register for?", card: null };
      }
      if (session.action === 'book_borrow') {
        return { reply: "Okay, let's start again. Which book would you like to borrow?", card: null };
      }
      if (session.action === 'sports_request') {
        return { reply: "Okay, let's start again. Which sports item would you like to request?", card: null };
      }
      const first = ACTIONS[session.action].required[0];
      return { reply: questionFor(session.action, first, session.draft), card: null };
    }
    return { reply: 'There is no active request to restart. What would you like to do?', card: null };
  }

  if (!session) {
    if (!ACTION_HINTS.test(trimmed)) return null;
    let intent = null;
    try {
      intent = await detectIntent(trimmed);
    } catch (err) {
      if (err?.status === 503 || err?.status === 401) throw err;
      intent = null;
    }
    if (!intent) intent = guessIntentFallback(trimmed);
    if (!intent) return null;

    session = {
      action: intent,
      draft: {},
      step: (intent === 'lost_found_claim' || intent === 'volunteer_application' || intent === 'event_registration' || intent === 'book_borrow' || intent === 'sports_request') ? 'search' : 'collect',
      optionalAsked: false,
      photoAsked: false,
      matches: null,
      itemId: null,
      eventId: null,
      bookId: null,
      bookTitle: null,
      bookAuthor: null,
      bookShelf: null,
      itemName: null,
      itemIcon: null,
      selectedOpportunities: null,
      volunteerCount: 1,
      createdAt: Date.now(),
    };
    setSession(user._id, session);
  }

  if (attachment && attachment.url && session.action === 'lost_found_report') {
    session.draft = { ...session.draft, image: attachment.url };
    setSession(user._id, session);
  }

  // ── Lost & Found claim flow ──────────────────────────
  if (session.action === 'lost_found_claim') {
    if (session.step === 'search') return claimSearchTurn(user, trimmed, session);
    if (session.step === 'choose') return claimChooseTurn(user, trimmed, session);
    if (session.step === 'details') return claimDetailsTurn(user, trimmed, session);
    if (session.step === 'confirm') {
      if (CONFIRM_RE.test(trimmed)) return confirmAction(user);
      return { reply: 'Reply "yes" to submit, "cancel" to stop, or ask me anything else.', card: null };
    }
  }

  // ── Volunteer application flow ───────────────────────
  if (session.action === 'volunteer_application') {
    if (session.step === 'search') return volunteerSearchTurn(user, trimmed, session);
    if (session.step === 'confirm') {
      if (CONFIRM_RE.test(trimmed)) return confirmAction(user);
      return { reply: 'Reply "yes" to submit the volunteer application, or "cancel" to stop.', card: null };
    }
  }

  // ── Event registration flow ───────────────────────────
  if (session.action === 'event_registration') {
    if (session.step === 'search') return eventSearchTurn(user, trimmed, session);
    if (session.step === 'choose') return eventChooseTurn(user, trimmed, session);
    if (session.step === 'confirm') {
      if (CONFIRM_RE.test(trimmed)) return confirmAction(user);
      return { reply: 'Reply "yes" to confirm registration, "cancel" to stop, or ask me anything else.', card: null };
    }
  }

  // ── Book borrow flow ──────────────────────────────────
  if (session.action === 'book_borrow') {
    if (session.step === 'search') return bookSearchTurn(user, trimmed, session, history);
    if (session.step === 'choose') return bookChooseTurn(user, trimmed, session);
    if (session.step === 'ask_return') return bookAskReturnTurn(user, trimmed, session);
    if (session.step === 'ask_id') return bookAskIdTurn(user, trimmed, session);
    if (session.step === 'confirm') {
      if (CONFIRM_RE.test(trimmed)) return confirmAction(user);
      return { reply: 'Reply "yes" to submit the borrow request, or "cancel" to stop.', card: null };
    }
  }

  // ── Sports item request flow ──────────────────────────
  if (session.action === 'sports_request') {
    if (session.step === 'search') return sportsSearchTurn(user, trimmed, session, history);
    if (session.step === 'choose') return sportsChooseTurn(user, trimmed, session);
    if (session.step === 'ask_quantity') return sportsAskQuantityTurn(user, trimmed, session);
    if (session.step === 'ask_slot') return sportsAskSlotTurn(user, trimmed, session);
    if (session.step === 'ask_note') return sportsAskNoteTurn(user, trimmed, session);
    if (session.step === 'confirm') {
      if (CONFIRM_RE.test(trimmed)) return confirmAction(user);
      return { reply: 'Reply "yes" to submit the request, or "cancel" to stop.', card: null };
    }
  }

  return handleCollectTurn(user, trimmed, session);
};

// ─────────────────────────────────────────────────────────────
//  Choose a claim match (called by choice buttons in frontend)
// ─────────────────────────────────────────────────────────────
const chooseMatch = async (user, index) => {
  const session = getSession(user._id);
  if (!session || session.step !== 'choose' || !session.matches) {
    return { reply: 'The item selection expired. Please search again.', card: null };
  }
  const choice = session.matches[Number(index)];
  if (!choice) {
    return { reply: 'That choice is invalid. Please pick one of the listed options.', card: null };
  }

  switch (session.action) {
    case 'lost_found_claim': {
      session.itemId = choice.id;
      session.step = 'details';
      setSession(user._id, session);
      return {
        reply: 'To verify ownership, please provide an identifying detail — e.g. a colour, a mark, or something only the owner would know.',
        card: null,
      };
    }
    case 'event_registration': {
      const ev = await Event.findById(choice.id).lean();
      if (!ev) {
        clearSession(user._id);
        return { reply: 'That event no longer exists. Please try again.', card: null };
      }
      session.eventId = choice.id;
      session.step = 'confirm';
      setSession(user._id, session);
      return { reply: 'Here is the event you selected:', card: eventConfirmCard(ev) };
    }
    case 'book_borrow': {
      const book = await Book.findById(choice.id).lean();
      if (!book) {
        clearSession(user._id);
        return { reply: 'That book no longer exists. Please try again.', card: null };
      }
      return selectBook(user, session, book);
    }
    case 'sports_request': {
      const item = await SportsItem.findById(choice.id).lean();
      if (!item) {
        clearSession(user._id);
        return { reply: 'That item no longer exists. Please try again.', card: null };
      }
      return selectSportsItem(user, session, item);
    }
    default:
      return { reply: 'The item selection expired. Please search again.', card: null };
  }
};

// ─────────────────────────────────────────────────────────────
//  Confirm / cancel — reuses existing controllers + sends
//  admin notifications where the normal flow doesn't already.
// ─────────────────────────────────────────────────────────────
const confirmAction = async (user) => {
  const session = getSession(user._id);
  if (!session) {
    return { reply: 'There is no pending request to submit.', card: null };
  }

  let result;
  try {
    switch (session.action) {

      // ── Lost & Found: report ─────────────────────────
      case 'lost_found_report': {
        const { title, description, category } = composeReport(session.draft);
        result = await runController(
          lostFoundController.createLostFoundItem,
          user,
          {
            title,
            description,
            type: session.draft.type,
            category,
            location: session.draft.location,
            image: session.draft.image || null,
            contactInfo: session.draft.contactInfo || user.email || '',
          }
        );
        if (result.statusCode >= 400) throw new Error(result.body?.message || 'The report was rejected.');
        // Notify all admins/staff so they see the new item in the panel
        createNotificationForRole(['admin', 'staff'], {
          type: 'lost_found',
          title: `New ${session.draft.type === 'found' ? 'Found' : 'Lost'} Item Reported`,
          message: `${user.username} reported: "${title}" at ${session.draft.location}`,
          link: 'lost-found',
        }, user._id);
        clearSession(user._id);
        return {
          reply: `Done! Your ${session.draft.type} report for "${title}" has been submitted. An admin will review it shortly.`,
          card: null,
        };
      }

      // ── Lost & Found: claim ──────────────────────────
      case 'lost_found_claim': {
        result = await runController(
          lostFoundController.claimLostFoundItem,
          user,
          { details: session.draft.details || 'Claimed by student' },
          { id: session.draft.itemId }
        );
        if (result.statusCode >= 400) throw new Error(result.body?.message || 'The claim was rejected.');

        // Notify admins/staff to review the pending claim
        const claimedItem = result.body;
        createNotificationForRole(['admin', 'staff'], {
          type: 'lost_found',
          title: 'New Lost & Found Claim',
          message: `${user.username} has claimed "${claimedItem?.title || 'an item'}" — awaiting your review.`,
          link: 'lost-found',
        }, user._id);

        clearSession(user._id);
        return {
          reply: 'Your claim has been submitted successfully. The admin has been notified and will review it. You will receive a notification once a decision is made.',
          card: null,
        };
      }

      // ── CCTV request ─────────────────────────────────
      case 'cctv_request': {
        result = await runController(
          lostFoundController.createCctvRequest,
          user,
          {
            location: session.draft.location,
            date: session.draft.date,
            timeFrom: session.draft.timeFrom,
            timeTo: session.draft.timeTo,
            reason: session.draft.reason,
            additionalDetails: session.draft.additionalDetails || '',
          }
        );
        if (result.statusCode >= 400) throw new Error(result.body?.message || 'The request was rejected.');

        // Notify admins/staff to review the CCTV request
        createNotificationForRole(['admin', 'staff'], {
          type: 'cctv_request',
          title: 'New CCTV Footage Request',
          message: `${user.username} requested footage for ${session.draft.location} on ${session.draft.date} (${session.draft.timeFrom}–${session.draft.timeTo}). Reason: ${session.draft.reason}`,
          link: 'lost-found',
        }, user._id);

        clearSession(user._id);
        return {
          reply: `Your CCTV request for ${session.draft.location} on ${session.draft.date} has been submitted successfully and sent to the administration for review. You will be notified of the outcome.`,
          card: null,
        };
      }

      // ── Attendance report ────────────────────────────
      case 'attendance_report': {
        result = await runController(
          attendanceController.createReportRequest,
          user,
          { reason: session.draft.reason || '' }
        );
        if (result.statusCode >= 400) throw new Error(result.body?.message || 'The request was rejected.');

        // Notify the student that their request was received
        createNotification(user._id, {
          type: 'attendance_report',
          title: 'Attendance Report Requested',
          message: 'Your attendance report request has been submitted to SSD. You will be notified once it is ready.',
          link: 'ssd-help',
        });
        // Notify admins to process it
        createNotificationForRole(['admin'], {
          type: 'attendance_report',
          title: 'New Attendance Report Request',
          message: `${user.username} (${user.email}) has requested an attendance report. Reason: ${session.draft.reason || 'Not specified'}`,
          link: 'ssd-help',
        }, user._id);

        clearSession(user._id);
        return {
          reply: 'Your attendance report request has been submitted successfully. The admin has been notified and you will receive a notification once your report is ready.',
          card: null,
        };
      }

      // ── Peer help request ─────────────────────────────
      case 'peer_help': {
        const requestText = session.draft.details
          ? `${session.draft.request} — ${session.draft.details}`
          : session.draft.request;

        result = await runController(helpController.createHelpRequest, user, { request: requestText, attachments: [] });
        if (result.statusCode >= 400) throw new Error(result.body?.message || 'The request was rejected.');
        // helpController.createHelpRequest already notifies staff/admin — no extra notification needed.
        clearSession(user._id);
        return {
          reply: 'Your peer help request has been posted. Other students and staff can now see it and respond.',
          card: null,
        };
      }

      // ── Campus help ──────────────────────────────────
      case 'campus_help': {
        const parts = [session.draft.problem];
        if (session.draft.location) parts.push(`Location: ${session.draft.location}`);
        if (session.draft.category) parts.push(`Category: ${session.draft.category}`);
        if (session.draft.details) parts.push(session.draft.details);
        const requestText = parts.join(' | ');

        result = await runController(helpController.createHelpRequest, user, { request: requestText, attachments: [] });
        if (result.statusCode >= 400) throw new Error(result.body?.message || 'The request was rejected.');
        // helpController.createHelpRequest already calls createNotificationForRole(['staff','admin'])
        // so no extra notification needed here — it's already wired.
        clearSession(user._id);
        return {
          reply: 'Your campus help request has been submitted and the admin team has been notified. They will get back to you shortly.',
          card: null,
        };
      }

      // ── Volunteer application ────────────────────────
      case 'volunteer_application': {
        const selected = session.selectedOpportunities;
        if (!selected || !selected.length) {
          clearSession(user._id);
          return { reply: 'No opportunities were selected. Please try again.', card: null };
        }

        const succeeded = [];
        const failed = [];

        for (const op of selected) {
          try {
            // Call applyToOpportunity directly — avoids HTTP round-trip,
            // uses identical validation + slot-check logic as the form UI.
            const existing = await VolunteerApplication.findOne({
              opportunity: op.id,
              student: user._id,
            });

            if (existing && existing.status === 'applied') {
              failed.push({ label: op.label, reason: 'Already applied' });
              continue;
            }

            const opportunity = await VolunteerOpportunity.findById(op.id);
            if (!opportunity || !opportunity.isOpen) {
              failed.push({ label: op.label, reason: 'Opportunity no longer available' });
              continue;
            }

            // Check slot availability
            if (opportunity.slotsAvailable !== null) {
              const count = await VolunteerApplication.countDocuments({
                opportunity: opportunity._id,
                status: 'applied',
              });
              if (count >= opportunity.slotsAvailable) {
                failed.push({ label: op.label, reason: 'No slots available' });
                continue;
              }
            }

            if (existing) {
              existing.status = 'applied';
              await existing.save();
            } else {
              await VolunteerApplication.create({
                opportunity: opportunity._id,
                student: user._id,
                status: 'applied',
              });
            }

            // Notify the student that their application was submitted
            createNotification(user._id, {
              type: 'volunteer_opportunity',
              title: 'Volunteer Application Submitted',
              message: `Your application for "${opportunity.eventTitle}" (${opportunity.role || 'Volunteer'}) has been submitted successfully.`,
              link: 'ssd-help',
            });

            // Notify admins of the new volunteer application
            createNotificationForRole(['admin'], {
              type: 'volunteer_opportunity',
              title: 'New Volunteer Application',
              message: `${user.username} applied to volunteer for "${opportunity.eventTitle}" — ${opportunity.role || 'Volunteer'}${opportunity.date ? ' on ' + opportunity.date : ''}.`,
              link: 'ssd-help',
            }, user._id);

            succeeded.push(op.label);
          } catch (opErr) {
            console.error('[ChautariAI] Volunteer apply error:', opErr?.message);
            failed.push({ label: op.label, reason: opErr?.message || 'Submission failed' });
          }
        }

        clearSession(user._id);

        if (!succeeded.length) {
          const reasons = failed.map((f) => `${f.label} (${f.reason})`).join(', ');
          return {
            reply: `Your volunteer application could not be submitted. ${reasons}. Please try again or contact SSD directly.`,
            card: null,
          };
        }

        let reply = `Your volunteer application${succeeded.length > 1 ? 's have' : ' has'} been submitted successfully.`;
        if (succeeded.length > 0) {
          reply += ` Applied for: ${succeeded.join(', ')}.`;
        }
        if (failed.length > 0) {
          reply += ` Could not apply for: ${failed.map((f) => `${f.label} (${f.reason})`).join(', ')}.`;
        }

        return { reply, card: null };
      }

      // ── Event registration ───────────────────────────
      case 'event_registration': {
        if (!session.eventId) {
          clearSession(user._id);
          return { reply: 'No event was selected. Please try again.', card: null };
        }

        result = await runController(eventController.registerForEvent, user, {}, { id: session.eventId });
        if (result.statusCode >= 400) throw new Error(result.body?.message || 'Registration failed.');

        const ev = await Event.findById(session.eventId).lean();
        const alreadyRegistered = /already registered/i.test(result.body?.message || '');

        if (!alreadyRegistered) {
          createNotification(user._id, {
            type: 'event',
            title: 'Registered for Event',
            message: `You have successfully registered for "${ev?.title || 'the event'}".`,
            link: 'events',
          });
        }

        clearSession(user._id);
        return {
          reply: alreadyRegistered
            ? `You're already registered for "${ev?.title || 'the event'}".`
            : `You're registered for "${ev?.title || 'the event'}"${ev?.date ? ' on ' + new Date(ev.date).toLocaleDateString() : ''}. See you there!`,
          card: null,
        };
      }

      // ── Book borrow ──────────────────────────────────
      case 'book_borrow': {
        if (!session.bookId) {
          clearSession(user._id);
          return { reply: 'No book was selected. Please try again.', card: null };
        }

        result = await runController(
          resourceController.requestBorrow,
          user,
          { returnBy: session.draft.returnBy, studentIdNumber: session.draft.studentIdNumber },
          { id: session.bookId }
        );
        if (result.statusCode >= 400) throw new Error(result.body?.message || 'The borrow request was rejected.');

        createNotification(user._id, {
          type: 'book_request',
          title: 'Borrow Request Submitted',
          message: `Your request to borrow "${session.bookTitle}" has been submitted and is pending approval.`,
          link: 'resources',
        });
        createNotificationForRole(['admin'], {
          type: 'book_request',
          title: 'New Book Borrow Request',
          message: `${user.username} requested to borrow "${session.bookTitle}" — return by ${session.draft.returnBy}.`,
          link: 'resources',
        }, user._id);

        clearSession(user._id);
        return {
          reply: `Your request to borrow "${session.bookTitle}" (Shelf ${session.bookShelf}) has been submitted. You'll be notified once it's approved.`,
          card: null,
        };
      }

      // ── Sports item request ───────────────────────────
      case 'sports_request': {
        if (!session.itemId) {
          clearSession(user._id);
          return { reply: 'No sports item was selected. Please try again.', card: null };
        }

        result = await runController(
          resourceController.requestSportsItem,
          user,
          { quantity: session.draft.quantity, slot: session.draft.slot, note: session.draft.note || '' },
          { id: session.itemId }
        );
        if (result.statusCode >= 400) throw new Error(result.body?.message || 'The request was rejected.');

        clearSession(user._id);
        return {
          reply: `Your request for ${session.draft.quantity} × "${session.itemName}" (${session.draft.slot}) has been submitted. You'll be notified once it's reviewed.`,
          card: null,
        };
      }

      default:
        clearSession(user._id);
        return { reply: 'This action type is not supported.', card: null };
    }
  } catch (err) {
    clearSession(user._id);
    console.error('[ChautariAI] Action execution failed:', err?.message || err);
    const msg = err?.body?.message || err?.message || 'The request could not be submitted. Please try again.';
    return { reply: `⚠️ ${msg}`, card: null };
  }
};

const cancelAction = async (user) => {
  clearSession(user._id);
  return { reply: 'Request cancelled. Type or ask me for anything else anytime.', card: null };
};

const isActionActive = (user) => Boolean(getSession(user._id));

module.exports = {
  handleTurn,
  confirmAction,
  cancelAction,
  chooseMatch,
  isActionActive,
  runController,
};
