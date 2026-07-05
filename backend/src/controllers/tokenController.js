const pool = require('../config/db');
const crypto = require('crypto');

// Generate a self-order token linked to a table/session
async function generateToken(req, res) {
  const { table_id, session_id } = req.body;

  if (!table_id || !session_id) {
    return res.status(400).json({ message: 'table_id and session_id are required' });
  }

  try {
    const token = crypto.randomBytes(8).toString('hex');
    const expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    const result = await pool.query(
      `INSERT INTO self_order_tokens (table_id, session_id, token, expires_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [table_id, session_id, token, expires_at]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating token' });
  }
}

// Validate a token (used by self-ordering flow, no auth needed)
async function validateToken(req, res) {
  const { token } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM self_order_tokens WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invalid or expired token' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error validating token' });
  }
}

module.exports = { generateToken, validateToken };