const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load models
const User = require('../models/User');
const Surprise = require('../models/Surprise');

dotenv.config();

const checkStatus = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const shops = await User.find({ role: 'shop' }).select('_id name email shopProfile.businessName shopProfile.businessType');
        console.log('\n--- SHOPS IN DB ---');
        shops.forEach(s => {
            console.log(`ID: ${s._id} | Name: ${s.name} | Biz: ${s.shopProfile?.businessName} | Type: ${s.shopProfile?.businessType}`);
        });

        const surprises = await Surprise.find({}).populate('userId', 'name');
        console.log('\n--- SURPRISES & BROADCASTS ---');
        surprises.forEach(s => {
            console.log(`ID: ${s._id} | For: ${s.recipientName} | Broad To: ${JSON.stringify(s.broadcastingTo)} | Assigned: ${s.assignedShop}`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkStatus();
