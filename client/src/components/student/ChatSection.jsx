import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Plus, Search, Users, MessageCircle, ArrowLeft, UserPlus,
  Check, X, Loader2, Trash2, MoreVertical, LogOut, Paperclip,
  FileText, Download, CheckSquare, Square, XCircle, Copy,
  UserCheck, Clock, MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useAIChat } from '../../context/AIChatContext';
import chatApi from '../../api/chatApi';
import uploadApi from '../../api/uploadApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeShort = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getConversationLabel = (conv, myId) => {
  if (conv.isGroup) return conv.groupName || 'Group';
  const other = conv.participants?.find((p) => (p._id || p) !== myId);
  return other?.username || other?.email || 'Unknown';
};

// ─── New Chat / Group Modal ────────────────────────────────────────────────────

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
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
                {friends.length === 0 ? "No friends yet — add some from Add Friends." : 'No matching friends.'}
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

// ─── Add Member Modal ──────────────────────────────────────────────────────────

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
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

// ─── Group Members Modal ───────────────────────────────────────────────────────

const GroupMembersModal = ({ t, conversation, myId, onClose, onAddMember }) => {
  const participants = conversation.participants || [];
  const creatorId = String(conversation.createdBy || '');
  const isCreator = String(myId) === creatorId;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border shadow-2xl"
        style={{ backgroundColor: t.cardBg, borderColor: t.border }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: t.border }}>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-extrabold" style={{ color: t.textPrimary }}>
              {conversation.groupName}
            </h3>
            <p className="text-xs" style={{ color: t.textMuted }}>
              {participants.length} member{participants.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 shrink-0 rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X size={16} style={{ color: t.textMuted }} />
          </button>
        </div>

        {/* Member count summary bar */}
        <div
          className="flex items-center gap-3 border-b px-5 py-3"
          style={{ borderColor: t.border, backgroundColor: t.chipBg }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: t.accentPrimary + '20' }}
          >
            <Users size={18} style={{ color: t.accentPrimary }} />
          </div>
          <div>
            <p className="text-lg font-extrabold leading-none" style={{ color: t.accentPrimary }}>
              {participants.length}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: t.textMuted }}>
              Total Members
            </p>
          </div>
          {isCreator && (
            <button
              type="button"
              onClick={onAddMember}
              className="ml-auto flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-white"
              style={{ backgroundColor: t.accentPrimary }}
            >
              <UserPlus size={12} /> Add
            </button>
          )}
        </div>

        {/* Members list */}
        <div className="max-h-80 overflow-y-auto py-2">
          {participants.map((p) => {
            const pid = String(p._id || p);
            const isMe = pid === String(myId);
            const isOwner = pid === creatorId;
            return (
              <div
                key={pid}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                {/* Avatar */}
                <div
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-extrabold text-white"
                  style={{ backgroundColor: isOwner ? '#7c3aed' : t.accentPrimary }}
                >
                  {p.profileImage ? (
                    <img src={p.profileImage} alt={p.username} className="h-full w-full object-cover" />
                  ) : (
                    (p.username || p.email || '?').charAt(0).toUpperCase()
                  )}
                </div>

                {/* Name + email */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>
                      {p.username || p.email || 'Unknown'}
                    </p>
                    {isMe && (
                      <span
                        className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide"
                        style={{ backgroundColor: t.chipBg, color: t.textMuted }}
                      >
                        You
                      </span>
                    )}
                  </div>
                  {p.email && (
                    <p className="truncate text-xs" style={{ color: t.textMuted }}>{p.email}</p>
                  )}
                </div>

                {/* Role badge */}
                {isOwner && (
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-white"
                    style={{ backgroundColor: '#7c3aed' }}
                  >
                    Admin
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3" style={{ borderColor: t.border }}>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2.5 text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: t.textMuted }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Chats Tab ────────────────────────────────────────────────────────────────

const ChatsTab = ({ t, onOpenNewChat }) => {
  const { user } = useAuth();
  const myId = user?._id || user?.id;
  const {
    conversations, loadingConversations, activeConversationId, messages,
    unreadByConversation, openConversation, closeConversation, deleteConversation, leaveGroup,
    sendMessage, deleteMessages, startDM, createGroup, friends,
  } = useChat();

  const [showMenu, setShowMenu] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [openMessageMenuId, setOpenMessageMenuId] = useState(null);
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Close message menu when clicking outside
  useEffect(() => {
    if (!openMessageMenuId) return undefined;
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-message-menu]')) setOpenMessageMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMessageMenuId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConversation = conversations.find((c) => c._id === activeConversationId);

  // Friends with no DM yet
  const dmPartnerIds = new Set(
    conversations
      .filter((c) => !c.isGroup)
      .map((c) => {
        const other = c.participants?.find((p) => (p._id || p) !== myId);
        return String(other?._id || other || '');
      })
  );
  const friendsWithoutChat = friends.filter((f) => !dmPartnerIds.has(String(f._id)));

  // Filter conversations + friends by sidebar search
  const searchQ = sidebarSearch.trim().toLowerCase();
  const filteredConversations = searchQ
    ? conversations.filter((c) => getConversationLabel(c, myId).toLowerCase().includes(searchQ))
    : conversations;
  const filteredFriendsWithoutChat = searchQ
    ? friendsWithoutChat.filter((f) => (f.username || '').toLowerCase().includes(searchQ))
    : friendsWithoutChat;

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
    } catch {
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
    <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
      {/* ── Conversation list sidebar ── */}
      <div
        className={`flex w-full shrink-0 flex-col border-r sm:w-72 ${mobileShowThread ? 'hidden sm:flex' : 'flex'}`}
        style={{ borderColor: t.border }}
      >
        {/* Sidebar search */}
        <div className="p-3 border-b" style={{ borderColor: t.border }}>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full rounded-full border py-2 pl-8 pr-3 text-xs outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
            {sidebarSearch && (
              <button
                type="button"
                onClick={() => setSidebarSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
              >
                <X size={12} style={{ color: t.textMuted }} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations && (
            <p className="p-6 text-center text-sm" style={{ color: t.textMuted }}>Loading...</p>
          )}
          {!loadingConversations && filteredConversations.length === 0 && filteredFriendsWithoutChat.length === 0 && (
            <div className="p-6 text-center">
              <MessageCircle size={28} className="mx-auto mb-2" style={{ color: t.textMuted }} />
              <p className="text-sm" style={{ color: t.textMuted }}>
                {sidebarSearch ? 'No matches found.' : 'No chats yet — click + to start one.'}
              </p>
            </div>
          )}

          {filteredConversations.map((conv) => {
            const unread = unreadByConversation[conv._id] || 0;
            const isActive = conv._id === activeConversationId;
            return (
              <div
                key={conv._id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectConversation(conv._id)}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectConversation(conv._id)}
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

          {filteredFriendsWithoutChat.map((f) => (
            <div
              key={`friend-${f._id}`}
              role="button"
              tabIndex={0}
              onClick={() => handleStartChatWithFriend(f)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartChatWithFriend(f)}
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

      {/* ── Message thread ── */}
      <div className={`flex min-w-0 flex-1 flex-col ${mobileShowThread ? 'flex' : 'hidden sm:flex'}`}>
        {!activeConversationId && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2">
            <MessageCircle size={36} style={{ color: t.textMuted }} />
            <p className="text-sm" style={{ color: t.textMuted }}>Select a conversation to start chatting</p>
          </div>
        )}

        {activeConversationId && (
          <>
            {/* Thread header */}
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
                >
                  <MoreVertical size={17} style={{ color: t.textPrimary }} />
                </button>
                {showMenu && (
                  <div
                    className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-xl border shadow-lg"
                    style={{ backgroundColor: t.cardBg, borderColor: t.border }}
                  >
                    {activeConversation?.isGroup && (
                      <button
                        type="button"
                        onClick={() => { setShowMenu(false); setShowGroupMembers(true); }}
                        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ color: t.textPrimary }}
                      >
                        <Users size={13} /> View Members
                      </button>
                    )}
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

            {/* Select mode bar */}
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
                  >
                    <XCircle size={16} style={{ color: t.textMuted }} />
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 min-w-0 space-y-2 overflow-y-auto overflow-x-hidden p-4">
              {messages.map((msg) => {
                const isMine = (msg.sender?._id || msg.sender) === myId;
                const isImageAttachment = msg.attachment?.mimetype?.startsWith('image/');
                const isSelected = selectedMessageIds.includes(msg._id);
                return (
                  <div
                    key={msg._id}
                    onClick={() => { if (selectMode && isMine) toggleSelectMessage(msg._id); }}
                    className={`group flex min-w-0 items-start gap-1.5 ${isMine ? 'justify-end' : 'justify-start'} ${selectMode && isMine ? 'cursor-pointer' : ''}`}
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
                        >
                          <MoreVertical size={14} style={{ color: t.textMuted }} />
                        </button>
                        {openMessageMenuId === msg._id && (
                          <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-xl border shadow-lg" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleCopyMessage(msg); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                              style={{ color: t.textPrimary }}
                            >
                              <Copy size={12} /> Copy
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setOpenMessageMenuId(null); handleSingleDelete(msg._id); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                              style={{ color: '#ef4444' }}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="min-w-0 max-w-[75%]">
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
                        <div className="mb-1 flex items-center gap-2.5 rounded-xl border p-2.5" style={{ borderColor: t.border, backgroundColor: t.pageBg }}>
                          <a href={msg.attachment.url} target="_blank" rel="noreferrer" className="flex min-w-0 flex-1 items-center gap-2.5">
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
                          >
                            <Download size={14} style={{ color: t.textMuted }} />
                          </button>
                        </div>
                      )}

                      {msg.text && (
                        <div
                          className="whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm"
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
                        >
                          <MoreVertical size={14} style={{ color: t.textMuted }} />
                        </button>
                        {openMessageMenuId === msg._id && (
                          <div className="absolute left-0 z-20 mt-1 w-32 overflow-hidden rounded-xl border shadow-lg" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
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

            {/* Pending attachment preview */}
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

            {/* Message input — the AI-chatbot widget is fully suppressed
                while this page is mounted (see suppressWidget above), so no
                extra right padding is needed to dodge it anymore. */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 border-t p-3"
              style={{ borderColor: pendingAttachment ? 'transparent' : t.border }}
            >
              <input ref={fileInputRef} type="file" onChange={handleFileSelect} disabled={uploadingFile} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/5"
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
                placeholder="Type a message…"
                className="flex-1 min-w-0 rounded-full border px-4 py-2.5 text-sm outline-none"
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

      {/* Modals */}
      {showAddMember && activeConversation && (
        <AddMemberModal t={t} conversation={activeConversation} onClose={() => setShowAddMember(false)} />
      )}

      {showGroupMembers && activeConversation?.isGroup && (
        <GroupMembersModal
          t={t}
          conversation={activeConversation}
          myId={myId}
          onClose={() => setShowGroupMembers(false)}
          onAddMember={() => { setShowGroupMembers(false); setShowAddMember(true); }}
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
          >
            <X size={20} className="text-white" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDownload(lightboxImage); }}
            className="absolute right-16 top-4 rounded-full bg-white/10 p-2.5 hover:bg-white/20"
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

// ─── Add Friends Tab ───────────────────────────────────────────────────────────

const AddFriendsTab = ({ t }) => {
  const {
    friends,
    friendRequests,
    sendFriendRequest,
  } = useChat();

  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sentTo, setSentTo] = useState(new Set());

  const outgoingRequestIds = new Set(
    friendRequests.outgoing.map((r) => r.recipient?._id || r.recipient || r.userId)
  );

  useEffect(() => {
    const q = searchInput.trim();
    if (!q) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await chatApi.searchUsers(q);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const isFriend = (id) => friends.some((f) => (f._id || f.id) === id);
  const isRequestSent = (id) => sentTo.has(id) || outgoingRequestIds.has(id);

  const handleAddFriend = async (targetUser) => {
    const targetId = targetUser._id || targetUser.id;
    try {
      await sendFriendRequest(targetId);
      setSentTo((prev) => new Set(prev).add(targetId));
      toast.success(`Friend request sent to ${targetUser.username}!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not send request.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-6">
      <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide" style={{ color: t.textMuted }}>
        Add Friends
      </h2>
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by username or email..."
          className="w-full rounded-2xl border py-2.5 pl-10 pr-4 text-sm outline-none"
          style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
        />
      </div>

      {searching && <p className="text-sm" style={{ color: t.textMuted }}>Searching...</p>}
      {!searching && searchInput.trim() && searchResults.length === 0 && (
        <p className="text-sm" style={{ color: t.textMuted }}>No users found.</p>
      )}
      {!searchInput.trim() && (
        <p className="text-sm" style={{ color: t.textMuted }}>Type a name or email above to find people.</p>
      )}

      <div className="mt-3 space-y-2">
        {searchResults.map((person) => {
          const id = person._id || person.id;
          const already = isFriend(id);
          const sent = isRequestSent(id);
          return (
            <div
              key={id}
              className="flex items-center justify-between gap-3 rounded-2xl border p-3"
              style={{ backgroundColor: t.cardBg, borderColor: t.border }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white" style={{ backgroundColor: t.accentPrimary }}>
                  {(person.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{person.username}</p>
                  {person.email && (
                    <p className="truncate text-xs" style={{ color: t.textMuted }}>{person.email}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={already || sent}
                onClick={() => handleAddFriend(person)}
                className="shrink-0 rounded-full px-4 py-1.5 text-xs font-extrabold transition-colors disabled:opacity-60"
                style={{
                  backgroundColor: already || sent ? t.border : '#111',
                  color: already || sent ? t.textMuted : '#fff',
                }}
              >
                {already ? 'Friends' : sent ? 'Requested' : 'Add Friend'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Requests Tab ─────────────────────────────────────────────────────────────

const RequestsTab = ({ t }) => {
  const {
    friendRequests,
    loadingFriends,
    respondToFriendRequest,
    groupInvites,
    loadingGroupInvites,
    respondToGroupInvite,
  } = useChat();

  const incomingRequests = friendRequests.incoming;

  const [busyRequestId, setBusyRequestId] = useState(null);
  const [busyInviteId, setBusyInviteId] = useState(null);

  const handleRespondFriend = async (requestId, status) => {
    setBusyRequestId(requestId);
    try {
      await respondToFriendRequest(requestId, status);
      toast.success(status === 'accepted' ? 'Friend request accepted!' : 'Request declined.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not respond to request.');
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleRespondGroup = async (inviteId, status) => {
    setBusyInviteId(inviteId);
    try {
      await respondToGroupInvite(inviteId, status);
      toast.success(status === 'accepted' ? 'Joined group!' : 'Invite declined.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not respond to invite.');
    } finally {
      setBusyInviteId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
      {/* Friend Requests */}
      <div>
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide" style={{ color: t.textMuted }}>
          Friend Requests {incomingRequests.length > 0 && `(${incomingRequests.length})`}
        </h2>
        {loadingFriends && <p className="text-sm" style={{ color: t.textMuted }}>Loading...</p>}
        {!loadingFriends && incomingRequests.length === 0 && (
          <div className="rounded-2xl border p-6 text-center" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
            <UserCheck size={28} className="mx-auto mb-2" style={{ color: t.textMuted }} />
            <p className="text-sm" style={{ color: t.textMuted }}>No pending friend requests.</p>
          </div>
        )}
        <div className="space-y-2">
          {incomingRequests.map((req) => {
            const requester = req.requester || req.sender || req;
            return (
              <div
                key={req._id}
                className="flex items-center justify-between gap-3 rounded-2xl border p-3"
                style={{ backgroundColor: t.cardBg, borderColor: t.border }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white" style={{ backgroundColor: t.accentPrimary }}>
                    {(requester.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{requester.username}</p>
                    {requester.email && (
                      <p className="truncate text-xs" style={{ color: t.textMuted }}>{requester.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={busyRequestId === req._id}
                    onClick={() => handleRespondFriend(req._id, 'accepted')}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white disabled:opacity-60"
                    title="Accept"
                  >
                    {busyRequestId === req._id ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                  </button>
                  <button
                    type="button"
                    disabled={busyRequestId === req._id}
                    onClick={() => handleRespondFriend(req._id, 'rejected')}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white disabled:opacity-60"
                    title="Decline"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Group Invites */}
      <div>
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide" style={{ color: t.textMuted }}>
          Group Invites {groupInvites.length > 0 && `(${groupInvites.length})`}
        </h2>
        {loadingGroupInvites && <p className="text-sm" style={{ color: t.textMuted }}>Loading...</p>}
        {!loadingGroupInvites && groupInvites.length === 0 && (
          <div className="rounded-2xl border p-6 text-center" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
            <Users size={28} className="mx-auto mb-2" style={{ color: t.textMuted }} />
            <p className="text-sm" style={{ color: t.textMuted }}>No pending group invites.</p>
          </div>
        )}
        <div className="space-y-2">
          {groupInvites.map((inv) => (
            <div
              key={inv._id}
              className="flex items-center justify-between gap-3 rounded-2xl border p-3"
              style={{ backgroundColor: t.cardBg, borderColor: t.border }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: '#7c3aed' }}>
                  <Users size={16} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>
                    {inv.conversation?.groupName || 'Group'}
                  </p>
                  <p className="truncate text-xs" style={{ color: t.textMuted }}>
                    Invited by {inv.invitedBy?.username || 'someone'}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={busyInviteId === inv._id}
                  onClick={() => handleRespondGroup(inv._id, 'accepted')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white disabled:opacity-60"
                  title="Accept"
                >
                  {busyInviteId === inv._id ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                  type="button"
                  disabled={busyInviteId === inv._id}
                  onClick={() => handleRespondGroup(inv._id, 'rejected')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white disabled:opacity-60"
                  title="Decline"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Create New Group Tab ──────────────────────────────────────────────────────

const CreateGroupTab = ({ t }) => {
  const { friends, createGroup, openConversation } = useChat();
  const [query, setQuery] = useState('');
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

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    setCreating(true);
    try {
      const conv = await createGroup(groupName.trim(), selectedUsers.map((u) => u._id));
      toast.success(`Group "${groupName.trim()}" created!`);
      setGroupName('');
      setSelectedUsers([]);
      setQuery('');
      if (conv?._id) openConversation(conv._id);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Left: Group setup & friend picker ── */}
      <div className="flex flex-1 flex-col overflow-y-auto p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide" style={{ color: t.textMuted }}>
          Create New Group
        </h2>

        {/* Group name */}
        <div className="mb-4 rounded-2xl border p-4" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
          <label className="mb-1.5 block text-xs font-bold" style={{ color: t.textMuted }}>Group Name</label>
          <input
            type="text"
            placeholder="Enter group name..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
            style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
          />
        </div>

        {/* Selected chips */}
        {selectedUsers.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedUsers.map((u) => (
              <span
                key={u._id}
                onClick={() => toggleSelect(u)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ backgroundColor: t.chipBg, color: t.textPrimary }}
              >
                {u.username} <X size={11} />
              </span>
            ))}
          </div>
        )}

        {/* Friend search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
          <input
            type="text"
            placeholder="Search friends to add..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none"
            style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
          />
        </div>

        {/* Friend list */}
        <div className="space-y-1.5">
          {filteredFriends.length === 0 && (
            <p className="py-3 text-center text-xs" style={{ color: t.textMuted }}>
              {friends.length === 0 ? 'No friends yet — add some first.' : 'No matching friends.'}
            </p>
          )}
          {filteredFriends.map((u) => {
            const isSelected = selectedUsers.some((s) => s._id === u._id);
            return (
              <button
                key={u._id}
                type="button"
                onClick={() => toggleSelect(u)}
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ backgroundColor: isSelected ? t.chipBg : 'transparent' }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: t.accentPrimary }}>
                  {(u.username || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{u.username}</p>
                  {u.email && <p className="truncate text-xs" style={{ color: t.textMuted }}>{u.email}</p>}
                </div>
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                  style={{
                    borderColor: isSelected ? t.accentPrimary : t.border,
                    backgroundColor: isSelected ? t.accentPrimary : 'transparent',
                  }}
                >
                  {isSelected && <Check size={11} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile-only create button */}
        <button
          type="button"
          disabled={!groupName.trim() || selectedUsers.length === 0 || creating}
          onClick={handleCreate}
          className="mt-5 w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40 sm:hidden"
          style={{ backgroundColor: t.accentPrimary }}
        >
          {creating
            ? 'Creating...'
            : selectedUsers.length > 0
            ? `Create Group · ${selectedUsers.length} member${selectedUsers.length > 1 ? 's' : ''}`
            : 'Create Group'}
        </button>
      </div>

      {/* ── Right: Member detail panel (desktop only) ── */}
      <div
        className="hidden w-64 shrink-0 flex-col border-l sm:flex"
        style={{ borderColor: t.border }}
      >
        <div className="flex-1 overflow-y-auto p-4">
          {/* Member count card */}
          <div
            className="mb-4 flex items-center justify-between rounded-2xl p-4"
            style={{ backgroundColor: t.chipBg }}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Members</p>
              <p className="mt-0.5 text-4xl font-extrabold leading-none" style={{ color: t.accentPrimary }}>
                {selectedUsers.length}
              </p>
              <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
                {selectedUsers.length === 0
                  ? 'None selected yet'
                  : selectedUsers.length === 1
                  ? '1 member added'
                  : `${selectedUsers.length} members added`}
              </p>
            </div>
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: t.accentPrimary + '20' }}
            >
              <Users size={26} style={{ color: t.accentPrimary }} />
            </div>
          </div>

          {/* Group name preview */}
          {groupName.trim() && (
            <div className="mb-4 rounded-xl border p-3" style={{ borderColor: t.border, backgroundColor: t.cardBg }}>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>Group Name</p>
              <p className="mt-0.5 truncate text-sm font-extrabold" style={{ color: t.textPrimary }}>{groupName.trim()}</p>
            </div>
          )}

          {/* Selected members list */}
          {selectedUsers.length > 0 ? (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
                Selected Members
              </p>
              <div className="space-y-1.5">
                {selectedUsers.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center gap-2.5 rounded-xl p-2.5"
                    style={{ backgroundColor: t.pageBg }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white" style={{ backgroundColor: t.accentPrimary }}>
                      {(u.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <p className="min-w-0 flex-1 truncate text-xs font-bold" style={{ color: t.textPrimary }}>{u.username}</p>
                    <button
                      type="button"
                      onClick={() => toggleSelect(u)}
                      className="shrink-0 rounded-full p-1 transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
                      title="Remove"
                    >
                      <X size={12} style={{ color: t.textMuted }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-5 text-center" style={{ borderColor: t.border }}>
              <Users size={22} className="mx-auto mb-2" style={{ color: t.textMuted }} />
              <p className="text-xs" style={{ color: t.textMuted }}>
                Select friends from the left to add them to your group
              </p>
            </div>
          )}
        </div>

        {/* Create button pinned to bottom of detail panel */}
        <div className="shrink-0 border-t p-4" style={{ borderColor: t.border }}>
          <button
            type="button"
            disabled={!groupName.trim() || selectedUsers.length === 0 || creating}
            onClick={handleCreate}
            className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: t.accentPrimary }}
          >
            {creating
              ? 'Creating...'
              : selectedUsers.length > 0
              ? `Create Group · ${selectedUsers.length} member${selectedUsers.length > 1 ? 's' : ''}`
              : 'Create Group'}
          </button>
          {(!groupName.trim() || selectedUsers.length === 0) && (
            <p className="mt-2 text-center text-[10px]" style={{ color: t.textMuted }}>
              {!groupName.trim() ? 'Enter a group name to continue' : 'Select at least 1 member'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main ChatSection ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'chats', label: 'Chats', icon: MessageSquare },
  { id: 'add-friends', label: 'Add Friends', icon: UserPlus },
  { id: 'requests', label: 'Requests', icon: Clock },
  { id: 'create-group', label: 'Create New Group', icon: Users },
];

const ChatSection = ({ t, initialTab }) => {
  const {
    totalUnread,
    pendingFriendRequestCount,
    pendingGroupInviteCount,
    startDM,
    createGroup,
    friends,
  } = useChat();

  const { suppressWidget, unsuppressWidget } = useAIChat();

  useEffect(() => {
    suppressWidget();
    return () => unsuppressWidget();
  }, [suppressWidget, unsuppressWidget]);

  const [activeTab, setActiveTab] = useState(initialTab || 'chats');
  const [showNewChat, setShowNewChat] = useState(false);

  // Badge counts for nav tabs
  const requestsBadge = pendingFriendRequestCount + pendingGroupInviteCount;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-[24px] border"
      style={{
        backgroundColor: t.cardBg,
        borderColor: t.border,
        boxShadow: t.shadowSoft,
        height: 'calc(100dvh - 80px - 3rem)',  /* dynamic viewport minus navbar (≈80px) minus parent padding (1.5rem top+bottom) */
        minHeight: '500px',
      }}
    >
      {/* ── Internal navigation bar ── */}
      <div
        className="flex shrink-0 items-center gap-1 overflow-x-auto border-b px-3 py-2"
        style={{ borderColor: t.border }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badge =
            tab.id === 'chats' ? totalUnread
            : tab.id === 'requests' ? requestsBadge
            : 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-colors"
              style={{
                backgroundColor: isActive ? t.accentPrimary : 'transparent',
                color: isActive ? '#fff' : t.textMuted,
              }}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
              {badge > 0 && (
                <span
                  className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-extrabold text-white"
                  style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : '#ef4444' }}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </button>
          );
        })}

        {/* New Chat / New Group shortcut button (only visible on Chats tab) */}
        {activeTab === 'chats' && (
          <button
            type="button"
            onClick={() => setShowNewChat(true)}
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: t.border, color: t.textPrimary }}
          >
            <Plus size={13} /> New Chat
          </button>
        )}
      </div>

      {/* ── Tab content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === 'chats' && (
          <ChatsTab t={t} onOpenNewChat={() => setShowNewChat(true)} />
        )}
        {activeTab === 'add-friends' && <AddFriendsTab t={t} />}
        {activeTab === 'requests' && <RequestsTab t={t} />}
        {activeTab === 'create-group' && <CreateGroupTab t={t} />}
      </div>

      {/* New Chat / Group Modal */}
      {showNewChat && (
        <NewChatModal
          t={t}
          onClose={() => setShowNewChat(false)}
          onStartDM={startDM}
          onCreateGroup={createGroup}
        />
      )}
    </div>
  );
};

export default ChatSection;
