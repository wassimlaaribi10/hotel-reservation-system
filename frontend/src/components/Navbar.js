import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <Link to="/reservations">📅 Réservations</Link>
            <Link to="/availability">🔍 Disponibilité</Link>
            <Link to="/clients">👥 Clients</Link>
            <Link to="/rooms">🛏️ Chambres</Link>
            <Link to="/invoices">🧾 Factures</Link>
            {user?.role === 'admin' && (
                <Link to="/users">👥 Utilisateurs</Link>
            )}
            {user?.role === 'admin' && (
                <Link to="/seasonal-prices">💰 Tarifs saisonniers</Link>
            )}
            <div className="user-info">
                <span className="user-email">{user?.email} ({user?.role})</span>
                <button className="logout-btn" onClick={handleLogout}>Déconnexion</button>
            </div>
        </nav>
    );
};

export default Navbar;