const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require("dotenv").config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { getDbStatus } = require('./config/db');
const {notFound, errorHandler} = require("./middleware/errorHandler");

// ROUTE and middleware IMPORTS

const uploadRoutes = require('./routes/upload.routes')
const authRoutes = require('./routes/auth.routes');
const authMiddleware = require('./middleware/authMiddleware');
const roleMiddleware = require('./middleware/roleMiddleware');
const testPostRoutes = require('./routes/testPost.routes');
const lostFoundRoutes = require('./routes/lostFound.routes');
const eventRoutes = require('./routes/event.routes');
const canteenRoutes = require('./routes/canteen.routes');

const announcementRoutes = require('./routes/announcement.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const helpRoutes = require('./routes/help.routes');
const resourceRoutes = require('./routes/resource.routes');
const timetableRoutes = require('./routes/timetable.routes');

const moduleRoutes = require('./routes/modules.routes');
const groupRoutes = require('./routes/groups.routes');
const classroomRoutes = require('./routes/classrooms.routes');
const classroomRequestRoutes = require('./routes/classroomRequests.routes');
const volunteerRecordRoutes = require('./routes/volunteerRecords.routes');
const adminUsersRoutes = require('./routes/adminUsers.routes');
const app = express();


const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5178',
  ,
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);




app.use(cookieParser());
app.use(express.json());

app.get('/', (req,res) => {
    res.json({message: 'Chautari API is running'})
});

app.get('/api/health', (req, res) => {
  const db = getDbStatus();
  res.status(200).json({
    status: 'ok',
    message: 'Chautari API is running',
    db: db.connected ? 'connected' : 'disconnected',
  });
});

// auth middleware part
app.get('/api/test-protected', authMiddleware, (req, res) => {
  res.status(200).json({
    message: 'Protected route accessed',
    user: req.user,
  });
});

app.get('/api/test-student', authMiddleware, roleMiddleware('student'), (req, res) => {
  res.status(200).json({ message: 'Student route accessed', user: req.user });
});

app.get('/api/test-teacher', authMiddleware, roleMiddleware('teacher'), (req, res) => {
  res.status(200).json({ message: 'Teacher route accessed', user: req.user });
});

app.get('/api/test-admin', authMiddleware, roleMiddleware('admin'), (req, res) => {
  res.status(200).json({ message: 'Admin route accessed', user: req.user });
});

app.get('/api/test-teacher-or-admin', authMiddleware, roleMiddleware('teacher', 'admin'), (req, res) => {
  res.status(200).json({ message: 'Teacher or admin route accessed', user: req.user });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/lost-found', lostFoundRoutes);

app.use('/api/test-posts', testPostRoutes);

app.use('/api/events', eventRoutes);

app.use('/api/canteen', canteenRoutes);

app.use('/api/timetable', timetableRoutes);


app.use('/api/announcements', announcementRoutes);

app.use('/api/attendance', attendanceRoutes);

app.use('/api/campus-help', helpRoutes);

app.use('/api/resources', resourceRoutes);

app.use('/api/timetable', timetableRoutes);


app.use('/api/modules', moduleRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/classroom-requests', classroomRequestRoutes);
app.use('/api/volunteer-records', volunteerRecordRoutes);

app.use('/api/volunteer-opportunities', require('./routes/volunteerOpportunity.routes'));

app.use('/api/admin/users', adminUsersRoutes);


connectDB();

app.listen(3000,() => {
    console.log("Server is running on port 3000");
});

