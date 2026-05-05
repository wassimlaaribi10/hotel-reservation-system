import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Reservations.css';

const Reservations = () => {
    const [reservations, setReservations] = useState([]);
    const [clients, setClients] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        clientId: '',
        roomId: '',
        checkInDate: '',
        checkOutDate: '',
        numberOfGuests: 1,
        discountPercent: 0
    });
    const [editingReservation, setEditingReservation] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editError, setEditError] = useState(''); // erreur spécifique à la modale
    const [editForm, setEditForm] = useState({
        roomId: '',
        checkInDate: '',
        checkOutDate: '',
        numberOfGuests: 1,
        discountPercent: 0
    });

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        if (editError) {
            const timer = setTimeout(() => setEditError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [editError]);

    const { user } = useAuth();

    useEffect(() => {
        fetchReservations();
        fetchClients();
        fetchRooms();
    }, []);

    const fetchReservations = async () => {
        try {
            const res = await API.get('/reservations');
            setReservations(res.data);
        } catch (err) {
            setError('Erreur chargement');
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await API.get('/clients');
            setClients(res.data.filter(c => c.isActive));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchRooms = async () => {
        try {
            const res = await API.get('/rooms');
            setRooms(res.data.filter(r => r.isActive));
        } catch (err) {
            console.error(err);
        }
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const resetForm = () => {
        setFormData({ clientId: '', roomId: '', checkInDate: '', checkOutDate: '', numberOfGuests: 1, discountPercent: 0 });
        setShowForm(false);
    };
    const handleCreateReservation = async (e) => {
        e.preventDefault();
        try {
            await API.post('/reservations', formData);
            resetForm();
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error);
        }
    };
    const handleEditClick = (res) => {
        if (res.status !== 'pending' && res.status !== 'confirmed') {
            setError('Impossible de modifier après check-in');
            return;
        }
        setEditingReservation(res);
        setEditForm({
            roomId: res.roomId,
            checkInDate: res.checkInDate.split('T')[0],
            checkOutDate: res.checkOutDate.split('T')[0],
            numberOfGuests: res.numberOfGuests,
            discountPercent: res.discountPercent || 0
        });
        setEditError(''); // nettoyer l'erreur avant ouverture
        setShowEditModal(true);
    };
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.put(`/reservations/${editingReservation.id}`, editForm);
            setShowEditModal(false);
            setEditError('');
            fetchReservations();
        } catch (err) {
            setEditError(err.response?.data?.error); // erreur affichée dans la modale
        }
    };
    const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });
    const handleConfirm = async (id) => {
        try {
            await API.put(`/reservations/${id}/confirm`);
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error);
        }
    };
    const handleCheckIn = async (id) => {
        try {
            await API.put(`/reservations/${id}/checkin`);
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error);
        }
    };
    const handleCheckOut = async (id) => {
        try {
            await API.put(`/reservations/${id}/checkout`);
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error);
        }
    };
    const handleCancel = async (id) => {
        if (!window.confirm('Annuler définitivement ?')) return;
        try {
            await API.delete(`/reservations/${id}`);
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error);
        }
    };
    const getStatusColor = (status) => ({ pending: '#f39c12', confirmed: '#3498db', checked_in: '#2ecc71', checked_out: '#95a5a6', cancelled: '#e74c3c' }[status] || '#7f8c8d');

    if (loading) return <div className="loading-state"><div className="spinner"></div><span>Chargement...</span></div>;

    return (
        <div className="reservations-app">
            <div className="header">
                <h1>Réservations</h1>
                <button className="btn-add" onClick={() => setShowForm(true)}>➕ Nouvelle réservation</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {showForm && (
                <div className="form-card">
                    <h2>📝 Créer une réservation</h2>
                    <form onSubmit={handleCreateReservation}>
                        <div className="form-grid">
                            <div>
                                <label>👤 Client *</label>
                                <select name="clientId" value={formData.clientId} onChange={handleInputChange} required>
                                    <option value="">Sélectionner un client</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName} - {c.idCardNumber}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>🛏️ Chambre *</label>
                                <select name="roomId" value={formData.roomId} onChange={handleInputChange} required>
                                    <option value="">Sélectionner une chambre</option>
                                    {rooms.map(r => (
                                        <option key={r.id} value={r.id}>{r.roomNumber} - {r.type} (capacité {r.capacity})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>📅 Date d'arrivée *</label>
                                <input type="date" name="checkInDate" value={formData.checkInDate} onChange={handleInputChange} required />
                            </div>
                            <div>
                                <label>📅 Date de départ *</label>
                                <input type="date" name="checkOutDate" value={formData.checkOutDate} onChange={handleInputChange} required />
                            </div>
                            <div>
                                <label>👥 Nombre de personnes *</label>
                                <input type="number" name="numberOfGuests" min="1" value={formData.numberOfGuests} onChange={handleInputChange} required />
                                <small>Capacité max indiquée sur la chambre</small>
                            </div>
                            <div>
                                <label>🏷️ Remise (%) (optionnel)</label>
                                <input type="number" name="discountPercent" min="0" max="100" step="1" value={formData.discountPercent} onChange={handleInputChange} placeholder="Ex: 10 pour 10%" />
                                <small>Laissez 0 si aucune remise</small>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem' }}>
                            <button type="submit" className="btn-submit">Créer</button>
                            <button type="button" className="btn-cancel" onClick={resetForm}>Annuler</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-card">
                <table className="res-table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Client</th><th>Chambre</th><th>Arrivée</th><th>Départ</th><th>Personnes</th><th>Statut</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservations.map(res => (
                            <tr key={res.id}>
                                <td>{res.id}</td>
                                <td>{res.clientName || `#${res.clientId}`}</td>
                                <td>{res.roomNumber || `#${res.roomId}`}</td>
                                <td>{new Date(res.checkInDate).toLocaleDateString()}</td>
                                <td>{new Date(res.checkOutDate).toLocaleDateString()}</td>
                                <td>{res.numberOfGuests}</td>
                                <td style={{ color: getStatusColor(res.status), fontWeight: 'bold' }}>{res.status}</td>
                                <td>
                                    {(res.status === 'pending' || res.status === 'confirmed') && <button className="btn-action" onClick={() => handleEditClick(res)}>✏️</button>}
                                    {res.status === 'pending' && <button className="btn-action" onClick={() => handleConfirm(res.id)}>✅</button>}
                                    {res.status === 'confirmed' && <button className="btn-action" onClick={() => handleCheckIn(res.id)}>▶️</button>}
                                    {res.status === 'checked_in' && <button className="btn-action" onClick={() => handleCheckOut(res.id)}>⏹️</button>}
                                    {(res.status === 'pending' || res.status === 'confirmed') && <button className="btn-action" onClick={() => handleCancel(res.id)}>❌</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showEditModal && editingReservation && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>✏️ Modifier réservation #{editingReservation.id}</h2>
                        {editError && <div className="error-message" style={{ marginBottom: '1rem' }}>{editError}</div>}
                        <form onSubmit={handleEditSubmit}>
                            <div className="edit-form-grid">
                                <div>
                                    <label>🛏️ Chambre</label>
                                    <select name="roomId" value={editForm.roomId} onChange={handleEditChange} required>
                                        {rooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber} - {r.type}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label>📅 Date d'arrivée</label>
                                    <input type="date" name="checkInDate" value={editForm.checkInDate} onChange={handleEditChange} required />
                                </div>
                                <div>
                                    <label>📅 Date de départ</label>
                                    <input type="date" name="checkOutDate" value={editForm.checkOutDate} onChange={handleEditChange} required />
                                </div>
                                <div>
                                    <label>👥 Nombre de personnes</label>
                                    <input type="number" name="numberOfGuests" min="1" value={editForm.numberOfGuests} onChange={handleEditChange} required />
                                </div>
                                <div>
                                    <label>🏷️ Remise (%)</label>
                                    <input type="number" name="discountPercent" min="0" max="100" step="1" value={editForm.discountPercent} onChange={handleEditChange} />
                                </div>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <button type="submit" className="btn-submit">Enregistrer</button>
                                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reservations;