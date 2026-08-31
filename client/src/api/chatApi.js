import axiosInstance from './axiosInstance';

const chatApi = {
  // GET /api/chat/users/search?q=...
  searchUsers: async (query) => {
    const res = await axiosInstance.get('/chat/users/search', { params: { q: query } });
    return res.data;
  },

  // GET /api/chat/conversations
  getMyConversations: async () => {
    const res = await axiosInstance.get('/chat/conversations');
    return res.data;
  },

  // POST /api/chat/conversations/dm   body: { userId }
  getOrCreateDM: async (userId) => {
    const res = await axiosInstance.post('/chat/conversations/dm', { userId });
    return res.data;
  },

  // POST /api/chat/conversations/group   body: { groupName, memberIds }
  // Note: creator becomes the only initial participant — everyone else in
  // memberIds gets a GroupInvite instead of being added directly.
  createGroup: async (groupName, memberIds) => {
    const res = await axiosInstance.post('/chat/conversations/group', { groupName, memberIds });
    return res.data;
  },

  // PATCH /api/chat/conversations/:id/members   body: { addUserId } or { removeUserId }
  // Note: addUserId now creates a GroupInvite rather than adding the user
  // directly — same gating as createGroup.
  addGroupMember: async (conversationId, addUserId) => {
    const res = await axiosInstance.patch(`/chat/conversations/${conversationId}/members`, { addUserId });
    return res.data;
  },
  removeGroupMember: async (conversationId, removeUserId) => {
    const res = await axiosInstance.patch(`/chat/conversations/${conversationId}/members`, { removeUserId });
    return res.data;
  },

  // GET /api/chat/conversations/:id/messages?before=&limit=
  getMessages: async (conversationId, before = null, limit = 30) => {
    const res = await axiosInstance.get(`/chat/conversations/${conversationId}/messages`, {
      params: { before: before || undefined, limit },
    });
    return res.data;
  },

  // POST /api/chat/conversations/:id/messages   body: { text, attachmentUrl?, attachmentName?, attachmentType? }
  sendMessage: async (conversationId, text, attachment = null) => {
    const res = await axiosInstance.post(`/chat/conversations/${conversationId}/messages`, {
      text,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
    });
    return res.data;
  },

  // PATCH /api/chat/conversations/:id/read
  markConversationRead: async (conversationId) => {
    const res = await axiosInstance.patch(`/chat/conversations/${conversationId}/read`);
    return res.data;
  },

  // DELETE /api/chat/conversations/:id/messages   body: { messageIds: [...] }
  deleteMessages: async (conversationId, messageIds) => {
    const res = await axiosInstance.delete(`/chat/conversations/${conversationId}/messages`, {
      data: { messageIds },
    });
    return res.data;
  },

  // DELETE /api/chat/conversations/:id
  // DM: deletes for both participants. Group: creator only, deletes for everyone.
  deleteConversation: async (conversationId) => {
    const res = await axiosInstance.delete(`/chat/conversations/${conversationId}`);
    return res.data;
  },

  // PATCH /api/chat/conversations/:id/leave — group only, removes yourself
  leaveGroup: async (conversationId) => {
    const res = await axiosInstance.patch(`/chat/conversations/${conversationId}/leave`);
    return res.data;
  },

  // -------- Group invites --------

  // GET /api/chat/group-invites
  // Pending invites for the logged-in user — groups they've been added to
  // but haven't accepted/rejected yet.
  getMyGroupInvites: async () => {
    const res = await axiosInstance.get('/chat/group-invites');
    return res.data;
  },

  // PATCH /api/chat/group-invites/:id   body: { status: 'accepted' | 'rejected' }
  respondToGroupInvite: async (inviteId, status) => {
    const res = await axiosInstance.patch(`/chat/group-invites/${inviteId}`, { status });
    return res.data;
  },
};

export default chatApi;