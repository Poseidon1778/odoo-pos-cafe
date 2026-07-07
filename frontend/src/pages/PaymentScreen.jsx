import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function PaymentScreen() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [orderRes, methodsRes] = await Promise.all([
        api.get(`/orders/${orderId}`),
        api.get('/payment-methods'),
      ]);
      setOrder(orderRes.data);
      setPaymentMethods(methodsRes.data.filter((m) => m.is_enabled));
    } catch (err) {
      setError('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectMethod(method) {
    setSelectedMethod(method);
    if (method.type === 'upi') {
      setShowQr(true);
    } else {
      setShowQr(false);
    }
  }

  async function handleConfirmPayment() {
    if (!selectedMethod) {
      setError('Select a payment method first');
      return;
    }

    setConfirming(true);
    try {
      await api.post('/payments', {
        order_id: orderId,
        payment_method_id: selectedMethod.id,
        amount: order.total_amount,
      });
      navigate('/floor');
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setConfirming(false);
    }
  }

  function handleCancelQr() {
    setShowQr(false);
    setSelectedMethod(null);
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: 60 }}>Loading...</p>;
  if (!order) return <p style={{ textAlign: 'center', marginTop: 60 }}>Order not found</p>;

  if (showQr && selectedMethod?.type === 'upi') {
    const upiString = `upi://pay?pa=${selectedMethod.upi_id}&am=${order.total_amount}&cu=INR`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;

    return (
      <div style={{ textAlign: 'center', marginTop: 60 }}>
        <h2>UPI QR Payment</h2>
        <p>Amount: Rs.{order.total_amount}</p>
        <img src={qrImageUrl} alt="UPI QR Code" style={{ margin: '20px 0' }} />
        <p>UPI ID: {selectedMethod.upi_id}</p>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div>
          <button
            onClick={handleConfirmPayment}
            disabled={confirming}
            style={{ padding: '10px 20px', marginRight: 10, backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 6 }}
          >
            {confirming ? 'Confirming...' : 'Confirmed'}
          </button>
          <button
            onClick={handleCancelQr}
            style={{ padding: '10px 20px', backgroundColor: '#ccc', color: '#111', border: 'none', borderRadius: 6 }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center' }}>
      <h2>Payment</h2>
      <h3>Total: Rs.{order.total_amount}</h3>

      <p>
        <a href={`/customer/${orderId}`} target="_blank" rel="noreferrer">
          Open Customer Display →
        </a>
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => handleSelectMethod(method)}
            style={{
              padding: 15,
              borderRadius: 8,
              border: selectedMethod?.id === method.id ? '2px solid #4CAF50' : '1px solid #ccc',
              backgroundColor: '#fff',
              color: '#111',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {method.type}
          </button>
        ))}
      </div>

      {selectedMethod && selectedMethod.type !== 'upi' && (
        <button
          onClick={handleConfirmPayment}
          disabled={confirming}
          style={{ width: '100%', padding: 12, marginTop: 20, backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 6 }}
        >
          {confirming ? 'Processing...' : 'Validate Payment'}
        </button>
      )}
    </div>
  );
}
