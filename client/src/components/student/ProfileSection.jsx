import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Camera, Lock, Users, UserPlus, Search, Check, X, Loader2, Pencil, ArrowLeft, MessageCircle,
} from 'lucide-react';
import userApi from '../../api/userApi';
import uploadApi from '../../api/uploadApi';
import { useChat } from '../../context/ChatContext';
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
const ProfileSection = ({ t, profileUserId, onBack, onViewProfile, onOpenChat, autoOpenRequests, onAutoOpenRequestsHandled }) => {  const { user: authUser, setUser: setAuthUser } = useAuth();

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
      onOpenChat();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not open chat.');
    } finally {
      setStartingChat(false);
    }
  };

  // ── Add friend from someone else's profile page ──────────
  const [sendingRequest, setSendingRequest] = useState(false);
  const [justSentTo, setJustSentTo] = useState(new Set());

  // ── Friends list modal (own profile only) ─────────────────
  const [showFriendsList, setShowFriendsList] = useState(false);

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
            onClick={() => setShowFriendsList(true)}
            className="inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-extrabold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: t.border, color: t.textPrimary, backgroundColor: t.cardBg }}
          >
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

      {/* ── Friends list modal (own profile only) ──────────── */}
      {showFriendsList && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowFriendsList(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border shadow-2xl"
            style={{ backgroundColor: t.cardBg, borderColor: t.border }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: t.border }}>
              <h3 className="text-sm font-extrabold" style={{ color: t.textPrimary }}>
                Friends <span style={{ color: t.accentPrimary }}>{friends.length}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowFriendsList(false)}
                className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X size={16} style={{ color: t.textMuted }} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {friends.length === 0 && (
                <p className="py-6 text-center text-xs" style={{ color: t.textMuted }}>
                  No friends yet.
                </p>
              )}
              {friends.map((f) => {
                const fid = f._id || f.id;
                return (
                  <button
                    key={fid}
                    type="button"
                    onClick={() => {
                      setShowFriendsList(false);
                      onViewProfile(fid);
                    }}
                    className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-extrabold text-white" style={{ backgroundColor: t.accentPrimary }}>
                      {f.profileImage ? (
                        <img src={f.profileImage} alt={f.username} className="h-full w-full object-cover" />
                      ) : (
                        (f.username || '?').charAt(0).toUpperCase()
                      )}
                    </div>
                    <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{f.username}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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

    </div>
  );
};

export default ProfileSection;