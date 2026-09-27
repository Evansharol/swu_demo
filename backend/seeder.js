const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Surprise = require('./models/Surprise');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Clear existing data
        await User.deleteMany();
        await Surprise.deleteMany();

        // Add Admin
        await User.create({
            name: 'Super Admin',
            email: 'admin@stillwithyou.com',
            password: 'admin123',
            role: 'admin'
        });

        // Add Mock Users
        const users = [
            { name: 'Evan Sharol', email: 'evan@gmail.com', password: 'pass123', role: 'user' },
            { name: 'Dr. Alok Sharma', email: 'alok.sharma@health.in', password: 'pass123', role: 'user' },
            { name: 'Priya Mukherjee', email: 'priya05@artstudio.com', password: 'pass123', role: 'user' },
            { name: 'Capt. Vikram Singh', email: 'vikram.navy@mil.gov', password: 'pass123', role: 'user' }
        ];

        const createdUsers = [];
        for (const u of users) {
          const newUser = await User.create(u);
          createdUsers.push(newUser);
        }

        // 12 Managed Shops for testing Smart Matching
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

        // Just 3 clean surprises for Alok, Priya, Vikram
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

        console.log('Seeding Done: 3 Surprises with Smart Categories.');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
