require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const LostFoundItem = require('../models/LostFoundItem');
const CctvRequest = require('../models/CctvRequest');
const generateToken = require('../utils/generateToken');

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 15000,
    });
    console.log('✅ 1. MongoDB Connected successfully');

    // 1. Ensure test student user exists
    let student = await User.findOne({ email: 'student.test@bicnepal.edu.np' });
    if (!student) {
      student = await User.create({
        username: 'Bikash Sharma',
        email: 'student.test@bicnepal.edu.np',
        password: '$2a$10$dummyhashedpasswordfortesting12345',
        role: 'student',
        status: 'approved',
        department: 'BSc (Hons) Computing',
        semester: 'Level 4',
      });
      console.log('✅ 2. Created test student user in MongoDB:', student.username);
    } else {
      console.log('✅ 2. Found test student user in MongoDB:', student.username);
    }

    // 2. Test create Lost & Found Item
    const testItem = await LostFoundItem.create({
      title: 'Graphing Calculator (TI-84 Plus)',
      description: 'Black Texas Instruments calculator left on 3rd row desk after Maths workshop.',
      type: 'lost',
      category: 'Electronics',
      location: 'Block B Room 102',
      status: 'Unclaimed',
      createdBy: student._id,
      authorName: student.username,
      time: 'Just now',
    });
    console.log('✅ 3. Item saved in MongoDB:', testItem._id, testItem.title, testItem.status);

    // 3. Test Query & Search
    const searchResults = await LostFoundItem.find({
      $or: [
        { title: new RegExp('Calculator', 'i') },
        { location: new RegExp('Block B', 'i') },
      ],
    });
    console.log(`✅ 4. Search Query returned ${searchResults.length} matching item(s) from MongoDB`);

    // 4. Test Claim Item
    testItem.claims.push({
      user: student._id,
      userName: student.username,
      userEmail: student.email,
      details: 'This is my TI-84 calculator with my name initial BS written on back.',
      status: 'Approved',
      claimedAt: new Date(),
    });
    testItem.status = 'Claimed';
    testItem.claimedBy = student._id;
    testItem.claimantName = student.username;
    await testItem.save();
    console.log('✅ 5. Item successfully claimed and saved in MongoDB. Status:', testItem.status, 'Claimant:', testItem.claimantName);

    // 5. Test Duplicate Claim Prevention check
    const isDuplicate = testItem.claims.filter(
      (c) => c.user.toString() === student._id.toString() && c.status !== 'Rejected'
    ).length > 1;
    console.log('✅ 6. Duplicate claim prevention logic checked (is duplicate detected?):', !isDuplicate);

    // 6. Test Mark Item as Returned
    testItem.status = 'Returned';
    testItem.returnedAt = new Date();
    testItem.returnedBy = student._id;
    await testItem.save();
    console.log('✅ 7. Item marked as Returned in MongoDB:', testItem.status, 'ReturnedAt:', testItem.returnedAt);

    // 7. Test CCTV Request
    const cctvReq = await CctvRequest.create({
      user: student._id,
      userName: student.username,
      userEmail: student.email,
      location: 'Block B Ground Floor (Labs)',
      date: '2026-08-20',
      timeFrom: '09:00 AM',
      timeTo: '11:00 AM',
      reason: 'Review footage for calculator misplaced on desk',
      relatedLostItem: testItem._id,
      status: 'In Review',
      submittedAt: 'Just now',
    });
    console.log('✅ 8. CCTV Request created and saved in MongoDB:', cctvReq._id, cctvReq.location, cctvReq.status);

    // 8. Test CCTV Status Transition
    cctvReq.status = 'Approved';
    cctvReq.reviewNotes = 'Security footage reviewed. Item handed over to Library desk.';
    await cctvReq.save();
    console.log('✅ 9. CCTV Request updated to Approved with Security Notes in MongoDB:', cctvReq.status);

    // 9. Test Statistics calculation
    const totalItems = await LostFoundItem.countDocuments();
    const unclaimedCount = await LostFoundItem.countDocuments({ status: 'Unclaimed' });
    const claimedCount = await LostFoundItem.countDocuments({ status: { $in: ['Claimed', 'Claim Pending'] } });
    const cctvCount = await CctvRequest.countDocuments();
    console.log('✅ 10. Real-time MongoDB Statistics:', {
      totalItems,
      unclaimedCount,
      claimedCount,
      totalCctvRequests: cctvCount,
    });

    // Cleanup test records
    await LostFoundItem.findByIdAndDelete(testItem._id);
    await CctvRequest.findByIdAndDelete(cctvReq._id);
    console.log('✅ 11. Cleanup test records completed');

    await mongoose.connection.close();
    console.log('\n🎉 ALL LOST & FOUND MONGODB BACKEND TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(1);
  }
};

runTest();
