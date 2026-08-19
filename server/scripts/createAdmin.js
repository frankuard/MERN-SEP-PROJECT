require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = require('../models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 15000,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      role: 'admin',
    });

    if (existingAdmin) {
      console.log('An admin account already exists.');
      console.log(`Username: ${existingAdmin.username}`);
      console.log(`Email: ${existingAdmin.email}`);

      await mongoose.connection.close();
      return;
    }

    // Admin account details
    const username = 'admin';
    const email = 'admin@chautari.com';
    const password = 'Admin@12345';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'admin',
      status: 'approved',
      department: 'Administration',
    });

    console.log('');
    console.log('================================');
    console.log('ADMIN CREATED SUCCESSFULLY');
    console.log('================================');
    console.log(`Username: ${admin.username}`);
    console.log(`Email:    ${admin.email}`);
    console.log(`Password: ${password}`);
    console.log(`Role:     ${admin.role}`);
    console.log(`Status:   ${admin.status}`);
    console.log('================================');
    console.log('');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Failed to create admin:', error.message);

    try {
      await mongoose.connection.close();
    } catch {}

    process.exit(1);
  }
};

createAdmin();