const mongoose = require('mongoose');

const surpriseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    recipientName: {
        type: String,
        required: true
    },
    giftType: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['flowers', 'chocolate', 'cakes', 'other'],
        default: 'other'
    },
    partner: {
        type: String,
        default: ''
    },
    scheduledDate: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['upcoming', 'ordered', 'shipped', 'delivered'],
        default: 'upcoming'
    },
    image: {
        type: String,
        default: ''
    },
    deliveryAddress: {
        type: String,
        default: ''
    },
    deliveryLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        }
    },
    broadcastingTo: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    assignedShop: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    adminVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Surprise', surpriseSchema);
