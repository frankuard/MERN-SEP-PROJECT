require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');
const CanteenMenu = require('../models/CanteenMenu');
const CanteenCredit = require('../models/CanteenCredit');
const User = require('../models/User');

const TIMETABLE_DATA = [
  {
    day: 'Sunday',
    startTime: '11:00 AM',
    endTime: '1:00 PM',
    courseCode: '4CS001',
    courseName: 'Introductory Programming and Problem Solving',
    teacher: 'Aayush Regmi',
    room: 'LT-01 Wulfurna',
    classType: 'Lecture',
  },
  {
    day: 'Monday',
    startTime: '8:00 AM',
    endTime: '10:00 AM',
    courseCode: '4CS017',
    courseName: 'Internet Software Architecture and Database',
    teacher: 'Mr. Arvind Nepal',
    room: 'LT-01 Wulfurna',
    classType: 'Lecture',
  },
  {
    day: 'Monday',
    startTime: '12:00 PM',
    endTime: '2:30 PM',
    courseCode: '4CS015',
    courseName: 'Fundamentals of Computing',
    teacher: 'Ms. Sandhya Tiwari',
    room: 'TR-04 Mechi',
    classType: 'Workshop',
  },
  {
    day: 'Tuesday',
    startTime: '8:00 AM',
    endTime: '10:00 AM',
    courseCode: '4CS015',
    courseName: 'Fundamentals of Computing',
    teacher: 'Mr. Sanjeev Chamling',
    room: 'LT-01 Wulfurna',
    classType: 'Lecture',
  },
  {
    day: 'Tuesday',
    startTime: '11:00 AM',
    endTime: '1:00 PM',
    courseCode: '4CS001',
    courseName: 'Introductory Programming and Problem Solving',
    teacher: 'Mr. Bhisma Raj Koirala',
    room: 'TR-05 Kankai',
    classType: 'Tutorial',
  },
  {
    day: 'Wednesday',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    courseCode: '4CS017',
    courseName: 'Internet Software Architecture and Database',
    teacher: 'Mr. Pankaj Shah',
    room: 'SR-02 Compton',
    classType: 'Tutorial',
  },
  {
    day: 'Friday',
    startTime: '8:00 AM',
    endTime: '10:30 AM',
    courseCode: '4CS001',
    courseName: 'Introductory Programming and Problem Solving',
    teacher: 'Aayush Regmi',
    room: 'SR-01 Wolves',
    classType: 'Workshop',
  },
];

const CANTEEN_MENU_DATA = [
  {
    name: 'Chicken Biryani',
    price: 220,
    category: 'Meals',
    description: 'Aromatic layered basmati rice with tender spiced chicken',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    availability: true,
  },
  {
    name: 'Aalu Nimki',
    price: 50,
    category: 'Snacks',
    description: 'Crispy diamond nimki with spicy potato gravy',
    image: 'https://images.unsplash.com/photo-1605333396915-47ed6b68a00e?w=600&auto=format&fit=crop&q=80',
    availability: true,
  },
  {
    name: 'Chatpatey',
    price: 50,
    category: 'Snacks',
    description: 'Tangy spicy Nepali puffed rice street mix with lemon & spices',
    image: '/canteen/chatpatey.jpg',
    availability: true,
  },
  {
    name: 'Chicken Chatpatey',
    price: 100,
    category: 'Snacks',
    description: 'Spicy street chatpatey tossed with crispy chicken bites',
    image: '/canteen/chicken-chatpatey.jpg',
    availability: true,
  },
  {
    name: 'Fried Rice',
    price: 100,
    category: 'Meals',
    description: 'Wok-tossed seasoned garden vegetables & rice',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
    availability: true,
  },
  {
    name: 'Chicken Chowmein',
    price: 100,
    category: 'Momo & Noodles',
    description: 'Stir-fried noodles with chicken & peppers',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80',
    availability: true,
  },
  {
    name: 'Veg Chowmein',
    price: 60,
    category: 'Momo & Noodles',
    description: 'Stir-fried noodles with fresh crisp veggies',
    image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
    availability: true,
  },
  {
    name: 'Samosa',
    price: 50,
    category: 'Snacks',
    description: 'Crispy golden spiced potato pastry (2 pcs)',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    availability: true,
  },
  {
    name: 'Lassi',
    price: 80,
    category: 'Beverages',
    description: 'Chilled sweet creamy curd yogurt drink',
    image: 'https://images.unsplash.com/photo-1571006682893-ac91f9b3ec70?w=600&auto=format&fit=crop&q=80',
    availability: true,
  },
  {
    name: 'Thukpa',
    price: 80,
    category: 'Momo & Noodles',
    description: 'Steaming hot Himalayan noodle soup',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
    availability: true,
  },
  {
    name: 'Veg Momo',
    price: 80,
    category: 'Momo & Noodles',
    description: 'Steamed fresh vegetable dumplings (10 pcs)',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
    availability: true,
  },
  {
    name: 'Chicken Momo',
    price: 120,
    category: 'Momo & Noodles',
    description: 'Juicy steamed chicken dumplings with timur achar (10 pcs)',
    image: '/canteen/chicken-momo.jpg',
    availability: true,
  },
];

async function seedDatabase() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is missing in server/.env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 15000,
    });
    console.log('✅ Connected to MongoDB');

    // 1. Seed Timetable
    console.log('Seeding Timetable...');
    await Timetable.deleteMany({});
    const createdClasses = await Timetable.insertMany(TIMETABLE_DATA);
    console.log(`✅ Seeded ${createdClasses.length} Timetable classes`);

    // 2. Seed Canteen Menu
    console.log('Seeding Canteen Menu...');
    await CanteenMenu.deleteMany({});
    const createdMenuItems = await CanteenMenu.insertMany(CANTEEN_MENU_DATA);
    console.log(`✅ Seeded ${createdMenuItems.length} Canteen Menu food items`);

    // 3. Seed Canteen Credit Khata
    console.log('Seeding Canteen Credit Khata...');
    const users = await User.find({ role: 'student' });
    if (users.length > 0) {
      for (const u of users) {
        await CanteenCredit.findOneAndUpdate(
          { user: u._id },
          {
            user: u._id,
            studentName: u.username,
            amountDue: 150,
            amountPaid: 0,
            remainingBalance: 150,
            paymentStatus: 'Pending',
          },
          { upsert: true, new: true }
        );
      }
      console.log(`✅ Seeded initial Credit Khata for ${users.length} student user(s)`);
    } else {
      // Find any user or admin to initialize demo khata
      const anyUser = await User.findOne({});
      if (anyUser) {
        await CanteenCredit.findOneAndUpdate(
          { user: anyUser._id },
          {
            user: anyUser._id,
            studentName: anyUser.username || 'Suraj Poddar',
            amountDue: 150,
            amountPaid: 0,
            remainingBalance: 150,
            paymentStatus: 'Pending',
          },
          { upsert: true, new: true }
        );
        console.log(`✅ Seeded initial Credit Khata for ${anyUser.username}`);
      }
    }

    console.log('🎉 Seeding completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
