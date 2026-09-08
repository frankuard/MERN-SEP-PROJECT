/**
 * Ensure the DevCorps Community Portal community accounts carry the same
 * portal configuration as the canonical devcorps BIC account.
 *
 * The five community (role: 'staff') accounts below were provisioned with
 * the correct role and status but without the `portal: 'devcorpsCommunity'`
 * identifier, so they fell back to the generic Staff dashboard after login.
 * devcorps BIC works because its `portal` field is set, which routes it to
 * the shared DevCorps Community Portal (backend devcorpsMiddleware + frontend
 * portal-aware routing key off this single identifier — nothing is per-email).
 *
 * This script fills that gap the same way devcorps BIC was provisioned:
 *   role        -> 'staff'             (Community)
 *   status      -> 'approved'
 *   portal      -> 'devcorpsCommunity'
 *   portalRole  -> 'member'            (no moderation powers — only devcorps BIC
 *                                       is portalRole 'admin' and may Manage Events)
 *
 * Unlike ensureDevCorpsAccount.js, it NEVER touches the password — the
 * existing password/authentication mechanism is preserved for every account.
 *
 * Idempotent: safe to re-run; already-correct accounts are left untouched.
 *
 * Usage:
 *   node scripts/ensureCommunityPortalAccounts.js
 */

require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
const User = require('../models/User');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const ROLE = 'staff';
const PORTAL = 'devcorpsCommunity';
const PORTAL_ROLE = 'member';

const ACCOUNTS = [
  { email: 'ai.horizon@bicnepal.edu.np' },
  { email: 'devsphere@bicnepal.edu.np' },
  { email: 'bicconverge@bicnepal.edu.np' },
  { email: 'lenspire@bicnepal.edu.np' },
  { email: 'incognitous@bicnepal.edu.np' },
];

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });
  console.log('Connected to DB.');

  let provisioned = 0;

  for (const account of ACCOUNTS) {
    const user = await User.findOne({ email: account.email });

    if (!user) {
      console.warn(`SKIP  ${account.email} — no account found`);
      continue;
    }

    const changes = [];
    if (user.role !== ROLE) { user.role = ROLE; changes.push(`role -> "${ROLE}"`); }
    if (user.status !== 'approved') { user.status = 'approved'; changes.push('status -> "approved"'); }
    if (user.portal !== PORTAL) { user.portal = PORTAL; changes.push(`portal -> "${PORTAL}"`); }
    if (user.portalRole !== PORTAL_ROLE) { user.portalRole = PORTAL_ROLE; changes.push(`portalRole -> "${PORTAL_ROLE}"`); }

    if (changes.length === 0) {
      console.log(`OK    ${account.email} — already provisioned as devcorps Community account`);
      continue;
    }

    await user.save();
    provisioned += 1;

    console.log(`FIXED ${account.email} — ${changes.join(', ')}`);
  }

  console.log(`Done. ${provisioned} account(s) updated.`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});