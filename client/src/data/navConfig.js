import {
  Home, Search, HelpCircle, Package, FileText, Coffee, MapPin,
  Megaphone, Calendar, Inbox, BarChart3, MessageSquare, BookOpen,
  AlertTriangle, ClipboardList, CheckSquare, Settings, LogOut,
  ChevronLeft, ChevronRight, Menu, X, Sun, Moon, PlusCircle, TrendingUp, Bell,
  Building2, School, GraduationCap,
} from "lucide-react";

const navConfig = {
  student: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "events", label: "Events", icon: Calendar },
    { id: "ssd-help", label: "SSD Help", icon: GraduationCap },
    { id: "lost-found", label: "Lost & Found", icon: Search },
    { id: "campus-posts", label: "Posts", icon: FileText },
    { id: "borrow-lend", label: "Borrow/Lend", icon: Package },
    { id: "canteen", label: "Canteen", icon: Coffee },
    { id: "vacant-classes", label: "Vacant Classes", icon: School },
    { id: "location", label: "Locations", icon: MapPin },
    { id: "campus-help", label: "Help", icon: HelpCircle },
  ],
  teacher: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "events", label: "Events", icon: Calendar },
    { id: "requests", label: "Student Requests", icon: Inbox },
    {
      id: "polls", label: "Polls", icon: BarChart3,
      children: [
        { id: "poll-create", label: "Create Poll", icon: PlusCircle },
        { id: "poll-results", label: "Poll Results", icon: TrendingUp },
      ],
    },
    { id: "qna", label: "Q & A", icon: MessageSquare },
    { id: "resources", label: "Resources", icon: BookOpen },
  ],
  staff: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "report", label: "Report Problem", icon: AlertTriangle },
    { id: "tracker", label: "Complaint Tracker", icon: ClipboardList },
    { id: "notices", label: "Notices", icon: FileText },
  ],
  admin: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "approvals", label: "Pending Approvals", icon: CheckSquare },
  ],
};
 
const roleNames = {
  student: "Roshan Karki",
  teacher: "Rojika Thapa",
  staff: "Suraj Poddar",
  admin: "Diya Khadka",
};

export default navConfig;