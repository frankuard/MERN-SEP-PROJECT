/* DEBUG-REALTIME end-to-end test (temporary, will be deleted).
 * Drives real admin HTTP API calls against the running server and verifies
 * a connected "user" socket receives the broadcast for each mutation.
 */
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { io } = require('../client/node_modules/socket.io-client');
const User = require('./models/User');

const BASE = 'http://localhost:3000/api';
const results = [];
const fail = (step, msg) => { results.push({ step, ok: false, msg }); console.error(`[TEST] FAIL ${step}: ${msg}`); };
const pass = (step, msg) => { results.push({ step, ok: true, msg }); console.log(`[TEST] PASS ${step}: ${msg}`); };

async function apiRequest(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `token=${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data };
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const admin = await User.findOne({ role: 'admin', status: 'approved' });
  const student = await User.findOne({ role: 'student', status: 'approved' });
  if (!admin || !student) { console.error('[TEST] need admin + student users'); process.exit(1); }
  console.log('[TEST] admin:', admin.email, '| student:', student.email);

  const adminToken = jwt.sign({ userId: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const studentToken = jwt.sign({ userId: student._id, role: student.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

  // --- Connect the "user panel" socket ---
  const socket = io('http://localhost:3000', {
    withCredentials: true,
    extraHeaders: { Cookie: `token=${studentToken}` },
  });

  const received = { menu: 0, announcement: 0 };
  const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));

  socket.on('canteen:menu:updated', (p) => { received.menu++; console.log('[TEST] [USER socket] canteen:menu:updated', p?.action); });
  socket.on('announcement:updated', (p) => { received.announcement++; console.log('[TEST] [USER socket] announcement:updated', p?.action); });
  socket.on('connect_error', (e) => console.error('[TEST] [USER socket] connect_error:', e.message));
  socket.on('connect', () => console.log('[TEST] [USER socket] connected:', socket.id));

  // wait for socket connection
  await waitFor(1500);
  if (!socket.connected) { console.error('[TEST] student socket never connected'); process.exit(1); }
  pass('user socket connection', 'student socket connected');

  // --- 1. CREATE a menu item ---
  let r = await apiRequest('POST', '/canteen/menu', {
    name: 'Realtime Debug Item', description: 'temp', price: 100, category: 'Snacks', availability: true, image: 'https://example.com/food.png',
  }, adminToken);
  const itemId = r.data?.item?._id;
  if (r.status === 201 && itemId) pass('admin CREATE menu', `_id=${itemId}`); else fail('admin CREATE menu', JSON.stringify(r.data));
  await waitFor(800);
  if (received.menu === 1) pass('user receives CREATE broadcast', 'canteen:menu:updated create'); else fail('user receives CREATE broadcast', `menuReceived=${received.menu}`);

  // --- 2. UPDATE menu (price + availability) ---
  r = await apiRequest('PUT', `/canteen/menu/${itemId}`, { price: 999, availability: false }, adminToken);
  if (r.status === 200 && r.data?.item?._id) pass('admin UPDATE menu (price+availability)', `_id=${itemId}`); else fail('admin UPDATE menu', JSON.stringify(r.data));
  await waitFor(800);
  if (received.menu === 2) pass('user receives UPDATE broadcast', 'canteen:menu:updated update'); else fail('user receives UPDATE broadcast', `menuReceived=${received.menu}`);

  // --- 3. CREATE an announcement ---
  r = await apiRequest('POST', '/announcements', { title: 'Realtime Debug Notice', message: 'temp', priority: 'Medium', department: 'General' }, adminToken);
  const annId = r.data?._id;
  if (r.status === 201 && annId) pass('admin CREATE announcement', `_id=${annId}`); else fail('admin CREATE announcement', JSON.stringify(r.data));
  await waitFor(800);
  if (received.announcement === 1) pass('user receives announcement CREATE broadcast', 'announcement:updated create'); else fail('user receives announcement CREATE broadcast', `announcementReceived=${received.announcement}`);

  // --- 4. UPDATE announcement ---
  r = await apiRequest('PATCH', `/announcements/${annId}`, { title: 'Realtime Debug Notice (edited)' }, adminToken);
  if (r.status === 200 && r.data?._id) pass('admin UPDATE announcement', `_id=${annId}`); else fail('admin UPDATE announcement', JSON.stringify(r.data));
  await waitFor(800);
  if (received.announcement === 2) pass('user receives announcement UPDATE broadcast', 'announcement:updated update'); else fail('user receives announcement UPDATE broadcast', `announcementReceived=${received.announcement}`);

  // --- 5. DELETE menu item ---
  r = await apiRequest('DELETE', `/canteen/menu/${itemId}`, null, adminToken);
  if (r.status === 200) pass('admin DELETE menu', `_id=${itemId}`); else fail('admin DELETE menu', JSON.stringify(r.data));
  await waitFor(800);
  if (received.menu === 3) pass('user receives DELETE broadcast', 'canteen:menu:updated delete'); else fail('user receives DELETE broadcast', `menuReceived=${received.menu}`);

  // --- 6. DELETE announcement ---
  r = await apiRequest('DELETE', `/announcements/${annId}`, null, adminToken);
  if (r.status === 200) pass('admin DELETE announcement', `_id=${annId}`); else fail('admin DELETE announcement', JSON.stringify(r.data));
  await waitFor(800);
  if (received.announcement === 3) pass('user receives announcement DELETE broadcast', 'announcement:updated delete'); else fail('user receives announcement DELETE broadcast', `announcementReceived=${received.announcement}`);

  const allOk = results.every((x) => x.ok);
  console.log(`\n[RESULT] ${results.filter((x) => x.ok).length}/${results.length} steps passed. OVERALL: ${allOk ? 'PASS' : 'FAIL'}`);
  socket.close();
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => { console.error('[TEST] fatal:', e); process.exit(1); });
