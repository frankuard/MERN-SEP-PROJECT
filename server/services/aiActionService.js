const mongoose = require('mongoose');
const LostFoundItem = require('../models/LostFoundItem');
const VolunteerOpportunity = require('../models/VolunteerOpportunity');
const VolunteerApplication = require('../models/VolunteerApplication');
const { groqJson } = require('./aiGroq');
const { getSession, setSession, clearSession } = require('./aiActionSession');
const { createNotification, createNotificationForRole } = require('../utils/createNotification');


//  Reuse existing request controllers instead of duplicating
//  business logic. Each handler receives a tiny stub req/res so
//  the exact same code paths (validation, notifications, model
//  writes) run as if the request came from the normal web form.

const lostFoundController = require('../controllers/lostFoundController');
const helpController = require('../controllers/helpController');
const attendanceController = require('../controllers/attendanceController');

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
    fields: ['type', 'item', 'location', 'color', 'brand', 'when', 'details'],
    required: ['type', 'item', 'location'],
    questions: {
      type: "Did you lose this item or did you find it?",
      item: (d) => (d.type === 'found' ? 'What item did you find?' : 'What item did you lose?'),
      location: (d) => (d.type === 'found' ? 'Where did you find it?' : 'Where did you last see it?'),
    },
    optionalQuestion:
      "Got it. Could you describe it a little more — color, brand, or approximately when this happened? (You can say skip.)",
    optionalSatisfied: (d) => Boolean(d.color || d.brand || d.when || d.details),
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
  // volunteer_application is handled by its own bespoke flow below,
  // not through the generic collect/confirm pipeline, but we register
  // it here so detectIntent can return it as a valid action name.
  volunteer_application: {
    label: 'Volunteer Application',
    cardTitle: 'Volunteer Application',
    fields: [],
    required: [],
    questions: {},
    optionalQuestion: null,
    optionalSatisfied: () => true,
  },
};

const ALLOWED_UPDATES = {
  lost_found_report: ['type', 'item', 'location', 'color', 'brand', 'when', 'details'],
  cctv_request: ['location', 'date', 'timeFrom', 'timeTo', 'reason', 'additionalDetails'],
  attendance_report: ['reason'],
  campus_help: ['problem', 'location', 'category', 'priority', 'details'],
};

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────
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
  const title = [draft.color, draft.brand, item].filter(Boolean).join(' ') || item;
  const parts = [title + '.'];
  if (draft.when) parts.push(`Last seen/found: ${draft.when}.`);
  if (draft.details) parts.push(draft.details);
  return { title, description: parts.join(' '), category: mapCategory(item) };
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

