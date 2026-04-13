const Memory = require('../models/Memory');
const User = require('../models/User');
const Surprise = require('../models/Surprise');
const nodemailer = require('nodemailer');

/**
 * Checks for memories and surprises scheduled for tomorrow and sends a reminder to the user.
 */
exports.checkAndSendReminders = async () => {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        console.log(`[REMINDER SERVICE] Checking for events on ${tomorrowStr}...`);

        // 1. Check Memories
        const memories = await Memory.find({ 
            date: tomorrowStr, 
            status: 'scheduled',
            reminderSent: false
        }).populate('userId');

        // 2. Check Surprises (Gifts)
        const surprises = await Surprise.find({
            scheduledDate: tomorrowStr,
            status: 'upcoming',
            reminderSent: false
        }).populate('userId');

        if (memories.length === 0 && surprises.length === 0) {
            return;
        }

        // Send memory reminders
        for (const memory of memories) {
            const user = memory.userId;
            if (user && user.email) {
                console.log(`[REMINDER SERVICE] Sending memory reminder to ${user.email}`);
                const sent = await sendReminderEmail(user, {
                    type: 'Memory Block',
                    title: memory.title,
                    recipient: memory.recipient.name,
                    occasion: memory.occasion || 'Special Moment'
                });
                
                if (sent) {
                    memory.reminderSent = true;
                    await memory.save();
                }
            }
        }

        // Send surprise reminders
        for (const surprise of surprises) {
            const user = surprise.userId;
            if (user && user.email) {
                console.log(`[REMINDER SERVICE] Sending surprise reminder to ${user.email}`);
                const sent = await sendReminderEmail(user, {
                    type: 'Surprise Gift',
                    title: surprise.giftType,
                    recipient: surprise.recipientName,
                    occasion: surprise.occasion || 'Special Day'
                });

                if (sent) {
                    surprise.reminderSent = true;
                    await surprise.save();
                }
            }
        }
    } catch (error) {
        console.error('[REMINDER SERVICE ERROR]', error);
    }
};

const sendReminderEmail = async (user, eventData) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('[REMINDER SERVICE] Email config missing, skipping email send.');
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const mailOptions = {
        from: `"Still With You" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Reminder: Tomorrow is ${eventData.recipient}'s ${eventData.occasion}!`,
        html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 12px; background: #fff;">
                <h2 style="color: #5aaa38; margin-top: 0;">✨ Tomorrow is a Special Day!</h2>
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>This is a gentle reminder that tomorrow is <strong>${eventData.recipient}'s ${eventData.occasion}</strong>.</p>
                
                <div style="background-color: #f0f7ed; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #5aaa38;">
                    <p style="margin: 0; font-size: 1.1rem;"><strong>Event:</strong> ${eventData.occasion}</p>
                    <p style="margin: 8px 0 0 0;"><strong>For:</strong> ${eventData.recipient}</p>
                    <p style="margin: 8px 0 0 0;"><strong>Package:</strong> ${eventData.title}</p>
                </div>

                <p>We've already started the fulfillment process to ensure a beautiful delivery of your ${eventData.type.toLowerCase()}.</p>
                <p style="color: #666; font-size: 0.9rem; font-style: italic;">No action is required from your side. We just wanted to let you know everything is on track.</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
                <p style="font-size: 0.8rem; color: #999; text-align: center;">With care,<br/>The Still With You Team</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (err) {
        console.error(`[REMINDER SERVICE] Send error:`, err.message);
        return false;
    }
};
