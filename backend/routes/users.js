const express = require('express');
const { getUsers, getLogs, updateUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getUsers);
router.get('/logs', getLogs);
router.put('/:id', updateUser);

module.exports = router;
