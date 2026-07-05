const pool = require('../config/db');

// Sales report with filters: period, session, responsible (user), product
async function getSalesReport(req, res) {
  const { from, to, session_id, user_id, product_id } = req.query;

  let query = `
    SELECT o.id AS order_id, o.order_number, o.total_amount, o.status, o.created_at,
           s.id AS session_id, u.name AS responsible,
           oi.product_id, p.name AS product_name, oi.quantity, oi.price
    FROM orders o
    JOIN pos_sessions s ON o.session_id = s.id
    JOIN users u ON s.user_id = u.id
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.status = 'paid'
  `;

  const params = [];
  let idx = 1;

  if (from) {
    query += ` AND o.created_at >= $${idx++}`;
    params.push(from);
  }
  if (to) {
    query += ` AND o.created_at <= $${idx++}`;
    params.push(to);
  }
  if (session_id) {
    query += ` AND s.id = $${idx++}`;
    params.push(session_id);
  }
  if (user_id) {
    query += ` AND u.id = $${idx++}`;
    params.push(user_id);
  }
  if (product_id) {
    query += ` AND p.id = $${idx++}`;
    params.push(product_id);
  }

  query += ' ORDER BY o.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating report' });
  }
}

// Dashboard summary (today's sales, order count, etc.)
async function getDashboardSummary(req, res) {
  try {
    const totalSales = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status = 'paid' AND created_at::date = CURRENT_DATE`
    );
    const orderCount = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE created_at::date = CURRENT_DATE`
    );
    const activeSessions = await pool.query(
      `SELECT COUNT(*) FROM pos_sessions WHERE status = 'open'`
    );
    const topProducts = await pool.query(`
      SELECT p.name, SUM(oi.quantity) AS total_sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'paid'
      GROUP BY p.name
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    res.json({
      today_sales: totalSales.rows[0].total,
      today_orders: orderCount.rows[0].count,
      active_sessions: activeSessions.rows[0].count,
      top_products: topProducts.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching dashboard summary' });
  }
}

module.exports = { getSalesReport, getDashboardSummary };