const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const { createNotification } = require('../utils/createNotification');

const resolveUserId = (req) => (req.user?._id || req.user?.userId).toString();

// Pulls the live io instance the same way chatController.js does — safe to
// call even if sockets aren't connected for some reason.
let getIO = null;
try {
  // eslint-disable-next-line global-require
  const socketHandler = require('../socket/socketHandler');
  if (typeof socketHandler.getIO === 'function') getIO = socketHandler.getIO;
} catch (err) {
  // socketHandler not available — REST still works, just no live push.
}

const emitToUser = (userId, event, payload) => {
  if (!getIO) return;
  try {
    const io = getIO();
    if (io) io.to(userId.toString()).emit(event, payload);
  } catch (err) {
    console.error('Socket emit failed (non-fatal):', err.message);
  }
};

// Checks both directions — a friendship is symmetric even though the
// underlying request document is directional (requester -> recipient).
const areFriends = async (userIdA, userIdB) => {
  const accepted = await FriendRequest.findOne({
    status: 'accepted',
    $or: [
      { requester: userIdA, recipient: userIdB },
      { requester: userIdB, recipient: userIdA },
    ],
  });
  return !!accepted;
};

// POST /api/friends/request   body: { userId }
const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const myId = resolveUserId(req);
    if (userId === myId) return res.status(400).json({ message: "You can't friend-request yourself" });

    const me = req.user;
    const other = await User.findById(userId).select('username email role status');
    if (!other) return res.status(404).json({ message: 'User not found' });

    // Student-to-student only, for now.
    if (me.role !== 'student' || other.role !== 'student') {
      return res.status(403).json({ message: 'Chat is currently available for students only' });
    }
    if (other.status !== 'approved') {
      return res.status(400).json({ message: 'That user is not available to add' });
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { requester: myId, recipient: userId },
        { requester: userId, recipient: myId },
      ],
      status: { $in: ['pending', 'accepted'] },
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ message: 'You are already friends' });
      }
      return res.status(400).json({ message: 'A friend request is already pending between you two' });
    }

    const request = await FriendRequest.create({ requester: myId, recipient: userId });

    createNotification(userId, {
      type: 'friend',
      title: 'New Friend Request',
      message: `${me.username || me.email} sent you a friend request`,
      link: 'chat:friend-requests',
    });

    // Live push: the recipient's ChatContext (if their socket is
    // connected) adds this straight into friendRequests.incoming so the
    // badge and popover update instantly, with no refresh/poll needed.
    const populatedRequest = await request.populate('requester', 'username email department');
    emitToUser(userId, 'friend:request', populatedRequest);

    res.status(201).json(request);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid user ID' });
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/friends/request/:id   body: { status: 'accepted' | 'rejected' }
const respondToFriendRequest = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "status must be 'accepted' or 'rejected'" });
    }

    const request = await FriendRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Friend request not found' });

    const myId = resolveUserId(req);
    if (request.recipient.toString() !== myId) {
      return res.status(403).json({ message: 'Only the recipient can respond to this request' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been responded to' });
    }

    request.status = status;
    await request.save();

    if (status === 'accepted') {
      const me = req.user;
      createNotification(request.requester, {
        type: 'friend',
        title: 'Friend Request Accepted',
        message: `${me.username || me.email} accepted your friend request`,
        link: 'chat:friend-requests',
      });

      // Live push: tells the original requester's ChatContext to move this
      // out of "outgoing" and into "friends" immediately.
      const populatedRequest = await request.populate('recipient', 'username email department');
      emitToUser(request.requester, 'friend:accepted', populatedRequest);
    }

    res.status(200).json(request);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid request ID' });
    res.status(500).json({ message: err.message });
  }
};

// GET /api/friends/requests — both incoming (pending, for me to respond to)
// and outgoing (pending, sent by me, awaiting the other person)
const getFriendRequests = async (req, res) => {
  try {
    const myId = resolveUserId(req);

    const [incoming, outgoing] = await Promise.all([
      FriendRequest.find({ recipient: myId, status: 'pending' })
        .populate('requester', 'username email department')
        .sort({ createdAt: -1 }),
      FriendRequest.find({ requester: myId, status: 'pending' })
        .populate('recipient', 'username email department')
        .sort({ createdAt: -1 }),
    ]);

    res.status(200).json({ incoming, outgoing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/friends — accepted friends list
const getFriends = async (req, res) => {
  try {
    const myId = resolveUserId(req);

    const accepted = await FriendRequest.find({
      status: 'accepted',
      $or: [{ requester: myId }, { recipient: myId }],
    })
      .populate('requester', 'username email department')
      .populate('recipient', 'username email department');

    const friends = accepted.map((r) =>
      r.requester._id.toString() === myId ? r.recipient : r.requester
    );

    res.status(200).json(friends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  areFriends,
  sendFriendRequest,
  respondToFriendRequest,
  getFriendRequests,
  getFriends,
};