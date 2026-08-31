import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import ChatPanel from './ChatPanel';

const ChatButton = ({ t }) => {
  const {
    totalUnread,
    pendingFriendRequestCount,
    pendingGroupInviteCount,
    isChatOpen,
    openChat,
    closeChat,
  } = useChat();

  // Combined badge — unread messages + pending friend requests + pending
  // group invites, so the icon reflects "anything needs your attention"
  // as a whole, not just unread chats.
  const badgeCount = totalUnread + pendingFriendRequestCount + pendingGroupInviteCount;

  return (
    <>
      <button
        type="button"
        onClick={() => openChat('chats')}
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

      {isChatOpen && <ChatPanel t={t} onClose={closeChat} />}
    </>
  );
};

export default ChatButton;