# Chauttari AI Chatbox — Change Documentation

> **Feature:** AI-powered campus assistant chatbox added to the existing CampusConnect (Chauttari) system.
> **Approach:** Add-only. Zero existing files were deleted or redesigned.

---

## Overview

A floating AI chatbox was added to the Chauttari campus management system. It appears as a small icon at the bottom-right corner of every page. Clicking it opens a compact chat panel where students, teachers, and staff can ask any campus-related question and receive answers based on **real live data from the existing MongoDB database**.

```
User clicks AI icon
      ↓
Chatbox opens (floating, does not replace page)
      ↓
User types question
      ↓
Frontend → POST /api/ai/chat (existing backend, auth cookie)
      ↓
authMiddleware verifies session (req.user set server-side)
      ↓
Controller fetches real data from existing DB models
      ↓
Context + question sent to Groq AI (llama/compound-mini)
      ↓
AI generates answer based on real campus data
      ↓
Answer displayed in chatbox
```

---

## Files Added (5 new files)

### `server/controllers/aiChatController.js`
The AI brain. On every chat request it:
1. Reads `req.user` from the existing `authMiddleware` (never trusts client-supplied IDs)
2. Queries **8 existing MongoDB models** to build a real-data context string
3. Sends the context + user message to **Groq AI** (`groq/compound-mini` model)
4. Returns only the AI reply — no credentials, no raw DB data exposed

**Models queried (all existing — no new models):**

| Model | Data fetched | Scope |
|-------|-------------|-------|
| `Timetable` | Today's class schedule | All students (shared) |
| `Attendance` | Present/absent records, % | This user only |
| `CanteenMenu` | All items with real NPR prices | All (shared menu) |
| `CanteenCredit` | Due amount, paid amount, balance | This user only |
| `Announcement` | Latest 5 announcements | All (shared) |
| `Event` | Upcoming events | All (shared) |
| `VolunteerRecord` | Volunteer history, hours | This user only |
| `LostFoundItem` | Recent lost & found posts | All (shared) |

---

### `server/routes/aiChat.routes.js`
Express router. Mounts one route:
```
POST /api/ai/chat  →  authMiddleware  →  aiChatController.chat
```
Unauthenticated requests return `401` before reaching the AI.

---

### `client/src/api/aiChatApi.js`
Thin axios wrapper using the existing `axiosInstance` (same base URL, same credentials cookie). Sends `{ message, history }` to `/api/ai/chat`.

```js
// No Gemini key. No API key. Just calls our own backend.
const sendAIMessage = (message, history) =>
  axiosInstance.post('/ai/chat', { message, history });
```

---

### `client/src/context/AIChatContext.jsx`
Minimal React context exposing:
- `isOpen` — whether the chatbox is visible
- `openChat()` / `closeChat()` / `toggleChat()`

Kept minimal intentionally. The widget manages its own message/input state internally.

---

### `client/src/components/common/AIChatWidget.jsx`
The floating button + collapsible chatbox UI component.

**Design decisions:**
- `position: fixed; bottom: 24px; right: 24px; z-index: 9999` — floats above all content, never disrupts layout
- Colors read from existing `themes.js` tokens — matches light and dark mode automatically
- Uses `MessageSquare`, `Send`, `X` from the already-installed `lucide-react`
- Chatbox: `340×460px` on desktop, `min(92vw, 340px) × min(72vh, 460px)` on mobile
- No gradients, no animations on the icon, no external fonts — minimal and clean
- Send on `Enter` key, `Shift+Enter` = newline
- Typing dots animation while waiting for AI response
- Last 8 conversation turns sent as history for multi-turn context
- Error messages displayed inline (no crashes, no blank screens)

---

## Files Modified (4 minimal edits)

### `server/.env`
**Added 1 line:**
```env
GROQ_API_KEY=gsk_your_actual_key_here
```
> Get a free key at https://console.groq.com/keys — no credit card required.

---

### `server/server.js`
**Added 2 lines:**
```js
// Line added near imports:
const aiChatRoutes = require('./routes/aiChat.routes');

// Line added near route registrations:
app.use('/api/ai', aiChatRoutes);
```
All existing routes remain completely unchanged.

---

