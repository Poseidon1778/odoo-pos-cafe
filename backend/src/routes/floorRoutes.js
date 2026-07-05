const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const { getFloors, createFloor, updateFloor, deleteFloor } = require('../controllers/floorController');

router.get('/', authMiddleware, getFloors);
router.post('/', authMiddleware, adminOnly, createFloor);
router.put('/:id', authMiddleware, adminOnly, updateFloor);
router.delete('/:id', authMiddleware, adminOnly, deleteFloor);

module.exports = router;