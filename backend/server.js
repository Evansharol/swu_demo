const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db');
const initScheduler = require('./utils/scheduler');

// Load env vars
dotenv.config();

// Connect to database
connectDB().then(() => {
    const User = require('./models/User');
    User.syncIndexes().then(() => {
        console.log('✅ Geospatial indexes synchronized');
    }).catch(err => {
        console.error('❌ Index sync error:', err);
    });
});
const mongoose = require('mongoose');
mongoose.set('debug', true);

// Route files
const auth = require('./routes/auth');
const users = require('./routes/users');
const memories = require('./routes/memories');
const surprises = require('./routes/surprises');
const shops = require('./routes/shops');

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

// Server Instance ID (Change on every restart)
const SERVER_INSTANCE_ID = Date.now().toString();

// Test route
app.get('/api/test', (req, res) => res.json({ 
    message: 'Backend is reachable', 
    instanceId: SERVER_INSTANCE_ID 
}));

// Quick Seed Endpoint (initializes demo users, admin, shops, surprises)
app.get('/api/seed', async (req, res) => {
    try {
        const User = require('./models/User');
        const Surprise = require('./models/Surprise');
        const count = await User.countDocuments();
        if (count > 0 && req.query.force !== 'true') {
            return res.json({ success: true, message: `Database already has ${count} users. Call /api/seed?force=true to reset.` });
        }
        await User.deleteMany();
        await Surprise.deleteMany();

        await User.create({
            name: 'Super Admin',
            email: 'admin@stillwithyou.com',
            password: 'admin123',
            role: 'admin'
        });

        const users = [
            { name: 'Evan Sharol', email: 'evan@gmail.com', password: 'pass123', role: 'user' },
            { name: 'Dr. Alok Sharma', email: 'alok.sharma@health.in', password: 'pass123', role: 'user' },
            { name: 'Priya Mukherjee', email: 'priya05@artstudio.com', password: 'pass123', role: 'user' },
            { name: 'Capt. Vikram Singh', email: 'vikram.navy@mil.gov', password: 'pass123', role: 'user' }
        ];
        const createdUsers = [];
        for (const u of users) {
            createdUsers.push(await User.create(u));
        }

        const shops = [
            { name: 'Rose Petal', email: 's1@swu.com', shopProfile: { businessName: 'Rose Petal Florist', address: 'RS Puram', location: {type:'Point', coordinates:[76.945, 11.006]}, businessType: 'flowers'} },
            { name: 'Choco Delights', email: 's2@swu.com', shopProfile: { businessName: 'Choco Delights', address: 'Race Course', location: {type:'Point', coordinates:[76.974, 11.001]}, businessType: 'chocolate'} },
            { name: 'Cakes & Co', email: 's3@swu.com', shopProfile: { businessName: 'Cakes & Co', address: 'Avinashi Rd', location: {type:'Point', coordinates:[76.992, 11.021]}, businessType: 'cakes'} },
            { name: 'Bloom Boutique', email: 's4@swu.com', shopProfile: { businessName: 'Bloom Boutique', address: 'Saibaba Colony', location: {type:'Point', coordinates:[76.942, 11.034]}, businessType: 'flowers'} },
            { name: 'Cocoa Bean', email: 's5@swu.com', shopProfile: { businessName: 'Cocoa Bean', address: 'Gandhipuram', location: {type:'Point', coordinates:[76.969, 11.018]}, businessType: 'chocolate'} },
            { name: 'Sugar Rush', email: 's6@swu.com', shopProfile: { businessName: 'Sugar Rush Cakes', address: 'Peelamedu', location: {type:'Point', coordinates:[77.012, 11.026]}, businessType: 'cakes'} },
            { name: 'Floral Aura', email: 'shop@stillwithyou.com', shopProfile: { businessName: 'Floral Aura', address: 'Town Hall', location: {type:'Point', coordinates:[76.966, 11.011]}, businessType: 'flowers'} },
            { name: 'Choco Bliss', email: 's8@swu.com', shopProfile: { businessName: 'Choco Bliss', address: 'Vadavalli', location: {type:'Point', coordinates:[76.899, 11.022]}, businessType: 'chocolate'} },
            { name: 'Dream Florals', email: 's9@swu.com', shopProfile: { businessName: 'Dream Florals', address: 'Ganapathy', location: {type:'Point', coordinates:[76.985, 11.041]}, businessType: 'flowers'} },
            { name: 'The Cake Lab', email: 's10@swu.com', shopProfile: { businessName: 'The Cake Lab', address: 'Saravanampatti', location: {type:'Point', coordinates:[77.025, 11.077]}, businessType: 'cakes'} },
            { name: 'Truffle Town', email: 's11@swu.com', shopProfile: { businessName: 'Truffle Town', address: 'Brooks Area', location: {type:'Point', coordinates:[76.958, 11.008]}, businessType: 'chocolate'} },
            { name: 'Eden Flowers', email: 's12@swu.com', shopProfile: { businessName: 'Eden Flowers', address: 'Singanallur', location: {type:'Point', coordinates:[77.021, 10.998]}, businessType: 'flowers'} }
        ];
        for (const s of shops) {
            s.role = 'shop';
            s.password = 'shop123';
            await User.create(s);
        }

        const surprises = [
            {
                userId: createdUsers[0]._id,
                recipientName: 'Kavita Sharma',
                giftType: 'Premium Roses',
                category: 'flowers',
                scheduledDate: '2026-05-12',
                deliveryAddress: 'Town Hall, Coimbatore',
                deliveryLocation: { type: 'Point', coordinates: [76.966, 11.011] },
                status: 'upcoming'
            },
            {
                userId: createdUsers[1]._id,
                recipientName: 'Anil Mukherjee',
                giftType: 'Assorted Chocolates',
                category: 'chocolate',
                scheduledDate: '2026-06-20',
                deliveryAddress: 'RS Puram, Coimbatore',
                deliveryLocation: { type: 'Point', coordinates: [76.945, 11.006] },
                status: 'upcoming'
            },
            {
                userId: createdUsers[2]._id,
                recipientName: 'Rahul Singh',
                giftType: 'Belgian Truffle Cake',
                category: 'cakes',
                scheduledDate: '2026-08-15',
                deliveryAddress: 'Race Course, Coimbatore',
                deliveryLocation: { type: 'Point', coordinates: [76.974, 11.001] },
                status: 'upcoming'
            }
        ];
        await Surprise.create(surprises);

        res.json({ success: true, message: 'Database successfully seeded with demo users, admin, shops, and surprises!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Mount routers
app.use('/api/auth', auth);
app.use('/api/users', users);
app.use('/api/memories', memories);
app.use('/api/surprises', surprises);
app.use('/api/shops', shops);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log('Server address info:', server.address());
    
    // Initialize Scheduler
    initScheduler();
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
