import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/dashboard/Navbar';
import Home from './pages/Home';
import Hospitals from './pages/Hospitals';
import HospitalDetail from './pages/HospitalDetail';
import FindHospital from './pages/FindHospital';
import GraphPage from './pages/GraphPage';
import { Login, Register } from './pages/Auth';
import Appointments from './pages/Appointments';
import Admin from './pages/Admin';
import './styles/global.css';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/hospitals" element={<Hospitals />} />
      <Route path="/hospitals/:id" element={<HospitalDetail />} />
      <Route path="/find-hospital" element={<FindHospital />} />
      <Route path="/graph" element={<GraphPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/appointments" element={
        <ProtectedRoute><Appointments /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute roles={['hospital_admin', 'super_admin']}><Admin /></ProtectedRoute>
      } />
    </Routes>
  </>
);

const App = () => (
  <AuthProvider>
    <Router>
      <AppRoutes />
    </Router>
  </AuthProvider>
);

export default App;
