import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Camera, Lock, Users, UserPlus, Search, Check, X, Loader2, Pencil, ArrowLeft, MessageCircle,
} from 'lucide-react';
import userApi from '../../api/userApi';
import uploadApi from '../../api/uploadApi';
import { useChat } from '../../context/ChatContext';
import { useAIChat } from '../../context/AIChatContext';
import chatApi from '../../api/chatApi';
import { useAuth } from '../../context/AuthContext';
import ImageCropModal from '../common/ImageCropModal';
import toast from 'react-hot-toast';

const Card = ({ t, children, className = '' }) => (
  <div
    className={`rounded-[24px] border p-5 sm:p-6 ${className}`}
    style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}
  >
    {children}
  </div>
);

const Input = ({ t, ...props }) => (
  <input
    {...props}
    className="w-full rounded-2xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-offset-1"
    style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary, ['--tw-ring-color']: t.accentPrimary }}
  />
);

// profileUserId: optional. When set (and different from the logged-in user's
// own id), the section renders READ-ONLY with an Add Friend button instead
// of edit controls. onBack fires when leaving someone else's profile.
const ProfileSection = ({ t, profileUserId, onBack, onViewProfile, autoOpenRequests, onAutoOpenRequestsHandled }) => {  const { user: authUser, setUser: setAuthUser } = useAuth();

  const isOwnProfile = !profileUserId || profileUserId === (authUser?._id || authUser?.id);

  // ── Whose profile is displayed ───────────────────────────
  const [viewedUser, setViewedUser] = useState(isOwnProfile ? authUser : null);
  const [loadingProfile, setLoadingProfile] = useState(!isOwnProfile);

  useEffect(() => {
    if (isOwnProfile) {
      setViewedUser(authUser);
      return;
    }
    setLoadingProfile(true);
    userApi.getUserProfile(profileUserId)
      .then(setViewedUser)
      .catch(() => toast.error('Could not load that profile.'))
      .finally(() => setLoadingProfile(false));
  }, [profileUserId, isOwnProfile, authUser]);

  const user = viewedUser;

  // ── Cover + avatar upload (own profile only) ─────────────
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropTarget, setCropTarget] = useState(null); // { file, field } | null

  const handleFilePicked = (file, field) => {
    if (!file) return;
    setCropTarget({ file, field });
  };

  const handleCropConfirm = async (blob) => {
    const field = cropTarget.field;
    const setUploading = field === 'profileImage' ? setUploadingAvatar : setUploadingCover;
    setCropTarget(null);
    setUploading(true);
    try {
      const folder = field === 'profileImage' ? 'profile-photo' : 'cover-photo';
      const fileToUpload = new File([blob], `${field}.jpg`, { type: 'image/jpeg' });
      const { url } = await uploadApi.uploadImage(fileToUpload, folder);
      const res = await userApi.updateProfile({ [field]: url });
      setAuthUser(res.user);
      setViewedUser(res.user);
      toast.success(field === 'coverPhoto' ? 'Cover photo updated!' : 'Profile photo updated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // ── Bio (own profile only) ────────────────────────────────
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => { setBio(user?.bio || ''); }, [user?.bio]);

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      const res = await userApi.updateProfile({ bio });
      setAuthUser(res.user);
      setViewedUser(res.user);
      setEditingBio(false);
      toast.success('Bio updated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update bio.');
    } finally {
      setSavingBio(false);
    }
  };

  // ── Credentials (own profile only) ────────────────────────
  const [username, setUsername] = useState(authUser?.username || '');
  const [savingUsername, setSavingUsername] = useState(false);

  const handleSaveUsername = async () => {
    setSavingUsername(true);
    try {
      const res = await userApi.updateProfile({ username });
      setAuthUser(res.user);
      setViewedUser(res.user);
      toast.success('Username updated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update username.');
    } finally {
      setSavingUsername(false);
    }
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await userApi.changePassword(currentPassword, newPassword);
      toast.success('Password updated!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Friends + requests — shared with ChatContext ──────────
  const {
    friends,
    friendRequests,
    loadingFriends,
    fetchFriends,
    fetchFriendRequests,
    sendFriendRequest: sendFriendRequestCtx,
    respondToFriendRequest: respondToFriendRequestCtx,
    startDM,
    openChat,
  } = useChat();

  const incomingRequests = friendRequests.incoming;
  const outgoingRequestIds = new Set(
    friendRequests.outgoing.map((r) => r.recipient?._id || r.recipient || r.userId)
  );

  const handleRespondRequest = async (requestId, status) => {
    try {
      await respondToFriendRequestCtx(requestId, status);
      toast.success(status === 'accepted' ? 'Friend request accepted!' : 'Request declined.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not respond to request.');
    }
  };

  const isFriend = (id) => friends.some((f) => (f._id || f.id) === id);
  const isRequestSent = (id, sentSet) => sentSet.has(id) || outgoingRequestIds.has(id);

// ── Message a friend from their profile page ──────────────
  const [startingChat, setStartingChat] = useState(false);

  const handleMessageFriend = async () => {
    const targetId = user?._id || user?.id;
    if (!targetId) return;
    setStartingChat(true);
    try {
      await startDM(targetId);
      openChat('chats');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not open chat.');
    } finally {
      setStartingChat(false);
    }
  };

  // ── Add friend from someone else's profile page ──────────
  const [sendingRequest, setSendingRequest] = useState(false);
  const [justSentTo, setJustSentTo] = useState(new Set());

  const handleAddFriendOnProfile = async () => {
    const targetId = user?._id || user?.id;
    if (!targetId) return;
    setSendingRequest(true);
    try {
      await sendFriendRequestCtx(targetId);
      setJustSentTo((prev) => new Set(prev).add(targetId));
      toast.success(`Friend request sent to ${user.username}!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not send request.');
    } finally {
      setSendingRequest(false);
    }
  };

  // ── Search / add friends (own profile's Add Friends tab) ──
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sentTo, setSentTo] = useState(new Set());

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

  const handleAddFriend = async (targetUser) => {
    const targetId = targetUser._id || targetUser.id;
    try {
      await sendFriendRequestCtx(targetId);
      setSentTo((prev) => new Set(prev).add(targetId));
      toast.success(`Friend request sent to ${targetUser.username}!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not send request.');
    }
  };

  // ── Friends overlay (own profile only) ────────────────────
  const { raiseWidget, lowerWidget } = useAIChat();
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friendsTab, setFriendsTab] = useState('friends');

  // Lift the floating chat launcher out of the way while this modal
  // covers the bottom of the screen, and restore it on close/unmount.
  useEffect(() => {
    if (showFriendsModal) raiseWidget();
    else lowerWidget();
    return () => lowerWidget();
  }, [showFriendsModal, raiseWidget, lowerWidget]);

  // Arrived here via the profile pill's friend-request badge — jump
  // straight to the Requests tab instead of landing on the base profile.
  useEffect(() => {
    if (!autoOpenRequests || !isOwnProfile) return;
    setShowFriendsModal(true);
    setFriendsTab('requests');
    fetchFriendRequests();
    fetchFriends();
    onAutoOpenRequestsHandled?.();
  }, [autoOpenRequests, isOwnProfile, fetchFriendRequests, fetchFriends, onAutoOpenRequestsHandled]);

  const goToProfile = (id) => {
    if (typeof onViewProfile === 'function') {
      setShowFriendsModal(false);
      onViewProfile(id);
    }
  };

  if (loadingProfile) {
    return <p className="p-6 text-sm" style={{ color: t.textMuted }}>Loading profile...</p>;
  }
  if (!user) return null;

  const targetId = user._id || user.id;
  const alreadyFriend = isFriend(targetId);
  const requestSent = justSentTo.has(targetId) || outgoingRequestIds.has(targetId);

  return (
    <div className="animate-in fade-in duration-200">
      {!isOwnProfile && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-extrabold"
          style={{ color: t.textMuted }}
        >
          <ArrowLeft size={14} /> Back
        </button>
      )}

      {/* ── Cover + avatar header ───────────────────────── */}
      <div className="relative mb-16 w-full">
        <div
          className="h-40 w-full overflow-hidden rounded-[24px] border sm:h-56"
          style={{ backgroundColor: t.pageBg, borderColor: t.border }}
        >
          {user?.coverPhoto ? (
            <img src={user.coverPhoto} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${t.accentPrimary}33, ${t.accentPrimary}11)` }} />
          )}
        </div>

        {isOwnProfile && (
          <>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform hover:scale-105"
            >
              {uploadingCover ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { handleFilePicked(e.target.files?.[0], 'coverPhoto'); e.target.value = ''; }}
            />
          </>
        )}

        <div className="absolute -bottom-14 left-5 sm:-bottom-16 sm:left-6">
          <div className="relative h-24 w-24 sm:h-28 sm:w-28">
            <div
              className="h-full w-full overflow-hidden rounded-full border-4"
              style={{ borderColor: t.cardBg, backgroundColor: t.pageBg }}
            >
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.username} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-white" style={{ backgroundColor: '#111' }}>
                  {(user?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {isOwnProfile && (
              <>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow-md transition-transform hover:scale-105"
                >
                  {uploadingAvatar ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { handleFilePicked(e.target.files?.[0], 'profileImage'); e.target.value = ''; }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Name + friends / add friend ─────────────────── */}
      <div className="mb-6 flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: t.textPrimary }}>{user?.username}</h2>
          {user?.department && (
            <p className="text-xs font-semibold" style={{ color: t.textMuted }}>{user.department}</p>
          )}
        </div>

        {isOwnProfile ? (
          <button
            type="button"
            onClick={() => { setShowFriendsModal(true); setFriendsTab('friends'); fetchFriendRequests(); fetchFriends(); }}
            className="relative inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-extrabold transition-colors"
            style={{ borderColor: t.border, color: t.textPrimary, backgroundColor: t.cardBg }}
          >
            {incomingRequests.length > 0 && (
              <span
                className="absolute -left-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white z-10"
                style={{ border: `2px solid ${t.cardBg}` }}
              >
                {incomingRequests.length > 9 ? '9+' : incomingRequests.length}
              </span>
            )}
            <Users size={15} />
            Friends <span style={{ color: t.accentPrimary }}>{friends.length}</span>
          </button>
        ) : alreadyFriend ? (
          <button
            type="button"
            onClick={handleMessageFriend}
            disabled={startingChat}
            className="inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: t.accentPrimary || '#111' }}
          >
            {startingChat ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={15} />}
            Message
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAddFriendOnProfile}
            disabled={requestSent || sendingRequest}
            className="inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition-colors disabled:opacity-60"
            style={{
              backgroundColor: requestSent ? t.border : '#111',
              color: requestSent ? t.textMuted : '#fff',
            }}
          >
            {sendingRequest ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={15} />}
            {requestSent ? 'Requested' : 'Add Friend'}
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* ── Bio ──────────────────────────────────────── */}
        <Card t={t}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wide" style={{ color: t.textMuted }}>Bio</h3>
            {isOwnProfile && !editingBio && (
              <button type="button" onClick={() => setEditingBio(true)} className="flex items-center gap-1 text-xs font-bold" style={{ color: t.accentPrimary }}>
                <Pencil size={12} /> Edit
              </button>
            )}
          </div>

          {isOwnProfile && editingBio ? (
            <div className="space-y-2">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 280))}
                rows={3}
                placeholder="Tell people a bit about yourself..."
                className="w-full resize-none rounded-2xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-offset-1"
                style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary, ['--tw-ring-color']: t.accentPrimary }}
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold" style={{ color: t.textMuted }}>{bio.length}/280</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setBio(user?.bio || ''); setEditingBio(false); }} className="rounded-full px-4 py-1.5 text-xs font-bold" style={{ color: t.textMuted }}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleSaveBio} disabled={savingBio} className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-xs font-extrabold text-white disabled:opacity-60">
                    {savingBio && <Loader2 size={12} className="animate-spin" />} Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: user?.bio ? t.textPrimary : t.textMuted }}>
              {user?.bio || (isOwnProfile ? 'No bio yet — tap Edit to add one.' : 'No bio yet.')}
            </p>
          )}
        </Card>

        {/* ── Edit credentials (own profile only) ─────────── */}
        {isOwnProfile && (
          <Card t={t}>
            <h3 className="mb-4 text-sm font-extrabold uppercase tracking-wide" style={{ color: t.textMuted }}>Edit Credentials</h3>

            <div className="mb-5 space-y-2">
              <label className="block text-xs font-bold" style={{ color: t.textMuted }}>Username</label>
              <div className="flex gap-2">
                <Input t={t} value={username} onChange={(e) => setUsername(e.target.value)} />
                <button
                  type="button"
                  onClick={handleSaveUsername}
                  disabled={savingUsername || username === authUser?.username}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-extrabold text-white disabled:opacity-40"
                >
                  {savingUsername && <Loader2 size={12} className="animate-spin" />} Save
                </button>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4" style={{ borderColor: t.border }}>
              <label className="flex items-center gap-1.5 text-xs font-bold" style={{ color: t.textMuted }}>
                <Lock size={12} /> Change Password
              </label>
              <Input t={t} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" />
              <Input t={t} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
              <Input t={t} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={savingPassword || !currentPassword || !newPassword}
                className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-60"
              >
                {savingPassword && <Loader2 size={14} className="animate-spin" />} Update Password
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* ── Crop modal ────────────────────────────────────── */}
      {cropTarget && (
        <ImageCropModal
          t={t}
          file={cropTarget.file}
          shape={cropTarget.field === 'profileImage' ? 'round' : 'rect'}
          aspect={cropTarget.field === 'profileImage' ? 1 : 3}
          onCancel={() => setCropTarget(null)}
          onConfirm={handleCropConfirm}
        />
      )}

      {/* ── Friends overlay (own profile only) ────────────── */}
      {isOwnProfile && showFriendsModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setShowFriendsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[80vh] w-full flex-col rounded-t-[24px] sm:max-h-[600px] sm:w-[420px] sm:rounded-[24px]"
            style={{ backgroundColor: t.cardBg }}
          >
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: t.border }}>
              <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>Friends</h3>
              <button type="button" onClick={() => setShowFriendsModal(false)} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ color: t.textMuted }}>
                <X size={16} />
              </button>
            </div>

            <div className="flex border-b px-2" style={{ borderColor: t.border }}>
              {[
                { key: 'friends', label: `Friends (${friends.length})` },
                { key: 'requests', label: `Requests${incomingRequests.length ? ` (${incomingRequests.length})` : ''}` },
                { key: 'add', label: 'Add Friends' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFriendsTab(tab.key)}
                  className="relative px-3 py-3 text-xs font-extrabold"
                  style={{ color: friendsTab === tab.key ? t.textPrimary : t.textMuted }}
                >
                  {tab.label}
                  {friendsTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ backgroundColor: t.accentPrimary }} />
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {friendsTab === 'friends' && (
                loadingFriends ? (
                  <p className="text-sm" style={{ color: t.textMuted }}>Loading...</p>
                ) : friends.length === 0 ? (
                  <p className="text-sm" style={{ color: t.textMuted }}>No friends yet — try the Add Friends tab.</p>
                ) : (
                  <div className="space-y-2">
                    {friends.map((f) => (
                      <button
                        key={f._id || f.id}
                        type="button"
                        onClick={() => goToProfile(f._id || f.id)}
                        className="flex w-full items-center gap-2.5 rounded-2xl p-2.5 text-left"
                        style={{ backgroundColor: t.pageBg }}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-xs font-extrabold text-white">
                          {(f.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{f.username}</p>
                      </button>
                    ))}
                  </div>
                )
              )}

              {friendsTab === 'requests' && (
                incomingRequests.length === 0 ? (
                  <p className="text-sm" style={{ color: t.textMuted }}>No pending requests.</p>
                ) : (
                  <div className="space-y-2">
                    {incomingRequests.map((req) => {
                      const requester = req.requester || req.sender || req;
                      return (
                        <div key={req._id} className="flex items-center justify-between gap-2 rounded-2xl p-2.5" style={{ backgroundColor: t.pageBg }}>
                          <button
                            type="button"
                            onClick={() => goToProfile(requester._id || requester.id)}
                            className="flex min-w-0 items-center gap-2 text-left"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-xs font-extrabold text-white">
                              {(requester.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{requester.username}</p>
                          </button>
                          <div className="flex shrink-0 gap-1.5">
                            <button type="button" onClick={() => handleRespondRequest(req._id, 'accepted')} className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white">
                              <Check size={13} />
                            </button>
                            <button type="button" onClick={() => handleRespondRequest(req._id, 'rejected')} className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white">
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {friendsTab === 'add' && (
                <div>
                  <div className="relative mb-3">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search by username..."
                      className="w-full rounded-2xl border py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-offset-1"
                      style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary, ['--tw-ring-color']: t.accentPrimary }}
                    />
                  </div>

                  {searching && <p className="text-sm" style={{ color: t.textMuted }}>Searching...</p>}
                  {!searching && searchInput.trim() && searchResults.length === 0 && (
                    <p className="text-sm" style={{ color: t.textMuted }}>No users found.</p>
                  )}

                  <div className="space-y-2">
                    {searchResults.map((person) => {
                      const id = person._id || person.id;
                      const already = isFriend(id);
                      const sent = isRequestSent(id, sentTo);
                      return (
                        <div key={id} className="flex items-center justify-between gap-2 rounded-2xl p-2.5" style={{ backgroundColor: t.pageBg }}>
                          <button
                            type="button"
                            onClick={() => goToProfile(id)}
                            className="flex min-w-0 items-center gap-2.5 text-left"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-xs font-extrabold text-white">
                              {(person.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{person.username}</p>
                          </button>
                          <button
                            type="button"
                            disabled={already || sent}
                            onClick={() => handleAddFriend(person)}
                            className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-colors disabled:opacity-60"
                            style={{ backgroundColor: already || sent ? t.border : '#111', color: already || sent ? t.textMuted : '#fff' }}
                          >
                            {already ? 'Friends' : sent ? 'Requested' : 'Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;