import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import chatApi from '../api/chatApi';
import friendApi from '../api/friendApi';
import { getSocket } from '../socket/socket';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const myId = user?._id || user?.id;

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [unreadByConversation, setUnreadByConversation] = useState({});
  const [loadingConversations, setLoadingConversations] = useState(false);

  // -------- Friends / friend requests --------
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ incoming: [], outgoing: [] });
  const [loadingFriends, setLoadingFriends] = useState(false);

  // -------- Group invites --------
  const [groupInvites, setGroupInvites] = useState([]);
  const [loadingGroupInvites, setLoadingGroupInvites] = useState(false);

  const activeConversationIdRef = useRef(null);
  useEffect(() => { activeConversationIdRef.current = activeConversationId; }, [activeConversationId]);

  const fetchConversations = useCallback(() => {
    if (!myId) return;
    setLoadingConversations(true);
    chatApi.getMyConversations()
      .then((data) => setConversations(Array.isArray(data) ? data : []))
      .catch(() => setConversations([]))
      .finally(() => setLoadingConversations(false));
  }, [myId]);

   // Guards against out-of-order responses: if two fetchFriends() calls are
  // in flight (e.g. one from opening the Friends modal, one from just
  // accepting a request), an older call resolving after a newer one must
  // NOT be allowed to overwrite the newer, more correct state.
  const friendsRequestIdRef = useRef(0);

  const fetchFriends = useCallback(() => {
    if (!myId) return;
    const requestId = ++friendsRequestIdRef.current;
    friendApi.getFriends()
      .then((data) => {
        if (requestId !== friendsRequestIdRef.current) return; // stale, ignore
        setFriends(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load friends list:', err);
        // Keep whatever we already have rather than silently wiping a
        // working list to empty on a transient/network error.
      });
  }, [myId]);

  const fetchFriendRequests = useCallback(() => {
    if (!myId) return;
    setLoadingFriends(true);
    friendApi.getFriendRequests()
      .then((data) => setFriendRequests({
        incoming: Array.isArray(data?.incoming) ? data.incoming : [],
        outgoing: Array.isArray(data?.outgoing) ? data.outgoing : [],
      }))
      .catch(() => setFriendRequests({ incoming: [], outgoing: [] }))
      .finally(() => setLoadingFriends(false));
  }, [myId]);

  const fetchGroupInvites = useCallback(() => {
    if (!myId) return;
    setLoadingGroupInvites(true);
    chatApi.getMyGroupInvites()
      .then((data) => setGroupInvites(Array.isArray(data) ? data : []))
      .catch(() => setGroupInvites([]))
      .finally(() => setLoadingGroupInvites(false));
  }, [myId]);

  useEffect(() => {
    if (myId) {
      fetchConversations();
      fetchFriends();
      fetchFriendRequests();
      fetchGroupInvites();
    }
  }, [myId, fetchConversations, fetchFriends, fetchFriendRequests, fetchGroupInvites]);

  // ---- Friend request actions ----
  const sendFriendRequest = useCallback(async (userId) => {
    const request = await friendApi.sendFriendRequest(userId);
    // Optimistically drop it into "outgoing" so the UI reflects pending
    // status immediately, without waiting on a refetch.
    setFriendRequests((prev) => ({ ...prev, outgoing: [request, ...prev.outgoing] }));
    return request;
  }, []);

  const respondToFriendRequest = useCallback(async (requestId, status) => {
    // Grab the requester's data BEFORE we filter the request out of state —
    // we need it below to add the new friend immediately, without waiting
    // on a refetch that might race, fail, or lag behind the backend commit.
    const requestObj = friendRequests.incoming.find((r) => r._id === requestId);
    const updated = await friendApi.respondToFriendRequest(requestId, status);

    // Remove it from "incoming" regardless of accept/reject — it's no
    // longer pending either way.
    setFriendRequests((prev) => ({
      ...prev,
      incoming: prev.incoming.filter((r) => r._id !== requestId),
    }));

    if (status === 'accepted') {
      const newFriend =
        requestObj?.requester || requestObj?.sender ||
        updated?.requester || updated?.sender;
      const newFriendId = newFriend?._id || newFriend?.id;
      if (newFriendId) {
        setFriends((prev) =>
          prev.some((f) => (f._id || f.id) === newFriendId) ? prev : [newFriend, ...prev]
        );
      }
      // Still refetch in the background to reconcile with the server's
      // canonical list, in case the shape above didn't match.
      fetchFriends();
    }
    return updated;
  }, [fetchFriends, friendRequests.incoming]);

  // ---- Group invite actions ----
  const respondToGroupInvite = useCallback(async (inviteId, status) => {
    const updated = await chatApi.respondToGroupInvite(inviteId, status);
    setGroupInvites((prev) => prev.filter((inv) => inv._id !== inviteId));
    if (status === 'accepted') {
      // The now-joined group should show up in the conversation list.
      fetchConversations();
    }
    return updated;
  }, [fetchConversations]);

  // ---- Open a conversation: fetch its messages, join its socket room, mark read ----
  const openConversation = useCallback((conversationId) => {
    setActiveConversationId(conversationId);
    if (!conversationId) return;

    const socket = getSocket();
    socket.emit('conversation:join', conversationId);

    if (!messagesByConversation[conversationId]) {
      chatApi.getMessages(conversationId)
        .then((msgs) => {
          setMessagesByConversation((prev) => ({ ...prev, [conversationId]: msgs }));
        })
        .catch(() => {});
    }

    setUnreadByConversation((prev) => ({ ...prev, [conversationId]: 0 }));
    chatApi.markConversationRead(conversationId).catch(() => {});
  }, [messagesByConversation]);

  const closeConversation = useCallback(() => {
    if (activeConversationId) {
      getSocket().emit('conversation:leave', activeConversationId);
    }
    setActiveConversationId(null);
  }, [activeConversationId]);

  const deleteConversation = useCallback(async (conversationId) => {
    await chatApi.deleteConversation(conversationId);
    setConversations((prev) => prev.filter((c) => c._id !== conversationId));
    if (activeConversationIdRef.current === conversationId) {
      closeConversation();
    }
  }, [closeConversation]);

  const leaveGroup = useCallback(async (conversationId) => {
    await chatApi.leaveGroup(conversationId);
    setConversations((prev) => prev.filter((c) => c._id !== conversationId));
    if (activeConversationIdRef.current === conversationId) {
      closeConversation();
    }
  }, [closeConversation]);

  // -------- Chat panel open/close + which tab it opens to --------
  // Lives here (not in ChatButton's local state) so anything in the app —
  // most importantly NotificationBell — can open the panel directly to a
  // specific view (e.g. clicking a "friend request" notification should
  // open Requests, not just toggle the panel open on whatever tab it was
  // last on).
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatView, setChatView] = useState('chats'); // 'chats' | 'requests'

  const openChat = useCallback((view = 'chats') => {
    setChatView(view);
    setIsChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    closeConversation();
  }, [closeConversation]);

  const deleteMessages = useCallback(async (conversationId, messageIds) => {
    await chatApi.deleteMessages(conversationId, messageIds);
    setMessagesByConversation((prev) => {
      const current = prev[conversationId];
      if (!current) return prev;
      return { ...prev, [conversationId]: current.filter((m) => !messageIds.includes(m._id)) };
    });
  }, []);

  const sendMessage = useCallback(async (conversationId, text, attachment = null) => {
    // Don't append locally here — the server broadcasts this message back
    // via the 'message:new' socket event to everyone in the conversation,
    // including the sender. Appending both here AND in the socket handler
    // caused sent messages to show up twice.
    const message = await chatApi.sendMessage(conversationId, text, attachment);
    return message;
  }, []);

  // Now gated on friendship server-side — if the two users aren't friends
  // yet, chatApi.getOrCreateDM will reject and this throws, same as any
  // other failed request. Callers should catch and show the error message.
  const startDM = useCallback(async (userId) => {
    const conversation = await chatApi.getOrCreateDM(userId);
    setConversations((prev) => {
      const exists = prev.find((c) => c._id === conversation._id);
      return exists ? prev : [conversation, ...prev];
    });
    openConversation(conversation._id);
    return conversation;
  }, [openConversation]);

  // Creator becomes the only initial participant — everyone else in
  // memberIds gets a GroupInvite (see groupInvites/fetchGroupInvites above)
  // instead of appearing in this conversation's participants right away.
  const createGroup = useCallback(async (groupName, memberIds) => {
    const conversation = await chatApi.createGroup(groupName, memberIds);
    setConversations((prev) => [conversation, ...prev]);
    openConversation(conversation._id);
    return conversation;
  }, [openConversation]);

  const totalUnread = Object.values(unreadByConversation).reduce((sum, n) => sum + n, 0);
  const pendingFriendRequestCount = friendRequests.incoming.length;
  const pendingGroupInviteCount = groupInvites.length;

  // ---- Socket listeners ----
  useEffect(() => {
    if (!myId) return undefined;
    const socket = getSocket();

    const handleNewMessage = (message) => {
      const conversationId = message.conversation;
      setMessagesByConversation((prev) => {
        // Only append if we've already loaded this thread's history —
        // otherwise openConversation's own fetch will bring it in.
        if (!prev[conversationId]) return prev;
        if (prev[conversationId].some((m) => m._id === message._id)) return prev;
        return { ...prev, [conversationId]: [...prev[conversationId], message] };
      });

      if (activeConversationIdRef.current !== conversationId) {
        setUnreadByConversation((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1,
        }));
      }
    };

    const handleBump = ({ conversationId, message }) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === conversationId);
        if (idx === -1) {
          fetchConversations();
          return prev;
        }
        const updated = {
          ...prev[idx],
          lastMessage: { text: message.text, sender: message.sender, sentAt: message.createdAt },
        };
        const rest = prev.filter((c) => c._id !== conversationId);
        return [updated, ...rest];
      });

      if (activeConversationIdRef.current !== conversationId) {
        setUnreadByConversation((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1,
        }));
      }
    };

    const handleNewConversation = (conversation) => {
      setConversations((prev) => {
        if (prev.some((c) => c._id === conversation._id)) return prev;
        return [conversation, ...prev];
      });
    };

    const handleConversationUpdated = (conversation) => {
      setConversations((prev) => prev.map((c) => (c._id === conversation._id ? conversation : c)));
    };

    const handleConversationDeleted = ({ conversationId }) => {
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (activeConversationIdRef.current === conversationId) {
        setActiveConversationId(null);
      }
    };

    const handleMessagesDeleted = ({ conversationId, messageIds }) => {
      setMessagesByConversation((prev) => {
        const current = prev[conversationId];
        if (!current) return prev;
        return { ...prev, [conversationId]: current.filter((m) => !messageIds.includes(m._id)) };
      });
    };

    socket.on('message:new', handleNewMessage);
    socket.on('conversation:bump', handleBump);
    socket.on('conversation:new', handleNewConversation);
    socket.on('conversation:updated', handleConversationUpdated);
    socket.on('conversation:deleted', handleConversationDeleted);
    socket.on('messages:deleted', handleMessagesDeleted);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('conversation:bump', handleBump);
      socket.off('conversation:new', handleNewConversation);
      socket.off('conversation:updated', handleConversationUpdated);
      socket.off('conversation:deleted', handleConversationDeleted);
      socket.off('messages:deleted', handleMessagesDeleted);
    };
  }, [myId, fetchConversations]);

  const value = {
    conversations,
    loadingConversations,
    activeConversationId,
    messages: messagesByConversation[activeConversationId] || [],
    unreadByConversation,
    totalUnread,
    openConversation,
    closeConversation,
    deleteConversation,
    leaveGroup,
    sendMessage,
    deleteMessages,
    startDM,
    createGroup,
    fetchConversations,

    // friends / friend requests
    friends,
    friendRequests,
    loadingFriends,
    pendingFriendRequestCount,
    fetchFriends,
    fetchFriendRequests,
    sendFriendRequest,
    respondToFriendRequest,

    // group invites
    groupInvites,
    loadingGroupInvites,
    pendingGroupInviteCount,
    fetchGroupInvites,
    respondToGroupInvite,

    // chat panel open/close (see above)
    isChatOpen,
    chatView,
    setChatView,
    openChat,
    closeChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
};

export default ChatContext;