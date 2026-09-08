import {
  Home, Search, HelpCircle, Package, FileText, Coffee, MapPin,
  Megaphone, Calendar, Inbox, BarChart3, MessageSquare, BookOpen,
  AlertTriangle, ClipboardList, Settings, LogOut,
   PlusCircle, TrendingUp, Bell,
  Building2, School, GraduationCap, Clock, Video, UtensilsCrossed, Users    // ← add UtensilsCrossed here
} from "lucide-react";

const navConfig = {
  student: [
    { id: "dashboard", label: "Dashboard", icon: Home },
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
    // Communities — DevCorps-only expandable item. Clicking it reveals the
    // five member communities as their own navigation items.
    {
      id: 'communities',
      label: 'Communities',
      icon: Users,
      children: [
        { id: 'community-ai-horizon', label: 'AI Horizon' },
        { id: 'community-devsphere', label: 'DevSphere' },
        { id: 'community-bic-converge', label: 'BIC Converge' },
        { id: 'community-lenspire', label: 'Lenspire' },
        { id: 'community-incognitous', label: 'Incognitous' },
      ],
    },
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