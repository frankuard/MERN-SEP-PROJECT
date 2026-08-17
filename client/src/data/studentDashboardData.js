// Initial classroom pool
export const CLASSROOM_POOL = [
  { id: 'sr01', name: 'SR01 Wolves', block: 'Block A, 1st Floor', capacity: 60, facilities: 'Projector · AC · Whiteboard' },
  { id: 'sr02', name: 'SR02 Compton', block: 'Block A, 2nd Floor', capacity: 55, facilities: 'Smart Screen · Audio' },
  { id: 'mechi', name: 'Mechi', block: 'Block B, Ground Floor', capacity: 45, facilities: 'Whiteboard · Mic System' },
  { id: 'kankai', name: 'Kankai', block: 'Block B, 1st Floor', capacity: 50, facilities: 'Projector · Smart Podium' },
  { id: 'baraha', name: 'Baraha', block: 'Block C, 2nd Floor', capacity: 40, facilities: 'Whiteboard · High-speed WiFi' },
  { id: 'lt01', name: 'LT01 Wulfurana', block: 'Main Lecture Hall', capacity: 120, facilities: 'Dual Projectors · Stage · AC' },
];

// College Events
export const INITIAL_COLLEGE_EVENTS = [
  {
    id: 'ce1',
    name: 'Devfest Program',
    date: 'Aug 26',
    time: '10:00 AM',
    venue: 'Main Auditorium',
    badge: 'Tech Conference',
    iconType: 'mic',
    registered: false,
    desc: 'Annual flagship technical symposium featuring keynotes, panel discussions, and student project exhibitions.',
  },
  {
    id: 'ce2',
    name: 'FUTURMA',
    date: 'Sep 20',
    time: '11:30 AM',
    venue: 'Tech Hall Block B',
    badge: 'Robotics & AI',
    iconType: 'cpu',
    registered: false,
    desc: 'Cutting-edge innovation expo showcasing autonomous robotics, hardware hacks, and machine learning prototypes.',
  },
  {
    id: 'ce3',
    name: 'DASHAIN CARNIVAL',
    date: 'Sep 27',
    time: '1:00 PM',
    venue: 'College Ground',
    badge: 'Annual Fest',
    iconType: 'trophy',
    registered: false,
    desc: 'Inter-department cultural celebration with acoustic live music, art installations, and traditional food stalls.',
  },
];

// Community Events
export const INITIAL_COMMUNITY_EVENTS = [
  {
    id: 'cme1',
    name: 'AI Horizon Workshop',
    org: 'AI Horizon',
    date: 'Aug 22',
    time: '2:00 PM',
    venue: 'LT01 Wulfurana',
    badge: 'Workshop',
    iconType: 'brain',
    joined: false,
    desc: 'Hands-on generative AI and LLM prompt engineering masterclass guided by senior student mentors.',
  },
  {
    id: 'cme2',
    name: 'Competitive Coding Sprint',
    org: 'Coding Club',
    date: 'Aug 24',
    time: '3:30 PM',
    venue: 'Lab 3',
    badge: 'Hackathon',
    iconType: 'code',
    joined: false,
    desc: 'Fast-paced algorithmic challenge focusing on dynamic programming and graph theory problem solving.',
  },
  {
    id: 'cme3',
    name: 'UI/UX Design Jam',
    org: 'Creative Guild',
    date: 'Aug 29',
    time: '1:00 PM',
    venue: 'Design Studio',
    badge: 'Design Session',
    iconType: 'palette',
    joined: false,
    desc: 'Figma wireframing and responsive component styling sprint for next-generation student applications.',
  },
];

// Announcements
export const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'a1',
    title: 'Semester project submission',
    date: 'Aug 25',
    tag: 'Academic',
    urgent: true,
    desc: 'Submit all final phase documentation along with GitHub repository links to your respective advisors.',
  },
  {
    id: 'a2',
    title: "Tomorrow's classes start at 10 AM",
    date: 'Aug 17',
    tag: 'Schedule',
    urgent: false,
    desc: 'Due to scheduled morning faculty meeting, periods 1 and 2 will be adjusted into the afternoon schedule.',
  },
  {
    id: 'a3',
    title: 'Library closed after 4 PM today',
    date: 'Today',
    tag: 'Notice',
    urgent: false,
    desc: 'Routine server maintenance and quarterly inventory stock check taking place in central library.',
  },
  {
    id: 'a4',
    title: 'Scholarship renewal verification deadline',
    date: 'Aug 28',
    tag: 'Admin',
    urgent: true,
    desc: 'Submit renewed grade sheets and recommendation letters at Room 102 before 3:00 PM.',
  },
];

