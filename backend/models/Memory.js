const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['message', 'media'],
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a title']
    },
    content: {
        type: String,
        required: [true, 'Please add content']
    },
    occasion: {
        type: String,
        default: ''
    },
    date: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['scheduled', 'delivered'],
        default: 'scheduled'
    },
    reminderSent: {
        type: Boolean,
        default: false
    },
    recipient: {
        name: String,
        email: String,
        phone: String,
        closePersonNumber: String,
        address: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Memory', memorySchema);
