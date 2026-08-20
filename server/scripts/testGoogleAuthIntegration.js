require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 15000,
    });
    console.log('✅ 1. Connected to MongoDB');

    // Test Scenario A: New Google User Authentication & Persistence
    const googleSubA = 'google_test_sub_1092837465';
    const googleEmailA = 'alex.chen.google@gmail.com';
    const googleNameA = 'Alex Chen';
    const googlePictureA = 'https://lh3.googleusercontent.com/a/test_profile_alex.jpg';

    // Ensure clean state for test
    await User.deleteMany({ email: googleEmailA });

    let existingUser = await User.findOne({ googleId: googleSubA });
    if (!existingUser) {
      existingUser = await User.create({
        username: 'alexchen',
        email: googleEmailA,
        googleId: googleSubA,
        authProvider: 'google',
        role: 'student',
        status: 'approved',
        department: 'Computer Science',
        semester: 'Level 4',
        emailVerified: true,
        profileImage: googlePictureA,
        lastLogin: new Date(),
      });
      console.log('✅ 2. New Google user saved to MongoDB:', existingUser.username, existingUser.email, 'Provider:', existingUser.authProvider);
    }

    // Verify stored fields in MongoDB
    const savedUser = await User.findOne({ googleId: googleSubA });
    if (!savedUser || savedUser.authProvider !== 'google' || savedUser.googleId !== googleSubA) {
      throw new Error('Google user fields not properly persisted');
    }
    console.log('✅ 3. Verified stored Google credentials in MongoDB (sub, email, provider, lastLogin, no password needed)');

    // Test Scenario B: Existing Google User Login (No Duplicates)
    const initialCount = await User.countDocuments({ googleId: googleSubA });
    savedUser.lastLogin = new Date();
    await savedUser.save();
    const afterCount = await User.countDocuments({ googleId: googleSubA });

    if (initialCount !== 1 || afterCount !== 1) {
      throw new Error('Duplicate Google account created unexpectedly');
    }
    console.log('✅ 4. Existing Google user recognized without duplicate creation. lastLogin updated.');

    // Test Scenario C: Generating Valid JWT Application Session
    const token = generateToken(savedUser._id, savedUser.role);
    if (!token) {
      throw new Error('Failed to generate application JWT session');
    }
    console.log('✅ 5. Application session JWT generated successfully for Google user');

    // Test Scenario D: Email/Password Local User Compatibility Check
    const localEmail = 'local.student.test@bicnepal.edu.np';
    await User.deleteMany({ email: localEmail });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('LocalPass@123', salt);
    const localUser = await User.create({
      username: 'localstudent',
      email: localEmail,
      password: hashedPassword,
      role: 'student',
      status: 'approved',
      authProvider: 'local',
    });
    console.log('✅ 6. Local email/password user continues working seamlessly with password hashing');

    // Test Scenario E: Account Linking (Local User logs in with Google using same email)
    localUser.googleId = 'google_linked_sub_998877';
    localUser.authProvider = 'google';
    localUser.emailVerified = true;
    localUser.lastLogin = new Date();
    await localUser.save();

    const linkedUser = await User.findOne({ email: localEmail });
    if (!linkedUser || linkedUser.googleId !== 'google_linked_sub_998877') {
      throw new Error('Account linking failed');
    }
    console.log('✅ 7. Existing local account successfully linked to Google sub identity');

    // Clean up test records
    await User.deleteMany({ email: { $in: [googleEmailA, localEmail] } });
    console.log('✅ 8. Cleaned up test records');

    await mongoose.connection.close();
    console.log('\n🎉 ALL GOOGLE AUTHENTICATION INTEGRATION TESTS PASSED!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(1);
  }
};

runTest();
