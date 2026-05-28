import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Users.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ email: '', password: '', role: 'receptionist', isActive: true });
    const { user } = useAuth();

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await API.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            setError('Erreur chargement utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };
    const resetForm = () => {
        setFormData({ email: '', password: '', role: 'receptionist', isActive: true });
        setEditingUser(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await API.put(`/admin/users/${editingUser.id}`, formData);
            } else {
                await API.post('/admin/users', formData);
            }
            resetForm();
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Opération échouée');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({ email: user.email, password: '', role: user.role, isActive: user.isActive });
        setShowForm(true);
    };

    const handleToggleActive = async (id, currentStatus) => {
        const action = currentStatus ? 'désactiver' : 'activer';
        if (!window.confirm(`Voulez-vous ${action} cet utilisateur ?`)) return;
        try {
            await API.put(`/admin/users/${id}`, { isActive: !currentStatus });
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Échec');
        }
    };

    if (loading) return <div className="loading-state"><div className="spinner"></div><span>Chargement...</span></div>;

    return (
        <div className="users-app">
            <div className="header">
                <h1>Utilisateurs</h1>
                <button className="btn-add" onClick={() => setShowForm(true)}>➕ Nouvel utilisateur</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {showForm && (
                <div className="form-card">
                    <h2>{editingUser ? 'Modifier utilisateur' : 'Nouvel utilisateur'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required />
                            <input type="password" name="password" placeholder="Mot de passe" value={formData.password} onChange={handleInputChange} required={!editingUser} />
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                disabled={editingUser?.id === user?.id}
                            >
                                <option value="receptionist">Réceptionniste</option>
                                <option value="admin">Administrateur</option>
                            </select>
                            <label className="checkbox-label">
                                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                                Actif
                            </label>
                        </div>
                        <div style={{ marginTop: '1.5rem' }}>
                            <button type="submit" className="btn-submit">{editingUser ? 'Mettre à jour' : 'Créer'}</button>
                            <button type="button" className="btn-cancel" onClick={resetForm}>Annuler</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-card">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Rôle</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{u.email}</td>
                                <td>{u.role === 'admin' ? 'Admin' : 'Réceptionniste'}</td>
                                <td>{u.isActive ? 'Actif' : 'Inactif'}</td>
                                <td>
                                    <td>
                                    <button className="btn-action btn-edit" onClick={() => handleEdit(u)}>✏️</button>
                                    {u.id !== user?.id && (
                                        <button className="btn-action btn-toggle" onClick={() => handleToggleActive(u.id, u.isActive)}>
                                            {u.isActive ? '🔴' : '🟢'}
                                        </button>
                                    )}
                                </td>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;