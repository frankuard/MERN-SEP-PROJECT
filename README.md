<div align="center">

# 🏫 Chauttari

### Your Campus, Connected.

**A full-stack MERN campus community platform with AI-powered assistance, real-time messaging, and role-based management for students, teachers, staff, and administrators.**

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat&logo=socket.io&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

![License](https://img.shields.io/badge/License-ISC-blue)
![Node](https://img.shields.io/badge/Node-20+-green)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

</div>

---

## 📖 Project Overview

**Chauttari** (Nepali: "चौतारी" — a resting place / community gathering spot) is a comprehensive MERN-stack web application designed to digitize and streamline daily campus operations for colleges in Nepal. It serves as a centralized hub connecting students, teachers, staff, and administrators through shared modules including attendance tracking, timetable management, campus canteen operations, lost & found, event management, peer help systems, library & sports resource management, and real-time chat — all powered by an AI campus assistant.

---

## 🎯 Project Objectives

- Digitize manual campus processes (attendance, timetables, canteen credits, announcements)
- Provide role-based dashboards for students, teachers, staff, and administrators
- Enable real-time communication between campus members via Socket.IO
- Introduce an AI-powered campus assistant (Chauttari AI) that answers queries using live database context
- Offer a modern, responsive, and accessible UI built with Tailwind CSS
- Centralize campus resources: library books, sports equipment, classroom booking, and department contacts

---

## ✨ Current Features

| Module | Description |
|---|---|
| 🔐 **Auth & Roles** | Register/Login with JWT in httpOnly cookies; 4 roles: student, teacher, staff, admin |
| 📊 **Student Dashboard** | Attendance, timetable, events, canteen, lost & found, campus help, chat, profile |
| 🛠️ **Admin Dashboard** | Manage attendance, events, announcements, canteen, lost & found, resources, campus help, timetable, SSD, users |
| 🏫 **Admin Department Panels** | Super, Canteen, SSD, RTE, and Resources department-specific admin sections |
| 🤖 **Chauttari AI** | RAG-powered campus assistant using Groq LLM with live database context |
| 💬 **Real-Time Chat** | 1-on-1 DMs and group conversations with Socket.IO, read receipts, file attachments |
| 👥 **Friends System** | Send/accept/reject friend requests; chat requires friendship |
| 📢 **Announcements** | Priority-based (Low/Medium/High/Urgent) campus announcements by department |
| 📅 **Events** | College & community events with registration, capacity limits, and status tracking |
| ✅ **Attendance** | Student attendance tracking (Present/Absent) with report request system |
| 📋 **Timetable** | Weekly timetable management with module, lecturer, room, and group linking |
| 🍽️ **Canteen** | Menu management with categories, NPR pricing, special/popular items, and student credit tracking |
| 🔍 **Lost & Found** | Post lost/found items with claims system, status tracking, and text search |
| 🏕️ **Campus Help** | Peer-to-peer help request system with threaded responses and attachments |
| 📚 **Library** | Book catalog with borrow request workflow (pending → approved → returned) |
| 🏀 **Sports** | Sports equipment inventory with request/approval workflow |
| 🏫 **Classrooms** | Classroom management, room requests, and vacant room finder |
| 🎓 **Modules** | Academic module master list (code + name) for timetable linking |
| 👥 **Groups** | Academic section groups for timetable assignment |
| 🤝 **Volunteering** | Volunteer opportunities, applications, and verified hour records |
| 📹 **CCTV Requests** | Students can request CCTV footage review for lost item incidents |
| 🔔 **Notifications** | Real-time notification system with 20+ notification types and read/unread tracking |
| 📱 **Responsive Design** | Mobile-first UI with Tailwind CSS 4 |
| 🖼️ **Image Uploads** | ImageKit-powered image hosting with crop modal for profiles and covers |

---

## 🤖 Chauttari AI / RAG

Chauttari AI is a Retrieval-Augmented Generation system that gives each student a personalized campus assistant:

- **Live Data Context**: On every query, the system fetches the student's real attendance, timetable, canteen menu & credit, events, announcements, volunteering records, lost & found items, classroom requests, CCTV requests, library borrows, and sports requests directly from MongoDB
- **LLM Backend**: Uses Groq SDK with the `qwen/qwen3.8-27b` model (with `allam-2-7b` as fallback on rate limits)
- **System Prompt**: Instructs the model to answer in plain, friendly language using only the provided real data — no hallucinations
- **Conversation History**: Maintains last 6 messages for context-aware multi-turn conversations
- **Accessible UI**: Floating AI chat widget available globally across all authenticated pages

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Vite)                         │
│   React 19 + React Router 7 + Tailwind CSS 4 + Socket.IO   │
│   Contexts: Auth | Chat | Notification | AIChat | Theme     │
│   Pages: Login | Signup | Student | Teacher | Staff | Admin  │
└──────────────────────────┬──────────────────────────────────┘
                           │  HTTP + WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVER (Express 5)                        │
│   JWT Auth Middleware | Role Middleware | Error Handler      │
│   Socket.IO Server (authenticated via cookie)               │
│   25 Route Modules | 22 Controllers | 31 Mongoose Models    │
│   Utilities: Notification Emitter | Token Generator | CORS  │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────────┐
        │ MongoDB  │ │ ImageKit │ │ Groq LLM API │
        │ Atlas    │ │ (Images) │ │ (Chauttari AI)│
        └──────────┘ └──────────┘ └──────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | UI library |
| React Router 7 | Client-side routing |
| Tailwind CSS 4 | Utility-first styling |
| Axios | HTTP client |
| Socket.IO Client | Real-time WebSocket communication |
| Lucide React | Icon library |
| React Hot Toast | Toast notifications |
| React Easy Crop | Image cropping for profile/cover uploads |
| Vite 8 | Build tool and dev server |
| ESLint | Code linting |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express 5 | Web framework |
| Mongoose 9 | MongoDB ODM |
| Socket.IO 4 | Real-time server |
| JSON Web Tokens | Authentication (httpOnly cookies) |
| bcryptjs | Password hashing |
| Multer 2 | File upload handling |
| ImageKit | Cloud image hosting |
| Groq SDK | AI/LLM integration |
| dotenv | Environment variable management |
| cookie-parser | Cookie parsing middleware |

### Infrastructure & Services

| Service | Purpose |
|---|---|
| MongoDB Atlas | Cloud database |
| ImageKit | Image CDN and transformations |
| Groq Cloud | LLM inference (Qwen 3.8B, Allam 2 7B) |
| Google DNS (8.8.8.8) | SRV record resolution fix for MongoDB Atlas |

---

## 📂 Project Structure

```
MERN-SEP-PROJECT/
├── client/                          # Frontend (Vite + React)
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── api/                     # API service modules (24 files)
│   │   │   ├── axiosInstance.js     # Configured Axios with credentials
│   │   │   ├── auth.js
│   │   │   ├── aiChatApi.js
│   │   │   ├── announcementApi.js
│   │   │   ├── attendanceApi.js
│   │   │   ├── campusHelpApi.js
│   │   │   ├── canteenApi.js
│   │   │   ├── chatApi.js
│   │   │   ├── classroomApi.js
│   │   │   ├── classroomRequestApi.js
│   │   │   ├── eventsApi.js
│   │   │   ├── friendApi.js
│   │   │   ├── groupApi.js
│   │   │   ├── lostFoundApi.js
│   │   │   ├── moduleApi.js
│   │   │   ├── notificationApi.js
│   │   │   ├── resourcesApi.js
│   │   │   ├── ssdHelpApi.js
│   │   │   ├── timetableApi.js
│   │   │   ├── uploadApi.js
│   │   │   ├── userApi.js
│   │   │   ├── vacantClassesApi.js
│   │   │   ├── volunteerApi.js
│   │   │   └── volunteerOpportunityApi.js
│   │   ├── assets/                  # Static images and icons
│   │   ├── auth/                    # ProtectedRoute, RoleRoute
│   │   ├── components/
│   │   │   ├── admin/               # Admin panel components (11 modules)
│   │   │   │   ├── Dashboard/
│   │   │   │   ├── ManageAnnouncements/
│   │   │   │   ├── ManageAttendance/
│   │   │   │   ├── ManageCampusHelp/
│   │   │   │   ├── ManageCanteen/
│   │   │   │   ├── ManageEvents/
│   │   │   │   ├── ManageLostFound/
│   │   │   │   ├── ManageResources/
│   │   │   │   ├── ManageSSD/
│   │   │   │   ├── ManageTimetable/
│   │   │   │   └── ManageUsers/
│   │   │   ├── auth/                # Auth form components
│   │   │   ├── common/              # Shared components
│   │   │   │   ├── AIChatWidget.jsx
│   │   │   │   ├── ChatButton.jsx
│   │   │   │   ├── ChatPanel.jsx
│   │   │   │   ├── ConfirmDeleteModal.jsx
│   │   │   │   ├── ImageCropModal.jsx
│   │   │   │   ├── ImageUploadField.jsx
│   │   │   │   ├── NotificationBell.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   └── student/             # Student dashboard sections
│   │   │       ├── Dashboard/
│   │   │       ├── CampusHelpSection.jsx
│   │   │       ├── CanteenSection.jsx
│   │   │       ├── ChatSection.jsx
│   │   │       ├── EventsSection.jsx
│   │   │       ├── LostFound/
│   │   │       ├── ProfileSection.jsx
│   │   │       ├── ResourcesSection.jsx
│   │   │       ├── SSDHelpSection.jsx
│   │   │       ├── TimetableSection.jsx
│   │   │       └── VacantClassesSection.jsx
│   │   ├── context/                 # React Context providers
│   │   │   ├── AIChatContext.jsx
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ChatContext.jsx
│   │   │   ├── NotificationContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── data/                    # Static data/config
│   │   ├── pages/                   # Route-level pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminDepartmentPicker.jsx
│   │   │   ├── AdminDeptSection.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── StaffDashboard.jsx
│   │   │   ├── StudentDashBoard.jsx
│   │   │   └── TeacherDashboard.jsx
│   │   ├── socket/                  # Socket.IO client setup
│   │   ├── utils/                   # Helper utilities
│   │   ├── App.jsx                  # Root component with routing
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Global styles
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Backend (Express + Mongoose)
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── imagekit.js              # ImageKit configuration
│   ├── controllers/                 # Business logic (22 files)
│   │   ├── adminUserController.js
│   │   ├── aiChatController.js
│   │   ├── announcementController.js
│   │   ├── attendanceController.js
│   │   ├── authController.js
│   │   ├── canteenController.js
│   │   ├── chatController.js
│   │   ├── classroomController.js
│   │   ├── classroomRequestController.js
│   │   ├── eventController.js
│   │   ├── friendController.js
│   │   ├── groupController.js
│   │   ├── helpController.js
│   │   ├── lostFoundController.js
│   │   ├── moduleController.js
│   │   ├── notificationController.js
│   │   ├── resourceController.js
│   │   ├── timetableController.js
│   │   ├── uploadController.js
│   │   ├── userController.js
│   │   ├── volunteerController.js
│   │   └── volunteerOpportunityController.js
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification + user injection
│   │   ├── errorHandler.js          # Global error handler
│   │   ├── optionalAuthMiddleware.js # Auth when token present, optional otherwise
│   │   ├── roleMiddleware.js        # Role-based access control
│   │   └── upload.js                # Multer file upload config
│   ├── models/                      # Mongoose schemas (31 models)
│   │   ├── User.js
│   │   ├── Announcement.js
│   │   ├── Attendance.js
│   │   ├── AttendanceReportRequest.js
│   │   ├── Book.js
│   │   ├── BorrowRequest.js
│   │   ├── CanteenCredit.js
│   │   ├── CanteenMenu.js
│   │   ├── CctvRequest.js
│   │   ├── Classroom.js
│   │   ├── ClassroomRequest.js
│   │   ├── Conversation.js
│   │   ├── DepartmentContact.js
│   │   ├── Event.js
│   │   ├── EventRegistration.js
│   │   ├── FriendRequest.js
│   │   ├── Group.js
│   │   ├── GroupInvite.js
│   │   ├── HelpRequest.js
│   │   ├── LostFoundItem.js
│   │   ├── Message.js
│   │   ├── Module.js
│   │   ├── Notification.js
│   │   ├── ScheduleChange.js
│   │   ├── SportsItem.js
│   │   ├── SportsRequest.js
│   │   ├── Timetable.js
│   │   ├── VacantClassroom.js
│   │   ├── VolunteerApplication.js
│   │   ├── VolunteerOpportunity.js
│   │   └── VolunteerRecord.js
│   ├── routes/                      # Express route definitions (25 files)
│   │   ├── adminUsers.routes.js
│   │   ├── aiChat.routes.js
│   │   ├── announcement.routes.js
│   │   ├── attendance.routes.js
│   │   ├── auth.routes.js
│   │   ├── canteen.routes.js
│   │   ├── chat.routes.js
│   │   ├── classroomRequests.routes.js
│   │   ├── classrooms.routes.js
│   │   ├── complaint.routes.js
│   │   ├── event.routes.js
│   │   ├── friend.routes.js
│   │   ├── groups.routes.js
│   │   ├── help.routes.js
│   │   ├── location.routes.js
│   │   ├── lostFound.routes.js
│   │   ├── modules.routes.js
│   │   ├── notice.routes.js
│   │   ├── notification.routes.js
│   │   ├── resource.routes.js
│   │   ├── timetable.routes.js
│   │   ├── upload.routes.js
│   │   ├── user.routes.js
│   │   ├── volunteerOpportunity.routes.js
│   │   └── volunteerRecords.routes.js
│   ├── scripts/
│   │   ├── createAdminAccount.js    # CLI script to create admin users
│   │   └── backfillCanteenCredits.js # Backfill CanteenCredit for existing users
│   ├── socket/
│   │   └── socketHandler.js         # Socket.IO server with JWT auth
│   ├── utils/
│   │   ├── corsOrigin.js            # Dynamic CORS origin check
│   │   ├── createNotification.js    # Notification helper with real-time push
│   │   └── generateToken.js         # JWT token generation
│   ├── .env
│   ├── package.json
│   └── server.js                    # Express app entry point
│
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites

- **Node.js** v20+ and npm
- **MongoDB Atlas** account (or local MongoDB)
- **ImageKit** account (for image uploads) — [imagekit.io](https://imagekit.io)
- **Groq** API key (for Chauttari AI) — [console.groq.com](https://console.groq.com)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/MERN-SEP-PROJECT.git
cd MERN-SEP-PROJECT
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/chautari
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint

GROQ_API_KEY=your_groq_api_key
```

Run the dev server:

```bash
npm run dev
```

The server starts on **port 3000**.

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

The client starts on **port 5178** (Vite default or configured in `vite.config.js`).

### 4. Create Admin Account

```bash
cd server
node scripts/createAdminAccount.js
```

Follow the prompts to create the initial admin user.

### 5. Environment Variables Reference

| Variable | Location | Description |
|---|---|---|
| `MONGO_URI` | server | MongoDB Atlas connection string |
| `JWT_SECRET` | server | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | server | Token expiry (default: 7d) |
| `IMAGEKIT_PUBLIC_KEY` | server | ImageKit public API key |
| `IMAGEKIT_PRIVATE_KEY` | server | ImageKit private API key |
| `IMAGEKIT_URL_ENDPOINT` | server | ImageKit CDN URL |
| `GROQ_API_KEY` | server | Groq LLM API key for Chauttari AI |
| `VITE_API_URL` | client | (Optional) Override API base URL |
| `VITE_SOCKET_URL` | client | (Optional) Override Socket.IO URL |

---

## 🔐 Authentication & Security

- **JWT in httpOnly Cookies**: Tokens are stored in `httpOnly`, `secure`, `SameSite` cookies — never accessible via JavaScript
- **Password Hashing**: bcryptjs with salt rounds for secure password storage
- **Role-Based Access Control**: Middleware-based role checking (`authMiddleware` + `roleMiddleware`) on every protected route
- **Account Approval System**: Teachers and staff require admin approval (`status: pending`) before accessing the platform; students are auto-approved
- **Rejected Account Handling**: Rejected accounts are blocked from login with a clear message
- **Socket.IO Authentication**: WebSocket connections are authenticated by parsing the raw Cookie header and verifying the JWT — no unauthenticated socket connections allowed
- **CORS**: Dynamic origin checking against the configured client URL
- **Session Duration**: 7-day token expiry with automatic refresh on page load via `GET /api/auth/me`

---

## 💬 Real-Time Communication

### Socket.IO Events

| Direction | Event | Description |
|---|---|---|
| Client → Server | `conversation:join` | Join a conversation room for live updates |
| Client → Server | `conversation:leave` | Leave a conversation room |
| Server → Client | `message:new` | New message in a joined conversation |
| Server → Client | `conversation:bump` | Conversation list update (unread badge) |
| Server → Client | `conversation:updated` | Group membership or info changed |
| Server → Client | `conversation:new` | New conversation appeared (group invite accepted) |
| Server → Client | `conversation:deleted` | Group deleted by creator |
| Server → Client | `messages:deleted` | Messages removed by sender |
| Server → Client | `notification:new` | Real-time notification pushed to user's personal room |
| Server → Client | `friend:request` | Incoming friend request |
| Server → Client | `group:invite` | Incoming group invite |

### Chat Features

- 1-on-1 direct messaging (requires accepted friendship)
- Group conversations with invite system
- Message read receipts (`readBy` array)
- File/image attachments via ImageKit upload
- Message deletion (own messages only)
- Conversation deletion (DM: hide-for-me; Group: creator deletes for all)
- Group leave (non-creators only)

---

## 👥 User Roles & Permissions

| Role | Status on Register | Dashboard | Key Permissions |
|---|---|---|---|
| **Student** | Auto-approved | `/student/:tab` | Full student features: attendance, timetable, chat, events, canteen, lost & found, campus help, profile |
| **Admin** | Created via script | `/admin/:tab` + `/admin/dept/:section` | Full management: attendance, events, announcements, canteen, lost & found, resources, campus help, timetable, SSD, users; department-specific panels (super, canteen, ssd, rte, resources) |

### Admin Department Sections

| Section | Scope |
|---|---|
| `super` | Super admin — main admin dashboard with all management tabs |
| `canteen` | Canteen menu, credits, and food operations |
| `ssd` | Student Support Division — help requests, CCTV requests, sports |
| `rte` | Registry & Timetabling — timetable, schedule changes, modules, classrooms |
| `resources` | Library books, borrow requests, department contacts |

---

## 🗄️ Database Structure

### Core Models

| Model | Key Fields | Purpose |
|---|---|---|
| **User** | username, email, password, role, status, department, semester, adminSection, profileImage, coverPhoto, bio | All platform users |
| **Attendance** | student, date, time, room, status (Present/Absent), markedBy | Daily attendance records |
| **AttendanceReportRequest** | student, reason, status (pending/fulfilled/rejected), adminNote | Attendance correction requests |
| **Timetable** | day, startTime, endTime, classType, module, moduleName, moduleCode, lecturer, group, room, roomName | Weekly class schedule |
| **Module** | code, name | Academic module master list |
| **Group** | name | Section groups (e.g., "Section A + Section B") |
| **Classroom** | name, capacity, facilities, manualBlocks | Room inventory |
| **ClassroomRequest** | classroom, requestedBy, day, startTime, endTime, reason, status | Room booking requests |
| **VacantClassroom** | roomName, block, day, capacity, availableFrom, availableTo | Available room finder |
| **ScheduleChange** | period, originalDay/Time/Room, newDay/Time/Room, reason, effectiveDate, status | Timetable modification notices |

### Communication Models

| Model | Key Fields | Purpose |
|---|---|---|
| **Conversation** | isGroup, groupName, participants, lastMessage, deletedBy | Chat conversation containers |
| **Message** | conversation, sender, text, readBy, attachment | Individual chat messages |
| **FriendRequest** | requester, recipient, status | Friendship system |
| **GroupInvite** | conversation, invitedUser, invitedBy, status | Group membership invites |
| **Notification** | recipient, type, title, message, link, read, meta | System-wide notifications (20+ types) |

### Campus Operations Models

| Model | Key Fields | Purpose |
|---|---|---|
| **Announcement** | title, message, priority, department, publishedAt | Campus announcements |
| **Event** | title, description, type (college/community), category, date, venue, organizer, registrationEnabled, capacity, status | Campus events |
| **EventRegistration** | event, user, status | Event sign-ups |
| **CanteenMenu** | name, price, category, image, availability, isSpecialOfTheDay, isPopular | Food menu items |
| **CanteenCredit** | user, amountDue, amountPaid, remainingBalance, paymentStatus, paymentHistory, dueHistory | Student canteen credit tracking |
| **LostFoundItem** | title, type (lost/found), category, location, status, claims | Lost & found items |
| **HelpRequest** | requester, request, attachments, responses | Peer help requests |
| **CctvRequest** | user, location, date, timeFrom, timeTo, reason, status | CCTV footage requests |
| **Book** | name, author, shelf, category, cover | Library book catalog |
| **BorrowRequest** | book, requestedBy, studentIdNumber, returnBy, status | Book borrowing workflow |
| **SportsItem** | name, icon, totalQuantity | Sports equipment inventory |
| **SportsRequest** | item, requestedBy, quantity, slot, status | Equipment requests |
| **DepartmentContact** | key, title, phone, email, icon | Department contact directory |
| **VolunteerOpportunity** | event, eventTitle, role, date, slotsAvailable, isOpen | Volunteer openings |
| **VolunteerApplication** | opportunity, student, status | Volunteer sign-ups |
| **VolunteerRecord** | student, event, eventTitle, role, date, hours, verifiedBy | Verified volunteer hours |

---

## 🔌 API Overview

All API endpoints are prefixed with `/api`.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new account (student auto-approved; teacher/staff pending) |
| POST | `/auth/login` | Login with email + password |
| POST | `/auth/logout` | Clear auth cookie |
| GET | `/auth/me` | Get current authenticated user (session restore) |

### Attendance
| Method | Endpoint | Description |
|---|---|---|
| GET | `/attendance` | Get student's attendance records |
| POST | `/attendance` | Mark attendance (admin) |
| GET | `/attendance/report-requests` | Get student's report requests |
| POST | `/attendance/report-requests` | Submit attendance report request |

### Timetable & Modules
| Method | Endpoint | Description |
|---|---|---|
| GET | `/timetable` | Get weekly timetable |
| POST | `/timetable` | Create timetable entry (admin) |
| GET | `/modules` | List all modules |
| POST | `/modules` | Create module (admin) |
| GET | `/classrooms` | List classrooms |
| POST | `/classrooms` | Create classroom (admin) |
| GET | `/classroom-requests` | Get classroom requests |
| POST | `/classroom-requests` | Submit room request |
| GET | `/classrooms/vacant` | Find vacant classrooms |

### Events & Announcements
| Method | Endpoint | Description |
|---|---|---|
| GET | `/events` | List events |
| POST | `/events` | Create event (admin) |
| POST | `/events/:id/register` | Register for event |
| GET | `/announcements` | List announcements |
| POST | `/announcements` | Create announcement (admin) |

### Canteen
| Method | Endpoint | Description |
|---|---|---|
| GET | `/canteen/menu` | Get canteen menu |
| POST | `/canteen/menu` | Add menu item (admin) |
| GET | `/canteen/credits` | Get credit records |
| POST | `/canteen/credits` | Manage credits (admin) |

### Lost & Found
| Method | Endpoint | Description |
|---|---|---|
| GET | `/lost-found` | List lost & found items |
| POST | `/lost-found` | Post lost/found item |
| POST | `/lost-found/:id/claim` | Claim an item |

### Campus Help
| Method | Endpoint | Description |
|---|---|---|
| GET | `/campus-help` | List help requests |
| POST | `/campus-help` | Submit help request |
| POST | `/campus-help/:id/respond` | Respond to request |

### Resources (Library & Sports)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/resources/books` | List library books |
| POST | `/resources/books` | Add book (admin) |
| POST | `/resources/borrow` | Request book borrow |
| GET | `/resources/sports` | List sports items |
| POST | `/resources/sports/request` | Request sports equipment |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| GET | `/chat/users/search?q=` | Search users |
| GET | `/chat/conversations` | List conversations |
| POST | `/chat/conversations/dm` | Start DM (requires friendship) |
| POST | `/chat/conversations/group` | Create group |
| GET | `/chat/conversations/:id/messages` | Get messages (paginated) |
| POST | `/chat/conversations/:id/messages` | Send message |
| PATCH | `/chat/conversations/:id/read` | Mark as read |
| DELETE | `/chat/conversations/:id` | Delete/hide conversation |

### Friends
| Method | Endpoint | Description |
|---|---|---|
| GET | `/friends` | List friends & requests |
| POST | `/friends/request` | Send friend request |
| PATCH | `/friends/:id/accept` | Accept friend request |
| PATCH | `/friends/:id/reject` | Reject friend request |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications` | List notifications |
| PATCH | `/notifications/:id/read` | Mark notification read |
| PATCH | `/notifications/read-all` | Mark all as read |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/users` | List all users |
| PATCH | `/admin/users/:id` | Update user (role, status, profile) |
| DELETE | `/admin/users/:id` | Delete user |
| GET | `/volunteer-records` | List volunteer records |
| POST | `/volunteer-records` | Create volunteer record (admin) |
| GET | `/volunteer-opportunities` | List volunteer opportunities |
| POST | `/volunteer-opportunities` | Create volunteer opportunity |

### AI
| Method | Endpoint | Description |
|---|---|---|
| POST | `/ai/chat` | Chat with Chauttari AI (authenticated, RAG-powered) |

### Upload
| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload/image` | Upload image to ImageKit |
| POST | `/upload/document` | Upload document |

---

## 🧪 Testing Status

> **Note:** Automated test suites are not yet implemented. The `npm test` script in both `server/` and `client/` are currently placeholder commands.

Manual testing has been performed across all major modules:

| Area | Status |
|---|---|
| Authentication flow (register, login, logout, session restore) | ✅ Tested |
| Role-based routing and access control | ✅ Tested |
| Admin CRUD operations (attendance, events, announcements, canteen, resources) | ✅ Tested |
| Student dashboard sections | ✅ Tested |
| Real-time chat (DMs, groups, Socket.IO) | ✅ Tested |
| Friend and group invite system | ✅ Tested |
| Notification system | ✅ Tested |
| Chauttari AI responses | ✅ Tested |
| Image upload and cropping | ✅ Tested |
| Responsive design (mobile/tablet/desktop) | ✅ Tested |

---

## 📱 Responsive Design

The application is built mobile-first with Tailwind CSS 4 and is fully responsive across:

- 📱 **Mobile** — Optimized layouts for small screens with collapsible navigation
- 💻 **Tablet** — Adapted grid layouts for medium screens
- 🖥️ **Desktop** — Full sidebar navigation with expanded panels

Key responsive patterns:
- Sidebar navigation collapses to a hamburger menu on mobile
- Dashboard tabs convert to scrollable pills on smaller screens
- Chat panel slides in as a full-screen overlay on mobile
- Forms and tables adapt to available width
- Dark and light themes supported throughout

---

## 🌐 Deployment / Live Demo

> Update this section with your actual deployment URLs once deployed.

- **Frontend**: Local Development Server
- **Backend**: Local Development Server
- **Database**: Local MongoDB
- **Images**: Local Storage

---

---

## 🧭 Future Improvements

- [ ] Automated unit and integration tests (Jest + React Testing Library)
- [ ] Email notification system for important updates
- [ ] Google OAuth 2.0 login integration (client ID configured but not yet wired)
- [ ] WebSocket reconnection handling and offline message queue
- [ ] Advanced timetable conflict detection
- [ ] Push notifications (PWA / FCM)
- [ ] Multi-language support (English + Nepali)
- [ ] Admin analytics dashboard with usage statistics
- [ ] File sharing in campus help requests
- [ ] Two-factor authentication (2FA)
- [ ] Rate limiting and brute-force protection
- [ ] API documentation with Swagger/OpenAPI

---

## 🤝 Contribution

This project was collaboratively developed by:

Roshan Karki — @frankuard

Suraj Poddar — @surajpoddar-ml

Aayush Pradhan — @Aayushprdhn

Kailash Prasad Shah — @pratik051

Diya Khadka —

Rojika Thapa —

### Branches
- `main` — Main project branch
- `frontend` — Frontend development branch
- `suraj` — Suraj's development branch

---

## 📜 License

This project is licensed under the **ISC License**.

---

## 👨‍💻 Authors

| Name | Role |
|---|---|
| **Diya Khadka** | UI/UX  Designer |
| **Rojika Thapa** | UI/UX  Designer |
| **Aayush Pradhan** | Frontend Developer |
| **Kailsah Prasad Shah** | Frontend Developer|
| **Roshan Karki** | Backend Developer |
| **Suraj Poddar** | Backend Developer |



---

## 🙏 Acknowledgements

- [MongoDB Atlas](https://www.mongodb.com/atlas) — Cloud database hosting
- [ImageKit](https://imagekit.io) — Image CDN and transformations
- [Groq](https://groq.com) — Fast LLM inference for Chauttari AI
- [Lucide Icons](https://lucide.dev) — Beautiful open-source icons
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS framework
- [Socket.IO](https://socket.io) — Real-time bidirectional event-based communication
- [Express.js](https://expressjs.com) — Fast, minimal web framework for Node.js
- [Mongoose](https://mongoosejs.com) — Elegant MongoDB object modeling for Node.js
- [React](https://react.dev) — A JavaScript library for building user interfaces
- [Vite](https://vitejs.dev) — Next generation frontend tooling

---

<div align="center">


*Chauttari — Where your campus comes together.*

</div>
