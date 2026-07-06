const pool = require('../config/db');

// Generate a simple order number
function generateOrderNumber() {
  return 'ORD-' + Date.now();
}

// CREATE order with items (from POS or self-order)
async function createOrder(req, res) {
  const { table_id, session_id, order_type, items } = req.body;
  // items: [{ product_id, variant_id, quantity, price }]

  if (!session_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'session_id and items are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const total_amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order_number = generateOrderNumber();

    const orderResult = await client.query(
      `INSERT INTO orders (table_id, session_id, order_number, order_type, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [table_id || null, session_id, order_number, order_type || 'pos', total_amount]
    );

    const order = orderResult.rows[0];
    const insertedItems = [];

    for (const item of items) {
      const itemResult = await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, quantity, price, kitchen_status)
         VALUES ($1, $2, $3, $4, $5, 'to_cook') RETURNING *`,
        [order.id, item.product_id, item.variant_id || null, item.quantity, item.price]
      );
      insertedItems.push(itemResult.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ ...order, items: insertedItems });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Error creating order' });
  } finally {
    client.release();
  }
}

// GET all orders (with items)
async function getOrders(req, res) {
  try {
    const orders = await pool.query(`
      SELECT o.*, t.table_number
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      ORDER BY o.created_at DESC
    `);

    const items = await pool.query(`
      SELECT oi.*, p.name AS product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
    `);

    const ordersWithItems = orders.rows.map((order) => ({
      ...order,
      items: items.rows.filter((i) => i.order_id === order.id),
    }));

    res.json(ordersWithItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching orders' });
  }
}

// GET single order
async function getOrderById(req, res) {
  const { id } = req.params;
  try {
    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (order.rows.length === 0) return res.status(404).json({ message: 'Order not found' });

    const items = await pool.query(`
      SELECT oi.*, p.name AS product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [id]);

    res.json({ ...order.rows[0], items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching order' });
  }
}

// GET orders for Kitchen Display (only items with kitchen-enabled categories)
async function getKitchenOrders(req, res) {
  try {
    const result = await pool.query(`
      SELECT oi.id AS item_id, oi.order_id, oi.quantity, oi.kitchen_status,
             p.name AS product_name, o.order_number, o.created_at
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE c.send_to_kitchen = true AND oi.kitchen_status != 'completed'
      ORDER BY o.created_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching kitchen orders' });
  }
}

// UPDATE order item kitchen status (to_cook -> preparing -> completed)
async function updateItemKitchenStatus(req, res) {
  const { itemId } = req.params;
  const { kitchen_status } = req.body;

  const validStatuses = ['to_cook', 'preparing', 'completed'];
  if (!validStatuses.includes(kitchen_status)) {
    return res.status(400).json({ message: 'Invalid kitchen status' });
  }

  try {
    const result = await pool.query(
      `UPDATE order_items SET kitchen_status = $1 WHERE id = $2 RETURNING *`,
      [kitchen_status, itemId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating kitchen status' });
  }
}

// UPDATE order status (e.g., cancel)
async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating order status' });
  }
}
// PUBLIC: Create order via self-ordering token flow (no auth)
async function createSelfOrder(req, res) {
  const { table_id, session_id, items } = req.body;

  if (!session_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'session_id and items are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const total_amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order_number = generateOrderNumber();

    const orderResult = await client.query(
      `INSERT INTO orders (table_id, session_id, order_number, order_type, total_amount, status)
       VALUES ($1, $2, $3, 'self', $4, 'pending') RETURNING *`,
      [table_id || null, session_id, order_number, total_amount]
    );

    const order = orderResult.rows[0];
    const insertedItems = [];

    for (const item of items) {
      const itemResult = await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, quantity, price, kitchen_status)
         VALUES ($1, $2, $3, $4, $5, 'to_cook') RETURNING *`,
        [order.id, item.product_id, item.variant_id || null, item.quantity, item.price]
      );
      insertedItems.push(itemResult.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ ...order, items: insertedItems });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Error creating self order' });
  } finally {
    client.release();
  }
}
// PUBLIC: Get order by id (for customer display, no auth)
async function getPublicOrderById(req, res) {
  return getOrderById(req, res);
}
module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getKitchenOrders,
  updateItemKitchenStatus,
  updateOrderStatus,
  createSelfOrder,
  getPublicOrderById,
};