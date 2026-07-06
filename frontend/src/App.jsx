import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import FloorView from './pages/FloorView';
import OrderScreen from './pages/OrderScreen';
import PaymentScreen from './pages/PaymentScreen';
import KitchenDisplay from './pages/KitchenDisplay';
import CustomerDisplay from './pages/CustomerDisplay';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/floor"
        element={
          <ProtectedRoute>
            <FloorView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/order/:tableId"
        element={
          <ProtectedRoute>
            <OrderScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/:orderId"
        element={
          <ProtectedRoute>
            <PaymentScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kitchen"
        element={
          <ProtectedRoute>
            <KitchenDisplay />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route path="/customer/:orderId" element={<CustomerDisplay />} />
      <Route path="/" element={<Login />} />
    </Routes>
  );
}

export default App;