const pool = require('../config/db');

async function getFloors(req, res) {
  try {
    const floors = await pool.query('SELECT * FROM floors ORDER BY id');
    const tables = await pool.query('SELECT * FROM tables ORDER BY id');

    const floorsWithTables = floors.rows.map((floor) => ({
      ...floor,
      tables: tables.rows.filter((t) => t.floor_id === floor.id),
    }));

    res.json(floorsWithTables);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching floors' });
  }
}

async function createFloor(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  try {
    const result = await pool.query(
      'INSERT INTO floors (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating floor' });
  }
}

async function updateFloor(req, res) {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const result = await pool.query(
      'UPDATE floors SET name=$1 WHERE id=$2 RETURNING *',
      [name, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Floor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating floor' });
  }
}

async function deleteFloor(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM floors WHERE id = $1', [id]);
    res.json({ message: 'Floor deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting floor' });
  }
}

module.exports = { getFloors, createFloor, updateFloor, deleteFloor };