const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTPEmail, verifyOTP } = require('../utils/emailService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { 
            name, email, password, phone, role, 
            whatsApp, reason, faceDescriptor
        } = req.body;

        const emailNum = email ? email.toLowerCase() : '';
        console.log(`[REGISTER] Attempting to register email: ${emailNum}, Role: ${role}`);

        const userExists = await User.findOne({ email: emailNum });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email: emailNum,
            password,
            phone,
            role: role || 'user',
            whatsApp,
            reason,
            faceDescriptor: faceDescriptor || []
        });

        sendTokenResponse(user, 201, res);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const emailNum = email ? email.toLowerCase() : '';
        console.log(`[LOGIN] Attempting login for email: ${emailNum}`);

        if (!emailNum || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        let user = await User.findOne({ email: emailNum }).select('+password');

        // ─── DEMO ADMIN FALLBACK ───
        if (!user && emailNum === 'admin@stillwithyou.com' && password === 'admin123') {
            console.log('[LOGIN] Creating demo admin user...');
            user = await User.create({
                name: 'System Admin',
                email: 'admin@stillwithyou.com',
                password: 'admin123',
                role: 'admin',
                identityVerified: true,
                emailVerified: true,
            });
            return sendTokenResponse(user, 200, res);
        }

        // ─── DEMO USER FALLBACK ───
        if (!user && emailNum === 'evan@gmail.com' && password === 'pass123') {
            console.log('[LOGIN] Creating demo normal user...');
            user = await User.create({
                name: 'Evan Sharol',
                email: 'evan@gmail.com',
                password: 'pass123',
                role: 'user',
                identityVerified: true,
                emailVerified: true,
            });
            return sendTokenResponse(user, 200, res);
        }

        // ─── DEMO SHOP FALLBACK (CREATE if missing) ───
        if (!user && emailNum === 'shop@stillwithyou.com' && password === 'shop123') {
            console.log('[LOGIN] Creating demo shop user...');
            user = await User.create({
                name: 'Floral Aura',
                email: 'shop@stillwithyou.com',
                password: 'shop123',
                role: 'shop',
                identityVerified: true,
                emailVerified: true,
                shopProfile: {
                    businessName: 'Floral Aura',
                    address: '123 Floral Garden, Coimbatore',
                    businessType: 'flowers',
                    isActive: true
                }
            });
            return sendTokenResponse(user, 200, res);
        }

        // ─── DEMO SHOP PROFILE SYNC (Always update if stale) ───
        // This fixes the case where the shop was already created with an old name
        if (user && emailNum === 'shop@stillwithyou.com' && password === 'shop123') {
            if (user.name !== 'Floral Aura' || user.shopProfile?.businessName !== 'Floral Aura') {
                console.log('[LOGIN] Syncing demo shop profile to Floral Aura...');
                user = await User.findByIdAndUpdate(
                    user._id,
                    {
                        name: 'Floral Aura',
                        'shopProfile.businessName': 'Floral Aura',
                        'shopProfile.address': '123 Floral Garden, Coimbatore',
                        'shopProfile.businessType': 'flowers',
                        'shopProfile.isActive': true
                    },
                    { new: true }
                ).select('+password');
            }
            return sendTokenResponse(user, 200, res);
        }

        if (!user) {
            console.log(`[LOGIN FAILED] No user found for: ${emailNum}`);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);
        console.log(`[LOGIN] Credential check for ${emailNum}: ${isMatch ? 'MATCH' : 'MISMATCH'}`);

        if (!isMatch) {
            // Special case for demo admin: allow if fallback credentials used
            if (
               (emailNum === 'admin@stillwithyou.com' && password === 'admin123') ||
               (emailNum === 'evan@gmail.com' && password === 'pass123')
            ) {
                console.log('[LOGIN] Demo credentials matched via override.');
                return sendTokenResponse(user, 200, res);
            }
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error('[LOGIN ERROR]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update current user profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateMe = async (req, res) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            phone: req.body.phone,
            selectedPackage: req.body.selectedPackage
        };

        // Remove undefined fields
        Object.keys(fieldsToUpdate).forEach(key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]);

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Save face descriptor for a user (called after signup identity verification)
// @route   PUT /api/auth/save-face
// @access  Private
exports.saveFaceDescriptor = async (req, res) => {
    try {
        const { faceDescriptor } = req.body;
        if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
            return res.status(400).json({ success: false, message: 'faceDescriptor array is required' });
        }
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { faceDescriptor },
            { new: true }
        );
        res.status(200).json({ success: true, message: 'Face descriptor saved', data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get stored face descriptor by email (pre-login check)
// @route   POST /api/auth/face-descriptor
// @access  Public
exports.getFaceDescriptorByEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email required' });
        const user = await User.findOne({ email }).select('faceDescriptor');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({
            success: true,
            hasFaceData: user.faceDescriptor && user.faceDescriptor.length > 0,
            faceDescriptor: user.faceDescriptor || []
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            selectedPackage: user.selectedPackage
        }
    });
};

// @desc    Send OTP to email
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOtp = async (req, res) => {
    try {
        const { email, name } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
        await sendOTPEmail(email, name || 'there');
        res.status(200).json({ success: true, message: `OTP sent to ${email}` });
    } catch (error) {
        console.error('[OTP Send Error]', error.message);
        res.status(500).json({ success: false, message: 'Failed to send OTP. Check your email config in .env' });
    }
};

// @desc    Verify OTP entered by user
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    const result = verifyOTP(email, otp);
    if (result.valid) {
        return res.status(200).json({ success: true, message: 'OTP verified successfully' });
    }
    return res.status(400).json({ success: false, message: result.message });
};
