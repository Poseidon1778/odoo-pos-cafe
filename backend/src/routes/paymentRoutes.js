const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { createPayment, getPaymentByOrder } = require('../controllers/paymentController');

router.post('/', authMiddleware, createPayment);
router.get('/order/:orderId', authMiddleware, getPaymentByOrder);
router.get('/public/order/:orderId', getPaymentByOrder);

module.exports = router;