// Lost & Found Items
export const INITIAL_LOST_FOUND = [
  {
    id: 'lf1',
    title: 'Rojika ko bag',
    location: 'Library, 2nd Floor Table 4',
    time: '2 hours ago',
    category: 'Bags',
    status: 'Unclaimed',
  },
  {
    id: 'lf2',
    title: 'Keychain with blue tag',
    location: 'Block A, Room 204',
    time: '4 hours ago',
    category: 'Keys',
    status: 'Unclaimed',
  },
  {
    id: 'lf3',
    title: 'Phone (Samsung black case)',
    location: 'Cafeteria counter',
    time: 'Yesterday',
    category: 'Electronics',
    status: 'Claimed',
  },
];

// Campus Help Requests
export const INITIAL_CAMPUS_HELP = [
  {
    id: 'ch1',
    request: 'Can someone share today’s DBMS notes?',
    author: 'Ankit Sharma',
    sem: 'CS 5th Sem',
    replies: 3,
    time: '1h ago',
  },
  {
    id: 'ch2',
    request: 'Need a scientific calculator for tomorrow’s exam.',
    author: 'Priya Shrestha',
    sem: 'BBA 2nd Sem',
    replies: 1,
    time: '3h ago',
  },
  {
    id: 'ch3',
    request: 'Looking for a study partner for AI midterms.',
    author: 'Rohan KC',
    sem: 'BCA 4th Sem',
    replies: 4,
    time: '5h ago',
  },
];

// Full Canteen Menu Items
export const CANTEEN_MENU = [
  { id: 'cm0', name: 'Diya Ko Royal Biryani', price: 220, category: 'Meals', available: true },
  { id: 'cm1', name: 'Aalu Nimki', price: 50, category: 'Snacks', available: true },
  { id: 'cm2', name: 'Chatpatey', price: 50, category: 'Snacks', available: true },
  { id: 'cm3', name: 'Chicken Chatpatey', price: 100, category: 'Snacks', available: true },
  { id: 'cm4', name: 'Fried Rice', price: 100, category: 'Meals', available: true },
  { id: 'cm5', name: 'Chicken Chowmein', price: 100, category: 'Momo & Noodles', available: true },
  { id: 'cm6', name: 'Veg Chowmein', price: 60, category: 'Momo & Noodles', available: true },
  { id: 'cm7', name: 'Samosa', price: 50, category: 'Snacks', available: true },
  { id: 'cm8', name: 'Lassi', price: 80, category: 'Beverages', available: true },
  { id: 'cm9', name: 'Thuppa', price: 80, category: 'Momo & Noodles', available: true },
  { id: 'cm10', name: 'Veg Momo', price: 80, category: 'Momo & Noodles', available: true },
  { id: 'cm11', name: 'Chicken Momo', price: 120, category: 'Momo & Noodles', available: true },
];

export const CANTEEN_SPECIALS_LIST = [
  { id: 1, name: 'Diya Ko Royal Biryani', price: 220, isBold: true },
  { id: 2, name: 'Chicken Momo', price: 120, isBold: false },
  { id: 3, name: 'Aalu Nimki', price: 50, isBold: false },
];

// Official Campus Social Media Posts Feed
export const INITIAL_CAMPUS_POSTS = [
  {
    id: 'post_1',
    author: 'Biratnagar International College',
    handle: '@bic_biratnagar',
    avatar: '🏫',
    time: '2 hours ago',
    category: 'Campus Reels & Vibes',
    caption: 'Register gareu tah? 🤩 XPERIA: Experience The Intelligence registration is officially LIVE! Join us for an adrenaline-fueled tech fest packed with student hacks, robotics showdowns, and interactive live workshops.',
    image: '/post-1.png',
    likes: 142,
    comments: 18,
    shares: 9,
    liked: false,
    tag: '#XPERIA2026 #BICStudents #CampusLife',
  },
  {
    id: 'post_2',
    author: 'BIC International MBA Department',
    handle: '@bic_mba',
    avatar: '🎓',
    time: 'Yesterday at 04:30 PM',
    category: 'Guest Speaker Series',
    caption: 'Guest Speaker Session: “IPR Essentials: Trademarks, Copyright and Patents for Business and Digital Content” led by distinguished guest Mr. Kunal Singh Chauhan (Section Officer, High Court of Nepal). Session kicks off this Friday 07:00 AM onwards at BIC Hall.',
    image: '/post-2.png',
    likes: 79,
    comments: 2,
    shares: 14,
    liked: false,
    tag: '#IPREssentials #GuestLecture #HighCourtNepal #BICMBA',
  },
  {
    id: 'post_3',
    author: 'BIC Research & Academic Guild',
    handle: '@bic_research',
    avatar: '📚',
    time: '2 days ago',
    category: 'Academic Insights',
    caption: 'Guest Speaker Session: “Applied Research in Business” featuring Dr. Chandra Upadhyay (Assistant Professor, Tribhuwan University). A comprehensive seminar guiding our scholars on rigorous empirical methodologies and modern market case studies.',
    image: '/post-3.png',
    likes: 118,
    comments: 6,
    shares: 11,
    liked: false,
    tag: '#AppliedResearch #BusinessAnalytics #TribhuwanUniversity #BIC',
  },
  {
    id: 'post_4',
    author: 'AI Horizon & BIC Devcorps',
    handle: '@bic.ai_horizon',
    avatar: '🤖',
    time: '3 days ago',
    category: 'Tech Summits & Partnerships',
    caption: 'Official Partnership Announcement! 🤝 Proud to partner with Birat Sports Zone, Goti Soda, The Kush Garden, and Laxmi iStore for XPERIA: Experience The Intelligence at LT-01 Wulfurana. Grab your passes early!',
    image: '/post-4.png',
    likes: 215,
    comments: 24,
    shares: 32,
    liked: false,
    tag: '#AIHorizon #Devcorps #BiratSportsZone #Sponsorships',
  },
];

