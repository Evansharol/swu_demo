const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
const auth = require('./routes/auth');
const users = require('./routes/users');
const memories = require('./routes/memories');
const surprises = require('./routes/surprises');

const app = express();

// Body parser
app.use(express.json());

// Manual CORS Headers (Force)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Global request logger for debugging 404s
app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.url}`);
    next();
});

// Logging middleware
app.use(morgan('dev'));

// Test route
app.get('/api/test', (req, res) => res.json({ message: 'Backend is reachable' }));

// Mount routers
app.use('/api/auth', auth);
app.use('/api/users', users);
app.use('/api/memories', memories);
app.use('/api/surprises', surprises);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// 404 Handler
app.use((req, res) => {
    console.log(`[404 ERROR] Route Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ success: false, message: `Route ${req.url} not found on this server` });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
