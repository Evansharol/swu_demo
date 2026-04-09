const nodemailer = require('nodemailer');

// In-memory OTP store: { email -> { otp, expiresAt } }
const otpStore = new Map();

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // App Password (not your real password)
        },
    });
};

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * Send an OTP to the given email address.
 * Returns the OTP (for dev logging) and stores it in memory for 10 minutes.
 */
const sendOTPEmail = async (email, name = 'there') => {
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email, { otp, expiresAt });

    const transporter = createTransporter();

    const mailOptions = {
        from: `"Still With You" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🌿 Your Still With You Verification Code',
        html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fdf5; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 24px rgba(42,82,32,0.10);">
            <div style="background: linear-gradient(135deg, #5aaa38, #2f8b24); padding: 36px 32px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 1.8rem; font-weight: 700; letter-spacing: 0.02em;">Still <em>With You</em></h1>
                <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 0.95rem;">Your Living Memorial</p>
            </div>
            <div style="padding: 36px 32px; text-align: center;">
                <p style="color: #2a4020; font-size: 1.05rem; margin: 0 0 24px;">Hi <strong>${name}</strong>, here is your verification code:</p>
                <div style="background: #fff; border: 2px solid #c0e0a0; border-radius: 14px; padding: 24px; margin: 0 auto 24px; display: inline-block;">
                    <span style="font-size: 2.6rem; letter-spacing: 10px; font-weight: 800; color: #2a5220; font-family: monospace;">${otp}</span>
                </div>
                <p style="color: #5a7a50; font-size: 0.88rem; margin: 0 0 8px;">This code expires in <strong>10 minutes</strong>.</p>
                <p style="color: #8a9a80; font-size: 0.8rem; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
            </div>
            <div style="background: #e8f5d0; padding: 16px 32px; text-align: center;">
                <p style="color: #3a6030; font-size: 0.78rem; margin: 0;">Still With You — Preserving memories, honoring legacies.</p>
            </div>
        </div>
        `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[OTP] Sent to ${email}: ${otp}`); // Only for dev visibility
    return otp;
};

/**
 * Verify the OTP entered by the user.
 */
const verifyOTP = (email, enteredOtp) => {
    const record = otpStore.get(email);
    if (!record) return { valid: false, message: 'No OTP found. Please request a new one.' };
    if (Date.now() > record.expiresAt) {
        otpStore.delete(email);
        return { valid: false, message: 'OTP has expired. Please request a new one.' };
    }
    if (record.otp !== enteredOtp) {
        return { valid: false, message: 'Invalid OTP. Please try again.' };
    }
    otpStore.delete(email); // One-time use
    return { valid: true };
};

module.exports = { sendOTPEmail, verifyOTP };
