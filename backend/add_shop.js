const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createShop = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'shop@stillwithyou.com';
        const existing = await User.findOne({ email });

        if (existing) {
            console.log('Update existing shop user...');
            existing.password = 'shop123';
            existing.role = 'shop';
            existing.shopProfile = {
                businessName: 'Still With You - Prime Florist',
                address: '123 Memorial Way, Heritage Heights',
                isActive: true
            };
            await existing.save();
            console.log('Shop user updated successfully.');
        } else {
            console.log('Creating new shop user...');
            await User.create({
                name: 'Main Shop Partner',
                email,
                password: 'shop123',
                role: 'shop',
                identityVerified: true,
                emailVerified: true,
                shopProfile: {
                    businessName: 'Still With You - Prime Florist',
                    address: '123 Memorial Way, Heritage Heights',
                    isActive: true
                }
            });
            console.log('Shop user created successfully.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

createShop();
