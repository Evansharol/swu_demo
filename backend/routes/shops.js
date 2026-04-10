const express = require('express');
const { 
    findClosestShops, 
    broadcastToShops, 
    getBroadcastedOrders, 
    acceptOrder 
} = require('../controllers/shopController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Admin Routes
router.get('/match', authorize('admin'), findClosestShops);
router.post('/broadcast', authorize('admin'), broadcastToShops);

// Shop Routes
router.get('/my-broadcasting', authorize('shop'), getBroadcastedOrders);
router.put('/accept/:id', authorize('shop'), acceptOrder);

module.exports = router;
