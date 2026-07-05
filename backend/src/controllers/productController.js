const pool = require('../config/db');

// GET all products with their variants
async function getProducts(req, res) {
  try {
    const products = await pool.query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id
    `);

    const variants = await pool.query('SELECT * FROM product_variants');

    const productsWithVariants = products.rows.map((product) => ({
      ...product,
      variants: variants.rows.filter((v) => v.product_id === product.id),
    }));

    res.json(productsWithVariants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching products' });
  }
}

// GET single product
async function getProductById(req, res) {
  const { id } = req.params;
  try {
    const product = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (product.rows.length === 0) return res.status(404).json({ message: 'Product not found' });

    const variants = await pool.query('SELECT * FROM product_variants WHERE product_id = $1', [id]);

    res.json({ ...product.rows[0], variants: variants.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching product' });
  }
}

// CREATE product (+ optional variants array)
async function createProduct(req, res) {
  const { name, category_id, price, unit, tax, description, variants } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: 'Name and price are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (name, category_id, price, unit, tax, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, category_id || null, price, unit || null, tax || 0, description || null]
    );

    const product = result.rows[0];

    let insertedVariants = [];
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        const vResult = await pool.query(
          `INSERT INTO product_variants (product_id, attribute_name, value, extra_price)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [product.id, v.attribute_name, v.value, v.extra_price || 0]
        );
        insertedVariants.push(vResult.rows[0]);
      }
    }

    res.status(201).json({ ...product, variants: insertedVariants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating product' });
  }
}

// UPDATE product
async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, category_id, price, unit, tax, description } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products SET name=$1, category_id=$2, price=$3, unit=$4, tax=$5, description=$6
       WHERE id=$7 RETURNING *`,
      [name, category_id, price, unit, tax, description, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating product' });
  }
}

// DELETE product
async function deleteProduct(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting product' });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};