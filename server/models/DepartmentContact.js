const mongoose = require('mongoose');

const departmentContactSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true, // e.g. 'bic', 'ssd', 'rte'
    },
    title: {
      type: String,
      required: [true, 'Department title is required'],
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
      default: 'Building2', // matches a lucide-react icon name on the frontend
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    phoneHref: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
    },
    emailHref: {
      type: String,
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const DepartmentContact =
  mongoose.models.DepartmentContact || mongoose.model('DepartmentContact', departmentContactSchema);

module.exports = DepartmentContact;