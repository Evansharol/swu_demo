const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Clear existing users
        await User.deleteMany();

        // Add Admin
        await User.create({
            name: 'Super Admin',
            email: 'admin@stillwithyou.com',
            password: 'admin123',
            role: 'admin'
        });

        // Add some mock users
        await User.create([
            {
                name: 'Evan',
                email: 'evan@gmail.com',
                password: 'pass123',
                role: 'user'
            },
            {
                name: 'Sara',
                email: 'sara@example.com',
                password: 'pass123',
                role: 'user'
            }
        ]);

        console.log('Data Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
