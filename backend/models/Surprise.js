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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Surprise', surpriseSchema);
