const cron = require('node-cron');
const Memory = require('../models/Memory');
const { checkAndSendReminders } = require('./reminderService');

/**
 * Initializes the background scheduler.
 */
const initScheduler = () => {
    console.log('[SCHEDULER] Initializing background tasks...');

    // Runs every day at 8:00 AM (0 8 * * *)
    // For development/demo, we can also run it every hour or on boot
    cron.schedule('* * * * *', async () => {
        console.log('[SCHEDULER] Running minute-by-minute check...');
        await processDailyDeliveries();
        await checkAndSendReminders();
    });

    // Run once on startup to ensure nothing was missed
    processDailyDeliveries();
};

/**
 * Processes memories scheduled for today.
 */
const processDailyDeliveries = async () => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        console.log(`[fulfillment] checking for deliveries on ${todayStr}...`);

        const memoriesToDeliver = await Memory.find({
            date: todayStr,
            status: 'scheduled'
        });

        if (memoriesToDeliver.length === 0) {
            console.log('[fulfillment] No memories to deliver today.');
            return;
        }

        for (const memory of memoriesToDeliver) {
            console.log(`[fulfillment] Delivering memory: ${memory.title} to ${memory.recipient.email}`);
            
            // Logic to actually send the email/WhatsApp would go here
            // For now, we update the status to delivered
            memory.status = 'delivered';
            await memory.save();

            // Notify recipient here (similar to reminder logic)
        }
    } catch (error) {
        console.error('[SCHEDULER ERROR]', error);
    }
};

module.exports = initScheduler;
