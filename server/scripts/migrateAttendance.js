// server/scripts/migrateAttendance.js
//
// One-time migration:
//   1. Drops the stale `student_1` unique index (old one-doc-per-student model).
//   2. Finds any leftover old-format docs (totalDays/present/absent, no `status`
//      field) and converts each into N "Present" + M "Absent" per-session
//      records, matching the current schema. Old docs are deleted after a
//      successful conversion.
//
// Run from the server/ directory: node scripts/migrateAttendance.js

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // sidesteps the SRV lookup issue some networks hit

require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const attendances = db.collection('attendances');

  // ---- Step 1: drop the stale unique index (ignore error if already gone) ----
  try {
    await attendances.dropIndex('student_1');
    console.log('✔ Dropped stale index student_1');
  } catch (err) {
    if (err.codeName === 'IndexNotFound' || /index not found/i.test(err.message)) {
      console.log('ℹ Index student_1 already absent, skipping');
    } else {
      throw err;
    }
  }

  // ---- Step 2: find old-format docs (no `status` field = old schema) ----
  const oldDocs = await attendances.find({ status: { $exists: false } }).toArray();
  console.log(`ℹ Found ${oldDocs.length} old-format document(s) to migrate`);

  for (const doc of oldDocs) {
    const { student, present = 0, absent = 0 } = doc;
    const markedBy = doc.markedBy || null;
    const baseDate = doc.createdAt || new Date();

    const newRecords = [];
    for (let i = 0; i < present; i += 1) {
      newRecords.push({
        student,
        date: `Migrated ${i + 1}`,
        time: '',
        room: '',
        status: 'Present',
        markedBy,
        createdAt: baseDate,
        updatedAt: baseDate,
      });
    }
    for (let i = 0; i < absent; i += 1) {
      newRecords.push({
        student,
        date: `Migrated ${present + i + 1}`,
        time: '',
        room: '',
        status: 'Absent',
        markedBy,
        createdAt: baseDate,
        updatedAt: baseDate,
      });
    }

    if (newRecords.length > 0) {
      await attendances.insertMany(newRecords);
    }
    await attendances.deleteOne({ _id: doc._id });
    console.log(`✔ Migrated student ${student} — ${present} present, ${absent} absent (old doc removed)`);
  }

  console.log('✔ Migration complete');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});