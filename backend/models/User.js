const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'shop'],
        default: 'user'
    },
    shopProfile: {
        businessName: { type: String, default: '' },
        address: { type: String, default: '' },
        location: {
            type: {
                type: String,
                enum: ['Point']
            },
            coordinates: {
                type: [Number]  // [longitude, latitude]
            }
        },
        isActive: { type: Boolean, default: true }
    },
    phone: {
        type: String,
        default: ''
    },
    whatsApp: {
        type: String,
        default: ''
    },
    reason: {
        type: String,
        default: ''
    },
    visitFrequency: {
        type: Number,
        default: null
    },
    emergencyContact: {
        name: String,
        phone: String,
        relation: String
    },
    identityVerified: {
        type: Boolean,
        default: false
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    phoneVerified: {
        type: Boolean,
        default: false
    },
    lastVisit: {
        type: Date,
        default: Date.now
    },
    deliveryStatus: {
        type: String,
        enum: ['active', 'monitoring', 'notifying', 'delivered'],
        default: 'active'
    },
    notificationStage: {
        type: Number,
        default: 0
    },
    faceDescriptor: {
        type: [Number],  // 128-float array from face-api.js
        default: []
    },
    selectedPackage: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for hyper-local shop matching
userSchema.index({ 'shopProfile.location': '2dsphere' });

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
