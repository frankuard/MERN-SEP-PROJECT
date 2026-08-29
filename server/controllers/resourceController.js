const Book = require('../models/Book');
const BorrowRequest = require('../models/BorrowRequest');
const SportsItem = require('../models/SportsItem');
const SportsRequest = require('../models/SportsRequest');
const { createNotificationForRole, createNotification } = require('../utils/createNotification');


const resolveUserId = (req) => req.user?._id || req.user?.userId;

// ========================================================
// STUDENT — Books
// ========================================================

const getBooks = async (req, res) => {
  try {
    const books = await Book.find({}).sort({ createdAt: -1 });
    const activeRequests = await BorrowRequest.find({ status: { $in: ['pending', 'approved'] } });

    const userId = resolveUserId(req)?.toString();

    const withStatus = books.map((book) => {
      const bookId = book._id.toString();
      const active = activeRequests.find((r) => r.book.toString() === bookId);
      const mine = active && active.requestedBy.toString() === userId ? active : null;

      return {
        ...book.toObject(),
        status: active ? (active.status === 'approved' ? 'borrowed' : 'pending') : 'none',
        myRequest: mine
          ? { returnBy: mine.returnBy, studentIdNumber: mine.studentIdNumber, status: mine.status, requestedAt: mine.createdAt }
          : null,
      };
    });

    res.status(200).json(withStatus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyBorrows = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const requests = await BorrowRequest.find({ requestedBy: userId })
      .populate('book', 'name author shelf cover')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const requestBorrow = async (req, res) => {
  try {
    const { id } = req.params;
    const { returnBy, studentIdNumber } = req.body;

    if (!returnBy || !studentIdNumber) {
      return res.status(400).json({ message: 'returnBy and studentIdNumber are required' });
    }

    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const userId = resolveUserId(req);

    const existing = await BorrowRequest.findOne({
      book: id,
      status: { $in: ['pending', 'approved'] },
    });
    if (existing) {
      return res.status(400).json({ message: 'This book already has an active request or is borrowed' });
    }

    const request = await BorrowRequest.create({
      book: id,
      requestedBy: userId,
      studentIdNumber: studentIdNumber.trim(),
      returnBy,
      status: 'pending',
    });

    res.status(201).json(request);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid book ID' });
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// ADMIN — Books
// ========================================================

const getBooksAdmin = async (req, res) => {
  try {
    const books = await Book.find({}).sort({ createdAt: -1 });
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createBook = async (req, res) => {
  try {
    const { name, author, shelf, category, cover } = req.body;
    if (!name || !author || !shelf) {
      return res.status(400).json({ message: 'name, author, and shelf are required' });
    }

    const book = await Book.create({
      name: name.trim(),
      author: author.trim(),
      shelf: shelf.trim(),
      category: category?.trim() || 'General',
      cover: cover?.trim() || '',
    });

    createNotificationForRole('student', {
      type: 'book',
      title: 'New Book Added',
      message: `"${book.name}" by ${book.author} is now available in the library`,
      link: 'resources',
    });

    res.status(201).json(book);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const allowedFields = ['name', 'author', 'shelf', 'category', 'cover'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) book[field] = req.body[field];
    });

    const updated = await book.save();

    createNotificationForRole('student', {
      type: 'book',
      title: 'Book Updated',
      message: `"${updated.name}" was updated`,
      link: 'resources',
    });

    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid book ID' });
    res.status(500).json({ message: err.message });
  }
};

const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    await book.deleteOne();

    createNotificationForRole('student', {
      type: 'book',
      title: 'Book Removed',
      message: `"${book.name}" was removed from the library`,
      link: 'resources',
    });

    res.status(200).json({ message: 'Book deleted' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid book ID' });
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// ADMIN — Book Borrow Requests
// ========================================================

const getBorrowRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;

    const requests = await BorrowRequest.find(filter)
      .populate('book', 'name author shelf cover')
      .populate('requestedBy', 'username email')
      .populate('approvedBy', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const approveBorrowRequest = async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be approved' });
    }

    request.status = 'approved';
    request.approvedBy = resolveUserId(req);
    request.approvedAt = new Date();
    await request.save();

    createNotification(request.requestedBy, {
      type: 'book_request',
      title: 'Book Request Approved',
      message: 'Your book borrow request has been approved.',
      link: 'resources',
    });

    res.status(200).json(request);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid request ID' });
    res.status(500).json({ message: err.message });
  }
};

const rejectBorrowRequest = async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be rejected' });
    }

    request.status = 'rejected';
    request.approvedBy = resolveUserId(req);
    request.approvedAt = new Date();
    await request.save();

    createNotification(request.requestedBy, {
      type: 'book_request',
      title: 'Book Request Rejected',
      message: 'Your book borrow request was rejected.',
      link: 'resources',
    });

    res.status(200).json(request);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid request ID' });
    res.status(500).json({ message: err.message });
  }
};

const markReturned = async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved (borrowed) requests can be marked returned' });
    }

    request.status = 'returned';
    request.returnedAt = new Date();
    await request.save();

    res.status(200).json(request);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid request ID' });
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// STUDENT — Sports
// ========================================================

const getSportsItems = async (req, res) => {
  try {
    const items = await SportsItem.find({}).sort({ name: 1 });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMySportsRequests = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const requests = await SportsRequest.find({ requestedBy: userId })
      .populate('item', 'name icon')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const requestSportsItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, slot, note } = req.body;

    if (!quantity || !slot) {
      return res.status(400).json({ message: 'quantity and slot are required' });
    }

    const item = await SportsItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Sports item not found' });

    const userId = resolveUserId(req);

    const request = await SportsRequest.create({
      item: id,
      requestedBy: userId,
      quantity: Number(quantity),
      slot: slot.trim(),
      note: note?.trim() || '',
      status: 'pending',
    });

    res.status(201).json(request);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid item ID' });
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// ADMIN — Sports Items
// ========================================================

const createSportsItem = async (req, res) => {
  try {
    const { name, icon, totalQuantity } = req.body;
    if (!name || !totalQuantity) {
      return res.status(400).json({ message: 'name and totalQuantity are required' });
    }

    const item = await SportsItem.create({
      name: name.trim(),
      icon: icon?.trim() || '🏐',
      totalQuantity: Number(totalQuantity),
    });

    createNotificationForRole('student', {
      type: 'sports_item',
      title: 'New Sports Item Added',
      message: `${item.name} is now available to request`,
      link: 'resources',
    });

    res.status(201).json(item);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

const updateSportsItem = async (req, res) => {
  try {
    const item = await SportsItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Sports item not found' });

    const allowedFields = ['name', 'icon', 'totalQuantity'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) item[field] = req.body[field];
    });

    const updated = await item.save();

    createNotificationForRole('student', {
      type: 'sports_item',
      title: 'Sports Item Updated',
      message: `${updated.name} was updated`,
      link: 'resources',
    });

    res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid item ID' });
    res.status(500).json({ message: err.message });
  }
};

const deleteSportsItem = async (req, res) => {
  try {
    const item = await SportsItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Sports item not found' });

    await item.deleteOne();

    createNotificationForRole('student', {
      type: 'sports_item',
      title: 'Sports Item Removed',
      message: `${item.name} is no longer available`,
      link: 'resources',
    });

    res.status(200).json({ message: 'Sports item deleted' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid item ID' });
    res.status(500).json({ message: err.message });
  }
};

// ========================================================
// ADMIN — Sports Requests
// ========================================================

const getSportsRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;

    const requests = await SportsRequest.find(filter)
      .populate('item', 'name icon')
      .populate('requestedBy', 'username email')
      .populate('approvedBy', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const approveSportsRequest = async (req, res) => {
  try {
    const request = await SportsRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be approved' });
    }

    request.status = 'approved';
    request.approvedBy = resolveUserId(req);
    request.approvedAt = new Date();
    await request.save();

    createNotification(request.requestedBy, {
      type: 'sports_request',
      title: 'Sports Request Approved',
      message: 'Your sports equipment request has been approved.',
      link: 'resources',
    });

    res.status(200).json(request);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid request ID' });
    res.status(500).json({ message: err.message });
  }
};

const rejectSportsRequest = async (req, res) => {
  try {
    const request = await SportsRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be rejected' });
    }

    request.status = 'rejected';
    request.approvedBy = resolveUserId(req);
    request.approvedAt = new Date();
    await request.save();

    createNotification(request.requestedBy, {
      type: 'sports_request',
      title: 'Sports Request Rejected',
      message: 'Your sports equipment request was rejected.',
      link: 'resources',
    });

    res.status(200).json(request);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid request ID' });
    res.status(500).json({ message: err.message });
  }
};

const markSportsReturned = async (req, res) => {
  try {
    const request = await SportsRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved requests can be marked returned' });
    }

    request.status = 'returned';
    request.returnedAt = new Date();
    await request.save();

    res.status(200).json(request);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid request ID' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  // Books — student
  getBooks,
  getMyBorrows,
  requestBorrow,
  // Books — admin
  getBooksAdmin,
  createBook,
  updateBook,
  deleteBook,
  getBorrowRequests,
  approveBorrowRequest,
  rejectBorrowRequest,
  markReturned,
  // Sports — student
  getSportsItems,
  getMySportsRequests,
  requestSportsItem,
  // Sports — admin
  createSportsItem,
  updateSportsItem,
  deleteSportsItem,
  getSportsRequests,
  approveSportsRequest,
  rejectSportsRequest,
  markSportsReturned,
};