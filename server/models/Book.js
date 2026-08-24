const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    shelf: {
      type: String,
      required: [true, 'Shelf code is required'],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    cover: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Book = mongoose.models.Book || mongoose.model('Book', bookSchema);

module.exports = Book;