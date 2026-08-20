const CanteenMenu = require('../models/CanteenMenu');
const CanteenCredit = require('../models/CanteenCredit');
const User = require('../models/User');

// =========================================================================
// 1. CANTEEN MENU (FOOD) CONTROLLER
// =========================================================================

/**
 * @desc   Get all canteen menu food items with search and category filters
 * @route  GET /api/canteen/menu
 * @access Public / Authenticated
 */
const getMenu = async (req, res) => {
  try {
    const { category, search, available } = req.query;

    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (available !== undefined) {
      filter.availability = available === 'true';
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await CanteenMenu.find(filter).sort({ createdAt: 1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch menu items', error: error.message });
  }
};

/**
 * @desc   Get single menu food item by ID
 * @route  GET /api/canteen/menu/:id
 * @access Public / Authenticated
 */
const getMenuItemById = async (req, res) => {
  try {
    const item = await CanteenMenu.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch food item', error: error.message });
  }
};

/**
 * @desc   Create new menu food item
 * @route  POST /api/canteen/menu
 * @access Private (Admin / Staff)
 */
const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, image, availability } = req.body;

    if (!name || price === undefined || !category || !image) {
      return res.status(400).json({ message: 'Name, price, category, and image are required' });
    }

    const newItem = await CanteenMenu.create({
      name,
      description: description || '',
      price: Number(price),
      category,
      image,
      availability: availability !== undefined ? availability : true,
    });

    res.status(201).json({ message: 'Food item added successfully', item: newItem });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create food item', error: error.message });
  }
};

/**
 * @desc   Update menu food item
 * @route  PUT /api/canteen/menu/:id
 * @access Private (Admin / Staff)
 */
const updateMenuItem = async (req, res) => {
  try {
    const item = await CanteenMenu.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    const updatedItem = await CanteenMenu.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Food item updated successfully', item: updatedItem });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update food item', error: error.message });
  }
};

/**
 * @desc   Delete menu food item
 * @route  DELETE /api/canteen/menu/:id
 * @access Private (Admin / Staff)
 */
const deleteMenuItem = async (req, res) => {
  try {
    const item = await CanteenMenu.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    await CanteenMenu.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Food item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete food item', error: error.message });
  }
};

// =========================================================================
// 2. CANTEEN CREDIT / KHATA CONTROLLER
// =========================================================================

/**
 * @desc   Get all student credit/khata accounts with search & status filter
 * @route  GET /api/canteen/credit
 * @access Private (Admin / Staff)
 */
const getAllCredits = async (req, res) => {
  try {
    const { status, search } = req.query;

    const filter = {};
    if (status) {
      filter.paymentStatus = status;
    }
    if (search) {
      filter.studentName = { $regex: search, $options: 'i' };
    }

    const records = await CanteenCredit.find(filter)
      .populate('user', 'username email role')
      .populate('paymentHistory.receivedBy', 'username')
      .sort({ updatedAt: -1 });

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch credit records', error: error.message });
  }
};

/**
 * @desc   Get logged-in student's own credit/khata balance & history
 * @route  GET /api/canteen/credit/my-balance
 * @access Private (Authenticated User)
 */
const getMyCredit = async (req, res) => {
  try {
    let credit = await CanteenCredit.findOne({ user: req.user._id });

    if (!credit) {
      // Default placeholder balance if not yet initialized
      return res.status(200).json({
        amountDue: 0,
        amountPaid: 0,
        remainingBalance: 0,
        paymentStatus: 'Cleared',
        paymentHistory: [],
      });
    }

    res.status(200).json(credit);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user credit balance', error: error.message });
  }
};

/**
 * @desc   Get single credit record by ID
 * @route  GET /api/canteen/credit/:id
 * @access Private (Admin / Staff)
 */
const getCreditById = async (req, res) => {
  try {
    const record = await CanteenCredit.findById(req.params.id)
      .populate('user', 'username email')
      .populate('paymentHistory.receivedBy', 'username');

    if (!record) {
      return res.status(404).json({ message: 'Credit record not found' });
    }

    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch credit record', error: error.message });
  }
};

/**
 * @desc   Create or add due amount to student's credit/khata account
 * @route  POST /api/canteen/credit
 * @access Private (Admin / Staff)
 */
const createOrUpdateCredit = async (req, res) => {
  try {
    const { userId, studentName, amountDue } = req.body;

    if (!userId || amountDue === undefined) {
      return res.status(400).json({ message: 'User ID and amount due are required' });
    }

    let credit = await CanteenCredit.findOne({ user: userId });

    if (credit) {
      credit.amountDue += Number(amountDue);
      if (studentName) credit.studentName = studentName;
      await credit.save();
    } else {
      credit = await CanteenCredit.create({
        user: userId,
        studentName: studentName || 'Student',
        amountDue: Number(amountDue),
        amountPaid: 0,
      });
    }

    res.status(200).json({ message: 'Credit account updated successfully', credit });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update credit account', error: error.message });
  }
};

/**
 * @desc   Record payment and clear/reduce credit due (Admin action after payment)
 * @route  POST /api/canteen/credit/:id/pay
 * @access Private (Admin / Staff)
 */
const recordCreditPayment = async (req, res) => {
  try {
    const { amount, method, note } = req.body;
    const paymentAmount = Number(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ message: 'Please provide a valid payment amount' });
    }

    const credit = await CanteenCredit.findById(req.params.id);
    if (!credit) {
      return res.status(404).json({ message: 'Credit record not found' });
    }

    // Add payment entry
    credit.amountPaid += paymentAmount;
    credit.paymentHistory.push({
      amount: paymentAmount,
      method: method || 'Cash',
      date: new Date(),
      note: note || 'Payment received by admin/counter',
      receivedBy: req.user._id,
    });

    await credit.save();

    res.status(200).json({
      message: `Payment of NPR ${paymentAmount} recorded successfully`,
      credit,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record payment', error: error.message });
  }
};

/**
 * @desc   Delete credit record
 * @route  DELETE /api/canteen/credit/:id
 * @access Private (Admin / Staff)
 */
const deleteCreditRecord = async (req, res) => {
  try {
    const credit = await CanteenCredit.findById(req.params.id);
    if (!credit) {
      return res.status(404).json({ message: 'Credit record not found' });
    }

    await CanteenCredit.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Credit record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete credit record', error: error.message });
  }
};

module.exports = {
  // Menu
  getMenu,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  // Credit
  getAllCredits,
  getMyCredit,
  getCreditById,
  createOrUpdateCredit,
  recordCreditPayment,
  deleteCreditRecord,
};
