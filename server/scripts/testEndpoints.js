require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');
const CanteenMenu = require('../models/CanteenMenu');
const CanteenCredit = require('../models/CanteenCredit');
const User = require('../models/User');

async function testDatabaseOperations() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 15000,
    });
    console.log('✅ Connected to MongoDB successfully\n');

    // 1. Test Timetable CRUD
    console.log('--- 1. Testing Timetable Operations ---');
    const totalClasses = await Timetable.countDocuments();
    console.log(`Found ${totalClasses} total class entries in DB`);

    // Create demo class
    const testClass = await Timetable.create({
      day: 'Saturday',
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      courseCode: '4CS099',
      courseName: 'Advanced Web Architecture',
      teacher: 'Aayush Regmi',
      room: 'LT-01 Wulfurna',
      classType: 'Lecture',
    });
    console.log('✅ [CRUD - ADD] Created test class:', testClass._id);

    // Update test class
    const updatedClass = await Timetable.findByIdAndUpdate(
      testClass._id,
      { room: 'SR-01 Wolves' },
      { returnDocument: 'after' }
    );
    console.log('✅ [CRUD - UPDATE] Updated test class room to:', updatedClass.room);

    // Delete test class
    await Timetable.findByIdAndDelete(testClass._id);
    console.log('✅ [CRUD - DELETE] Deleted test class');

    // 2. Test Canteen Menu CRUD
    console.log('\n--- 2. Testing Canteen Menu Operations ---');
    const totalMenuItems = await CanteenMenu.countDocuments();
    console.log(`Found ${totalMenuItems} total menu food items in DB`);

    // Create demo food item
    const testFood = await CanteenMenu.create({
      name: 'Special Keema Noodles',
      price: 150,
      category: 'Momo & Noodles',
      description: 'Handmade spicy noodles with seasoned minced chicken',
      image: '/canteen/chowmein.png',
      availability: true,
    });
    console.log('✅ [CRUD - ADD] Created test menu item:', testFood.name, `(NPR ${testFood.price})`);

    // Update test food
    const updatedFood = await CanteenMenu.findByIdAndUpdate(
      testFood._id,
      { price: 160 },
      { returnDocument: 'after' }
    );
    console.log('✅ [CRUD - UPDATE] Updated test food price to: NPR', updatedFood.price);

    // Delete test food
    await Timetable.findByIdAndDelete(testFood._id);
    await CanteenMenu.findByIdAndDelete(testFood._id);
    console.log('✅ [CRUD - DELETE] Deleted test food item');

    // 3. Test Credit Khata Operations
    console.log('\n--- 3. Testing Credit / Khata Operations ---');
    const credits = await CanteenCredit.find();
    console.log(`Found ${credits.length} credit record(s) in DB`);
    if (credits.length > 0) {
      const first = credits[0];
      console.log(`Student: ${first.studentName}, Due: NPR ${first.amountDue}, Paid: NPR ${first.amountPaid}, Remaining: NPR ${first.remainingBalance}, Status: ${first.paymentStatus}`);
    }

    console.log('\n🎉 ALL DATABASE AND CRUD OPERATIONS VERIFIED SUCCESSFULLY!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testDatabaseOperations();
