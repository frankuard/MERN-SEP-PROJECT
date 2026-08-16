require("dotenv").config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const {notFound, errorHandler} = require("./middleware/errorHandler");

// ROUTE IMPORTS

const uploadRoutes = require('./routes/upload.routes')
const authRoutes = require('./routes/auth.routes');
const authMiddleware = require('./middleware/authMiddleware');


const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req,res) => {
    res.json({message: 'Chautari API is running'})
});

// auth middleware part
app.get('/api/test-protected', authMiddleware, (req, res) => {
  res.status(200).json({
    message: 'Protected route accessed',
    user: req.user,
  });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);


connectDB();

app.listen(3000,() => {
    console.log("Server is running on port 3000");
});

