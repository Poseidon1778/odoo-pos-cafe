const pool = require('../config/db');

async function getPaymentMethods(req, res) {
  try {
    const result = await pool.query('SELECT * FROM payment_methods ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching payment methods' });
  }
}

async function getPublicPaymentMethods(req, res) {
  try {
    const result = await pool.query('SELECT * FROM payment_methods WHERE is_enabled = true ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching payment methods' });
  }
}

async function createPaymentMethod(req, res) {
  const { type, is_enabled, upi_id } = req.body;

  if (!type) return res.status(400).json({ message: 'Type is required' });

  if (type === 'upi' && !upi_id) {
    return res.status(400).json({ message: 'UPI ID is required for UPI payment method' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO payment_methods (type, is_enabled, upi_id) VALUES ($1, $2, $3) RETURNING *`,
      [type, is_enabled ?? true, upi_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating payment method' });
  }
}

async function updatePaymentMethod(req, res) {
  const { id } = req.params;
  const { type, is_enabled, upi_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE payment_methods SET type=$1, is_enabled=$2, upi_id=$3 WHERE id=$4 RETURNING *`,
      [type, is_enabled, upi_id, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Payment method not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating payment method' });
  }
}

async function deletePaymentMethod(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM payment_methods WHERE id = $1', [id]);
    res.json({ message: 'Payment method deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting payment method' });
  }
}

module.exports = {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getPublicPaymentMethods,
};