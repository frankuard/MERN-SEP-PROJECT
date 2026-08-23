const LostFoundItem = require('../models/LostFoundItem');
const CctvRequest = require('../models/CctvRequest');
const User = require('../models/User');

const resolveUserId = (req) => req.user?.userId || req.user?.id || req.user?._id;

const getLostFoundItems = async (req, res) => {
  try {
    const { search, category, status, type, mine } = req.query;
    const filter = {};

    if (category && category !== 'All') filter.category = category;
    if (status && status !== 'All') filter.status = status;
    if (type && type !== 'All') filter.type = type;

    if (mine === 'true') {
      const userId = resolveUserId(req);
      if (userId) filter.createdBy = userId;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { category: searchRegex },
        { authorName: searchRegex },
      ];
    }

    const items = await LostFoundItem.find(filter)
      .populate('createdBy', 'username email role department semester')
      .populate('claimedBy', 'username email role')
      .populate('claims.user', 'username email role')
      .sort({ createdAt: -1 });

    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getLostFoundItem = async (req, res) => {
  try {
    const item = await LostFoundItem.findById(req.params.id)
      .populate('createdBy', 'username email role department semester')
      .populate('claimedBy', 'username email role')
      .populate('claims.user', 'username email role');

    if (!item) return res.status(404).json({ message: 'Item not found' });

    res.status(200).json(item);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid item ID' });
    res.status(500).json({ message: err.message });
  }
};

const createLostFoundItem = async (req, res) => {
  try {
    const { title, description, type, category, location, image, contactInfo } = req.body;

    if (!title || !location) {
      return res.status(400).json({ message: 'Item title and location are required' });
    }

    const userId = resolveUserId(req);
    const user = await User.findById(userId);
    const authorName = user?.username || 'Student';

    const item = await LostFoundItem.create({
      title: title.trim(),
      description: description ? description.trim() : `Reported at ${location}`,
      type: type || 'lost',
      category: category || 'General',
      location: location.trim(),
      image: image || null,
      contactInfo: contactInfo || user?.email || '',
      status: 'Unclaimed',
      createdBy: userId,
      authorName,
    });

    const populatedItem = await LostFoundItem.findById(item._id)
      .populate('createdBy', 'username email role department semester');

    res.status(201).json(populatedItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateLostFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostFoundItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const userId = resolveUserId(req);
    const isOwner = item.createdBy && item.createdBy.toString() === userId;
    const isStaffOrAdmin = ['staff', 'admin'].includes(req.user.role);

    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ message: 'Unauthorized to edit this item' });
    }

    const { title, description, type, category, location, image, status } = req.body;

    if (title !== undefined) item.title = title.trim();
    if (description !== undefined) item.description = description.trim();
    if (type !== undefined) item.type = type;
    if (category !== undefined) item.category = category;
    if (location !== undefined) item.location = location.trim();
    if (image !== undefined) item.image = image;
    if (status !== undefined) item.status = status;

    await item.save();

    const updatedItem = await LostFoundItem.findById(item._id)
      .populate('createdBy', 'username email role')
      .populate('claimedBy', 'username email role');

    res.status(200).json(updatedItem);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid item ID' });
    res.status(500).json({ message: err.message });
  }
};

const deleteLostFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostFoundItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const userId = resolveUserId(req);
    const isOwner = item.createdBy && item.createdBy.toString() === userId;
    const isStaffOrAdmin = ['staff', 'admin'].includes(req.user.role);

    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ message: 'Unauthorized to delete this item' });
    }

    await LostFoundItem.findByIdAndDelete(id);
    res.status(200).json({ message: 'Item deleted successfully', id });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid item ID' });
    res.status(500).json({ message: err.message });
  }
};

const claimLostFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostFoundItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (item.status === 'Returned') {
      return res.status(400).json({ message: 'This item has already been marked as Returned.' });
    }

    const userId = resolveUserId(req);

    const existingClaim = item.claims.find(
      (c) => c.user && c.user.toString() === userId && c.status !== 'Rejected'
    );
    if (existingClaim) {
      return res.status(400).json({ message: 'You have already submitted a claim for this item.' });
    }

    const user = await User.findById(userId);
    const claimantName = user?.username || 'Student';
    const claimantEmail = user?.email || '';
    const claimDetails = req.body.details || req.body.reason || 'Claimed by student';

    item.claims.push({
      user: userId,
      userName: claimantName,
      userEmail: claimantEmail,
      details: claimDetails,
      status: 'Pending',
      claimedAt: new Date(),
    });

    item.status = 'Claim Pending';

    await item.save();

    const populated = await LostFoundItem.findById(item._id)
      .populate('createdBy', 'username email role')
      .populate('claimedBy', 'username email role')
      .populate('claims.user', 'username email role');

    res.status(200).json(populated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid item ID' });
    res.status(500).json({ message: err.message });
  }
};

