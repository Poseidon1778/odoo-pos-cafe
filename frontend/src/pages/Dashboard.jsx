import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [report, setReport] = useState([]);
  const [filters, setFilters] = useState({ from: '', to: '', session_id: '', user_id: '', product_id: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadSummary();
    loadReport();
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', marginTop: 80 }}>
        <p>Admin access required.</p>
        <button onClick={() => navigate('/floor')}>Back to Floor</button>
      </div>
    );
  }

  async function loadSummary() {
    try {
      const res = await api.get('/reports/dashboard');
      setSummary(res.data);
    } catch {
      setError('Failed to load dashboard summary');
    } finally {
      setLoading(false);
    }
  }

  async function loadReport(customFilters = filters) {
    try {
      const params = {};
      Object.entries(customFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const res = await api.get('/reports/sales', { params });
      setReport(res.data);
    } catch {
      setError('Failed to load sales report');
    }
  }

  function handleFilterChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  function handleApplyFilters(e) {
    e.preventDefault();
    loadReport(filters);
  }

  function handleExportCsv() {
    if (report.length === 0) return;

    const headers = ['Order Number', 'Product', 'Quantity', 'Price', 'Responsible', 'Date'];
    const rows = report.map((r) => [
      r.order_number,
      r.product_name,
      r.quantity,
      r.price,
      r.responsible,
      new Date(r.created_at).toLocaleString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sales_report.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: 60 }}>Loading dashboard...</p>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard & Reporting</h2>
        <button onClick={() => navigate('/floor')}>← Back to Floor</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'flex', gap: 20, margin: '20px 0' }}>
          <SummaryCard label="Today's Sales" value={`₹${summary.today_sales}`} />
          <SummaryCard label="Today's Orders" value={summary.today_orders} />
          <SummaryCard label="Active Sessions" value={summary.active_sessions} />
        </div>
      )}

      {/* Top products */}
      {summary?.top_products?.length > 0 && (
        <div style={{ marginBottom: 30 }}>
          <h3>Top Products</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
                <th>Product</th>
                <th>Total Sold</th>
              </tr>
            </thead>
            <tbody>
              {summary.top_products.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td>{p.name}</td>
                  <td>{p.total_sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Filters */}
      <h3>Sales Report</h3>
      <form onSubmit={handleApplyFilters} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <label>
          From: <input type="date" name="from" value={filters.from} onChange={handleFilterChange} />
        </label>
        <label>
          To: <input type="date" name="to" value={filters.to} onChange={handleFilterChange} />
        </label>
        <input name="session_id" placeholder="Session ID" value={filters.session_id} onChange={handleFilterChange} style={{ padding: 6, width: 100 }} />
        <input name="user_id" placeholder="Responsible (user ID)" value={filters.user_id} onChange={handleFilterChange} style={{ padding: 6, width: 150 }} />
        <input name="product_id" placeholder="Product ID" value={filters.product_id} onChange={handleFilterChange} style={{ padding: 6, width: 100 }} />
        <button type="submit">Apply Filters</button>
        <button type="button" onClick={handleExportCsv}>Export CSV</button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
            <th>Order #</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Responsible</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {report.length === 0 && (
            <tr><td colSpan="6">No records found</td></tr>
          )}
          {report.map((r, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
              <td>{r.order_number}</td>
              <td>{r.product_name}</td>
              <td>{r.quantity}</td>
              <td>₹{r.price}</td>
              <td>{r.responsible}</td>
              <td>{new Date(r.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div style={{ flex: 1, padding: 20, backgroundColor: '#f0f0f0', borderRadius: 8, textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: '#666' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}