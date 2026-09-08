require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const EMAILS = [
  'devcorps@bicnepal.edu.np',
  'ai.horizon@bicnepal.edu.np',
  'devsphere@bicnepal.edu.np',
  'bicconverge@bicnepal.edu.np',
  'lenspire@bicnepal.edu.np',
  'incognitous@bicnepal.edu.np',
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });
  console.log('Connected.\n');

  for (const email of EMAILS) {
    // Also check case-insensitive / multiple
    const found = await User.find({ email: { $regex: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } });
    if (found.length === 0) {
      console.log(`--- ${email}: NOT FOUND in DB`);
      continue;
    }
    found.forEach((u) => {
      console.log(`--- ${email}`);
      console.log('   _id        :', u._id.toString());
      console.log('   username   :', JSON.stringify(u.username));
      console.log('   email      :', JSON.stringify(u.email));
      console.log('   role       :', u.role);
      console.log('   status     :', u.status);
      console.log('   portal     :', u.portal);
      console.log('   portalRole :', u.portalRole);
      console.log('   pwHash     :', u.password);
      console.log('   total matching:', found.length);
    });
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
