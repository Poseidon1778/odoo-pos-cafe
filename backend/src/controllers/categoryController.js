const pool = require('../config/db');

async function getCategories(req, res) {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching categories' });
  }
}

async function createCategory(req, res) {
  const { name, send_to_kitchen } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  try {
    const result = await pool.query(
      `INSERT INTO categories (name, send_to_kitchen) VALUES ($1, $2) RETURNING *`,
      [name, send_to_kitchen ?? true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating category' });
  }
}

async function updateCategory(req, res) {
  const { id } = req.params;
  const { name, send_to_kitchen } = req.body;

  try {
    const result = await pool.query(
      `UPDATE categories SET name = $1, send_to_kitchen = $2 WHERE id = $3 RETURNING *`,
      [name, send_to_kitchen, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating category' });
  }
}

async function deleteCategory(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting category' });
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };