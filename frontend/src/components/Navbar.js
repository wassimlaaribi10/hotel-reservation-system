import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav style={{ background: '#2c3e50', padding: '10px 20px', color: 'white', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link to="/reservations" style={{ color: 'white', textDecoration: 'none' }}>Reservations</Link>
            <Link to="/availability" style={{ color: 'white', textDecoration: 'none' }}>Check Availability</Link>
            <Link to="/clients" style={{ color: 'white', textDecoration: 'none' }}>Clients</Link>
            <Link to="/rooms" style={{ color: 'white', textDecoration: 'none' }}>Rooms</Link>
            <Link to="/invoices" style={{ color: 'white', textDecoration: 'none' }}>Invoices</Link>
            <div style={{ marginLeft: 'auto' }}>
                <span style={{ marginRight: '15px' }}>{user?.email} ({user?.role})</span>
                <button onClick={handleLogout} style={{ padding: '5px 10px' }}>Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;