const pool = require('../config/db');

// Open a new session
async function openSession(req, res) {
  const { opening_amount } = req.body;
  const user_id = req.user.id;

  try {
    // Check if user already has an open session
    const existing = await pool.query(
      `SELECT * FROM pos_sessions WHERE user_id = $1 AND status = 'open'`,
      [user_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'You already have an open session', session: existing.rows[0] });
    }

    const result = await pool.query(
      `INSERT INTO pos_sessions (user_id, opening_amount, status)
       VALUES ($1, $2, 'open') RETURNING *`,
      [user_id, opening_amount || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error opening session' });
  }
}

// Close a session
async function closeSession(req, res) {
  const { id } = req.params;
  const { closing_amount } = req.body;

  try {
    const result = await pool.query(
      `UPDATE pos_sessions
       SET status = 'closed', closed_at = NOW(), closing_amount = $1
       WHERE id = $2 AND status = 'open' RETURNING *`,
      [closing_amount || 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Open session not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error closing session' });
  }
}

// Get current open session for logged-in user
async function getCurrentSession(req, res) {
  const user_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT * FROM pos_sessions WHERE user_id = $1 AND status = 'open'`,
      [user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No open session' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching session' });
  }
}

// Get all sessions (for reporting)
async function getAllSessions(req, res) {
  try {
    const result = await pool.query(`
      SELECT s.*, u.name AS user_name
      FROM pos_sessions s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.opened_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching sessions' });
  }
}

module.exports = { openSession, closeSession, getCurrentSession, getAllSessions };