const CanteenMenu = require('../models/CanteenMenu');
const CanteenCredit = require('../models/CanteenCredit');
const CanteenOrder = require('../models/CanteenOrder');
const CanteenCreditRequest = require('../models/CanteenCreditRequest');
const User = require('../models/User');
const { createNotificationForRole, createNotification } = require('../utils/createNotification');


// =========================================================================
// 1. CANTEEN MENU (FOOD) CONTROLLER
// =========================================================================

/**
 * @desc   Get all canteen menu food items with search and category filters
 * @route  GET /api/canteen/menu
 * @access Public / Authenticated
 */

const resolveUserId = (req) => req.user?._id || req.user?.userId;


const getMenu = async (req, res) => {
  try {
            const { category, search, available, isSpecialOfTheDay, isPopular } = req.query;

    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (available !== undefined) {
      filter.availability = available === 'true';
    }
        if (isSpecialOfTheDay !== undefined) {
      filter.isSpecialOfTheDay = isSpecialOfTheDay === 'true';
    }

        if (isPopular !== undefined) {
      filter.isPopular = isPopular === 'true';
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

    createNotificationForRole('student', {
      type: 'canteen_menu',
      title: 'New Menu Item Added',
      message: `${newItem.name} is now available in the canteen`,
      link: 'canteen',
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

    createNotificationForRole('student', {
      type: 'canteen_menu',
      title: 'Menu Item Updated',
      message: `${updatedItem.name} was updated`,
      link: 'canteen',
    });

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

    createNotificationForRole('student', {
      type: 'canteen_menu',
      title: 'Menu Item Removed',
      message: `${item.name} is no longer available`,
      link: 'canteen',
    });

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

    let filter = {};
    if (status) {
      filter.paymentStatus = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const isNumeric = !isNaN(Number(q)) && q !== '';

      const orConditions = [
        { studentName: { $regex: q, $options: 'i' } },
      ];

      if (isNumeric) {
        orConditions.push({ amountDue: Number(q) });
        orConditions.push({ amountPaid: Number(q) });
        orConditions.push({ remainingBalance: Number(q) });
      }

      if (q.match(/^[0-9a-fA-F]{24}$/)) {
        orConditions.push({ user: q });
        orConditions.push({ _id: q });
      }

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: orConditions }];
        delete filter.$or;
      } else {
        filter.$or = orConditions;
      }
    }

    let query = CanteenCredit.find(filter)
      .populate('user', 'username email role')
      .populate('paymentHistory.receivedBy', 'username')
      .sort({ updatedAt: -1 });

    const records = await query;

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      const filtered = records.filter((r) => {
        const nameMatch = (r.studentName || '').toLowerCase().includes(q);
        const emailMatch = (r.user?.email || '').toLowerCase().includes(q);
        const usernameMatch = (r.user?.username || '').toLowerCase().includes(q);
        const idMatch = r._id.toString().includes(q);
        const userIdMatch = r.user?._id?.toString().includes(q);
        const amountMatch = !isNaN(Number(q)) && (
          r.amountDue === Number(q) ||
          r.amountPaid === Number(q) ||
          r.remainingBalance === Number(q)
        );
        return nameMatch || emailMatch || usernameMatch || idMatch || userIdMatch || amountMatch;
      });
      return res.status(200).json(filtered);
    }

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
    let credit = await CanteenCredit.findOne({ user: req.user._id })
      .populate('paymentHistory.receivedBy', 'username')
      .populate('dueHistory.addedBy', 'username');

    if (!credit) {
      return res.status(200).json({
        amountDue: 0,
        amountPaid: 0,
        remainingBalance: 0,
        paymentStatus: 'Cleared',
        paymentHistory: [],
        dueHistory: [],
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
      .populate('paymentHistory.receivedBy', 'username')
      .populate('dueHistory.addedBy', 'username');

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

    const dueEntry = {
      amount: Number(amountDue),
      date: new Date(),
      note: req.body.note || 'Charge added by admin',
      addedBy: resolveUserId(req),
    };

    if (credit) {
      credit.amountDue += Number(amountDue);
      if (studentName) credit.studentName = studentName;
      credit.dueHistory.push(dueEntry);
      await credit.save();
    } else {
      credit = await CanteenCredit.create({
        user: userId,
        studentName: studentName || 'Student',
        amountDue: Number(amountDue),
        amountPaid: 0,
        dueHistory: [dueEntry],
      });
    }

    createNotification(userId, {
      type: 'canteen_credit',
      title: 'Canteen Due Updated',
      message: `NPR ${Number(amountDue)} was added to your canteen due. New balance: NPR ${credit.amountDue - credit.amountPaid}`,
      link: 'canteen',
    });

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
      receivedBy: resolveUserId(req),
    });

    await credit.save();

    createNotification(credit.user, {
      type: 'canteen_credit',
      title: 'Payment Recorded',
      message: `NPR ${paymentAmount} payment recorded. Remaining balance: NPR ${credit.amountDue - credit.amountPaid}`,
      link: 'canteen',
    });

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

// =========================================================================
// 3. CANTEEN ORDER CONTROLLER
// =========================================================================

/**
 * @desc   Place a new canteen order
 * @route  POST /api/canteen/orders
 * @access Private (Student / Teacher)
 */
const placeOrder = async (req, res) => {
  try {
    const { items, tableNumber, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    if (!tableNumber || tableNumber < 1 || tableNumber > 9) {
      return res.status(400).json({ message: 'Table number (1-9) is required' });
    }
    if (!paymentMethod || !['Credit Due', 'Pay at Counter'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Valid payment method is required' });
    }

    // Validate all food items exist and are available
    const menuItems = await CanteenMenu.find({
      _id: { $in: items.map((i) => i.foodItem) },
    });

    if (menuItems.length !== items.length) {
      return res.status(400).json({ message: 'One or more food items are no longer available' });
    }

    const unavailableItem = menuItems.find((m) => m.availability === false);
    if (unavailableItem) {
      return res.status(400).json({ message: `"${unavailableItem.name}" is currently unavailable` });
    }

    const menuItemMap = {};
    menuItems.forEach((m) => { menuItemMap[m._id.toString()] = m; });

    let totalAmount = 0;
    const orderItems = items.map((item) => {
      const menuItem = menuItemMap[item.foodItem];
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      totalAmount += menuItem.price * qty;
      return {
        foodItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: qty,
      };
    });

    const creditRequestStatus = paymentMethod === 'Credit Due' ? 'Pending' : 'None';

    const order = await CanteenOrder.create({
      user: req.user._id,
      userRole: req.user.role,
      userName: req.user.username || '',
      items: orderItems,
      totalAmount,
      tableNumber: Number(tableNumber),
      paymentMethod,
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      creditRequestStatus,
    });

    // If Credit Due, also create a credit request record
    if (paymentMethod === 'Credit Due') {
      await CanteenCreditRequest.create({
        user: req.user._id,
        userRole: req.user.role,
        userName: req.user.username || '',
        order: order._id,
        amount: totalAmount,
        status: 'Pending',
      });

      // Notify all admins
      createNotificationForRole('admin', {
        type: 'canteen_credit',
        title: 'New Credit Due Request',
        message: `${req.user.username} (${req.user.role}) requested NPR ${totalAmount} credit due for order #${order._id.toString().slice(-6).toUpperCase()}`,
        link: 'manage-canteen',
      });
    }

    // Notify user
    createNotification(req.user._id, {
      type: 'canteen_order',
      title: 'Order Placed Successfully',
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been placed. Total: NPR ${totalAmount}. Table: ${tableNumber}`,
      link: 'canteen',
    });

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
};

/**
 * @desc   Get current user's orders
 * @route  GET /api/canteen/orders/my
 * @access Private (Student / Teacher)
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await CanteenOrder.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

/**
 * @desc   Get all orders (admin only)
 * @route  GET /api/canteen/orders
 * @access Private (Admin / Staff)
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, paymentMethod, role, search } = req.query;
    const filter = {};

    if (status) filter.orderStatus = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (role) filter.userRole = role;
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await CanteenOrder.find(filter)
      .populate('user', 'username email role')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

/**
 * @desc   Get single order by ID
 * @route  GET /api/canteen/orders/:id
 * @access Private (Owner or Admin)
 */
const getOrderById = async (req, res) => {
  try {
    const order = await CanteenOrder.findById(req.params.id)
      .populate('user', 'username email role');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only owner or admin can view
    if (order.user._id.toString() !== req.user._id.toString() &&
        !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
};

/**
 * @desc   Update order status (admin only)
 * @route  PUT /api/canteen/orders/:id/status
 * @access Private (Admin / Staff)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await CanteenOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (orderStatus) {
      const validStatuses = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
      if (!validStatuses.includes(orderStatus)) {
        return res.status(400).json({ message: 'Invalid order status' });
      }
      order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      const validPaymentStatuses = ['Pending', 'Approved', 'Rejected', 'Paid'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ message: 'Invalid payment status' });
      }
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    // Notify user of status change
    createNotification(order.user, {
      type: 'canteen_order',
      title: 'Order Updated',
      message: `Order #${order._id.toString().slice(-6).toUpperCase()} status: ${order.orderStatus}${order.paymentStatus !== 'Pending' ? `, Payment: ${order.paymentStatus}` : ''}`,
      link: 'canteen',
    });

    res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};

/**
 * @desc   Confirm Pay at Counter payment (admin only)
 * @route  POST /api/canteen/orders/:id/confirm-payment
 * @access Private (Admin / Staff)
 */
const confirmCounterPayment = async (req, res) => {
  try {
    const order = await CanteenOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentMethod !== 'Pay at Counter') {
      return res.status(400).json({ message: 'This order is not a Pay at Counter order' });
    }

    order.paymentStatus = 'Paid';
    await order.save();

    createNotification(order.user, {
      type: 'canteen_credit',
      title: 'Payment Confirmed',
      message: `Payment for order #${order._id.toString().slice(-6).toUpperCase()} (NPR ${order.totalAmount}) has been confirmed at counter.`,
      link: 'canteen',
    });

    res.status(200).json({ message: 'Payment confirmed', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm payment', error: error.message });
  }
};

// =========================================================================
// 4. CANTEEN CREDIT REQUEST CONTROLLER
// =========================================================================

/**
 * @desc   Get all credit requests (admin only)
 * @route  GET /api/canteen/credit-requests
 * @access Private (Admin / Staff)
 */
const getAllCreditRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const requests = await CanteenCreditRequest.find(filter)
      .populate('user', 'username email role')
      .populate('order')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch credit requests', error: error.message });
  }
};

/**
 * @desc   Get current user's credit requests
 * @route  GET /api/canteen/credit-requests/my
 * @access Private (Student / Teacher)
 */
const getMyCreditRequests = async (req, res) => {
  try {
    const requests = await CanteenCreditRequest.find({ user: req.user._id })
      .populate('order')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch credit requests', error: error.message });
  }
};

/**
 * @desc   Approve or reject a credit request (admin only)
 * @route  PUT /api/canteen/credit-requests/:id
 * @access Private (Admin / Staff)
 */
const reviewCreditRequest = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved or Rejected' });
    }

    const creditRequest = await CanteenCreditRequest.findById(req.params.id)
      .populate('order');

    if (!creditRequest) {
      return res.status(404).json({ message: 'Credit request not found' });
    }

    if (creditRequest.status !== 'Pending') {
      return res.status(400).json({ message: 'This request has already been reviewed' });
    }

    creditRequest.status = status;
    creditRequest.adminNote = adminNote || '';
    creditRequest.reviewedBy = req.user._id;
    creditRequest.reviewedAt = new Date();
    await creditRequest.save();

    // Update the order's credit request status
    const order = await CanteenOrder.findById(creditRequest.order._id);
    if (order) {
      order.creditRequestStatus = status;
      if (status === 'Approved') {
        order.paymentStatus = 'Approved';
      } else {
        order.paymentStatus = 'Rejected';
        order.orderStatus = 'Cancelled';
      }
      await order.save();
    }

    // If approved, add to user's CanteenCredit due balance
    if (status === 'Approved') {
      let credit = await CanteenCredit.findOne({ user: creditRequest.user });
      const dueEntry = {
        amount: creditRequest.amount,
        date: new Date(),
        note: `Credit due approved for order #${creditRequest.order._id.toString().slice(-6).toUpperCase()}`,
        addedBy: req.user._id,
      };

      if (credit) {
        credit.amountDue += creditRequest.amount;
        credit.dueHistory.push(dueEntry);
        await credit.save();
      } else {
        credit = await CanteenCredit.create({
          user: creditRequest.user,
          studentName: creditRequest.userName,
          amountDue: creditRequest.amount,
          amountPaid: 0,
          dueHistory: [dueEntry],
        });
      }
    }

    // Notify user
    createNotification(creditRequest.user, {
      type: 'canteen_credit',
      title: `Credit Request ${status}`,
      message: `Your credit due request of NPR ${creditRequest.amount} has been ${status.toLowerCase()}${adminNote ? `. Note: ${adminNote}` : ''}`,
      link: 'canteen',
    });

    res.status(200).json({ message: `Credit request ${status.toLowerCase()}`, creditRequest });
  } catch (error) {
    res.status(500).json({ message: 'Failed to review credit request', error: error.message });
  }
};

// =========================================================================
// 5. SALES & ANALYTICS CONTROLLER
// =========================================================================

/**
 * @desc   Get canteen sales analytics (today's sales, last month revenue, top items, daily graph)
 * @route  GET /api/canteen/analytics/sales
 * @access Private (Admin / Staff)
 */
const getSalesAnalytics = async (req, res) => {
  try {
    const { year, month } = req.query;

    const now = new Date();

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const targetMonth = month ? parseInt(month, 10) : now.getMonth();
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();
    const monthStart = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const lastMonthDate = new Date(targetYear, targetMonth - 1, 1);
    const lastMonthStart = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1, 0, 0, 0, 0);
    const lastMonthEnd = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const paidOrCompletedMatch = {
      createdAt: { $gte: monthStart, $lte: monthEnd },
      orderStatus: { $ne: 'Cancelled' },
      paymentStatus: { $in: ['Paid', 'Approved'] },
    };

    const lastMonthPaidOrCompletedMatch = {
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      orderStatus: { $ne: 'Cancelled' },
      paymentStatus: { $in: ['Paid', 'Approved'] },
    };

    const todayMatch = {
      createdAt: { $gte: todayStart, $lte: todayEnd },
      orderStatus: { $ne: 'Cancelled' },
      paymentStatus: { $in: ['Paid', 'Approved', 'Pending'] },
    };

    const [todaySalesResult, lastMonthRevenueResult, topItemsResult, dailyGraphResult, totalOrdersResult, pendingOrdersResult] = await Promise.all([
      CanteenOrder.aggregate([
        { $match: todayMatch },
        { $group: { _id: null, totalSales: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
      ]),
      CanteenOrder.aggregate([
        { $match: lastMonthPaidOrCompletedMatch },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
      ]),
      CanteenOrder.aggregate([
        { $match: paidOrCompletedMatch },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', totalQuantity: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
      ]),
      CanteenOrder.aggregate([
        { $match: paidOrCompletedMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            daySales: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      CanteenOrder.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd }, orderStatus: { $ne: 'Cancelled' } }),
      CanteenOrder.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd }, paymentStatus: 'Pending', orderStatus: { $ne: 'Cancelled' } }),
    ]);

    const totalDaysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const graphData = [];
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const found = dailyGraphResult.find((g) => g._id === dateStr);
      graphData.push({
        date: dateStr,
        day: d,
        sales: found ? found.daySales : 0,
        orders: found ? found.orderCount : 0,
      });
    }

    res.status(200).json({
      todaySales: todaySalesResult.length > 0 ? todaySalesResult[0].totalSales : 0,
      todayOrderCount: todaySalesResult.length > 0 ? todaySalesResult[0].orderCount : 0,
      lastMonthRevenue: lastMonthRevenueResult.length > 0 ? lastMonthRevenueResult[0].totalRevenue : 0,
      lastMonthOrderCount: lastMonthRevenueResult.length > 0 ? lastMonthRevenueResult[0].orderCount : 0,
      selectedMonthRevenue: paidOrCompletedMatch ? (await CanteenOrder.aggregate([
        { $match: paidOrCompletedMatch },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]))[0]?.total || 0 : 0,
      topItems: topItemsResult,
      graphData,
      totalOrders: totalOrdersResult,
      pendingOrders: pendingOrdersResult,
      filters: {
        selectedMonth: targetMonth,
        selectedYear: targetYear,
        lastMonth: lastMonthDate.getMonth(),
        lastMonthYear: lastMonthDate.getFullYear(),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sales analytics', error: error.message });
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
  // Orders
  placeOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  confirmCounterPayment,
  // Credit Requests
  getAllCreditRequests,
  getMyCreditRequests,
  reviewCreditRequest,
  // Analytics
  getSalesAnalytics,
};
