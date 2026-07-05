const pool = require('../config/db');

async function createTable(req, res) {
  const { floor_id, table_number, seats, is_active, appointment_resource } = req.body;

  if (!floor_id || !table_number) {
    return res.status(400).json({ message: 'floor_id and table_number are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tables (floor_id, table_number, seats, is_active, appointment_resource)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [floor_id, table_number, seats || 4, is_active ?? true, appointment_resource || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating table' });
  }
}

async function updateTable(req, res) {
  const { id } = req.params;
  const { table_number, seats, is_active, appointment_resource } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tables SET table_number=$1, seats=$2, is_active=$3, appointment_resource=$4
       WHERE id=$5 RETURNING *`,
      [table_number, seats, is_active, appointment_resource, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Table not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating table' });
  }
}

async function deleteTable(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tables WHERE id = $1', [id]);
    res.json({ message: 'Table deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting table' });
  }
}

module.exports = { createTable, updateTable, deleteTable };