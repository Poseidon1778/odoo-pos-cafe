const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} = require('../controllers/paymentMethodController');

router.get('/', authMiddleware, getPaymentMethods);
router.post('/', authMiddleware, adminOnly, createPaymentMethod);
router.put('/:id', authMiddleware, adminOnly, updatePaymentMethod);
router.delete('/:id', authMiddleware, adminOnly, deletePaymentMethod);

module.exports = router;