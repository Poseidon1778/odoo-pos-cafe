import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const TABS = ['categories', 'products', 'payment-methods', 'floors'];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('categories');
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', marginTop: 80 }}>
        <p>Admin access required.</p>
        <button onClick={() => navigate('/floor')}>Back to Floor</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>POS Backend Configuration</h2>
        <button onClick={() => navigate('/floor')}>← Back to Floor</button>
      </div>

      <div style={{ display: 'flex', gap: 10, margin: '20px 0' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: activeTab === tab ? '2px solid #4CAF50' : '1px solid #ccc',
              backgroundColor: activeTab === tab ? '#e6f4ea' : '#fff',
              color: '#111',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'products' && <ProductsTab />}
      {activeTab === 'payment-methods' && <PaymentMethodsTab />}
      {activeTab === 'floors' && <FloorsTab />}
    </div>
  );
}

// ---------------- CATEGORIES ----------------
function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [sendToKitchen, setSendToKitchen] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch {
      setError('Failed to load categories');
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!name) return;
    try {
      await api.post('/categories', { name, send_to_kitchen: sendToKitchen });
      setName('');
      setSendToKitchen(true);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category');
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/categories/${id}`);
      load();
    } catch {
      setError('Failed to delete category');
    }
  }

  return (
    <div>
      <h3>Categories</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleCreate} style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8 }}
        />
        <label>
          <input
            type="checkbox"
            checked={sendToKitchen}
            onChange={(e) => setSendToKitchen(e.target.checked)}
          />
          Send to kitchen
        </label>
        <button type="submit">Add Category</button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
            <th>Name</th>
            <th>Send to Kitchen</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{cat.name}</td>
              <td>{cat.send_to_kitchen ? 'Yes' : 'No'}</td>
              <td><button onClick={() => handleDelete(cat.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- PRODUCTS ----------------
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', category_id: '', price: '', unit: '', tax: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [prodRes, catRes] = await Promise.all([api.get('/products'), api.get('/categories')]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch {
      setError('Failed to load products');
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name || !form.price) return;
    try {
      await api.post('/products', {
        ...form,
        category_id: form.category_id || null,
        price: parseFloat(form.price),
        tax: parseFloat(form.tax || 0),
      });
      setForm({ name: '', category_id: '', price: '', unit: '', tax: '', description: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product');
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/products/${id}`);
      load();
    } catch {
      setError('Failed to delete product');
    }
  }

  return (
    <div>
      <h3>Products</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleCreate} style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} style={{ padding: 8 }} />
        <select name="category_id" value={form.category_id} onChange={handleChange} style={{ padding: 8 }}>
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} style={{ padding: 8, width: 90 }} />
        <input name="unit" placeholder="Unit" value={form.unit} onChange={handleChange} style={{ padding: 8, width: 80 }} />
        <input name="tax" type="number" placeholder="Tax %" value={form.tax} onChange={handleChange} style={{ padding: 8, width: 80 }} />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} style={{ padding: 8 }} />
        <button type="submit">Add Product</button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Tax</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{p.name}</td>
              <td>{p.category_name || '-'}</td>
              <td>₹{p.price}</td>
              <td>{p.tax}%</td>
              <td><button onClick={() => handleDelete(p.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- PAYMENT METHODS ----------------
function PaymentMethodsTab() {
  const [methods, setMethods] = useState([]);
  const [type, setType] = useState('cash');
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await api.get('/payment-methods');
      setMethods(res.data);
    } catch {
      setError('Failed to load payment methods');
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.post('/payment-methods', {
        type,
        is_enabled: true,
        upi_id: type === 'upi' ? upiId : null,
      });
      setUpiId('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create payment method');
    }
  }

  async function toggleEnabled(method) {
    try {
      await api.put(`/payment-methods/${method.id}`, {
        ...method,
        is_enabled: !method.is_enabled,
      });
      load();
    } catch {
      setError('Failed to update payment method');
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/payment-methods/${id}`);
      load();
    } catch {
      setError('Failed to delete payment method');
    }
  }

  return (
    <div>
      <h3>Payment Methods</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleCreate} style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: 8 }}>
          <option value="cash">Cash</option>
          <option value="digital">Digital</option>
          <option value="upi">UPI</option>
        </select>
        {type === 'upi' && (
          <input
            placeholder="UPI ID (e.g. cafe@upi)"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            style={{ padding: 8 }}
          />
        )}
        <button type="submit">Add Payment Method</button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
            <th>Type</th>
            <th>UPI ID</th>
            <th>Enabled</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {methods.map((m) => (
            <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ textTransform: 'uppercase' }}>{m.type}</td>
              <td>{m.upi_id || '-'}</td>
              <td>
                <input type="checkbox" checked={m.is_enabled} onChange={() => toggleEnabled(m)} />
              </td>
              <td><button onClick={() => handleDelete(m.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- FLOORS & TABLES ----------------
function FloorsTab() {
  const [floors, setFloors] = useState([]);
  const [floorName, setFloorName] = useState('');
  const [tableForm, setTableForm] = useState({ floor_id: '', table_number: '', seats: 4 });
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await api.get('/floors');
      setFloors(res.data);
    } catch {
      setError('Failed to load floors');
    }
  }

  async function handleCreateFloor(e) {
    e.preventDefault();
    if (!floorName) return;
    try {
      await api.post('/floors', { name: floorName });
      setFloorName('');
      load();
    } catch {
      setError('Failed to create floor');
    }
  }

  async function handleDeleteFloor(id) {
    try {
      await api.delete(`/floors/${id}`);
      load();
    } catch {
      setError('Failed to delete floor');
    }
  }

  function handleTableFormChange(e) {
    setTableForm({ ...tableForm, [e.target.name]: e.target.value });
  }

  async function handleCreateTable(e) {
    e.preventDefault();
    if (!tableForm.floor_id || !tableForm.table_number) return;
    try {
      await api.post('/tables', {
        floor_id: tableForm.floor_id,
        table_number: tableForm.table_number,
        seats: parseInt(tableForm.seats),
      });
      setTableForm({ floor_id: tableForm.floor_id, table_number: '', seats: 4 });
      load();
    } catch {
      setError('Failed to create table');
    }
  }

  async function handleDeleteTable(id) {
    try {
      await api.delete(`/tables/${id}`);
      load();
    } catch {
      setError('Failed to delete table');
    }
  }

  return (
    <div>
      <h3>Floors & Tables</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleCreateFloor} style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <input
          placeholder="Floor name (e.g. Ground Floor)"
          value={floorName}
          onChange={(e) => setFloorName(e.target.value)}
          style={{ padding: 8 }}
        />
        <button type="submit">Add Floor</button>
      </form>

      <form onSubmit={handleCreateTable} style={{ marginBottom: 30, display: 'flex', gap: 10 }}>
        <select name="floor_id" value={tableForm.floor_id} onChange={handleTableFormChange} style={{ padding: 8 }}>
          <option value="">Select floor</option>
          {floors.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <input
          name="table_number"
          placeholder="Table number"
          value={tableForm.table_number}
          onChange={handleTableFormChange}
          style={{ padding: 8, width: 120 }}
        />
        <input
          name="seats"
          type="number"
          placeholder="Seats"
          value={tableForm.seats}
          onChange={handleTableFormChange}
          style={{ padding: 8, width: 80 }}
        />
        <button type="submit">Add Table</button>
      </form>

      {floors.map((floor) => (
        <div key={floor.id} style={{ marginBottom: 20 }}>
          <h4>
            {floor.name}
            <button onClick={() => handleDeleteFloor(floor.id)} style={{ marginLeft: 10, fontSize: 12 }}>
              Delete Floor
            </button>
          </h4>
          <ul>
            {floor.tables.map((t) => (
              <li key={t.id}>
                Table {t.table_number} — {t.seats} seats
                <button onClick={() => handleDeleteTable(t.id)} style={{ marginLeft: 10, fontSize: 12 }}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}