import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function FloorView() {
  const [floors, setFloors] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFloors();
  }, []);

  async function fetchFloors() {
    try {
      const res = await api.get('/floors');
      setFloors(res.data);
    } catch (err) {
      setError('Failed to load floors');
    } finally {
      setLoading(false);
    }
  }

  function handleTableClick(table) {
    navigate(`/order/${table.id}`);
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: 60 }}>Loading floors...</p>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Floor View</h2>
        <div>
          <span style={{ marginRight: 15 }}>Logged in as: {user?.name} ({user?.role})</span>
          <button onClick={() => navigate('/kitchen')} style={{ marginRight: 10 }}>Kitchen Display</button>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin')} style={{ marginRight: 10 }}>Backend Config</button>
          )}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {floors.length === 0 && !error && (
        <p>No floors configured yet. Create one via the backend config screen.</p>
      )}

      {floors.map((floor) => (
        <div key={floor.id} style={{ marginBottom: 30 }}>
          <h3>{floor.name}</h3>
          <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
            {floor.tables.length === 0 && <p>No tables on this floor yet.</p>}
            {floor.tables.map((table) => (
              <button
                key={table.id}
                onClick={() => handleTableClick(table)}
                disabled={!table.is_active}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 10,
                  border: '2px solid #333',
                  backgroundColor: table.is_active ? '#4CAF50' : '#ccc',
                  color: 'white',
                  fontSize: 16,
                  cursor: table.is_active ? 'pointer' : 'not-allowed',
                }}
              >
                Table {table.table_number}
                <br />
                <small>{table.seats} seats</small>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}