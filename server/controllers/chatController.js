const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const GroupInvite = require('../models/GroupInvite');
const User = require('../models/User');
const { areFriends } = require('./friendController');
const { createNotification } = require('../utils/createNotification');

const resolveUserId = (req) => (req.user?._id || req.user?.userId).toString();

// Pulls the live io instance the same way createNotification.js does —
// safe to call even if sockets aren't connected for some reason.
let getIO = null;
try {
  // eslint-disable-next-line global-require
  const socketHandler = require('../socket/socketHandler');
  if (typeof socketHandler.getIO === 'function') getIO = socketHandler.getIO;
} catch (err) {
  // socketHandler not available — REST still works, just no live push.
}

const emitToRoom = (room, event, payload) => {
  if (!getIO) return;
  try {
    const io = getIO();
    if (io) io.to(room).emit(event, payload);
  } catch (err) {
    console.error('Socket emit failed (non-fatal):', err.message);
  }
};

// Checks whether a given user currently has this conversation's room open
// (i.e. their socket already ran 'conversation:join' for it) — used to
// skip sending a redundant notification to someone already watching the
// thread live.
const isUserViewingConversation = (conversationId, userId) => {
  if (!getIO) return false;
  try {
    const io = getIO();
    if (!io) return false;
    const room = io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
    if (!room) return false;
    for (const socketId of room) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket?.user?._id?.toString() === userId) return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

// ========================================================
// User search — for sending a friend request or inviting to a group
// ========================================================

// GET /api/chat/users/search?q=someone@email.com
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.status(200).json([]);

    const myId = resolveUserId(req);
    const regex = new RegExp(q.trim(), 'i');

    // Student-to-student only, for now — don't surface teachers/admins as
    // chattable results even if their username/email matches the search.
    const users = await User.find({
      _id: { $ne: myId },
      status: 'approved',
      role: 'student',
      $or: [{ email: regex }, { username: regex }],
    })
      .select('username email role department profileImage')
      .limit(15);

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// Conversations
// ========================================================

// GET /api/chat/conversations — this user's inbox, most recent first
const getMyConversations = async (req, res) => {
  try {
    const myId = resolveUserId(req);

    const conversations = await Conversation.find({
      participants: myId,
      deletedBy: { $ne: myId },
    })
      .populate('participants', 'username email role profileImage')
      .populate('lastMessage.sender', 'username')
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/chat/conversations/dm   body: { userId }
// Requires an accepted friendship — this is the gate the whole friend
// request system exists to enforce. Finds an existing 1-on-1 conversation
// with that user, or creates one.
const getOrCreateDM = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const myId = resolveUserId(req);
    if (userId === myId) return res.status(400).json({ message: "You can't start a chat with yourself" });

    const otherUser = await User.findById(userId).select('username email role');
    if (!otherUser) return res.status(404).json({ message: 'User not found' });

    const friends = await areFriends(myId, userId);
    if (!friends) {
      return res.status(403).json({
        message: 'You need to be friends before you can message this person. Send a friend request first.',
      });
    }

    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [myId, userId], $size: 2 },
    }).populate('participants', 'username email role profileImage');

    if (!conversation) {
      conversation = await Conversation.create({
        isGroup: false,
        participants: [myId, userId],
      });
      conversation = await Conversation.findById(conversation._id).populate(
        'participants',
        'username email role profileImage'
      );
    }

    res.status(200).json(conversation);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid user ID' });
    res.status(500).json({ message: err.message });
  }
};

