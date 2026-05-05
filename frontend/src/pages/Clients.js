import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Clients.css';

const Clients = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', idCardNumber: '', address: '', phone: '', email: ''
    });
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientReservations, setClientReservations] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const { user } = useAuth();

        useEffect(() => {
            if (error) {
                const timer = setTimeout(() => setError(''), 5000);
                return () => clearTimeout(timer);
            }
        }, [error]);

    useEffect(() => { fetchClients(); }, []);

    const fetchClients = async () => {
        try {
            const res = await API.get('/clients');
            setClients(res.data);
            setError('');
        } catch (err) {
            setError('Échec du chargement');
        } finally {
            setLoading(false);
        }
    };

    const showClientHistory = async (client) => {
        setSelectedClient(client);
        setHistoryLoading(true);
        try {
            const res = await API.get(`/clients/${client.id}/reservations`);
            setClientReservations(res.data);
            setShowHistoryModal(true);
        } catch (err) {
            setError('Erreur historique');
        } finally {
            setHistoryLoading(false);
        }
    };

    const filteredClients = clients.filter(client => {
        const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
        const idCard = client.idCardNumber.toLowerCase();
        const phone = client.phone.toLowerCase();
        const term = searchTerm.toLowerCase();
        return fullName.includes(term) || idCard.includes(term) || phone.includes(term);
    });

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const resetForm = () => {
        setFormData({ firstName: '', lastName: '', idCardNumber: '', address: '', phone: '', email: '' });
        setEditingClient(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingClient) await API.put(`/clients/${editingClient.id}`, formData);
            else await API.post('/clients', formData);
            resetForm();
            fetchClients();
        } catch (err) {
            setError(err.response?.data?.error || 'Opération échouée');
        }
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setFormData({
            firstName: client.firstName, lastName: client.lastName, idCardNumber: client.idCardNumber,
            address: client.address || '', phone: client.phone, email: client.email || ''
        });
        setShowForm(true);
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm('Désactiver ce client ?')) return;
        try {
            await API.delete(`/clients/${id}`);
            fetchClients();
        } catch (err) {
            setError(err.response?.data?.error || 'Échec désactivation');
        }
    };

    const handleActivate = async (id) => {
        if (!window.confirm('Activer ce client ?')) return;
        try {
            await API.put(`/clients/${id}`, { isActive: true });
            fetchClients();
        } catch (err) {
            setError(err.response?.data?.error || 'Échec activation');
        }
    };

    if (loading) return <div className="loading-state"><div className="spinner"></div><span>Chargement...</span></div>;

    return (
        <div className="clients-app">
            <div className="header">
                <h1>Clients</h1>
                <button className="btn-add" onClick={() => setShowForm(true)}>➕ Nouveau client</button>
            </div>

            <div className="search-bar">
                <input type="text" placeholder="Rechercher par nom, ID, téléphone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            {error && <div className="error-message">{error}</div>}

            {showForm && (
                <div className="form-card">
                    <h2>{editingClient ? 'Modifier client' : 'Nouveau client'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <input type="text" name="firstName" placeholder="Prénom" value={formData.firstName} onChange={handleInputChange} required />
                            <input type="text" name="lastName" placeholder="Nom" value={formData.lastName} onChange={handleInputChange} required />
                            <input type="text" name="idCardNumber" placeholder="N° pièce d'identité" value={formData.idCardNumber} onChange={handleInputChange} required />
                            <input type="text" name="phone" placeholder="Téléphone" value={formData.phone} onChange={handleInputChange} required />
                            <input type="text" name="address" placeholder="Adresse" value={formData.address} onChange={handleInputChange} />
                            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} />
                        </div>
                        <div style={{ marginTop: '1.5rem' }}>
                            <button type="submit" className="btn-submit">{editingClient ? 'Mettre à jour' : 'Créer'}</button>
                            <button type="button" className="btn-cancel" onClick={resetForm}>Annuler</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-card">
                <table className="client-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nom</th>
                            <th>Pièce</th>
                            <th>Téléphone</th>
                            <th>Email</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClients.map(client => (
                            <tr key={client.id}>
                                <td>{client.id}</td>
                                <td>{client.firstName} {client.lastName}</td>
                                <td>{client.idCardNumber}</td>
                                <td>{client.phone}</td>
                                <td>{client.email}</td>
                                <td>{client.isActive ? 'Actif' : 'Inactif'}</td>
                                <td>
                                    <button className="btn-action btn-edit" onClick={() => handleEdit(client)}>✏️</button>
                                    {user?.role === 'admin' && (
                                        client.isActive ? 
                                            <button className="btn-action btn-deactivate" onClick={() => handleDeactivate(client.id)}>🔴</button> :
                                            <button className="btn-action btn-activate" onClick={() => handleActivate(client.id)}>🟢</button>
                                    )}
                                    <button className="btn-action btn-history" onClick={() => showClientHistory(client)}>📜</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showHistoryModal && selectedClient && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>📜 Historique – {selectedClient.firstName} {selectedClient.lastName}</h3>
                            <button className="modal-close" onClick={() => setShowHistoryModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {historyLoading ? (
                                <div className="loading-state"><div className="spinner"></div><span>Chargement...</span></div>
                            ) : clientReservations.length === 0 ? (
                                <p className="empty">Aucune réservation trouvée.</p>
                            ) : (
                                <div className="table-wrapper">
                                    <table className="history-table">
                                        <thead>
                                            <tr>
                                                <th>Arrivée</th>
                                                <th>Départ</th>
                                                <th>Chambre</th>
                                                <th>Personnes</th>
                                                <th>Prix total</th>
                                                <th>Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clientReservations.map(res => (
                                                <tr key={res.id}>
                                                    <td>{new Date(res.checkInDate).toLocaleDateString()}</td>
                                                    <td>{new Date(res.checkOutDate).toLocaleDateString()}</td>
                                                    <td>{res.roomNumber || res.roomId}</td>
                                                    <td>{res.numberOfGuests}</td>
                                                    <td>
                                                        {res.status === 'cancelled' && res.cancellationFee
                                                            ? `${res.cancellationFee} € (pénalité)`
                                                            : (res.totalPrice ? `${res.totalPrice} €` : 'N/A')}
                                                    </td>
                                                    <td>{res.status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;