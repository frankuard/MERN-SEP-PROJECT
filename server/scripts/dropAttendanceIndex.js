// server/scripts/dropAttendanceIndex.js
require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await mongoose.connection.db
    .collection('attendances')
    .dropIndex('student_1');
  console.log('Dropped index:', result);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed to drop index:', err.message);
  process.exit(1);
});