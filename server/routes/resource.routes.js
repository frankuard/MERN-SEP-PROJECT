const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getBooks,
  getMyBorrows,
  requestBorrow,
  getBooksAdmin,
  createBook,
  updateBook,
  deleteBook,
  getBorrowRequests,
  approveBorrowRequest,
  rejectBorrowRequest,
  markReturned,
  getSportsItems,
  getMySportsRequests,
  requestSportsItem,
  createSportsItem,
  updateSportsItem,
  deleteSportsItem,
  getSportsRequests,
  approveSportsRequest,
  rejectSportsRequest,
  markSportsReturned,
} = require('../controllers/resourceController');



const allRoles = roleMiddleware('student', 'teacher', 'staff', 'admin');
const adminOnly = roleMiddleware('admin');

// -------- Student — Books --------
router.get('/books', authMiddleware, allRoles, getBooks);
router.get('/my-borrows', authMiddleware, allRoles, getMyBorrows);
router.post('/books/:id/borrow', authMiddleware, allRoles, requestBorrow);

// -------- Admin — Books (above any bare '/:id' to avoid path collisions) --------
router.get('/books/admin', authMiddleware, adminOnly, getBooksAdmin);
router.post('/books', authMiddleware, adminOnly, createBook);
router.patch('/books/:id', authMiddleware, adminOnly, updateBook);
router.delete('/books/:id', authMiddleware, adminOnly, deleteBook);

// -------- Admin — Book Borrow Requests --------
router.get('/borrow-requests', authMiddleware, adminOnly, getBorrowRequests);
router.patch('/borrow-requests/:id/approve', authMiddleware, adminOnly, approveBorrowRequest);
router.patch('/borrow-requests/:id/reject', authMiddleware, adminOnly, rejectBorrowRequest);
router.patch('/borrow-requests/:id/return', authMiddleware, adminOnly, markReturned);

// -------- Student — Sports --------
router.get('/sports-items', authMiddleware, allRoles, getSportsItems);
router.get('/my-sports-requests', authMiddleware, allRoles, getMySportsRequests);
router.post('/sports-items/:id/request', authMiddleware, allRoles, requestSportsItem);

// -------- Admin — Sports Items --------
router.post('/sports-items', authMiddleware, adminOnly, createSportsItem);
router.patch('/sports-items/:id', authMiddleware, adminOnly, updateSportsItem);
router.delete('/sports-items/:id', authMiddleware, adminOnly, deleteSportsItem);

// -------- Admin — Sports Requests --------
router.get('/sports-requests', authMiddleware, adminOnly, getSportsRequests);
router.patch('/sports-requests/:id/approve', authMiddleware, adminOnly, approveSportsRequest);
router.patch('/sports-requests/:id/reject', authMiddleware, adminOnly, rejectSportsRequest);
router.patch('/sports-requests/:id/return', authMiddleware, adminOnly, markSportsReturned);

module.exports = router;