### `client/src/main.jsx`
**Added 2 lines:**
```jsx
// Import:
import { AIChatProvider } from './context/AIChatContext.jsx';

// Wrap inside existing providers:
<AIChatProvider> ... </AIChatProvider>
```

---

### `client/src/App.jsx`
**Added 2 lines:**
```jsx
// Import:
import AIChatWidget from './components/common/AIChatWidget';

// Render after </Routes> inside a React fragment:
<AIChatWidget />
```
The widget is `position: fixed` so adding it here causes it to appear on every page without touching any individual page or layout component.

---

## Files NOT Modified

Every existing file in the project was left untouched:

- All pages: `StudentDashBoard.jsx`, `TeacherDashboard.jsx`, `StaffDashboard.jsx`, `AdminDashboard.jsx`, `Login.jsx`, `Signup.jsx`
- All existing components: `Sidebar.jsx`, `ChatPanel.jsx`, `ChatButton.jsx`, `NotificationBell.jsx`, and all student/teacher/admin section components
- All existing contexts: `AuthContext.jsx`, `ChatContext.jsx`, `ThemeContext.jsx`, `NotificationContext.jsx`
- All existing API files, models, middleware, routes, and controllers
- `index.css`, `vite.config.js`, `eslint.config.js`, `package.json` (client)
- All existing DB models (no new models, no schema changes)

---

## AI Provider

| Detail | Value |
|--------|-------|
| Provider | [Groq](https://console.groq.com) |
| Model | `groq/compound-mini` |
| Free tier | Yes — no credit card, generous limits |
| API key location | `server/.env` → `GROQ_API_KEY` only |
| Frontend exposure | None — key never sent to browser |

> **Why not Gemini?** The Google Cloud project associated with the provided keys had API access permanently denied (`403: Your project has been denied access`). Groq provides a reliable free alternative with an OpenAI-compatible API.

---

## Security

| Concern | How it is handled |
|---------|------------------|
| API key exposure | `GROQ_API_KEY` lives only in `server/.env` (gitignored). Never in any client file or `VITE_` variable. |
| Cross-student data | All personal queries (`attendance`, `canteen credit`, `volunteer`) use `req.user._id` set by `authMiddleware` — the client cannot override this. |
| Unauthenticated access | `authMiddleware` on the route returns `401` before any DB query or AI call. |
| Sensitive data to AI | Only plain text field values are sent — no MongoDB URIs, no passwords, no tokens. |

---

## Server Package Installed

```bash
cd server
npm install groq-sdk   # Added to server/node_modules
```

No client packages were installed. All existing client dependencies (`lucide-react`, `axios`, `react`, etc.) were already present.

---

## How to Run

```bash
# Terminal 1 — Backend
cd server
node server.js        # or: npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

---

## Real-Data Examples

| User asks | AI answers from |
|-----------|----------------|
| "price of veg momo" | Exact NPR price from `CanteenMenu` collection |
| "my attendance this month" | Actual present/absent count + % from `Attendance` collection |
| "how much do I owe in canteen" | Exact due/paid/remaining from `CanteenCredit` collection |
| "today's classes" | Real schedule for today's day from `Timetable` collection |
| "my volunteer hours" | Actual events + hours from `VolunteerRecord` collection |
| "any lost items on campus" | Latest entries from `LostFoundItem` collection |
| "upcoming events" | Real future events from `Event` collection |
| "latest announcements" | Latest 5 from `Announcement` collection |

---

## Checklist

- [x] Existing pages and UI unchanged
- [x] Floating AI icon appears bottom-right on every page
- [x] Icon matches light and dark theme
- [x] Clicking icon opens compact chatbox
- [x] Chatbox does not replace the page
- [x] Minimize (×) button collapses chatbox back to icon
- [x] Clicking icon again reopens chatbox
- [x] Enter key sends message
- [x] Send button sends message
- [x] Typing dots shown while waiting
- [x] AI response appears in chat
- [x] Error message shown if server is unreachable
- [x] Mobile responsive (smaller dimensions on small screens)
- [x] `GROQ_API_KEY` not in any client file or browser-accessible variable
- [x] Network request goes to `/api/ai/chat` (own backend), not directly to AI provider
- [x] Unauthenticated request returns 401
- [x] Student-specific data (attendance, credit) cannot be accessed by other students
- [x] Canteen menu shows real items with real NPR prices from database
