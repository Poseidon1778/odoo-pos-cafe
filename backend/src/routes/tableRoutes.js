const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const { createTable, updateTable, deleteTable } = require('../controllers/tableController');

router.post('/', authMiddleware, adminOnly, createTable);
router.put('/:id', authMiddleware, adminOnly, updateTable);
router.delete('/:id', authMiddleware, adminOnly, deleteTable);

module.exports = router;