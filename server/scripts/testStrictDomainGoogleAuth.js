require('dotenv').config();
const mongoose = require('mongoose');
const { validateBicDomain } = require('../controllers/googleAuthController');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const testDomainValidation = async () => {
  console.log('\n--- 1. Testing Domain Validation Function ---');

  const testCases = [
    // Allowed cases
    { email: 'student@bicnepal.edu.np', expected: true, desc: 'Standard student BIC email' },
    { email: 'suraj.student@bicnepal.edu.np', expected: true, desc: 'Dotted student BIC email' },
    { email: 'BASANTA.TEACHER@BICNEPAL.EDU.NP', expected: true, desc: 'Uppercase BIC email' },
    { email: 'bimala.staff@bicnepal.edu.np', expected: true, desc: 'Staff BIC email' },

    // Rejected cases
    { email: 'surajpoddar098@gmail.com', expected: false, desc: 'Personal Gmail account' },
    { email: 'user@yahoo.com', expected: false, desc: 'Yahoo account' },
    { email: 'attacker@fakebicnepal.edu.np', expected: false, desc: 'Fake prefix domain' },
    { email: 'attacker@bicnepal.edu.np.evil.com', expected: false, desc: 'Appended evil domain' },
    { email: 'attacker@sub.bicnepal.edu.np', expected: false, desc: 'Subdomain not matching exact domain' },
    { email: 'attacker@notbicnepal.edu.np', expected: false, desc: 'Not-BIC domain' },
    { email: 'user@otherdomain.com', expected: false, desc: 'Random domain' },
    { email: '', expected: false, desc: 'Empty email' },
    { email: null, expected: false, desc: 'Null email' },
    { email: 'bicnepal.edu.np', expected: false, desc: 'Missing @ and username' },
  ];

  let passedTests = 0;
  for (const tc of testCases) {
    const result = validateBicDomain(tc.email);
    const passed = result === tc.expected;
    if (passed) {
      console.log(`✅ Passed: [${tc.email}] -> ${result ? 'ALLOWED' : 'REJECTED'} (${tc.desc})`);
      passedTests++;
    } else {
      console.error(`❌ FAILED: [${tc.email}] expected ${tc.expected} but got ${result}`);
    }
  }

  if (passedTests !== testCases.length) {
    throw new Error(`Domain validation tests failed: ${passedTests}/${testCases.length} passed`);
  }
  console.log(`\n🎉 All ${passedTests}/${testCases.length} Domain Validation Tests Passed!`);
};

const testDatabaseAndSessionForBicUser = async () => {
  console.log('\n--- 2. Testing Database Persistence & JWT Generation for Valid @bicnepal.edu.np User ---');

  await mongoose.connect(process.env.MONGO_URI, {
    family: 4,
    serverSelectionTimeoutMS: 15000,
  });
  console.log('✅ Connected to MongoDB');

  const testSub = 'google_bic_sub_789456123';
  const testEmail = 'aarav.shrestha@bicnepal.edu.np';
  const testName = 'Aarav Shrestha';
  const testPicture = 'https://lh3.googleusercontent.com/a/aarav_bic.jpg';

  // Clean up existing test record
  await User.deleteMany({ email: testEmail });

  // 1. Create user in MongoDB
  const newUser = await User.create({
    username: 'aaravshrestha',
    email: testEmail,
    googleId: testSub,
    authProvider: 'google',
    role: 'student',
    status: 'approved',
    department: 'Computer Science',
    semester: 'Level 4',
    emailVerified: true,
    profileImage: testPicture,
    lastLogin: new Date(),
  });
  console.log(`✅ Created BIC student in MongoDB: ${newUser.username} (${newUser.email})`);

  // 2. Verify fields
  const retrieved = await User.findOne({ googleId: testSub });
  if (!retrieved || retrieved.email !== testEmail || retrieved.authProvider !== 'google') {
    throw new Error('User record mismatch in MongoDB');
  }
  console.log(`✅ Verified stored user in MongoDB. googleId: ${retrieved.googleId}, authProvider: ${retrieved.authProvider}`);

  // 3. Generate Session Token
  const token = generateToken(retrieved._id, retrieved.role);
  if (!token) {
    throw new Error('Failed to generate JWT session token');
  }
  console.log(`✅ Generated valid JWT application session token for BIC student`);

  // 4. Update lastLogin on repeat login
  retrieved.lastLogin = new Date();
  await retrieved.save();
  console.log(`✅ Updated lastLogin timestamp on subsequent login`);

  // Clean up
  await User.deleteMany({ email: testEmail });
  console.log(`✅ Cleaned up test record`);

  await mongoose.connection.close();
};

const runAll = async () => {
  try {
    await testDomainValidation();
    await testDatabaseAndSessionForBicUser();
    console.log('\n======================================================');
    console.log('🎉 ALL DOMAIN VALIDATION AND PERSISTENCE TESTS PASSED!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test suite failed:', err);
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(1);
  }
};

runAll();
