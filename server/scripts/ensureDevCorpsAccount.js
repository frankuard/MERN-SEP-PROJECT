/**
 * One-time fix: ensure the DevCorps Community Portal account exists with
 * the correct `portal` identifier, role, and status. Uses the app's own
 * MONGO_URI so it talks to the exact database the server uses.
 *
 * Usage:
 *   node scripts/ensureDevCorpsAccount.js <password>
 *
 * Idempotent: if the account exists it normalizes username, role, status,
 * and portal AND sets the given password, so the credentials are always
 * deterministic.
 */

require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const USERNAME = 'devcorps BIC';
const EMAIL = 'devcorps@bicnepal.edu.np';
const ROLE = 'staff';
const PORTAL = 'devcorpsCommunity';

async function main() {
  const [, , passwordArg] = process.argv;

  if (!passwordArg) {
    console.error('Usage: node scripts/ensureDevCorpsAccount.js <password>');
    process.exit(1);
  }

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB.');

  const hashedPassword = await bcrypt.hash(passwordArg, 10);

  let user = await User.findOne({ email: EMAIL });

  if (user) {
    // Normalize portal, role, username, status, AND the password so the
    // account is fully deterministic (idempotent — safe to re-run).
    let changed = false;
    if (user.portal !== PORTAL) { user.portal = PORTAL; changed = true; }
    if (user.role !== ROLE) { user.role = ROLE; changed = true; }
    if (user.status !== 'approved') { user.status = 'approved'; changed = true; }
    if (user.username !== USERNAME) { user.username = USERNAME; changed = true; }
    user.password = hashedPassword;
    changed = true;
    await user.save();
    console.log('Existing account updated:', JSON.stringify({ changed: true }));
    console.log('Account:', JSON.stringify({ id: user._id, username: user.username, email: user.email, role: user.role, portal: user.portal, status: user.status }));
    await mongoose.disconnect();
    process.exit(0);
  }

  user = await User.create({
    username: USERNAME,
    email: EMAIL,
    password: hashedPassword,
    role: ROLE,
    status: 'approved',
    portal: PORTAL,
  });

  console.log('Account created:', JSON.stringify({ id: user._id, username: user.username, email: user.email, role: user.role, portal: user.portal }));

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});