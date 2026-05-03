import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const Clients = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        idCardNumber: '',
        address: '',
        phone: '',
        email: ''
    });
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientReservations, setClientReservations] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const { user } = useAuth();

    // Fetch clients on component mount
    useEffect(() => {
        fetchClients();
    }, []);

    const showClientHistory = async (client) => {
        setSelectedClient(client);
        setHistoryLoading(true);
        try {
            const res = await API.get(`/clients/${client.id}/reservations`);
            setClientReservations(res.data);
            setShowHistoryModal(true);
        } catch (err) {
            setError('Failed to fetch reservation history');
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await API.get('/clients');
            setClients(res.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch clients');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(client => {
        const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
        const idCard = client.idCardNumber.toLowerCase();
        const phone = client.phone.toLowerCase();
        const term = searchTerm.toLowerCase();
        return fullName.includes(term) || idCard.includes(term) || phone.includes(term);
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            idCardNumber: '',
            address: '',
            phone: '',
            email: ''
        });
        setEditingClient(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingClient) {
                await API.put(`/clients/${editingClient.id}`, formData);
            } else {
                await API.post('/clients', formData);
            }
            resetForm();
            fetchClients();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setFormData({
            firstName: client.firstName,
            lastName: client.lastName,
            idCardNumber: client.idCardNumber,
            address: client.address || '',
            phone: client.phone,
            email: client.email || ''
        });
        setShowForm(true);
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm('Deactivate this client? They will no longer be able to make reservations.')) return;
        try {
            await API.delete(`/clients/${id}`);
            fetchClients();
        } catch (err) {
            setError(err.response?.data?.error || 'Deactivation failed');
        }
    };

    const handleActivate = async (id) => {
    if (!window.confirm('Activate this client? They will be able to make reservations again.')) return;
    try {
        await API.put(`/clients/${id}`, { isActive: true });
        fetchClients();
    } catch (err) {
        setError(err.response?.data?.error || 'Activation failed');
    }
};

    if (loading) return <div>Loading clients...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Clients</h1>
                <button onClick={() => setShowForm(true)} style={{ padding: '8px 16px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px' }}>
                    Add Client
                </button>
            </div>
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="Search by name, ID card, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '300px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
            </div>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            {showForm && (
                <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
                    <h2>{editingClient ? 'Edit Client' : 'New Client'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div><label>First Name *</label><br /><input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required style={{ width: '100%', padding: '6px' }} /></div>
                            <div><label>Last Name *</label><br /><input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required style={{ width: '100%', padding: '6px' }} /></div>
                            <div><label>ID Card Number *</label><br /><input type="text" name="idCardNumber" value={formData.idCardNumber} onChange={handleInputChange} required style={{ width: '100%', padding: '6px' }} /></div>
                            <div><label>Phone *</label><br /><input type="text" name="phone" value={formData.phone} onChange={handleInputChange} required style={{ width: '100%', padding: '6px' }} /></div>
                            <div><label>Address</label><br /><input type="text" name="address" value={formData.address} onChange={handleInputChange} style={{ width: '100%', padding: '6px' }} /></div>
                            <div><label>Email</label><br /><input type="email" name="email" value={formData.email} onChange={handleInputChange} style={{ width: '100%', padding: '6px' }} /></div>
                        </div>
                        <div style={{ marginTop: '15px' }}>
                            <button type="submit" style={{ marginRight: '10px', padding: '6px 12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px' }}>
                                {editingClient ? 'Update' : 'Create'}
                            </button>
                            <button type="button" onClick={resetForm} style={{ padding: '6px 12px', backgroundColor: '#7f8c8d', color: 'white', border: 'none', borderRadius: '4px' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID Card</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Phone</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Email</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Actions</th>
                    </tr>
                </thead>
               <tbody>
                {filteredClients.map(client => (
                <tr key={client.id}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{client.id}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{client.firstName} {client.lastName}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{client.idCardNumber}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{client.phone}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{client.email}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{client.isActive ? 'Active' : 'Inactive'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        <button onClick={() => handleEdit(client)} style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '3px' }}>Edit</button>
                        {user?.role === 'admin' && (
                            client.isActive ? (
                                <button onClick={() => handleDeactivate(client.id)} style={{ padding: '4px 8px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px' }}>Deactivate</button>
                            ) : (
                                <button onClick={() => handleActivate(client.id)} style={{ padding: '4px 8px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '3px' }}>Activate</button>
                            )
                        )}
                        <button onClick={() => showClientHistory(client)} style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#16a085', color: 'white', border: 'none', borderRadius: '3px' }}>History</button>
                    </td>
                </tr>
            ))}
</tbody>
            </table>
            {showHistoryModal && selectedClient && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '80%', maxWidth: '800px', maxHeight: '80%', overflow: 'auto' }}>
                        <h2>Stay History for {selectedClient.firstName} {selectedClient.lastName}</h2>
                        {historyLoading ? <div>Loading...</div> : (
                            clientReservations.length === 0 ? <p>No reservations found.</p> : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f2f2f2' }}>
                                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Check-in</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Check-out</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Room #</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Guests</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Total Price</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clientReservations.map(res => (
                                            <tr key={res.id}>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(res.checkInDate).toLocaleDateString()}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(res.checkOutDate).toLocaleDateString()}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{res.roomId}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{res.numberOfGuests}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{res.totalPrice ? `${res.totalPrice} €` : 'N/A'}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{res.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}
                        <button onClick={() => setShowHistoryModal(false)} style={{ marginTop: '15px', padding: '8px 16px', backgroundColor: '#7f8c8d', color: 'white', border: 'none', borderRadius: '4px' }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;