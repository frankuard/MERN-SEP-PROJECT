// scripts/backfillCanteenCredits.js
//
// One-time fix-up script:
//   1. Finds every User who has NO CanteenCredit record and creates a
//      fresh one for them (amountDue: 0, amountPaid: 0) — this restores
//      the "credit due" section on the user panel for anyone whose
//      record got accidentally deleted.
//   2. Reports (does NOT auto-delete) any CanteenCredit records whose
//      `user` no longer exists — orphans left over from before the
//      cascade-delete fix was added to adminUserController.js.
//
// Run from the server/ directory:
//   node scripts/backfillCanteenCredits.js
//
// Safe to run multiple times — it only creates what's missing.

require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
const User = require('../models/User');
const CanteenCredit = require('../models/CanteenCredit');

// Fix for "querySrv ECONNREFUSED _mongodb._tcp.<cluster>.mongodb.net" —
// happens when the OS/network's default DNS resolver can't resolve the
// SRV record that mongodb+srv:// connection strings rely on (common on
// some Windows setups, VPNs, or restrictive routers/ISPs). Forcing Node
// to use a public resolver (Google DNS here) fixes it without needing to
// change the connection string itself.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.\n');

  // ---- 1. Create missing credit records ----
  const users = await User.find({}).select('_id username');
  const existingCredits = await CanteenCredit.find({}).select('user');
  const existingUserIds = new Set(existingCredits.map((c) => String(c.user)));

  const missing = users.filter((u) => !existingUserIds.has(String(u._id)));

  console.log(`Total users: ${users.length}`);
  console.log(`Users missing a CanteenCredit record: ${missing.length}\n`);

  for (const user of missing) {
    await CanteenCredit.create({
      user: user._id,
      studentName: user.username,
      amountDue: 0,
      amountPaid: 0,
    });
    console.log(`  + Created credit record for "${user.username}" (${user._id})`);
  }

  // ---- 2. Report orphaned credit records ----
  const userIdSet = new Set(users.map((u) => String(u._id)));
  const orphans = existingCredits.filter((c) => !userIdSet.has(String(c.user)));

  console.log(`\nOrphaned credit records (user no longer exists): ${orphans.length}`);
  if (orphans.length > 0) {
    console.log('These were NOT deleted automatically — review and remove manually if unwanted:');
    orphans.forEach((o) => console.log(`  - CanteenCredit _id: ${o._id}, dangling user ref: ${o.user}`));
  }

  console.log('\nDone.');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});