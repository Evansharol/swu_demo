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
        const { surpriseId, shopIds, shopNames } = req.body;
        const mongoose = require('mongoose');
        
        // 1. Filter out any valid MongoDB ObjectIds
        let validShopIds = (shopIds || []).filter(id => mongoose.Types.ObjectId.isValid(id));
        
        // 2. ALWAYS try to match by name as well (in case of dummy IDs or out-of-sync markers)
        if (shopNames && shopNames.length > 0) {
            const matchedShops = await User.find({
                role: 'shop',
                $or: [
                    { name: { $in: shopNames } },
                    { 'shopProfile.businessName': { $in: shopNames } }
                ]
            }).select('_id');
            const matchedIds = matchedShops.map(s => s._id.toString());
            // Add any newly matched IDs that weren't already in validShopIds
            validShopIds = [...new Set([...validShopIds.map(id => id.toString()), ...matchedIds])];
        }
        
        // 3. Last resort fallback: if still empty, grab all shops (to ensure demo works)
        if (validShopIds.length === 0) {
            const allShops = await User.find({ role: 'shop' }).select('_id');
            validShopIds = allShops.map(s => s._id);
        }

        if (validShopIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No shop partner accounts found in the database. Please ensure at least one shop has logged in.' });
        }

        const surprise = await Surprise.findByIdAndUpdate(
            surpriseId,
            { 
                broadcastingTo: validShopIds,
                adminVerified: true 
            },
            { new: true }
        );
        console.log(`[BROADCAST] Surprise ${surpriseId} broadcasted to ${validShopIds.length} shops:`, validShopIds);
        res.status(200).json({ success: true, data: surprise, shopCount: validShopIds.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get orders broadcasted to current shop
// @access  Private (Shop)
exports.getBroadcastedOrders = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const shopId = new mongoose.Types.ObjectId(req.user.id);
        
        // Find orders where this shop is in the broadcast list AND not yet assigned
        const orders = await Surprise.find({
            broadcastingTo: { $in: [shopId] },
            $or: [
                { assignedShop: { $exists: false } },
                { assignedShop: null }
            ]
        }).sort('-createdAt');
        
        console.log(`[SHOP INBOX] Found ${orders.length} incoming orders for shop ${req.user.id}`);
        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        console.error('[getBroadcastedOrders ERROR]', error);
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

// @desc    Decline order (Remove from broadcast list)
// @access  Private (Shop)
exports.declineOrder = async (req, res) => {
    try {
        await Surprise.findByIdAndUpdate(
            req.params.id,
            { $pull: { broadcastingTo: req.user.id } }
        );
        res.status(200).json({ success: true, message: 'Order declined.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