const mergePrompt = ({ action, message }) => {
  const def = ACTIONS[action];
  return `You are the action-understanding engine of Chauttari, a campus assistant for a college in Nepal.
${baseDateHint}

The student is completing a ${def.label}. Latest message:
"${message}"

Available fields: ${def.fields.join(', ')}.

Rules for parsing (STRICT):
- "updates" must contain ONLY fields the message actually provides or corrects. Never invent values.
- If the message changes or overrides a previously collected field, include the corrected value.
- Normalize date fields to YYYY-MM-DD using TODAY (resolve today, yesterday, last Monday, "on the 3rd").
- Normalize time fields to 12-hour form like "2:00 PM".
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
- "campus_help": student reports a campus facility problem needing admin action. e.g. "the projector in LT01 isn't working", "there is no wifi in lab 2", "the AC is broken in SR01".
- "volunteer_application": student wants to apply as a volunteer. e.g. "I want to volunteer", "apply me for volunteering", "I want to volunteer for the next event", "register me as a volunteer", "apply for the next two events".
- "none": everything else (questions about attendance percentages, canteen menu, timetable, events, greetings, chit-chat).

Message: "${message}"
Return {"action":"none|lost_found_report|lost_found_claim|attendance_report|cctv_request|campus_help|volunteer_application"}`;

// ACTION_HINTS: fast regex pre-filter before calling the LLM for intent detection.
// Must include keywords that could signal any of the 6 supported actions.
const ACTION_HINTS =
  /\b(lost|lose|losing|found|claim|claiming|reclaim|cctv|camera|footage|attendance report|report request|projector|wifi|wi-fi|internet|not working|isn't working|isn\'t working|broken|problem with|issue with|help with|can you request|need.*report|wallet|airpod|earbud|passport|id card|charger|backpack|volunteer|volunteering|apply.*volunteer|register.*volunteer|volunteer.*event|i want to volunteer)\b/i;

const detectIntent = async (message) => {
  const parsed = await groqJson([{ role: 'user', content: intentPrompt(message) }], { maxTokens: 100 });
  const action = parsed?.action;
  // volunteer_application is valid even though its ACTIONS entry has no fields
  if (action === 'volunteer_application') return 'volunteer_application';
  return ACTIONS[action] ? action : null;
};

const sanitizeUpdates = (action, updates) => {
  const allowed = new Set(ALLOWED_UPDATES[action] || []);
  const out = {};
  for (const [key, value] of Object.entries(updates || {})) {
    if (!allowed.has(key)) continue;
    let v = clean(value, key === 'details' || key === 'reason' ? 1000 : 200);
    if (!v) continue;
    if (key === 'type') {
      if (!['lost', 'found'].includes(v.toLowerCase())) continue;
      v = v.toLowerCase();
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
          { label: 'Category', value: category },
          { label: 'Color', value: draft.color || '—' },
          { label: 'Brand', value: draft.brand || '—' },
          { label: 'Location', value: draft.location },
          { label: 'When', value: draft.when || '—' },
          { label: 'Description', value: description },
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
    default:
      return null;
  }
};

const handleCollectTurn = async (user, message, session) => {
  const action = session.action;

  let parsed;
  try {
    parsed = await groqJson([{ role: 'user', content: mergePrompt({ action, message }) }], { maxTokens: 250 });
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

  const missing = def.required.filter((f) => !clean(session.draft[f]) && f !== 'type');
  if (action === 'lost_found_report' && !session.draft.type) missing.push('type');

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

  const card = buildConfirmCard(action, session.draft, user);
  card.confirm = true;
  session.step = 'confirm';
  setSession(user._id, session);
  return { reply: 'Here is the summary — submit this request?', card };
};

// ─────────────────────────────────────────────────────────────
//  Orchestrator
// ─────────────────────────────────────────────────────────────
const handleTurn = async (user, message, history = []) => {
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
      session.step = (session.action === 'lost_found_claim' || session.action === 'volunteer_application')
        ? 'search'
        : 'collect';
      session.optionalAsked = false;
      session.matches = null;
      session.itemId = null;
      session.selectedOpportunities = null;
      setSession(user._id, session);
      if (session.action === 'lost_found_claim') {
        return { reply: "Okay, let's start again. What item are you trying to claim?", card: null };
      }
      if (session.action === 'volunteer_application') {
        return { reply: "Okay, let's start again. How many events would you like to volunteer for?", card: null };
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
    if (!intent) return null;

    session = {
      action: intent,
      draft: {},
      step: (intent === 'lost_found_claim' || intent === 'volunteer_application') ? 'search' : 'collect',
      optionalAsked: false,
      matches: null,
      itemId: null,
      selectedOpportunities: null,
      volunteerCount: 1,
      createdAt: Date.now(),
    };
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

  return handleCollectTurn(user, trimmed, session);
};

// ─────────────────────────────────────────────────────────────
//  Choose a claim match (called by choice buttons in frontend)
// ─────────────────────────────────────────────────────────────
const chooseMatch = async (user, index) => {
  const session = getSession(user._id);
  if (!session || session.action !== 'lost_found_claim' || session.step !== 'choose' || !session.matches) {
    return { reply: 'The item selection expired. Please search again.', card: null };
  }
  const choice = session.matches[Number(index)];
  if (!choice) {
    return { reply: 'That choice is invalid. Please pick one of the listed options.', card: null };
  }
  session.itemId = choice.id;
  session.step = 'details';
  setSession(user._id, session);
  return {
    reply: 'To verify ownership, please provide an identifying detail — e.g. a colour, a mark, or something only the owner would know.',
    card: null,
  };
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
            contactInfo: user.email || '',
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
