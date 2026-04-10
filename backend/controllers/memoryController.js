const Memory = require('../models/Memory');

// @desc    Get all memories for current user
// @route   GET /api/memories
// @access  Private
exports.getMemories = async (req, res) => {
    try {
        console.log(`[DEBUG] Fetching memories for User ID: ${req.user ? req.user.id : 'undefined'}`);
        if (!req.user) {
            console.error('[ERROR] req.user is undefined in a protected route!');
            return res.status(401).json({ success: false, message: 'User not found in request' });
        }
        const memories = await Memory.find({ userId: req.user.id });
        res.status(200).json({ success: true, data: memories });
    } catch (error) {
        console.error('[MEMORY CONTROLLER ERROR]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new memory
// @route   POST /api/memories
// @access  Private
exports.createMemory = async (req, res) => {
    try {
        req.body.userId = req.user.id;
        const memory = await Memory.create(req.body);
        res.status(201).json({ success: true, data: memory });
    } catch (error) {
        console.error('[MEMORY CONTROLLER ERROR]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete memory
// @route   DELETE /api/memories/:id
// @access  Private
exports.deleteMemory = async (req, res) => {
    try {
        const memory = await Memory.findById(req.params.id);
        if (!memory) {
            return res.status(404).json({ success: false, message: 'Memory not found' });
        }
        if (memory.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        await memory.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        console.error('[MEMORY CONTROLLER ERROR]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
