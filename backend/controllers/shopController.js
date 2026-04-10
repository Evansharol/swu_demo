const User = require('../models/User');
const Surprise = require('../models/Surprise');

// @desc    Find 3 closest shops to a coordinate
// @access  Private (Admin)
exports.findClosestShops = async (req, res) => {
    try {
        const { lng, lat, type } = req.query;
        if (!lng || !lat) {
            return res.status(400).json({ success: false, message: 'Coordinates required' });
        }

        const query = {
            role: 'shop',
            'shopProfile.location': {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    }
                }
            }
        };

        if (type && type !== 'other') {
            query['shopProfile.businessType'] = type;
        }

        const shops = await User.find(query).limit(3);

        res.status(200).json({ success: true, count: shops.length, data: shops });
    } catch (error) {
        console.error('[GEOSPATIAL ERROR]', error);
        res.status(500).json({ success: false, message: error.message, error, stack: error.stack });
    }
};

// @desc    Broadcast order to selected shops
// @access  Private (Admin)
exports.broadcastToShops = async (req, res) => {
    try {
        const { surpriseId, shopIds } = req.body;
        
        // Safety: Filter out any invalid non-ObjectId dummy strings (e.g. 'd1')
        const mongoose = require('mongoose');
        const validShopIds = (shopIds || []).filter(id => mongoose.Types.ObjectId.isValid(id));
        
        if (validShopIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid shop accounts selected.' });
        }

        const surprise = await Surprise.findByIdAndUpdate(
            surpriseId,
            { 
                broadcastingTo: validShopIds,
                adminVerified: true 
            },
            { new: true }
        );
        res.status(200).json({ success: true, data: surprise });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get orders broadcasted to current shop
// @access  Private (Shop)
exports.getBroadcastedOrders = async (req, res) => {
    try {
        const orders = await Surprise.find({
            broadcastingTo: req.user.id,
            assignedShop: { $exists: false }
        });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Accept order (First one wins)
// @access  Private (Shop)
exports.acceptOrder = async (req, res) => {
    try {
        // Find order that hasn't been assigned yet but is in current shop's broadcast
        const order = await Surprise.findOneAndUpdate(
            { 
                _id: req.params.id, 
                broadcastingTo: req.user.id,
                assignedShop: { $exists: false } 
            },
            { 
                assignedShop: req.user.id,
                status: 'ordered' 
            },
            { new: true }
        );

        if (!order) {
            return res.status(400).json({ success: false, message: 'Order already claimed or not found' });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
