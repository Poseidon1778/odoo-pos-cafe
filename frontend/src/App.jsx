import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';

function FloorPlaceholder() {
  return <h2 style={{ textAlign: 'center', marginTop: 80 }}>Floor View — coming next</h2>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/floor"
        element={
          <ProtectedRoute>
            <FloorPlaceholder />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Login />} />
    </Routes>
  );
}

export default App;
