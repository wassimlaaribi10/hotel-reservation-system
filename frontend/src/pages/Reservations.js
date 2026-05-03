import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

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
        numberOfGuests: 1
    });
    
    // Edit modal state
    const [editingReservation, setEditingReservation] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        roomId: '',
        checkInDate: '',
        checkOutDate: '',
        numberOfGuests: 1
    });

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
            setError('Failed to fetch reservations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await API.get('/clients');
            setClients(res.data.filter(c => c.isActive));
        } catch (err) {
            console.error('Failed to fetch clients', err);
        }
    };

    const fetchRooms = async () => {
        try {
            const res = await API.get('/rooms');
            setRooms(res.data.filter(r => r.isActive));
        } catch (err) {
            console.error('Failed to fetch rooms', err);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setFormData({
            clientId: '',
            roomId: '',
            checkInDate: '',
            checkOutDate: '',
            numberOfGuests: 1
        });
        setShowForm(false);
    };

    const handleCreateReservation = async (e) => {
        e.preventDefault();
        try {
            await API.post('/reservations', formData);
            resetForm();
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error || 'Creation failed');
        }
    };

    // Edit handlers
    const handleEditClick = (reservation) => {
        // Only allow edit if pending or confirmed
        if (reservation.status !== 'pending' && reservation.status !== 'confirmed') {
            setError('Cannot edit reservation after check-in');
            return;
        }
        setEditingReservation(reservation);
        setEditForm({
            roomId: reservation.roomId,
            checkInDate: reservation.checkInDate.split('T')[0],
            checkOutDate: reservation.checkOutDate.split('T')[0],
            numberOfGuests: reservation.numberOfGuests
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.put(`/reservations/${editingReservation.id}`, editForm);
            setShowEditModal(false);
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error || 'Update failed');
        }
    };

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleConfirm = async (id) => {
        try {
            await API.put(`/reservations/${id}/confirm`);
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error || 'Confirmation failed');
        }
    };

    const handleCheckIn = async (id) => {
        try {
            await API.put(`/reservations/${id}/checkin`);
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error || 'Check-in failed');
        }
    };

    const handleCheckOut = async (id) => {
        try {
            await API.put(`/reservations/${id}/checkout`);
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error || 'Check-out failed');
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this reservation? This action cannot be undone.')) return;
        try {
            await API.delete(`/reservations/${id}`);
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error || 'Cancellation failed');
        }
    };

    const generateInvoice = async (id) => {
        try {
            const res = await API.post(`/reservations/${id}/invoice`);
            alert(`Invoice generated: ${res.data.invoiceNumber}`);
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error || 'Invoice generation failed');
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'pending': return '#f39c12';
            case 'confirmed': return '#3498db';
            case 'checked_in': return '#2ecc71';
            case 'checked_out': return '#95a5a6';
            case 'cancelled': return '#e74c3c';
            default: return '#7f8c8d';
        }
    };

    if (loading) return <div>Loading reservations...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Reservations</h1>
                <button onClick={() => setShowForm(true)} style={{ padding: '8px 16px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px' }}>
                    New Reservation
                </button>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            {showForm && (
                <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
                    <h2>Create Reservation</h2>
                    <form onSubmit={handleCreateReservation}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div><label>Client *</label><br />
                                <select name="clientId" value={formData.clientId} onChange={handleInputChange} required style={{ width: '100%', padding: '6px' }}>
                                    <option value="">Select client</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} - {c.idCardNumber}</option>)}
                                </select>
                            </div>
                            <div><label>Room *</label><br />
                                <select name="roomId" value={formData.roomId} onChange={handleInputChange} required style={{ width: '100%', padding: '6px' }}>
                                    <option value="">Select room</option>
                                    {rooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber} - {r.type} (cap. {r.capacity})</option>)}
                                </select>
                            </div>
                            <div><label>Check-in Date *</label><br /><input type="date" name="checkInDate" value={formData.checkInDate} onChange={handleInputChange} required style={{ width: '100%', padding: '6px' }} /></div>
                            <div><label>Check-out Date *</label><br /><input type="date" name="checkOutDate" value={formData.checkOutDate} onChange={handleInputChange} required style={{ width: '100%', padding: '6px' }} /></div>
                            <div><label>Number of Guests *</label><br /><input type="number" name="numberOfGuests" min="1" value={formData.numberOfGuests} onChange={handleInputChange} required style={{ width: '100%', padding: '6px' }} /></div>
                        </div>
                        <div style={{ marginTop: '15px' }}>
                            <button type="submit" style={{ marginRight: '10px', padding: '6px 12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px' }}>Create</button>
                            <button type="button" onClick={resetForm} style={{ padding: '6px 12px', backgroundColor: '#7f8c8d', color: 'white', border: 'none', borderRadius: '4px' }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Client Name</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Room Number</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Check-in</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Check-out</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Guests</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {reservations.map(res => (
                        <tr key={res.id}>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{res.id}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{res.clientName || `Client #${res.clientId}`}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{res.roomNumber || `Room #${res.roomId}`}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(res.checkInDate).toLocaleDateString()}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(res.checkOutDate).toLocaleDateString()}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{res.numberOfGuests}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px', color: getStatusColor(res.status), fontWeight: 'bold' }}>{res.status}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                {/* Edit button - only for pending/confirmed */}
                                {(res.status === 'pending' || res.status === 'confirmed') && (
                                    <button onClick={() => handleEditClick(res)} style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '3px' }}>Edit</button>
                                )}
                                {res.status === 'pending' && (
                                    <button onClick={() => handleConfirm(res.id)} style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '3px' }}>Confirm</button>
                                )}
                                {res.status === 'confirmed' && (
                                    <button onClick={() => handleCheckIn(res.id)} style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '3px' }}>Check-in</button>
                                )}
                                {res.status === 'checked_in' && (
                                    <button onClick={() => handleCheckOut(res.id)} style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '3px' }}>Check-out</button>
                                )}
                                {(res.status === 'pending' || res.status === 'confirmed') && (
                                    <button onClick={() => handleCancel(res.id)} style={{ padding: '4px 8px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px' }}>Cancel</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Edit Modal */}
            {showEditModal && editingReservation && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '400px' }}>
                        <h2>Edit Reservation #{editingReservation.id}</h2>
                        <form onSubmit={handleEditSubmit}>
                            <div style={{ marginBottom: '10px' }}>
                                <label>Room</label><br />
                                <select name="roomId" value={editForm.roomId} onChange={handleEditChange} required style={{ width: '100%', padding: '6px' }}>
                                    <option value="">Select room</option>
                                    {rooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber} - {r.type} (cap. {r.capacity})</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <label>Check-in Date</label><br />
                                <input type="date" name="checkInDate" value={editForm.checkInDate} onChange={handleEditChange} required style={{ width: '100%', padding: '6px' }} />
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <label>Check-out Date</label><br />
                                <input type="date" name="checkOutDate" value={editForm.checkOutDate} onChange={handleEditChange} required style={{ width: '100%', padding: '6px' }} />
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <label>Number of Guests</label><br />
                                <input type="number" name="numberOfGuests" min="1" value={editForm.numberOfGuests} onChange={handleEditChange} required style={{ width: '100%', padding: '6px' }} />
                            </div>
                            <div style={{ marginTop: '15px' }}>
                                <button type="submit" style={{ marginRight: '10px', padding: '6px 12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px' }}>Save</button>
                                <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '6px 12px', backgroundColor: '#7f8c8d', color: 'white', border: 'none', borderRadius: '4px' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reservations;