const mongoose = require('mongoose');

const sportsItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
      default: '🏐',
    },
    totalQuantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [1, 'Total quantity must be at least 1'],
    },
  },
  { timestamps: true }
);

const SportsItem = mongoose.models.SportsItem || mongoose.model('SportsItem', sportsItemSchema);

module.exports = SportsItem;