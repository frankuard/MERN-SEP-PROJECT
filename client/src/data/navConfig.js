import {
  Home, Search, HelpCircle, Package, FileText, Coffee, MapPin,
  Megaphone, Calendar, Inbox, BarChart3, MessageSquare, BookOpen,
  AlertTriangle, ClipboardList, CheckSquare, Settings, LogOut,
   PlusCircle, TrendingUp, Bell,
  Building2, School, GraduationCap, Clock, Video, UtensilsCrossed, Users    // ← add UtensilsCrossed here
} from "lucide-react";

const navConfig = {
  student: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "events", label: "Events", icon: Calendar },
    { id: "canteen", label: "Canteen", icon: Coffee },
    { id: "lost-found", label: "Lost & Found", icon: Search },
    { id: "campus-help", label: "Help", icon: HelpCircle },
    { id: "ssd-help", label: "SSD Help", icon: GraduationCap },
    { id: "rte", label: "RTE", icon: Clock },
    { id: "resources", label: "Resources", icon: BookOpen },
  ],
  teacher: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "events", label: "Events", icon: Calendar },
    { id: "requests", label: "Student Requests", icon: Inbox },
    { id: "resources", label: "Resources", icon: BookOpen },
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
  { id: "approvals", label: "Pending Approvals", icon: CheckSquare },
],
};
 

export default navConfig;