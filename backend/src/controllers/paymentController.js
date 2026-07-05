const pool = require('../config/db');

// Process a payment for an order
async function createPayment(req, res) {
  const { order_id, payment_method_id, amount } = req.body;

  if (!order_id || !payment_method_id || !amount) {
    return res.status(400).json({ message: 'order_id, payment_method_id, and amount are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const paymentResult = await client.query(
      `INSERT INTO payments (order_id, payment_method_id, amount, status, paid_at)
       VALUES ($1, $2, $3, 'success', NOW()) RETURNING *`,
      [order_id, payment_method_id, amount]
    );

    await client.query(
      `UPDATE orders SET status = 'paid' WHERE id = $1`,
      [order_id]
    );

    await client.query('COMMIT');
    res.status(201).json(paymentResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Error processing payment' });
  } finally {
    client.release();
  }
}

// Get payment status for an order (for Customer Display)
async function getPaymentByOrder(req, res) {
  const { orderId } = req.params;
  try {
    const order = await pool.query('SELECT status, total_amount FROM orders WHERE id = $1', [orderId]);
    const payment = await pool.query(
      `SELECT p.*, pm.type AS payment_type
       FROM payments p
       JOIN payment_methods pm ON p.payment_method_id = pm.id
       WHERE p.order_id = $1 ORDER BY p.id DESC LIMIT 1`,
      [orderId]
    );

    if (order.rows.length === 0) return res.status(404).json({ message: 'Order not found' });

    res.json({
      order_status: order.rows[0].status,
      total_amount: order.rows[0].total_amount,
      payment: payment.rows[0] || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching payment' });
  }
}

module.exports = { createPayment, getPaymentByOrder };