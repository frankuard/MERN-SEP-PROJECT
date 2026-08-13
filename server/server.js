require("dotenv").config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const {notFound, errorHandler} = require("./middleware/errorHandler");

// ROUTE IMPORTS

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const lostFoundRoutes = require('./routes/lostFound.routes');
const uploadRoutes = require('./routes/upload.routes')


const app = express();

app.use(cors());

app.use(express.json());

app.get('/', (req,res) => {
    res.json({message: 'Chautari API is running'})
});


connectDB();

app.listen(3000,() => {
    console.log("Server is running on port 3000");
});

