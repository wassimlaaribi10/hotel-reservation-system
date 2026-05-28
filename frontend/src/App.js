import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Clients from './pages/Clients';
import Rooms from './pages/Rooms';
import Reservations from './pages/Reservations';
import Invoices from './pages/Invoices';
import Availability from './pages/Availability';
import Navbar from './components/Navbar';
import Users from './pages/Users';
import SeasonalPrices from './pages/SeasonalPrices';
import ClientHistory from './pages/ClientHistory';


// Protected route wrapper
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" />;
    }
    return children;
};

function App() {
    const { user } = useAuth();
    return (
        <BrowserRouter>
            {user && <Navbar />}
            <div style={{ padding: '20px' }}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/clients" element={
                        <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                            <Clients />
                        </ProtectedRoute>
                    } />
                    <Route path="/rooms" element={
                        <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                            <Rooms />
                        </ProtectedRoute>
                    } />
                    <Route path="/availability" element={
                        <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                            <Availability />
                        </ProtectedRoute>
                    } />
                    <Route path="/reservations" element={
                        <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                            <Reservations />
                        </ProtectedRoute>
                    } />
                    <Route path="/invoices" element={
                        <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                            <Invoices />
                        </ProtectedRoute>
                    } />
                    <Route path="/" element={<Navigate to="/reservations" />} />
                    <Route path="/users" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <Users />
                        </ProtectedRoute>
                    } />
                    <Route path="/seasonal-prices" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <SeasonalPrices />
                        </ProtectedRoute>
                    } />
                    <Route path="/client-history" element={<ClientHistory />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;