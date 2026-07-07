import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function SelfOrder() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [tokenInfo, setTokenInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  useEffect(() => {
    validateAndLoad();
  }, []);

  async function validateAndLoad() {
    try {
      const tokenRes = await axios.get(`${API_BASE}/tokens/${token}`);
      setTokenInfo(tokenRes.data);

      const productsRes = await axios.get(`${API_BASE}/products/public`);
      setProducts(productsRes.data);
    } catch (err) {
      setError('This self-order link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  }

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product_id: product.id, name: product.name, price: parseFloat(product.price), quantity: 1 }];
    });
  }

  function changeQuantity(product_id, delta) {
    setCart((prev) =>
      prev
        .map((item) => (item.product_id === product_id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function getTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  async function handlePlaceOrder() {
    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setPlacingOrder(true);
    try {
      const res = await axios.post(`${API_BASE}/orders/self`, {
        table_id: tokenInfo.table_id,
        session_id: tokenInfo.session_id,
        order_type: 'self',
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
      });
      setPlacedOrder(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: 60 }}>Loading menu...</p>;
  if (error && !tokenInfo) return <p style={{ textAlign: 'center', marginTop: 60, color: 'red' }}>{error}</p>;

  if (placedOrder) {
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center' }}>
        <h2>Order Placed!</h2>
        <p>Order #{placedOrder.order_number}</p>
        <p>Total: Rs.{placedOrder.total_amount}</p>
        <p>Your order has been sent to the kitchen. Please wait for your food to be prepared.</p>
        <button onClick={() => navigate(`/customer/${placedOrder.id}`)}>
          View Order & Payment Status
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '20px auto', padding: 15 }}>
      <h2>Self Order — Table {tokenInfo.table_id}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 30 }}>
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => addToCart(product)}
            style={{ padding: 15, borderRadius: 8, border: '1px solid #ccc', backgroundColor: '#fff', color: '#111', cursor: 'pointer', textAlign: 'left' }}
          >
            <strong>{product.name}</strong>
            <br />
            Rs.{product.price}
          </button>
        ))}
      </div>

      <div style={{ backgroundColor: '#f7f7f7', padding: 15, borderRadius: 8, color: '#111' }}>
        <h3>Your Cart</h3>
        {cart.length === 0 && <p>No items yet</p>}
        {cart.map((item) => (
          <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>{item.name} — Rs.{item.price}</span>
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
          onClick={handlePlaceOrder}
          disabled={placingOrder}
          style={{ width: '100%', padding: 12, backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 6 }}
        >
          {placingOrder ? 'Placing order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}
