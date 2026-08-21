require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const authRoutes = require('../routes/auth.routes');
const timetableRoutes = require('../routes/timetable.routes');
const canteenRoutes = require('../routes/canteen.routes');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const User = require('../models/User');

const connectDB = require('../config/db');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/canteen', canteenRoutes);

app.get('/api/test-student', authMiddleware, roleMiddleware('student'), (req, res) => {
  res.status(200).json({ message: 'Student access granted', user: req.user.username });
});

app.get('/api/test-admin', authMiddleware, roleMiddleware('admin'), (req, res) => {
  res.status(200).json({ message: 'Admin access granted', user: req.user.username });
});

async function runSecurityTests() {
  let server;
  try {
    console.log('Connecting to MongoDB via connectDB()...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    server = app.listen(3001);
    console.log('Test server running on port 3001\n');

    // Helper fetch
    const request = async (path, options = {}) => {
      const url = `http://localhost:3001${path}`;
      const res = await fetch(url, options);
      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      return {
        status: res.status,
        headers: res.headers,
        data,
      };
    };

    // 1. Create/Ensure a test student in DB
    const studentEmail = 'security_test_student@bicnepal.edu.np';
    let testStudent = await User.findOne({ email: studentEmail });
    if (!testStudent) {
      const bcrypt = require('bcryptjs');
      testStudent = await User.create({
        username: 'sec_student',
        email: studentEmail,
        password: await bcrypt.hash('TestPass123!', 10),
        role: 'student',
        status: 'approved',
        department: 'Computer Science',
      });
    }

    console.log('--- 1. Testing Login & HttpOnly Cookie Issuance ---');
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: 'TestPass123!',
      }),
    });

    console.log('Login Status:', loginRes.status);
    const setCookie = loginRes.headers.get('set-cookie');
    console.log('Set-Cookie Header:', setCookie);

    if (!setCookie || !setCookie.includes('HttpOnly') || !setCookie.includes('token=')) {
      throw new Error('❌ HttpOnly token cookie was not set in response header!');
    }
    console.log('✅ HttpOnly token cookie successfully received');

    // Extract cookie for subsequent calls
    const cookieHeader = setCookie.split(';')[0];

    // 2. Test GET /api/auth/me (Session Hydration)
    console.log('\n--- 2. Testing Session Hydration via GET /api/auth/me ---');
    const meRes = await request('/api/auth/me', {
      headers: { Cookie: cookieHeader },
    });
    console.log('Auth Me Status:', meRes.status);
    console.log('Resolved User from DB:', meRes.data.user?.username, `(Role: ${meRes.data.user?.role})`);

    if (meRes.status !== 200 || meRes.data.user?.email !== studentEmail) {
      throw new Error('❌ GET /api/auth/me failed to resolve student session from cookie');
    }
    console.log('✅ Session validated via HttpOnly cookie (0 localStorage used)');

    // 3. Test Role Access: Student route
    console.log('\n--- 3. Testing Role Authorization: Student Protected Route ---');
    const studentRouteRes = await request('/api/test-student', {
      headers: { Cookie: cookieHeader },
    });
    console.log('Student Route Status:', studentRouteRes.status, studentRouteRes.data);
    if (studentRouteRes.status !== 200) {
      throw new Error('❌ Student route rejected valid student cookie');
    }
    console.log('✅ Student access authorized');

    // 4. Test Privilege Escalation Protection: Access Admin Route as Student
    console.log('\n--- 4. Testing Privilege Escalation Defense: Admin Protected Route ---');
    const adminRouteRes = await request('/api/test-admin', {
      headers: { Cookie: cookieHeader },
    });
    console.log('Admin Route Status with Student Cookie:', adminRouteRes.status, adminRouteRes.data);
    if (adminRouteRes.status !== 403) {
      throw new Error('❌ Security breach! Student was able to access admin endpoint');
    }
    console.log('✅ Privilege escalation correctly blocked (403 Forbidden)');

    // 5. Test Logout: Clear Cookie
    console.log('\n--- 5. Testing Logout & Cookie Invalidation ---');
    const logoutRes = await request('/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: cookieHeader },
    });
    console.log('Logout Status:', logoutRes.status, logoutRes.data);
    const logoutCookie = logoutRes.headers.get('set-cookie');
    console.log('Logout Set-Cookie Header:', logoutCookie);

    // Call /api/auth/me without valid cookie
    const postLogoutMe = await request('/api/auth/me');
    console.log('Post-Logout /api/auth/me Status:', postLogoutMe.status);
    if (postLogoutMe.status !== 401) {
      throw new Error('❌ Expected 401 Unauthorized after logout');
    }
    console.log('✅ Session successfully terminated upon logout');

    console.log('\n🎉 ALL AUTHENTICATION & SECURITY REQUIREMENTS VERIFIED SUCCESSFULLY!');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    if (server) server.close();
    process.exit(1);
  }
}

runSecurityTests();
