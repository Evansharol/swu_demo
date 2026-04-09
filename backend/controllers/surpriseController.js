const Surprise = require('../models/Surprise');

// @desc    Get all surprises for current user
// @route   GET /api/surprises
// @access  Private
exports.getSurprises = async (req, res) => {
    try {
        const surprises = await Surprise.find({ userId: req.user.id });
        res.status(200).json({ success: true, data: surprises });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new surprise
// @route   POST /api/surprises
// @access  Private
exports.createSurprise = async (req, res) => {
    try {
        req.body.userId = req.user.id;
        const surprise = await Surprise.create(req.body);
        res.status(201).json({ success: true, data: surprise });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
