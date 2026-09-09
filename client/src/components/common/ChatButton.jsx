import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { DEV_CORPS_PORTAL_ID } from '../../data/devcorpsConfig';

const ChatButton = ({ t }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || 'student';

  // DevCorps Community Portal accounts (the DevCorps admin + the five member
  // communities) use the DevCorps chat page — their role is 'staff', but they
  // must never land on the staff dashboard.
  const chatPath = user?.portal === DEV_CORPS_PORTAL_ID
    ? '/devcorps/chat'
    : `/${role}/chat`;

  const {
    totalUnread,
    pendingGroupInviteCount,
    pendingFriendRequestCount,
  } = useChat();

  // Combined badge — unread messages + pending group invites + pending
  // friend requests, all live via socket (see ChatContext's socket
  // useEffect: message:new, conversation:updated, friend:request).
  const badgeCount = totalUnread + pendingGroupInviteCount + pendingFriendRequestCount;

  return (
    <button
      type="button"
      onClick={() => navigate(chatPath)}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
      style={{ color: t.textPrimary }}
    >
      <MessageCircle size={19} />
      {badgeCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </button>
  );
};

export default ChatButton;