const mongoose = require('mongoose');

const canteenMenuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Meals', 'Snacks', 'Momo & Noodles', 'Beverages'],
      default: 'Meals',
    },
    image: {
      type: String,
      required: [true, 'Image URL or path is required'],
      trim: true,
    },
    availability: {
      type: Boolean,
      default: true,
    },
        isSpecialOfTheDay: {
      type: Boolean,
      default: false,
    },
        isPopular: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const CanteenMenu = mongoose.models.CanteenMenu || mongoose.model('CanteenMenu', canteenMenuSchema);

module.exports = CanteenMenu;
