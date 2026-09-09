import React, { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu, Users, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import navConfig from '../../data/navConfig';
import { themes } from '../../data/themes';
import { disconnectSocket } from '../../socket/socket';
import { DEV_CORPS_PORTAL_ID } from '../../data/devcorpsConfig';

const roleLabels = {
  student: 'Student Portal',
  teacher: 'Teacher Portal',
  staff: 'Staff Portal',
  admin: 'Admin Portal',
  devcorpsCommunity: 'DevCorps Community Portal',
};

// Shown in place of the old "@handle" line, admin accounts only —
// mirrors the department picker's own section names.
const ADMIN_SECTION_LABELS = {
  super: 'Super Admin',
  canteen: 'Canteen Admin',
  ssd: 'SSD Admin',
  rte: 'RTE Admin',
  resources: 'Resources Admin',
};

const CHAUTARI_LOGO_URL = 'https://ik.imagekit.io/ltf9bjszh/logos/chatariiilogoooorightisde.jpeg';

const Sidebar = ({
  activeTab: controlledActiveTab,
  onTabChange,
  navItems,
  // Optional controlled mobile-drawer state — lets a parent (e.g. a sticky
  // navbar) own the open/close trigger instead of Sidebar's own floating
  // button. Falls back to the old internal-state behavior untouched for
  // any screen that doesn't pass these.
  mobileOpen: controlledMobileOpen,
  onMobileOpenChange,
}) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const t = themes[theme] || themes.light;

  const [collapsed, setCollapsed] = useState(false); // desktop mini-rail toggle
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const isMobileControlled = controlledMobileOpen !== undefined;
  const mobileOpen = isMobileControlled ? controlledMobileOpen : internalMobileOpen;
  const setMobileOpen = (next) => {
    if (isMobileControlled) onMobileOpenChange?.(next);
    else setInternalMobileOpen(next);
  };
  const [internalActiveId, setInternalActiveId] = useState('dashboard');
  const navRef = useRef(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  const activeId = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveId;

  const role = user?.portal === DEV_CORPS_PORTAL_ID ? 'devcorpsCommunity' : (user?.role || 'student');
  // Optional override so a scoped panel (e.g. a department admin's own
  // mini nav) can pass its own short item list — falls back to the
  // untouched role-based lookup everywhere else, unchanged.
  // Items flagged `devcorpsAdminOnly` (e.g. DevCorps Manage Events) are
  // hidden unless the signed-in user is a portal admin; items flagged
  // `devcorpsMemberOnly` (Manage User, Workshop Release) are hidden from the
  // portal admin and shown only to the five community member accounts.
  const isPortalMember = role === 'devcorpsCommunity' && user?.portalRole === 'member';
  const isDevCorpsAdmin = role === 'devcorpsCommunity' && user?.portalRole === 'admin';

  const baseItems = navItems || navConfig[role] || navConfig.student;
  let items = baseItems.filter(
    (item) =>
      (!item.devcorpsAdminOnly || isDevCorpsAdmin) &&
      (!item.devcorpsMemberOnly || isPortalMember)
  );

  // Dynamic "Community" section — the user panel equivalent of the community
  // portal's Manage User. Only appears once the user has at least one
  // APPROVED community membership (guaranteed by the backend, which decides
  // what lands in user.communityMemberships). Each approved community is a
  // child item; rejected/pending requests never show up here.
  const approvedCommunities = Array.isArray(user?.communityMemberships)
    ? user.communityMemberships
    : [];
  // The Community section is a feature of the Student/Teacher user panels
  // (the community-* and community-requests routes live in those dashboards).
  const supportsCommunityPanel = role === 'student' || role === 'teacher';
  if (supportsCommunityPanel && approvedCommunities.length > 0) {
    const communitySection = {
      id: 'community',
      label: 'Community',
      icon: Users,
      children: approvedCommunities.map((membership) => ({
        id: `community-${membership.communityId}`,
        label: membership.communityName,
      })),
    };
    const insertAt = items.findIndex((item) => item.id === 'dashboard') + 1 || 1;
    items = [
      ...items.slice(0, insertAt),
      communitySection,
      ...items.slice(insertAt),
    ];
  }
  const username = user?.username || '';
  // Second line under the name: admin accounts show their department
  // ("Resource Admin", "SSD Admin"...), everyone else shows nothing here
  // (the role caption below already says "Student Portal" etc.).
  const subLabel = role === 'admin' ? (ADMIN_SECTION_LABELS[user?.adminSection] || 'Admin') : '';

  // Tracks which nav items with `children` are expanded (e.g. DevCorps
  // "Communities" reveals the five member communities when open). Starts
  // with the group that owns the active child if there is one (landing
  // directly on /devcorps/community-ai-horizon keeps the menu open).
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = new Set();
    items.forEach((item) => {
      if (
        Array.isArray(item.children) &&
        item.children.some((c) => c.id === activeId)
      ) {
        initial.add(item.id);
      }
    });
    return initial;
  });

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const checkOverflow = () => {
      setHasMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
    };
    checkOverflow();
    el.addEventListener('scroll', checkOverflow, { passive: true });
    window.addEventListener('resize', checkOverflow);
    return () => {
      el.removeEventListener('scroll', checkOverflow);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [items, collapsed]);

  // If the active tab is inside an expandable group, keep that group open.
  // Dynamic items (e.g. the user's Community section loading after /auth/me)
  // need this so the active child is visible even on a hard refresh.
  useEffect(() => {
    if (!activeId) return;
    const owningGroup = items.find(
      (item) => Array.isArray(item.children) && item.children.some((c) => c.id === activeId)
    );
    if (owningGroup) {
      setExpandedGroups((prev) => {
        if (prev.has(owningGroup.id)) return prev;
        const next = new Set(prev);
        next.add(owningGroup.id);
        return next;
      });
    }
  }, [items, activeId]);

  // Close the mobile drawer automatically if the viewport grows into desktop size
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handleChange = (e) => {
      if (e.matches) setMobileOpen(false);
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  const handleItemClick = (id) => {
    if (controlledActiveTab === undefined) setInternalActiveId(id);
    // Keep the expandable group open when one of its children is activated
    // (e.g. a DevCorps community under the "Communities" item, or an approved
    // community under the user's dynamic Community section).
    const owningGroup = items.find(
      (item) => Array.isArray(item.children) && item.children.some((c) => c.id === id)
    );
    if (owningGroup) {
      setExpandedGroups((prev) => {
        if (prev.has(owningGroup.id)) return prev;
        const next = new Set(prev);
        next.add(owningGroup.id);
        return next;
      });
    }
    onTabChange?.(id);
    setMobileOpen(false); // always close the drawer on nav; no-op on desktop
  };

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile hamburger trigger — only rendered when nothing else (e.g.
          the sticky navbar) is controlling the drawer. This is the old
          floating-fixed-button behavior, kept as a fallback. */}
      {!isMobileControlled && !mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-full shadow-md lg:hidden"
          style={{
            backgroundColor: t.sidebarBg,
            color: t.sidebarText,
            border: `1px solid ${t.sidebarBorder || t.border}`,
          }}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
      )}

      {/* Backdrop — only rendered on mobile while the drawer is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[260px] flex-col self-start
          transition-transform duration-300 select-none
          lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 lg:transition-[width] lg:duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'lg:w-[4.5rem]' : 'lg:w-[260px]'}`}
        style={{
          backgroundColor: t.sidebarBg,
          borderRight: `1px solid ${t.sidebarBorder || t.border}`,
          color: t.sidebarText,
        }}
      >
        {/* Profile header */}
        <div className={`px-4 pt-5 pb-4 ${collapsed ? 'lg:flex lg:flex-col lg:items-center' : ''}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'lg:flex-col lg:gap-2' : ''}`}>
            {/* Chautari logo, filling the circle edge-to-edge */}
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-black">
              <img
                src={CHAUTARI_LOGO_URL}
                alt="Chautari"
                className="h-full w-full object-cover object-center"
              />
            </div>
            <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="truncate text-[15px] font-extrabold" style={{ color: t.sidebarText }}>
                CHAUTARI
              </p>
              {subLabel && (
                <p className="truncate text-xs font-medium" style={{ color: t.sidebarMuted }}>
                  {subLabel}
                </p>
              )}
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.sidebarMuted }}>
                {roleLabels[role]}
              </p>
            </div>

            {/* Desktop-only collapse button */}
            {!collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors lg:flex"
                style={{ color: t.sidebarMuted, backgroundColor: t.sidebarHover }}
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={14} />
              </button>
            )}

            {/* Mobile-only close button */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors lg:hidden"
              style={{ color: t.sidebarMuted, backgroundColor: t.sidebarHover }}
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>
          {collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="mt-2 hidden h-7 w-7 items-center justify-center rounded-full lg:flex"
              style={{ color: t.sidebarMuted, backgroundColor: t.sidebarHover }}
              aria-label="Expand sidebar"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Nav */}
        <div className="relative min-h-0 flex-1">
          <div ref={navRef} className="h-full overflow-y-auto px-3 pb-2">
            <nav className="flex flex-col gap-1" aria-label="Sidebar Navigation">
              {items.map((item) => {
                const Icon = item.icon;
                const hasChildren = Array.isArray(item.children) && item.children.length > 0;

                // Expandable group (e.g. DevCorps "Communities" -> the five
                // member communities as their own nav items).
                if (hasChildren) {
                  const isExpanded = expandedGroups.has(item.id);
                  const isActive =
                    activeId === item.id ||
                    item.children.some((c) => c.id === activeId);
                  return (
                    <Fragment key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          // In the collapsed mini-rail, first widen the sidebar
                          // so the child items actually have room to render.
                          if (collapsed) setCollapsed(false);
                          setExpandedGroups((prev) => {
                            const next = new Set(prev);
                            if (next.has(item.id)) next.delete(item.id);
                            else next.add(item.id);
                            return next;
                          });
                        }}
                        title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-left text-[13px] font-bold transition-all duration-200 ${
                          collapsed ? 'lg:justify-center lg:rounded-xl lg:px-2 lg:gap-0' : ''
                        }`}
                        style={{
                          backgroundColor: isActive ? t.sidebarActiveBg : 'transparent',
                          color: isActive ? t.sidebarActiveText : t.sidebarText,
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = t.sidebarHover;
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Icon
                          size={18}
                          className="shrink-0"
                          style={{ color: isActive ? t.sidebarActiveText : t.sidebarMuted }}
                        />
                        <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                        <ChevronDown
                          size={14}
                          className={`ml-auto shrink-0 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          } ${collapsed ? 'lg:hidden' : ''}`}
                          style={{ color: isActive ? t.sidebarActiveText : t.sidebarMuted }}
                        />
                      </button>

                      {isExpanded && !collapsed && (
                        <div className="flex flex-col gap-1 pl-4">
                          {item.children.map((child) => {
                            const isChildActive = activeId === child.id;
                            return (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => handleItemClick(child.id)}
                                className="flex items-center gap-3 rounded-full py-2 pl-5 pr-4 text-left text-[12.5px] font-bold transition-all duration-200"
                                style={{
                                  backgroundColor: isChildActive ? t.sidebarActiveBg : 'transparent',
                                  color: isChildActive ? t.sidebarActiveText : t.sidebarMuted,
                                }}
                                onMouseEnter={(e) => {
                                  if (!isChildActive) e.currentTarget.style.backgroundColor = t.sidebarHover;
                                }}
                                onMouseLeave={(e) => {
                                  if (!isChildActive) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <span
                                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                                  style={{
                                    backgroundColor: isChildActive ? t.sidebarActiveText : t.sidebarMuted,
                                  }}
                                />
                                <span className="truncate">{child.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </Fragment>
                  );
                }

                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-left text-[13px] font-bold transition-all duration-200 ${
                      collapsed ? 'lg:justify-center lg:rounded-xl lg:px-2 lg:gap-0' : ''
                    }`}
                    style={{
                      backgroundColor: isActive ? t.sidebarActiveBg : 'transparent',
                      color: isActive ? t.sidebarActiveText : t.sidebarText,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = t.sidebarHover;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Icon
                      size={18}
                      className="shrink-0"
                      style={{ color: isActive ? t.sidebarActiveText : t.sidebarMuted }}
                    />
                    <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {hasMoreBelow && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-1 pt-8">
              <div className="absolute inset-x-0 bottom-0 h-12" style={{ background: `linear-gradient(to top, ${t.sidebarBg}, transparent)` }} />
              <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-black text-white">
                <ChevronDown size={14} strokeWidth={2.5} />
              </span>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="border-t p-3" style={{ borderColor: t.sidebarBorder || t.border }}>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
              collapsed ? 'lg:justify-center lg:gap-0' : ''
            }`}
            style={{ color: t.sidebarMuted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = t.sidebarHover;
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = t.sidebarMuted;
            }}
          >
            <LogOut size={17} />
            <span className={collapsed ? 'lg:hidden' : ''}>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;