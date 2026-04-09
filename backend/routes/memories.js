const express = require('express');
const { getMemories, createMemory, deleteMemory } = require('../controllers/memoryController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getMemories)
    .post(createMemory);

router.route('/:id')
    .delete(deleteMemory);

module.exports = router;
