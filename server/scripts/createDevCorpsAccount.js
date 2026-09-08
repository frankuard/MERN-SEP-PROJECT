/**
 * Create (or upgrade) the DevCorps Community Portal account.
 *
 * Username: devcorps BIC
 * Email:    devcorps@bicnepal.edu.np
 * Role:     staff  (displayed as "Community")
 * Portal:   devcorpsCommunity  (secure backend identifier)
 *
 * Usage:
 *   node scripts/createDevCorpsAccount.js <password>
 *
 * If the account already exists, it only ensures the `portal` field is set
 * to 'devcorpsCommunity' and leaves everything else untouched.
 */

require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const USERNAME = 'devcorps BIC';
const EMAIL = 'devcorps@bicnepal.edu.np';
const ROLE = 'staff'; // Community role value already used across the system
const PORTAL = 'devcorpsCommunity';

async function main() {
  const [, , passwordArg] = process.argv;

  if (!passwordArg) {
    console.error('Usage: node scripts/createDevCorpsAccount.js <password>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB.');

  const existing = await User.findOne({ email: EMAIL });

  if (existing) {
    if (existing.portal !== PORTAL) {
      existing.portal = PORTAL;
      await existing.save();
      console.log('Portal identifier updated on the existing account.');
    }
    console.log('DevCorps account already exists:');
    console.log({ id: existing._id, username: existing.username, email: existing.email, role: existing.role, portal: existing.portal });
    await mongoose.disconnect();
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(passwordArg, 10);

  const user = await User.create({
    username: USERNAME,
    email: EMAIL,
    password: hashedPassword,
    role: ROLE,
    status: 'approved',
    portal: PORTAL,
  });

  console.log('DevCorps account created:');
  console.log({ id: user._id, username: user.username, email: user.email, role: user.role, portal: user.portal });

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to create DevCorps account:', err);
  process.exit(1);
});