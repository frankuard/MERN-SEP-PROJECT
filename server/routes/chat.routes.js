const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  searchUsers,
  getMyConversations,
  getOrCreateDM,
  createGroup,
  updateGroupMembers,
  deleteConversation,
  leaveGroup,
  getMessages,
  sendMessage,
  deleteMessages,
  markConversationRead,
  getMyGroupInvites,
  respondToGroupInvite,
} = require('../controllers/chatController');

router.get('/users/search', authMiddleware, searchUsers);

router.get('/conversations', authMiddleware, getMyConversations);
router.post('/conversations/dm', authMiddleware, getOrCreateDM);
router.post('/conversations/group', authMiddleware, createGroup);
router.patch('/conversations/:id/members', authMiddleware, updateGroupMembers);
router.delete('/conversations/:id', authMiddleware, deleteConversation);
router.patch('/conversations/:id/leave', authMiddleware, leaveGroup);

router.get('/group-invites', authMiddleware, getMyGroupInvites);
router.patch('/group-invites/:id', authMiddleware, respondToGroupInvite);

router.get('/conversations/:id/messages', authMiddleware, getMessages);
router.post('/conversations/:id/messages', authMiddleware, sendMessage);
router.delete('/conversations/:id/messages', authMiddleware, deleteMessages);
router.patch('/conversations/:id/read', authMiddleware, markConversationRead);

module.exports = router;