// Initial Library Books
export const INITIAL_LIBRARY_BOOKS = [
  { id: 'b1', name: 'Database System Concepts', author: 'Silberschatz, Korth & Sudarshan', shelf: 'CS-12', available: true, issuedTo: null },
  { id: 'b2', name: 'Introduction to Algorithms (CLRS)', author: 'Cormen, Leiserson & Rivest', shelf: 'CS-04', available: false, issuedTo: 'Due in 3 days' },
  { id: 'b3', name: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell & Peter Norvig', shelf: 'AI-01', available: true, issuedTo: null },
  { id: 'b4', name: 'Principles of Marketing', author: 'Philip Kotler & Gary Armstrong', shelf: 'MKT-08', available: true, issuedTo: null },
  { id: 'b5', name: 'Computer Networking: A Top-Down Approach', author: 'James Kurose & Keith Ross', shelf: 'NET-03', available: true, issuedTo: null },
  { id: 'b6', name: 'Business Research Methods', author: 'Donald R. Cooper', shelf: 'RES-02', available: true, issuedTo: null },
];

// Initial Volunteering History for SSD
export const INITIAL_VOLUNTEERING_HISTORY = [
  { id: 'v1', role: 'Campus Orientation Peer Mentor', event: 'Freshers Induction 2026', hours: 12, date: 'Aug 2026', verified: true },
  { id: 'v2', role: 'Blood Donation Camp Coordinator', event: 'Red Cross & Campus Health Drive', hours: 8, date: 'Jul 2026', verified: true },
  { id: 'v3', role: 'TechFest IT Logistics Volunteer', event: 'Annual TechFest 2026', hours: 16, date: 'May 2026', verified: true },
];

// Upcoming Events / Volunteer Requests for SSD
export const INITIAL_VOLUNTEER_REQUESTS = [
  {
    id: 'vr1',
    eventTitle: 'XPERIA 2026 Tech Fest Logistics & Stage Support',
    date: 'Aug 26 - Aug 27',
    slotsOpen: 5,
    department: 'AI Horizon & SSD',
    role: 'Registration desk, stage audio management, participant coordination',
    applied: false,
  },
  {
    id: 'vr2',
    eventTitle: 'Annual Inter-College Sports Week Referee & Scorekeeper',
    date: 'Sep 05 - Sep 08',
    slotsOpen: 3,
    department: 'Sports & Student Affairs',
    role: 'Match timekeeping, score tracking, medical first-aid booth support',
    applied: false,
  },
  {
    id: 'vr3',
    eventTitle: 'Community Blood Donation & Health Screening Drive',
    date: 'Sep 15',
    slotsOpen: 8,
    department: 'Red Cross Youth Circle & SSD',
    role: 'Donor queue guidance, refreshment distribution, certificate dispatch',
    applied: false,
  },
  {
    id: 'vr4',
    eventTitle: 'Guest Speaker Series: Academic Protocol & Hospitality',
    date: 'Sep 22',
    slotsOpen: 2,
    department: 'BIC Academic Guild',
    role: 'Speaker reception, presentation clicker support, audience Q&A mics',
    applied: false,
  },
];

// Attendance Records Log
export const INITIAL_ATTENDANCE_RECORDS = [
  { date: 'Today (Aug 17)', status: 'Present', time: '09:45 AM', room: 'SR01 Wolves' },
  { date: 'Aug 16', status: 'Present', time: '09:50 AM', room: 'LT01 Wulfurana' },
  { date: 'Aug 15', status: 'Present', time: '09:40 AM', room: 'SR02 Compton' },
  { date: 'Aug 14', status: 'Absent', time: '-', room: '-' },
  { date: 'Aug 13', status: 'Present', time: '10:05 AM', room: 'Baraha' },
];