const markItemReturned = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostFoundItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const userId = resolveUserId(req);
    const isOwner = item.createdBy && item.createdBy.toString() === userId;
    const isStaffOrAdmin = ['staff', 'admin'].includes(req.user.role);

    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ message: 'Only authorized staff or the item owner can mark this as returned' });
    }

    item.status = 'Returned';
    item.returnedAt = new Date();
    item.returnedBy = userId;

    await item.save();

    const populated = await LostFoundItem.findById(item._id)
      .populate('createdBy', 'username email role')
      .populate('claimedBy', 'username email role');

    res.status(200).json(populated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid item ID' });
    res.status(500).json({ message: err.message });
  }
};

const createCctvRequest = async (req, res) => {
  try {
    const { location, date, timeFrom, timeTo, reason, relatedLostItem, additionalDetails } = req.body;

    if (!location || !date || !timeFrom || !timeTo || !reason) {
      return res.status(400).json({
        message: 'Location, date, time range (timeFrom, timeTo), and reason are required',
      });
    }

    const userId = resolveUserId(req);
    const user = await User.findById(userId);

    const cctvRequest = await CctvRequest.create({
      user: userId,
      userName: user?.username || 'Student',
      userEmail: user?.email || '',
      location: location.trim(),
      date,
      timeFrom: timeFrom.trim(),
      timeTo: timeTo.trim(),
      reason: reason.trim(),
      relatedLostItem: relatedLostItem || null,
      additionalDetails: additionalDetails || '',
      status: 'In Review',
      submittedAt: 'Just now',
    });

    res.status(201).json(cctvRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCctvRequests = async (req, res) => {
  try {
    const isStaffOrAdmin = ['staff', 'admin'].includes(req.user.role);
    const filter = isStaffOrAdmin ? {} : { user: resolveUserId(req) };

    const requests = await CctvRequest.find(filter)
      .populate('user', 'username email role department semester')
      .populate('relatedLostItem')
      .populate('reviewedBy', 'username email role')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateCctvStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    const request = await CctvRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'CCTV request not found' });

    if (status) request.status = status;
    if (reviewNotes !== undefined) request.reviewNotes = reviewNotes;
    request.reviewedBy = resolveUserId(req);

    await request.save();

    const updated = await CctvRequest.findById(id)
      .populate('user', 'username email role')
      .populate('reviewedBy', 'username email role');

    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid request ID' });
    res.status(500).json({ message: err.message });
  }
};

const getLostFoundStats = async (req, res) => {
  try {
    const totalItems = await LostFoundItem.countDocuments();
    const unclaimedItems = await LostFoundItem.countDocuments({ status: { $in: ['Unclaimed', 'open'] } });
    const claimedItems = await LostFoundItem.countDocuments({ status: { $in: ['Claimed', 'Claim Pending'] } });
    const returnedItems = await LostFoundItem.countDocuments({ status: { $in: ['Returned', 'resolved'] } });

    const isStaffOrAdmin = ['staff', 'admin'].includes(req.user.role);
    const cctvFilter = isStaffOrAdmin ? {} : { user: resolveUserId(req) };
    const myCctvRequests = await CctvRequest.countDocuments(cctvFilter);

    res.status(200).json({ totalItems, unclaimedItems, claimedItems, returnedItems, myCctvRequests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateClaimStatus = async (req, res) => {
  try {
    const { itemId, claimId } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be Approved or Rejected' });
    }

    const item = await LostFoundItem.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const claim = item.claims.id(claimId);
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    claim.status = status;

    if (status === 'Approved') {
      item.status = 'Claimed';
      item.claimedBy = claim.user;
      item.claimantName = claim.userName;
      item.claims.forEach((c) => {
        if (c._id.toString() !== claimId && c.status === 'Pending') {
          c.status = 'Rejected';
        }
      });
    } else {
      const wasActiveClaimant =
        item.claimedBy && claim.user && item.claimedBy.toString() === claim.user.toString();
      if (wasActiveClaimant) {
        item.claimedBy = null;
        item.claimantName = null;
      }
      const stillHasApproved = item.claims.some((c) => c.status === 'Approved');
      const stillHasPending = item.claims.some((c) => c.status === 'Pending');
      if (!stillHasApproved) {
        item.status = stillHasPending ? 'Claim Pending' : 'Unclaimed';
      }
    }

    await item.save();

    const populated = await LostFoundItem.findById(item._id)
      .populate('createdBy', 'username email role')
      .populate('claimedBy', 'username email role')
      .populate('claims.user', 'username email role');

    res.status(200).json(populated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getLostFoundItems,
  getLostFoundItem,
  createLostFoundItem,
  updateLostFoundItem,
  deleteLostFoundItem,
  claimLostFoundItem,
  markItemReturned,
  createCctvRequest,
  getCctvRequests,
  updateCctvStatus,
  getLostFoundStats,
  updateClaimStatus,
};