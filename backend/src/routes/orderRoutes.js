const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  createOrder,
  getOrders,
  getOrderById,
  getKitchenOrders,
  updateItemKitchenStatus,
  updateOrderStatus,
} = require('../controllers/orderController');

router.post('/', authMiddleware, createOrder);
router.get('/', authMiddleware, getOrders);
router.get('/kitchen', authMiddleware, getKitchenOrders);
router.get('/:id', authMiddleware, getOrderById);
router.put('/:id/status', authMiddleware, updateOrderStatus);
router.put('/items/:itemId/kitchen-status', authMiddleware, updateItemKitchenStatus);

module.exports = router;