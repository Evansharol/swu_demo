const express = require('express');
const { register, login, getMe, updateMe, saveFaceDescriptor, getFaceDescriptorByEmail, sendOtp, verifyOtp } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/save-face', protect, saveFaceDescriptor);
router.post('/face-descriptor', getFaceDescriptorByEmail);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

module.exports = router;
