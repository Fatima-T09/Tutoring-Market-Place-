import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import TutorListings from './pages/TutorListings';
import TutorProfile from './pages/TutorProfile';
import BookingPage from './pages/BookingPage';
import ChatPage from './pages/ChatPage';
import SessionsPage from './pages/SessionsPage';
import AdminPanel from './pages/AdminPanel';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-overlay" style={{ minHeight: '100vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p>Loading...</p>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/tutors" element={<ProtectedRoute><TutorListings /></ProtectedRoute>} />
        <Route path="/tutors/:id" element={<ProtectedRoute><TutorProfile /></ProtectedRoute>} />
        <Route path="/book/:tutorId" element={<ProtectedRoute role="student"><BookingPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/chat/:userId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/auth'} replace />} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
