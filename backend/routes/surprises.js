const express = require('express');
const { getSurprises, createSurprise } = require('../controllers/surpriseController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getSurprises)
    .post(createSurprise);

module.exports = router;
