import {
  Home, Search, HelpCircle, Package, FileText, Coffee, MapPin,
  Megaphone, Calendar, Inbox, BarChart3, MessageSquare, BookOpen,
  AlertTriangle, ClipboardList, Settings, LogOut,
   PlusCircle, TrendingUp, Bell,
  Building2, School, GraduationCap, Clock, Video, UtensilsCrossed, Users,
  UserCog, Presentation, BookMarked,
} from "lucide-react";

const navConfig = {
  student: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "coursework", label: "Coursework", icon: BookMarked },
    { id: "events", label: "Events", icon: Calendar },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "canteen", label: "Canteen", icon: Coffee },
    { id: "lost-found", label: "Lost & Found", icon: Search },
    { id: "ssd-help", label: "SSD Help", icon: GraduationCap },
    { id: "rte", label: "Routine & Timetable", icon: Clock },
    { id: "resources", label: "Resources", icon: BookOpen },
    { id: "campus-help", label: "Help", icon: HelpCircle },
  ],
  teacher: [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'coursework', label: 'Coursework', icon: BookMarked },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'canteen', label: 'Canteen', icon: Coffee },
    { id: 'lost-found', label: 'Lost & Found', icon: Search },
    { id: 'rte', label: 'Routine & Timetable', icon: Clock },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'campus-help', label: 'Help', icon: HelpCircle },
  ],

  devcorpsCommunity: [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'documentation', label: 'Documentation', icon: FileText },
    // Communities — DevCorps ADMIN ONLY. The five member communities'
    // portals had their sidebar "Community" section replaced by "Manage
    // User" (see below), so this expandable menu stays visible just for the
    // portal admin who oversees all five communities.
    {
      id: 'communities',
      label: 'Communities',
      icon: Users,
      devcorpsAdminOnly: true,
      children: [
        { id: 'community-ai-horizon', label: 'AI Horizon' },
        { id: 'community-devsphere', label: 'DevSphere' },
        { id: 'community-bic-converge', label: 'BIC Converge' },
        { id: 'community-lenspire', label: 'Lenspire' },
        { id: 'community-incognitous', label: 'Incognitous' },
      ],
    },
    // The five member communities (portalRole 'member') get Manage User in
    // place of the old Communities menu, plus a dedicated Workshop Release
    // screen. None of it is shown to the DevCorps portal admin. The About
    // Community + Constitution content lives INSIDE Manage User as read-only
    // tabs — these community accounts cannot edit their profile or replace/
    // delete their constitution (admin-only, from the Communities menu).
    { id: 'manage-user', label: 'Manage User', icon: UserCog, devcorpsMemberOnly: true },
    { id: 'workshop-release', label: 'Workshop Release', icon: Presentation, devcorpsMemberOnly: true },
    // Exclusive to the DevCorps portal admin (user.portalRole === 'admin').
    // Sidebar hides this item for regular community members.
    { id: 'manage-events', label: 'Manage Events', icon: Calendar, devcorpsAdminOnly: true },
  ],

    admin: [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "manage-announcements", label: "Manage Announcements", icon: Megaphone },
  { id: "manage-attendance", label: "Manage Attendance", icon: ClipboardList },
  { id: "manage-ssd", label: "Manage SSD", icon: GraduationCap },
  { id: "manage-timetable", label: "Manage Timetable", icon: Clock },
  { id: "manage-events", label: "Manage Events", icon: Calendar },
  { id: "manage-campus-help", label: "Manage Campus Help", icon: MessageSquare },
  { id: "manage-canteen", label: "Manage Canteen", icon: UtensilsCrossed },
  { id: "manage-resources", label: "Manage Resources", icon: BookOpen },
  { id: "manage-lost-found", label: "Manage Lost & Found", icon: Search }, 
  { id: 'manage-users',label: 'Manage Users',icon: Users},
],
};
 

export default navConfig;