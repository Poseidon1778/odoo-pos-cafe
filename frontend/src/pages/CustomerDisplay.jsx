import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function CustomerDisplay() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // poll for live payment status
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [orderRes, paymentRes] = await Promise.all([
        api.get(`/orders/public/${orderId}`),
        api.get(`/payments/public/order/${orderId}`),
      ]);
      setOrder(orderRes.data);
      setPaymentInfo(paymentRes.data);
    } catch (err) {
      setError('Unable to load order');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: 80 }}>Loading...</p>;
  if (error) return <p style={{ textAlign: 'center', marginTop: 80, color: 'red' }}>{error}</p>;
  if (!order) return null;

  const isPaid = paymentInfo?.order_status === 'paid';

  return (
    <div style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Thank you for your order!</h1>
      <h3>Order #{order.order_number}</h3>

      <div style={{ margin: '30px 0', textAlign: 'left', border: '1px solid #ddd', borderRadius: 8, padding: 20 }}>
        {order.items.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>{item.product_name} x {item.quantity}</span>
            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <hr />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <span>Total</span>
          <span>₹{order.total_amount}</span>
        </div>
      </div>

      <div
        style={{
          padding: 20,
          borderRadius: 8,
          backgroundColor: isPaid ? '#e6f4ea' : '#fff3e0',
          color: isPaid ? '#2e7d32' : '#e65100',
          fontSize: 22,
          fontWeight: 'bold',
        }}
      >
        {isPaid ? '✔ Payment Successful' : '⏳ Awaiting Payment'}
      </div>

      {paymentInfo?.payment && (
        <p style={{ marginTop: 15, color: '#555' }}>
          Paid via {paymentInfo.payment.payment_type?.toUpperCase()}
        </p>
      )}

      <button onClick={() => navigate('/floor')} style={{ marginTop: 30, padding: '10px 20px' }}>
        Back to Floor
      </button>
    </div>
  );
}