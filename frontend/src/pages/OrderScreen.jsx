import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function OrderScreen() {
  const { tableId } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const [productsRes, sessionRes] = await Promise.all([
        api.get('/products'),
        api.get('/sessions/current').catch(() => null),
      ]);

      setProducts(productsRes.data);

      if (sessionRes && sessionRes.data) {
        setSession(sessionRes.data);
      } else {
        setError('No open POS session. Please open a session first.');
      }
    } catch (err) {
      setError('Failed to load order screen data');
    } finally {
      setLoading(false);
    }
  }

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          quantity: 1,
        },
      ];
    });
  }

  function changeQuantity(product_id, delta) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product_id === product_id
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function getTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  async function handleSendOrder() {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }
    if (!session) {
      setError('No open session');
      return;
    }

    try {
      const res = await api.post('/orders', {
        table_id: tableId,
        session_id: session.id,
        order_type: 'pos',
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      navigate(`/payment/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order');
    }
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: 60 }}>Loading...</p>;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 2, padding: 20, overflowY: 'auto' }}>
        <button onClick={() => navigate('/floor')}>← Back to Floor</button>
        <h2>Table {tableId} — Order</h2>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              style={{
                padding: 15,
                borderRadius: 8,
                border: '1px solid #ccc',
                backgroundColor: '#fff',
                color: '#111',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <strong>{product.name}</strong>
              <br />
              Rs.{product.price}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: 20, backgroundColor: '#f7f7f7', color: '#111', borderLeft: '1px solid #ddd' }}>
        <h3>Cart</h3>
        {cart.length === 0 && <p>No items yet</p>}

        {cart.map((item) => (
          <div
            key={item.product_id}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}
          >
            <div>
              <strong>{item.name}</strong>
              <br />
              Rs.{item.price} x {item.quantity}
            </div>
            <div>
              <button onClick={() => changeQuantity(item.product_id, -1)}>-</button>
              <span style={{ margin: '0 8px' }}>{item.quantity}</span>
              <button onClick={() => changeQuantity(item.product_id, 1)}>+</button>
            </div>
          </div>
        ))}

        <hr />
        <h3>Total: Rs.{getTotal().toFixed(2)}</h3>

        <button
          onClick={handleSendOrder}
          style={{ width: '100%', padding: 12, marginTop: 10, backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 6 }}
        >
          Confirm & Go to Payment
        </button>
      </div>
    </div>
  );
}