// POST /api/chat/conversations/group   body: { groupName, memberIds: [] }
// Creator joins immediately as the sole initial participant. Everyone else
// listed in memberIds gets a pending GroupInvite instead of being added
// directly — they only become a participant once they accept it.
const createGroup = async (req, res) => {
  try {
    const { groupName, memberIds } = req.body;
    if (!groupName || !groupName.trim()) {
      return res.status(400).json({ message: 'groupName is required' });
    }

    const myId = resolveUserId(req);
    const invitedIds = [...new Set((Array.isArray(memberIds) ? memberIds : []).filter((id) => id !== myId))];

    if (invitedIds.length === 0) {
      return res.status(400).json({ message: 'A group needs at least one other member to invite' });
    }

    const conversation = await Conversation.create({
      isGroup: true,
      groupName: groupName.trim(),
      createdBy: myId,
      participants: [myId],
    });

    const invites = await GroupInvite.insertMany(
      invitedIds.map((invitedUser) => ({
        conversation: conversation._id,
        invitedUser,
        invitedBy: myId,
      }))
    );

    const me = req.user;
    const populatedInvites = await GroupInvite.find({ _id: { $in: invites.map((i) => i._id) } })
      .populate('conversation', 'groupName groupIcon')
      .populate('invitedBy', 'username email');

    populatedInvites.forEach((invite) => {
      const invitedUserId = invite.invitedUser.toString();
      createNotification(invitedUserId, {
        type: 'group',
        title: 'Group Invite',
        message: `${me.username || me.email} invited you to join "${groupName.trim()}"`,
        link: 'chat:group-invites',
        meta: { inviteId: invite._id },
      });
      // Live push: adds straight into the invited user's groupInvites
      // state, same pattern as friend:request.
      emitToRoom(invitedUserId, 'group:invite', invite);
    });

    const populated = await Conversation.findById(conversation._id).populate(
      'participants',
      'username email role profileImage'
    );

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/chat/conversations/:id/members   body: { addUserId } or { removeUserId }
// addUserId now creates a pending invite instead of joining them directly.
// removeUserId is unchanged — creator-only, immediate removal.
const updateGroupMembers = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.isGroup) return res.status(400).json({ message: 'Not a group conversation' });

    const myId = resolveUserId(req);
    const { addUserId, removeUserId } = req.body;

    if (addUserId) {
      if (!conversation.participants.map(String).includes(myId)) {
        return res.status(403).json({ message: 'Only members can invite people' });
      }
      if (conversation.participants.map(String).includes(addUserId)) {
        return res.status(400).json({ message: 'That user is already in the group' });
      }

      const existingInvite = await GroupInvite.findOne({
        conversation: conversation._id,
        invitedUser: addUserId,
        status: 'pending',
      });
      if (existingInvite) {
        return res.status(400).json({ message: 'That user already has a pending invite to this group' });
      }

      const invitedUser = await User.findById(addUserId).select('username email role status');
      if (!invitedUser) return res.status(404).json({ message: 'User not found' });
      if (invitedUser.role !== 'student') {
        return res.status(403).json({ message: 'Chat is currently available for students only' });
      }

      const invite = await GroupInvite.create({
        conversation: conversation._id,
        invitedUser: addUserId,
        invitedBy: myId,
      });

      const me = req.user;
      createNotification(addUserId, {
        type: 'group',
        title: 'Group Invite',
        message: `${me.username || me.email} invited you to join "${conversation.groupName}"`,
        link: 'chat:group-invites',
        meta: { inviteId: invite._id },
      });

      const populatedInvite = await GroupInvite.findById(invite._id)
        .populate('conversation', 'groupName groupIcon')
        .populate('invitedBy', 'username email');
      emitToRoom(addUserId, 'group:invite', populatedInvite);

      return res.status(200).json({ message: 'Invite sent', invite });
    }

    if (removeUserId) {
      if (conversation.createdBy?.toString() !== myId) {
        return res.status(403).json({ message: 'Only the group creator can remove members' });
      }
      conversation.participants = conversation.participants.filter(
        (p) => p.toString() !== removeUserId
      );
      await conversation.save();

      const populated = await Conversation.findById(conversation._id).populate(
        'participants',
        'username email role profileImage'
      );
      emitToRoom(`conversation:${conversation._id}`, 'conversation:updated', populated);
      return res.status(200).json(populated);
    }

    res.status(400).json({ message: 'addUserId or removeUserId is required' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// Group invites
// ========================================================

// GET /api/chat/group-invites — my pending invites
const getMyGroupInvites = async (req, res) => {
  try {
    const myId = resolveUserId(req);
    const invites = await GroupInvite.find({ invitedUser: myId, status: 'pending' })
      .populate('conversation', 'groupName groupIcon')
      .populate('invitedBy', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json(invites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/chat/group-invites/:id   body: { status: 'accepted' | 'rejected' }
const respondToGroupInvite = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "status must be 'accepted' or 'rejected'" });
    }

    const invite = await GroupInvite.findById(req.params.id);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    const myId = resolveUserId(req);
    if (invite.invitedUser.toString() !== myId) {
      return res.status(403).json({ message: 'Only the invited user can respond to this invite' });
    }
    if (invite.status !== 'pending') {
      return res.status(400).json({ message: 'This invite has already been responded to' });
    }

    invite.status = status;
    await invite.save();

    let conversation = null;
    if (status === 'accepted') {
      conversation = await Conversation.findById(invite.conversation);
      if (conversation && !conversation.participants.map(String).includes(myId)) {
        conversation.participants.push(myId);
        await conversation.save();
      }
      conversation = await Conversation.findById(invite.conversation).populate(
        'participants',
        'username email role profileImage'
      );

      // Let the group's other members' open tabs know someone joined.
      emitToRoom(`conversation:${invite.conversation}`, 'conversation:updated', conversation);
      // Let the newly-joined user's other devices/tabs pick up the new conversation.
      emitToRoom(myId, 'conversation:new', conversation);
    }

    res.status(200).json({ invite, conversation });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid invite ID' });
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// Messages
// ========================================================

// GET /api/chat/conversations/:id/messages?before=<messageId>&limit=30
const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { before, limit = 30 } = req.query;

    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const myId = resolveUserId(req);
    if (!conversation.participants.map(String).includes(myId)) {
      return res.status(403).json({ message: 'Not a participant in this conversation' });
    }

    const filter = { conversation: id };
    if (before) {
      const beforeMsg = await Message.findById(before);
      if (beforeMsg) filter.createdAt = { $lt: beforeMsg.createdAt };
    }

    const messages = await Message.find(filter)
      .populate('sender', 'username email profileImage')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json(messages.reverse());
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid conversation ID' });
    res.status(500).json({ message: err.message });
  }
};

// POST /api/chat/conversations/:id/messages   body: { text }
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, attachmentUrl, attachmentName, attachmentType } = req.body;

    const trimmedText = (text || '').trim();
    if (!trimmedText && !attachmentUrl) {
      return res.status(400).json({ message: 'Message text or an attachment is required' });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const myId = resolveUserId(req);
    if (!conversation.participants.map(String).includes(myId)) {
      return res.status(403).json({ message: 'Not a participant in this conversation' });
    }

    const message = await Message.create({
      conversation: id,
      sender: myId,
      text: trimmedText,
      readBy: [myId],
      attachment: attachmentUrl
        ? { url: attachmentUrl, name: attachmentName || 'file', mimetype: attachmentType || '' }
        : undefined,
    });

    conversation.lastMessage = {
      text: message.text || (message.attachment?.url ? `📎 ${message.attachment.name}` : ''),
      sender: myId,
      sentAt: message.createdAt,
    };
    // If any participant had previously deleted (hidden) this DM from
    // their inbox, a new message means it should reappear for them.
    conversation.deletedBy = conversation.deletedBy.filter(
      (id) => id.toString() === myId
    );
    await conversation.save();

    const populated = await Message.findById(message._id).populate('sender', 'username email profileImage');

    // Live push: anyone with this conversation open right now gets it instantly.
    emitToRoom(`conversation:${id}`, 'message:new', populated);

    // Also nudge every participant's personal room — this is what lets the
    // conversation list / unread badge update even for people who don't
    // currently have this specific thread open.
    const me = req.user;
    const senderLabel = me.username || me.email || 'Someone';
    const messagePreview = message.text || (message.attachment?.url ? `📎 ${message.attachment.name}` : 'sent a message');

    conversation.participants.forEach((p) => {
      const pid = p.toString();
      if (pid === myId) return;

      emitToRoom(pid, 'conversation:bump', { conversationId: id, message: populated });

      // Only notify if they're not already looking at this thread live.
      if (!isUserViewingConversation(id, pid)) {
        createNotification(pid, {
          type: 'message',
          title: conversation.isGroup ? `New message in ${conversation.groupName}` : 'New Message',
          message: conversation.isGroup ? `${senderLabel}: ${messagePreview}` : `${senderLabel}: ${messagePreview}`,
          link: `chat:conversation:${id}`,
        });
      }
    });

    res.status(201).json(populated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid conversation ID' });
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/chat/conversations/:id/read — mark all messages in this conversation as read by me
const markConversationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const myId = resolveUserId(req);

    await Message.updateMany(
      { conversation: id, readBy: { $ne: myId } },
      { $addToSet: { readBy: myId } }
    );

    res.status(200).json({ message: 'Marked as read' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid conversation ID' });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/chat/conversations/:id
// DM: hides it from MY inbox only (adds me to deletedBy). The conversation
// and its messages still exist — the other participant's copy is
// untouched, and if they message me again it reappears in my list (see
// sendMessage, which clears deletedBy for recipients on a new message).
// Group: only the creator can delete — this one destroys the whole group
// and its messages for everyone. Other members should use leaveGroup.
const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const myId = resolveUserId(req);
    const isParticipant = conversation.participants.map(String).includes(myId);
    if (!isParticipant) return res.status(403).json({ message: 'Not a participant in this conversation' });

    if (conversation.isGroup) {
      if (conversation.createdBy?.toString() !== myId) {
        return res.status(403).json({ message: 'Only the group creator can delete the group. Leave it instead.' });
      }

      await Message.deleteMany({ conversation: conversation._id });
      await conversation.deleteOne();

      conversation.participants.forEach((p) => {
        const pid = p.toString();
        if (pid !== myId) emitToRoom(pid, 'conversation:deleted', { conversationId: conversation._id });
      });

      return res.status(200).json({ message: 'Group deleted' });
    }

    // DM: hide-for-me only.
    if (!conversation.deletedBy.map(String).includes(myId)) {
      conversation.deletedBy.push(myId);
      await conversation.save();
    }

    res.status(200).json({ message: 'Conversation removed from your inbox' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid conversation ID' });
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/chat/conversations/:id/leave
// Group only. Removes yourself from participants. If you're the creator,
// this is blocked — creators must delete the group instead, since an
// ownerless group with no delete-permission holder would be stuck.
const leaveGroup = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.isGroup) return res.status(400).json({ message: 'Not a group conversation' });

    const myId = resolveUserId(req);
    if (!conversation.participants.map(String).includes(myId)) {
      return res.status(403).json({ message: 'Not a participant in this conversation' });
    }
    if (conversation.createdBy?.toString() === myId) {
      return res.status(400).json({ message: 'As the creator, delete the group instead of leaving it' });
    }

    conversation.participants = conversation.participants.filter((p) => p.toString() !== myId);
    await conversation.save();

    const populated = await Conversation.findById(conversation._id).populate(
      'participants',
      'username email role profileImage'
    );
    emitToRoom(`conversation:${conversation._id}`, 'conversation:updated', populated);

    res.status(200).json({ message: 'Left the group' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid conversation ID' });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/chat/conversations/:id/messages   body: { messageIds: [...] }
// Only deletes messages sent by the requester (silently skips any others
// passed in) — hard delete, removed for everyone, live-pushed via socket.
const deleteMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: 'messageIds is required' });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const myId = resolveUserId(req);
    if (!conversation.participants.map(String).includes(myId)) {
      return res.status(403).json({ message: 'Not a participant in this conversation' });
    }

    const deletable = await Message.find({
      _id: { $in: messageIds },
      conversation: id,
      sender: myId,
    }).select('_id');

    const deletableIds = deletable.map((m) => m._id.toString());
    if (deletableIds.length === 0) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    await Message.deleteMany({ _id: { $in: deletableIds } });

    emitToRoom(`conversation:${id}`, 'messages:deleted', { conversationId: id, messageIds: deletableIds });

    res.status(200).json({ deletedIds: deletableIds });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  searchUsers,
  getMyConversations,
  getOrCreateDM,
  createGroup,
  updateGroupMembers,
  deleteConversation,
  leaveGroup,
  getMyGroupInvites,
  respondToGroupInvite,
  getMessages,
  sendMessage,
  deleteMessages,
  markConversationRead,
};