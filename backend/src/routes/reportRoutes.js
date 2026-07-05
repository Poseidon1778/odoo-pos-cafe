const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const { getSalesReport, getDashboardSummary } = require('../controllers/reportController');

router.get('/sales', authMiddleware, adminOnly, getSalesReport);
router.get('/dashboard', authMiddleware, adminOnly, getDashboardSummary);

module.exports = router;