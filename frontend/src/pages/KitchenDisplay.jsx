import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const STAGES = ['to_cook', 'preparing', 'completed'];
const STAGE_LABELS = {
  to_cook: 'To Cook',
  preparing: 'Preparing',
  completed: 'Completed',
};
const NEXT_STAGE = {
  to_cook: 'preparing',
  preparing: 'completed',
};

export default function KitchenDisplay() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // poll every 5s for real-time feel
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const res = await api.get('/orders/kitchen');
      setItems(res.data);
    } catch (err) {
      setError('Failed to load kitchen orders');
    } finally {
      setLoading(false);
    }
  }

  async function advanceStage(item) {
    const nextStage = NEXT_STAGE[item.kitchen_status];
    if (!nextStage) return;

    try {
      await api.put(`/orders/items/${item.item_id}/kitchen-status`, {
        kitchen_status: nextStage,
      });
      fetchOrders();
    } catch (err) {
      setError('Failed to update item status');
    }
  }

  // Group items by order_number, then by stage
  function groupByOrder(stageItems) {
    const grouped = {};
    stageItems.forEach((item) => {
      if (!grouped[item.order_number]) {
        grouped[item.order_number] = [];
      }
      grouped[item.order_number].push(item);
    });
    return grouped;
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: 60 }}>Loading kitchen display...</p>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Kitchen Display</h2>
        <button onClick={() => navigate('/floor')}>← Back to Floor</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 20 }}>
        {STAGES.map((stage) => {
          const stageItems = items.filter((i) => i.kitchen_status === stage);
          const grouped = groupByOrder(stageItems);

          return (
            <div key={stage} style={{ flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8, padding: 15, minHeight: 400 }}>
              <h3>{STAGE_LABELS[stage]}</h3>

              {Object.keys(grouped).length === 0 && <p style={{ color: '#888' }}>No orders</p>}

              {Object.entries(grouped).map(([orderNumber, orderItems]) => (
                <div
                  key={orderNumber}
                  onClick={() => stage !== 'completed' && advanceStage(orderItems[0])}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12,
                    cursor: stage !== 'completed' ? 'pointer' : 'default',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }}
                >
                  <strong>Ticket #{orderNumber}</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                    {orderItems.map((item) => (
                      <li key={item.item_id}>
                        {item.product_name} x {item.quantity}
                      </li>
                    ))}
                  </ul>
                  {stage !== 'completed' && (
                    <small style={{ color: '#666' }}>Click to move to next stage →</small>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}