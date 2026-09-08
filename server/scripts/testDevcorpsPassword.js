require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const EMAIL = 'devcorps@bicnepal.edu.np';
const CANDIDATES = process.argv.slice(2);

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });
  const user = await User.findOne({ email: EMAIL });
  if (!user) { console.log('not found'); process.exit(1); }

  console.log('Stored hash:', user.password);

  if (CANDIDATES.length === 0) {
    console.log('No candidate passwords passed. Pass them as args, e.g.:');
    console.log('node scripts/testDevcorpsPassword.js devcorps devcorps123 password ...');
  }

  for (const p of CANDIDATES) {
    const ok = await bcrypt.compare(p, user.password);
    console.log(`"${p}" -> ${ok ? 'MATCH' : 'no'}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
