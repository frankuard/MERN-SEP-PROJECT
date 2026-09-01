/**
 * Create an admin account (super or department-scoped) — interactive.
 *
 * Usage:
 *   node scripts/createAdminAccount.js
 *
 * It will ask you for each field one at a time: username, email,
 * password, and adminSection (super / canteen / ssd / rte / resources).
 */

require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
const readline = require('readline');
const bcrypt = require('bcryptjs'); // change to require('bcrypt') if that's what authController.js uses
const User = require('../models/User');

// Force Node's DNS resolver to use Google + Cloudflare DNS directly for
// this script, instead of relying on the OS/router's DNS — this is what
// actually fixes SRV lookup failures, since changing DNS in Windows
// network settings doesn't always get picked up by Node's resolver.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const VALID_SECTIONS = ['super', 'canteen', 'ssd', 'rte', 'resources'];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));

async function main() {
  console.log('--- Create Admin Account ---');

  const username = await ask('Username: ');
  const email = await ask('Email: ');
  const password = await ask('Password: ');

  let adminSection = await ask(`Admin section (${VALID_SECTIONS.join(' / ')}): `);
  adminSection = adminSection.toLowerCase();

  if (!username || !email || !password) {
    console.error('Username, email, and password are all required.');
    rl.close();
    process.exit(1);
  }

  if (!VALID_SECTIONS.includes(adminSection)) {
    console.error(`adminSection must be one of: ${VALID_SECTIONS.join(', ')}`);
    rl.close();
    process.exit(1);
  }

  rl.close();

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB.');

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    console.error(`A user with that username or email already exists (id: ${existing._id}).`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    role: 'admin',
    status: 'approved',
    adminSection,
  });

  console.log('\nAdmin account created:');
  console.log({ id: user._id, username: user.username, email: user.email, adminSection: user.adminSection });

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to create admin account:', err);
  process.exit(1);
});