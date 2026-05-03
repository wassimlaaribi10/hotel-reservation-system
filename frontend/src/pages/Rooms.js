import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [formData, setFormData] = useState({
        roomNumber: '',
        type: 'single',
        floor: '',
        capacity: '',
        description: ''
    });
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await API.get('/rooms');
            setRooms(res.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch rooms');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setFormData({
            roomNumber: '',
            type: 'single',
            floor: '',
            capacity: '',
            description: ''
        });
        setEditingRoom(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRoom) {
                await API.put(`/rooms/${editingRoom.id}`, formData);
            } else {
                await API.post('/rooms', formData);
            }
            resetForm();
            fetchRooms();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleEdit = (room) => {
        if (!isAdmin) return;
        setEditingRoom(room);
        setFormData({
            roomNumber: room.roomNumber,
            type: room.type,
            floor: room.floor,
            capacity: room.capacity,
            description: room.description || ''
        });
        setShowForm(true);
    };

    const handleDeactivate = async (id) => {
        if (!isAdmin) return;
        if (!window.confirm('Deactivate this room? It will no longer be available for reservations.')) return;
        try {
            await API.put(`/rooms/${id}`, { isActive: false });
            fetchRooms();
        } catch (err) {
            setError(err.response?.data?.error || 'Deactivation failed');
        }
    };

    const handleActivate = async (id) => {
        if (!window.confirm('Activate this room? It will become available for reservations.')) return;
        try {
            await API.put(`/rooms/${id}`, { isActive: true });
            fetchRooms();
        } catch (err) {
            setError(err.response?.data?.error || 'Activation failed');
        }
    }; 

    if (loading) return <div>Loading rooms...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Rooms</h1>
                {isAdmin && (
                    <button onClick={() => setShowForm(true)} style={{ padding: '8px 16px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px' }}>
                        Add Room
                    </button>
                )}
            </div>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            {showForm && isAdmin && (
                <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
                    <h2>{editingRoom ? 'Edit Room' : 'New Room'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div><label>Room Number *</label><br /><input type="text" name="roomNumber" value={formData.roomNumber} onChange={handleInputChange} required style={{ width: '100%', padding: '6px' }} /></div>
                            <div><label>Type *</label><br />
                                <select name="type" value={formData.type} onChange={handleInputChange} required style={{ width: '100%', padding: '6px' }}>
                                    <option value="single">Single</option>
                                    <option value="double">Double</option>
                                    <option value="suite">Suite</option>
                                </select>
                            </div>
                            <div><label>Floor *</label><br /><input type="number" name="floor" value={formData.floor} onChange={handleInputChange} required style={{ width: '100%', padding: '6px' }} /></div>
                            <div><label>Capacity *</label><br /><input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} required style={{ width: '100%', padding: '6px' }} /></div>
                            <div style={{ gridColumn: 'span 2' }}><label>Description</label><br /><textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" style={{ width: '100%', padding: '6px' }} /></div>
                        </div>
                        <div style={{ marginTop: '15px' }}>
                            <button type="submit" style={{ marginRight: '10px', padding: '6px 12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px' }}>
                                {editingRoom ? 'Update' : 'Create'}
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
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Number</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Type</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Floor</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Capacity</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Description</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                        {isAdmin && <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {rooms.map(room => (
                        <tr key={room.id}>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{room.roomNumber}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{room.type}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{room.floor}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{room.capacity}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{room.description}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{room.isActive ? 'Active' : 'Inactive'}</td>
                           {isAdmin && (
                              <>      
                                 <button onClick={() => handleEdit(room)} style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '3px' }}>Edit</button>
                                  {room.isActive ? (
                                      <button onClick={() => handleDeactivate(room.id)} style={{ padding: '4px 8px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px' }}>Deactivate</button>
                                  ) : (
                                      <button onClick={() => handleActivate(room.id)} style={{ padding: '4px 8px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '3px' }}>Activate</button>
                                  )}
                              </>
                          )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Rooms;