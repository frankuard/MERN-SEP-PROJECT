import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Plus, Search, Users, MessageCircle, ArrowLeft, UserPlus, Check, Clock, UserCheck, Trash2, MoreVertical, LogOut, Paperclip, FileText, Loader2, Download, CheckSquare, Square, XCircle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useAIChat } from '../../context/AIChatContext';
import chatApi from '../../api/chatApi';
import uploadApi from '../../api/uploadApi';

const timeShort = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getConversationLabel = (conv, myId) => {
  if (conv.isGroup) return conv.groupName || 'Group';
  const other = conv.participants?.find((p) => (p._id || p) !== myId);
  return other?.username || other?.email || 'Unknown';
};

// ---------------- New chat modal (search + start DM or create group) ----------------
const NewChatModal = ({ t, onClose, onStartDM, onCreateGroup }) => {
  const { friends } = useChat();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('dm'); // 'dm' | 'group'
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  const filteredFriends = friends.filter((f) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (f.username || '').toLowerCase().includes(q) || (f.email || '').toLowerCase().includes(q);
  });

  const toggleSelect = (user) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u._id === user._id) ? prev.filter((u) => u._id !== user._id) : [...prev, user]
    );
  };

  const handleDMClick = async (user) => {
    try {
      await onStartDM(user._id);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not start conversation');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    setCreating(true);
    try {
      await onCreateGroup(groupName.trim(), selectedUsers.map((u) => u._id));
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border shadow-2xl" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
        <div className="flex items-center justify-between border-b p-4" style={{ borderColor: t.border }}>
          <div className="flex gap-1 rounded-full border p-1" style={{ borderColor: t.border }}>
            <button
              type="button"
              onClick={() => { setMode('dm'); setSelectedUsers([]); }}
              className="rounded-full px-3.5 py-1.5 text-xs font-bold"
              style={{ backgroundColor: mode === 'dm' ? t.accentPrimary : 'transparent', color: mode === 'dm' ? '#fff' : t.textPrimary }}
            >
              New Chat
            </button>
            <button
              type="button"
              onClick={() => setMode('group')}
              className="rounded-full px-3.5 py-1.5 text-xs font-bold"
              style={{ backgroundColor: mode === 'group' ? t.accentPrimary : 'transparent', color: mode === 'group' ? '#fff' : t.textPrimary }}
            >
              New Group
            </button>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/5">
            <X size={16} style={{ color: t.textMuted }} />
          </button>
        </div>

        <div className="p-4">
          {mode === 'group' && (
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mb-3 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
          )}

          {mode === 'group' && selectedUsers.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {selectedUsers.map((u) => (
                <span
                  key={u._id}
                  onClick={() => toggleSelect(u)}
                  className="flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ backgroundColor: t.chipBg, color: t.textPrimary }}
                >
                  {u.username} <X size={11} />
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
            <input
              type="text"
              placeholder="Search your friends..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
          </div>

          <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
            {filteredFriends.length === 0 && (
              <p className="py-4 text-center text-xs" style={{ color: t.textMuted }}>
                {friends.length === 0 ? "You don't have any friends yet — add some from a profile page first." : 'No matching friends.'}
              </p>
            )}
            {filteredFriends.map((u) => {
              const isSelected = selectedUsers.some((s) => s._id === u._id);

              if (mode === 'group') {
                return (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => toggleSelect(u)}
                    className="flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ backgroundColor: isSelected ? t.chipBg : 'transparent' }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: t.accentPrimary }}>
                      {(u.username || u.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{u.username}</p>
                      <p className="truncate text-xs" style={{ color: t.textMuted }}>{u.email}</p>
                    </div>
                    {isSelected && <UserPlus size={14} style={{ color: t.accentPrimary }} />}
                  </button>
                );
              }

              return (
                <div key={u._id} className="flex w-full items-center gap-2.5 rounded-xl p-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: t.accentPrimary }}>
                    {(u.username || u.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{u.username}</p>
                    <p className="truncate text-xs" style={{ color: t.textMuted }}>{u.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDMClick(u)}
                    className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                    style={{ backgroundColor: t.accentPrimary }}
                  >
                    Message
                  </button>
                </div>
              );
            })}
          </div>

          {mode === 'group' && (
            <button
              type="button"
              disabled={!groupName.trim() || selectedUsers.length === 0 || creating}
              onClick={handleCreateGroup}
              className="mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-40"
              style={{ backgroundColor: t.accentPrimary }}
            >
              {creating ? 'Creating...' : `Create Group (${selectedUsers.length} members)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------- Add member modal (invite someone to an existing group) ----------------
const AddMemberModal = ({ t, conversation, onClose }) => {
  const { friends } = useChat();
  const [query, setQuery] = useState('');
  const [invitingId, setInvitingId] = useState(null);

  const existingIds = (conversation.participants || []).map((p) => String(p._id || p));

  const filteredFriends = friends.filter((f) => {
    if (existingIds.includes(String(f._id))) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (f.username || '').toLowerCase().includes(q) || (f.email || '').toLowerCase().includes(q);
  });

  const handleInvite = async (u) => {
    setInvitingId(u._id);
    try {
      await chatApi.addGroupMember(conversation._id, u._id);
      toast.success(`Invite sent to ${u.username}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not send invite');
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border shadow-2xl" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
        <div className="flex items-center justify-between border-b p-4" style={{ borderColor: t.border }}>
          <h3 className="text-sm font-bold" style={{ color: t.textPrimary }}>
            Add Member to "{conversation.groupName}"
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/5">
            <X size={16} style={{ color: t.textMuted }} />
          </button>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
            <input
              type="text"
              placeholder="Search your friends..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
          </div>
          <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
            {filteredFriends.length === 0 && (
              <p className="py-4 text-center text-xs" style={{ color: t.textMuted }}>No friends to add.</p>
            )}
            {filteredFriends.map((u) => (
              <div key={u._id} className="flex w-full items-center gap-2.5 rounded-xl p-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: t.accentPrimary }}>
                  {(u.username || u.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{u.username}</p>
                  <p className="truncate text-xs" style={{ color: t.textMuted }}>{u.email}</p>
                </div>
                <button
                  type="button"
                  disabled={invitingId === u._id}
                  onClick={() => handleInvite(u)}
                  className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  style={{ backgroundColor: t.accentPrimary }}
                >
                  <UserPlus size={11} /> {invitingId === u._id ? '...' : 'Invite'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------- Requests view (friend requests + group invites) ----------------
const GroupInvitesPopover = ({ t, onClose }) => {
  const { groupInvites, respondToGroupInvite, loadingGroupInvites } = useChat();
  const [busyId, setBusyId] = useState(null);

  const handleGroupResponse = async (inviteId, status) => {
    setBusyId(inviteId);
    try {
      await respondToGroupInvite(inviteId, status);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not respond to invite');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="absolute right-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-2xl border shadow-xl"
      style={{ backgroundColor: t.cardBg, borderColor: t.border }}
    >
      <div className="flex items-center justify-between border-b p-3" style={{ borderColor: t.border }}>
        <p className="text-xs font-extrabold" style={{ color: t.textPrimary }}>Group Invites</p>
        <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/5">
          <X size={14} style={{ color: t.textMuted }} />
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto p-2">
        {loadingGroupInvites && (
          <p className="py-4 text-center text-xs" style={{ color: t.textMuted }}>Loading...</p>
        )}
        {!loadingGroupInvites && groupInvites.length === 0 && (
          <p className="py-4 text-center text-xs" style={{ color: t.textMuted }}>No pending invites.</p>
        )}
        <div className="space-y-1.5">
          {groupInvites.map((inv) => (
            <div key={inv._id} className="flex items-center gap-2 rounded-xl p-2" style={{ backgroundColor: t.pageBg }}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: '#7c3aed' }}>
                <Users size={13} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold" style={{ color: t.textPrimary }}>
                  {inv.conversation?.groupName || 'Group'}
                </p>
                <p className="truncate text-[10px]" style={{ color: t.textMuted }}>
                  Invited by {inv.invitedBy?.username || 'someone'}
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === inv._id}
                onClick={() => handleGroupResponse(inv._id, 'accepted')}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white disabled:opacity-50"
                style={{ backgroundColor: '#16a34a' }}
                title="Accept"
              >
                <Check size={11} />
              </button>
              <button
                type="button"
                disabled={busyId === inv._id}
                onClick={() => handleGroupResponse(inv._id, 'rejected')}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border disabled:opacity-50"
                style={{ borderColor: t.border, color: t.textMuted }}
                title="Decline"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FriendRequestsPopover = ({ t, onClose }) => {
  const { friendRequests, respondToFriendRequest, loadingFriends } = useChat();
  const [busyId, setBusyId] = useState(null);

  const handleResponse = async (requestId, status) => {
    setBusyId(requestId);
    try {
      await respondToFriendRequest(requestId, status);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not respond to request');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="absolute right-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-2xl border shadow-xl"
      style={{ backgroundColor: t.cardBg, borderColor: t.border }}
    >
      <div className="flex items-center justify-between border-b p-3" style={{ borderColor: t.border }}>
        <p className="text-xs font-extrabold" style={{ color: t.textPrimary }}>Friend Requests</p>
        <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/5">
          <X size={14} style={{ color: t.textMuted }} />
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto p-2">
        {loadingFriends && (
          <p className="py-4 text-center text-xs" style={{ color: t.textMuted }}>Loading...</p>
        )}
        {!loadingFriends && friendRequests.incoming.length === 0 && (
          <p className="py-4 text-center text-xs" style={{ color: t.textMuted }}>No pending requests.</p>
        )}
        <div className="space-y-1.5">
          {friendRequests.incoming.map((r) => (
            <div key={r._id} className="flex items-center gap-2 rounded-xl p-2" style={{ backgroundColor: t.pageBg }}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: t.accentPrimary }}>
                {(r.requester?.username || r.requester?.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold" style={{ color: t.textPrimary }}>
                  {r.requester?.username || 'Unknown'}
                </p>
                <p className="truncate text-[10px]" style={{ color: t.textMuted }}>
                  {r.requester?.department || r.requester?.email}
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === r._id}
                onClick={() => handleResponse(r._id, 'accepted')}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white disabled:opacity-50"
                style={{ backgroundColor: '#16a34a' }}
                title="Accept"
              >
                <Check size={11} />
              </button>
              <button
                type="button"
                disabled={busyId === r._id}
                onClick={() => handleResponse(r._id, 'rejected')}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border disabled:opacity-50"
                style={{ borderColor: t.border, color: t.textMuted }}
                title="Decline"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------- Main chat panel ----------------
const ChatPanel = ({ t, onClose }) => {
  const { user } = useAuth();
  const myId = user?._id || user?.id;
  const { suppressWidget, unsuppressWidget } = useAIChat();
    const {
    conversations, loadingConversations, activeConversationId, messages,
    unreadByConversation, openConversation, closeConversation, deleteConversation, leaveGroup,
    sendMessage, deleteMessages, startDM, createGroup,
    pendingGroupInviteCount, pendingFriendRequestCount, friends,
  } = useChat();

  const [showNewChat, setShowNewChat] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
    const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null); // { url, name, type } after upload
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null); // { url, name } | null
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [openMessageMenuId, setOpenMessageMenuId] = useState(null);

  // Close a message's ⋮ menu when clicking anywhere outside it
  useEffect(() => {
    if (!openMessageMenuId) return undefined;
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-message-menu]')) setOpenMessageMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMessageMenuId]);

  // Lock body scroll while the panel is open — prevents the mobile
  // dashboard behind it from becoming momentarily visible/scrollable
  // during touch-scroll gestures inside the panel (iOS Safari rubber-band
  // bleed-through).
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Hide the AI chatbot bubble for as long as this panel is open, so it
  // never overlaps a human conversation. Restored on close/unmount.
  useEffect(() => {
    suppressWidget();
    return () => unsuppressWidget();
  }, [suppressWidget, unsuppressWidget]);

  const activeConversation = conversations.find((c) => c._id === activeConversationId);

  // Friends with no DM yet — merged into the chat list so every friend is
  // reachable without a separate "start chat" step.
  const dmPartnerIds = new Set(
    conversations
      .filter((c) => !c.isGroup)
      .map((c) => {
        const other = c.participants?.find((p) => (p._id || p) !== myId);
        return String(other?._id || other || '');
      })
  );
  const friendsWithoutChat = friends.filter((f) => !dmPartnerIds.has(String(f._id)));

  const handleSelectConversation = (id) => {
    openConversation(id);
    setMobileShowThread(true);
  };

  const handleStartChatWithFriend = async (friend) => {
    try {
      const conv = await startDM(friend._id);
      const convId = conv?._id || conv?.id;
      if (convId) handleSelectConversation(convId);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not start conversation');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!draft.trim() && !pendingAttachment) || !activeConversationId) return;
    setSending(true);
    const text = draft.trim();
    const attachment = pendingAttachment;
    setDraft('');
    setPendingAttachment(null);
    try {
      await sendMessage(activeConversationId, text, attachment);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  const handleCopyMessage = (msg) => {
    const textToCopy = msg.text || msg.attachment?.name || '';
    navigator.clipboard.writeText(textToCopy)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Could not copy'));
    setOpenMessageMenuId(null);
  };

  const toggleSelectMessage = (msgId) => {
    setSelectedMessageIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedMessageIds.length === 0 || !activeConversationId) return;
    if (!window.confirm(`Delete ${selectedMessageIds.length} message${selectedMessageIds.length > 1 ? 's' : ''}?`)) return;
    try {
      await deleteMessages(activeConversationId, selectedMessageIds);
      setSelectedMessageIds([]);
      setSelectMode(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete messages');
    }
  };

  const handleSingleDelete = async (msgId) => {
    if (!activeConversationId) return;
    if (!window.confirm('Delete this message?')) return;
    try {
      await deleteMessages(activeConversationId, [msgId]);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete message');
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const res = await fetch(attachment.url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = attachment.name || 'file';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      toast.error('Could not download file');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large — max 10MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setUploadingFile(true);
    try {
      const { url, name } = await uploadApi.uploadDocument(file);
      setPendingAttachment({ url, name: name || file.name, type: file.type });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete/leave triggered from a conversation row in the list (trash icon).
  const handleDeleteFromList = async (conv) => {
    const isCreator = conv.isGroup && String(conv.createdBy) === String(myId);
    if (conv.isGroup && !isCreator) {
      if (!window.confirm(`Leave "${conv.groupName}"?`)) return;
      try {
        await leaveGroup(conv._id);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Could not leave group');
      }
      return;
    }
    const label = conv.isGroup ? `Delete group "${conv.groupName}" for everyone?` : 'Delete this conversation?';
    if (!window.confirm(label)) return;
    try {
      await deleteConversation(conv._id);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete conversation');
    }
  };

  // Same logic, but for the "..." menu in the open thread's header.
  const handleHeaderDelete = async () => {
    if (!activeConversation) return;
    const isCreator = String(activeConversation.createdBy) === String(myId);
    if (activeConversation.isGroup && !isCreator) {
      if (!window.confirm(`Leave "${activeConversation.groupName}"?`)) return;
      try {
        await leaveGroup(activeConversation._id);
        setMobileShowThread(false);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Could not leave group');
      }
      return;
    }
    const label = activeConversation.isGroup
      ? `Delete group "${activeConversation.groupName}" for everyone?`
      : 'Delete this conversation?';
    if (!window.confirm(label)) return;
    try {
      await deleteConversation(activeConversation._id);
      setMobileShowThread(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete conversation');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs" style={{ overscrollBehavior: 'contain', touchAction: 'none' }}>
      <div
        className="flex w-full flex-col overflow-hidden sm:h-[85vh] sm:max-w-3xl sm:rounded-2xl sm:border"
        style={{ backgroundColor: t.cardBg, borderColor: t.border, height: '100dvh', maxHeight: '100dvh' }}
      >
        {/* Header — title, group-invites bell (popover; friend requests are
            handled from the profile page's Friends overlay instead), new
            chat, close. */}
        <div className="relative flex items-center justify-between border-b p-3" style={{ borderColor: t.border }}>
          <p className="px-2 text-sm font-extrabold" style={{ color: t.textPrimary }}>Chats</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowFriendRequests((o) => !o)}
              className="relative rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/5"
              title="Friend requests"
            >
              <UserPlus size={17} style={{ color: t.textPrimary }} />
              {pendingFriendRequestCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {pendingFriendRequestCount > 9 ? '9+' : pendingFriendRequestCount}
                </span>
              )}
            </button>
            {showFriendRequests && <FriendRequestsPopover t={t} onClose={() => setShowFriendRequests(false)} />}
            <button
              type="button"
              onClick={() => setShowInvites((o) => !o)}
              className="relative rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/5"
              title="Group invites"
            >
              <Users size={17} style={{ color: t.textPrimary }} />
              {pendingGroupInviteCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {pendingGroupInviteCount > 9 ? '9+' : pendingGroupInviteCount}
                </span>
              )}
            </button>
            {showInvites && <GroupInvitesPopover t={t} onClose={() => setShowInvites(false)} />}
            <button
              type="button"
              onClick={() => setShowNewChat(true)}
              className="rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/5"
              title="New chat"
            >
              <Plus size={17} style={{ color: t.textPrimary }} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X size={17} style={{ color: t.textPrimary }} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Conversation list */}
            <div
              className={`w-full shrink-0 flex-col border-r sm:flex sm:w-72 ${mobileShowThread ? 'hidden' : 'flex'}`}
              style={{ borderColor: t.border }}
            >
              <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
                {loadingConversations && (
                  <p className="p-6 text-center text-sm" style={{ color: t.textMuted }}>Loading...</p>
                )}
                {!loadingConversations && conversations.length === 0 && friendsWithoutChat.length === 0 && (
                  <div className="p-6 text-center">
                    <MessageCircle size={28} className="mx-auto mb-2" style={{ color: t.textMuted }} />
                    <p className="text-sm" style={{ color: t.textMuted }}>
                      No friends yet — add some from a profile page to start chatting.
                    </p>
                  </div>
                )}
                {conversations.map((conv) => {
                  const unread = unreadByConversation[conv._id] || 0;
                  const isActive = conv._id === activeConversationId;
                  return (
                    <div
                      key={conv._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectConversation(conv._id)}
                      className="group flex w-full cursor-pointer items-center gap-3 border-b p-3.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ borderColor: t.border, backgroundColor: isActive ? t.chipBg : 'transparent' }}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: conv.isGroup ? '#7c3aed' : t.accentPrimary }}>
                        {conv.isGroup ? <Users size={16} /> : getConversationLabel(conv, myId).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>
                            {getConversationLabel(conv, myId)}
                          </p>
                          {conv.lastMessage?.sentAt && (
                            <span className="shrink-0 text-[10px] font-semibold" style={{ color: t.textMuted }}>
                              {timeShort(conv.lastMessage.sentAt)}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs" style={{ color: t.textMuted }}>
                          {conv.lastMessage?.text || 'No messages yet'}
                        </p>
                      </div>
                      {unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Friends with no chat history yet — first tap lazily
                    creates the DM. */}
                {friendsWithoutChat.map((f) => (
                  <div
                    key={`friend-${f._id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleStartChatWithFriend(f)}
                    className="group flex w-full cursor-pointer items-center gap-3 border-b p-3.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: t.border }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: t.accentPrimary }}>
                      {(f.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{f.username}</p>
                      <p className="truncate text-xs" style={{ color: t.textMuted }}>Say hi 👋</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active thread */}
            <div className={`flex-1 flex-col sm:flex ${mobileShowThread ? 'flex' : 'hidden'}`}>
              {!activeConversationId && (
                <div className="flex flex-1 flex-col items-center justify-center gap-2">
                  <MessageCircle size={36} style={{ color: t.textMuted }} />
                  <p className="text-sm" style={{ color: t.textMuted }}>Select a conversation to start chatting</p>
                </div>
              )}

              {activeConversationId && (
                <>
                  <div className="flex items-center gap-2 border-b p-4" style={{ borderColor: t.border }}>
                    <button
                      type="button"
                      onClick={() => { setMobileShowThread(false); closeConversation(); }}
                      className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/5 sm:hidden"
                    >
                      <ArrowLeft size={17} style={{ color: t.textPrimary }} />
                    </button>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: activeConversation?.isGroup ? '#7c3aed' : t.accentPrimary }}>
                      {activeConversation?.isGroup ? <Users size={14} /> : getConversationLabel(activeConversation || {}, myId).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>
                        {activeConversation ? getConversationLabel(activeConversation, myId) : ''}
                      </p>
                      {activeConversation?.isGroup && (
                        <p className="truncate text-[11px]" style={{ color: t.textMuted }}>
                          {activeConversation.participants.length} members
                        </p>
                      )}
                    </div>
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowMenu((o) => !o)}
                        className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                        title="Conversation options"
                      >
                        <MoreVertical size={17} style={{ color: t.textPrimary }} />
                      </button>
                      {showMenu && (
                        <div
                          className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-xl border shadow-lg"
                          style={{ backgroundColor: t.cardBg, borderColor: t.border }}
                        >
                          <button
                            type="button"
                            onClick={() => { setShowMenu(false); setSelectMode(true); setSelectedMessageIds([]); }}
                            className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ color: t.textPrimary }}
                          >
                            <CheckSquare size={13} /> Select Messages
                          </button>
                          {activeConversation?.isGroup && (
                            <button
                              type="button"
                              onClick={() => { setShowMenu(false); setShowAddMember(true); }}
                              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                              style={{ color: t.textPrimary }}
                            >
                              <UserPlus size={13} /> Add Member
                            </button>
                          )}
                          {activeConversation?.isGroup && String(activeConversation.createdBy) !== String(myId) && (
                            <button
                              type="button"
                              onClick={() => { setShowMenu(false); handleHeaderDelete(); }}
                              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                              style={{ color: '#ef4444' }}
                            >
                              <LogOut size={13} /> Leave Group
                            </button>
                          )}
                          {(!activeConversation?.isGroup || String(activeConversation?.createdBy) === String(myId)) && (
                            <button
                              type="button"
                              onClick={() => { setShowMenu(false); handleHeaderDelete(); }}
                              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                              style={{ color: '#ef4444' }}
                            >
                              <Trash2 size={13} /> {activeConversation?.isGroup ? 'Delete Group' : 'Delete Conversation'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectMode && (
                    <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5" style={{ borderColor: t.border, backgroundColor: t.chipBg }}>
                      <p className="text-xs font-bold" style={{ color: t.textPrimary }}>
                        {selectedMessageIds.length} selected
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={selectedMessageIds.length === 0}
                          onClick={handleBulkDelete}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                          style={{ backgroundColor: '#ef4444' }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSelectMode(false); setSelectedMessageIds([]); }}
                          className="rounded-lg p-1.5 hover:bg-black/10 dark:hover:bg-white/10"
                          title="Cancel"
                        >
                          <XCircle size={16} style={{ color: t.textMuted }} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ overscrollBehavior: 'contain' }}>
                    {messages.map((msg) => {
                      const isMine = (msg.sender?._id || msg.sender) === myId;
                      const isImageAttachment = msg.attachment?.mimetype?.startsWith('image/');
                      const isSelected = selectedMessageIds.includes(msg._id);
                      return (
                        <div
                          key={msg._id}
                          onClick={() => { if (selectMode && isMine) toggleSelectMessage(msg._id); }}
                          className={`group flex items-start gap-1.5 ${isMine ? 'justify-end' : 'justify-start'} ${selectMode && isMine ? 'cursor-pointer' : ''}`}
                        >
                          {selectMode && isMine && (
                            isSelected
                              ? <CheckSquare size={16} className="mt-2 shrink-0" style={{ color: t.accentPrimary }} />
                              : <Square size={16} className="mt-2 shrink-0" style={{ color: t.textMuted }} />
                          )}

                          {!selectMode && isMine && (
                            <div className="relative mt-1 shrink-0" data-message-menu>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setOpenMessageMenuId((prev) => (prev === msg._id ? null : msg._id)); }}
                                className={`rounded-lg p-1 hover:bg-black/10 dark:hover:bg-white/10 ${openMessageMenuId === msg._id ? 'block' : 'hidden group-hover:block'}`}
                                title="Message options"
                              >
                                <MoreVertical size={14} style={{ color: t.textMuted }} />
                              </button>

                              {openMessageMenuId === msg._id && (
                                <div
                                  className={`absolute z-20 mt-1 w-32 overflow-hidden rounded-xl border shadow-lg ${isMine ? 'right-0' : 'left-0'}`}
                                  style={{ backgroundColor: t.cardBg, borderColor: t.border }}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleCopyMessage(msg); }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                                    style={{ color: t.textPrimary }}
                                  >
                                    <Copy size={12} /> Copy
                                  </button>
                                  {isMine && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setOpenMessageMenuId(null); handleSingleDelete(msg._id); }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                                      style={{ color: '#ef4444' }}
                                    >
                                      <Trash2 size={12} /> Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="max-w-[75%]">
                            {!isMine && activeConversation?.isGroup && (
                              <p className="mb-0.5 ml-1 text-[10px] font-bold" style={{ color: t.textMuted }}>
                                {msg.sender?.username}
                              </p>
                            )}

                            {msg.attachment?.url && isImageAttachment && (
                              <img
                                src={msg.attachment.url}
                                alt={msg.attachment.name}
                                onClick={() => setLightboxImage(msg.attachment)}
                                className="mb-1 max-h-52 cursor-pointer rounded-xl border object-cover"
                                style={{ borderColor: t.border }}
                              />
                            )}

                            {msg.attachment?.url && !isImageAttachment && (
                              <div
                                className="mb-1 flex items-center gap-2.5 rounded-xl border p-2.5"
                                style={{ borderColor: t.border, backgroundColor: t.pageBg }}
                              >
                                
                                 <a href={msg.attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex min-w-0 flex-1 items-center gap-2.5"
                                >
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: t.chipBg }}>
                                    <FileText size={15} style={{ color: t.textMuted }} />
                                  </div>
                                  <p className="truncate text-xs font-semibold" style={{ color: t.textPrimary }}>
                                    {msg.attachment.name}
                                  </p>
                                </a>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDownload(msg.attachment); }}
                                  className="shrink-0 rounded-lg p-1.5 hover:bg-black/10 dark:hover:bg-white/10"
                                  title="Download"
                                >
                                  <Download size={14} style={{ color: t.textMuted }} />
                                </button>
                              </div>
                            )}

                            {msg.text && (
                              <div
                                className="rounded-2xl px-3.5 py-2 text-sm"
                                style={{
                                  backgroundColor: isMine ? t.accentPrimary : t.chipBg,
                                  color: isMine ? '#fff' : t.textPrimary,
                                }}
                              >
                                {msg.text}
                              </div>
                            )}
                            <p className="mt-0.5 text-[10px]" style={{ color: t.textMuted, textAlign: isMine ? 'right' : 'left' }}>
                              {timeShort(msg.createdAt)}
                            </p>
                          </div>

                          {!selectMode && !isMine && (
                            <div className="relative mt-1 shrink-0" data-message-menu>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setOpenMessageMenuId((prev) => (prev === msg._id ? null : msg._id)); }}
                                className={`rounded-lg p-1 hover:bg-black/10 dark:hover:bg-white/10 ${openMessageMenuId === msg._id ? 'block' : 'hidden group-hover:block'}`}
                                title="Message options"
                              >
                                <MoreVertical size={14} style={{ color: t.textMuted }} />
                              </button>

                              {openMessageMenuId === msg._id && (
                                <div
                                  className="absolute left-0 z-20 mt-1 w-32 overflow-hidden rounded-xl border shadow-lg"
                                  style={{ backgroundColor: t.cardBg, borderColor: t.border }}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleCopyMessage(msg); }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                                    style={{ color: t.textPrimary }}
                                  >
                                    <Copy size={12} /> Copy
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {pendingAttachment && (
                    <div className="flex items-center gap-2.5 border-t px-3 pt-3" style={{ borderColor: t.border }}>
                      <div className="flex flex-1 items-center gap-2 rounded-xl border p-2" style={{ borderColor: t.border, backgroundColor: t.pageBg }}>
                        {pendingAttachment.type?.startsWith('image/') ? (
                          <img src={pendingAttachment.url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: t.chipBg }}>
                            <FileText size={14} style={{ color: t.textMuted }} />
                          </div>
                        )}
                        <p className="truncate text-xs font-semibold" style={{ color: t.textPrimary }}>
                          {pendingAttachment.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendingAttachment(null)}
                        className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <X size={14} style={{ color: t.textMuted }} />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSend} className="flex items-center gap-2 border-t p-3" style={{ borderColor: pendingAttachment ? 'transparent' : t.border }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      disabled={uploadingFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/5"
                      title="Attach a file"
                    >
                      {uploadingFile ? (
                        <Loader2 size={16} className="animate-spin" style={{ color: t.textMuted }} />
                      ) : (
                        <Paperclip size={17} style={{ color: t.textPrimary }} />
                      )}
                    </button>
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 rounded-full border px-4 py-2.5 text-sm outline-none"
                      style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                    />
                    <button
                      type="submit"
                      disabled={(!draft.trim() && !pendingAttachment) || sending}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40"
                      style={{ backgroundColor: t.accentPrimary }}
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>

      {showNewChat && (
        <NewChatModal
          t={t}
          onClose={() => setShowNewChat(false)}
          onStartDM={startDM}
          onCreateGroup={createGroup}
        />
      )}

      {showAddMember && activeConversation && (
        <AddMemberModal
          t={t}
          conversation={activeConversation}
          onClose={() => setShowAddMember(false)}
        />
      )}

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 hover:bg-white/20"
            title="Close"
          >
            <X size={20} className="text-white" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDownload(lightboxImage); }}
            className="absolute right-16 top-4 rounded-full bg-white/10 p-2.5 hover:bg-white/20"
            title="Download"
          >
            <Download size={20} className="text-white" />
          </button>
          <img
            src={lightboxImage.url}
            alt={lightboxImage.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default ChatPanel;