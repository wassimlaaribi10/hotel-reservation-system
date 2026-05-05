import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Rooms.css';

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [formData, setFormData] = useState({ roomNumber: '', type: 'single', floor: '', capacity: '', description: '' });
    const [showEquipmentModal, setShowEquipmentModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [roomEquipment, setRoomEquipment] = useState([]);
    const [allEquipment, setAllEquipment] = useState([]);
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

        useEffect(() => {
            if (error) {
                const timer = setTimeout(() => setError(''), 5000);
                return () => clearTimeout(timer);
            }
        }, [error]);

    useEffect(() => { fetchRooms(); }, []);

    const fetchRooms = async () => {
        try { const res = await API.get('/rooms'); setRooms(res.data); setError(''); } catch (err) { setError('Échec chargement'); }
        finally { setLoading(false); }
    };
    const fetchEquipmentForRoom = async (roomId) => { try { const res = await API.get(`/rooms/${roomId}/equipment`); setRoomEquipment(res.data); } catch (err) { console.error(err); } };
    const fetchAllEquipment = async () => { try { const res = await API.get('/equipment'); setAllEquipment(res.data); } catch (err) { console.error(err); } };
    const handleOpenEquipmentModal = async (room) => { setSelectedRoom(room); await fetchEquipmentForRoom(room.id); await fetchAllEquipment(); setShowEquipmentModal(true); };
    const addEquipmentToRoom = async (equipmentId) => { if (!equipmentId) return; try { await API.post(`/rooms/${selectedRoom.id}/equipment/${equipmentId}`); await fetchEquipmentForRoom(selectedRoom.id); } catch (err) { alert('Erreur ajout'); } };
    const removeEquipmentFromRoom = async (equipmentId) => { try { await API.delete(`/rooms/${selectedRoom.id}/equipment/${equipmentId}`); await fetchEquipmentForRoom(selectedRoom.id); } catch (err) { alert('Erreur retrait'); } };
    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const resetForm = () => { setFormData({ roomNumber: '', type: 'single', floor: '', capacity: '', description: '' }); setEditingRoom(null); setShowForm(false); };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try { if (editingRoom) await API.put(`/rooms/${editingRoom.id}`, formData); else await API.post('/rooms', formData); resetForm(); fetchRooms(); } catch (err) { setError(err.response?.data?.error || 'Erreur'); }
    };
    const handleEdit = (room) => { if (!isAdmin) return; setEditingRoom(room); setFormData({ roomNumber: room.roomNumber, type: room.type, floor: room.floor, capacity: room.capacity, description: room.description || '' }); setShowForm(true); };
    const handleDeactivate = async (id) => { if (!window.confirm('Désactiver cette chambre ?')) return; try { await API.put(`/rooms/${id}`, { isActive: false }); fetchRooms(); } catch (err) { setError(err.response?.data?.error); } };
    const handleActivate = async (id) => { if (!window.confirm('Activer cette chambre ?')) return; try { await API.put(`/rooms/${id}`, { isActive: true }); fetchRooms(); } catch (err) { setError(err.response?.data?.error); } };
    if (loading) return <div className="loading-state"><div className="spinner"></div><span>Chargement...</span></div>;

    return (
        <div className="rooms-app">
            <div className="header">
                <h1>Chambres</h1>
                {isAdmin && <button className="btn-add" onClick={() => setShowForm(true)}>➕ Ajouter</button>}
            </div>
            {error && <div className="error-message">{error}</div>}
            {showForm && isAdmin && (
                <div className="form-card">
                    <h2>{editingRoom ? 'Modifier chambre' : 'Nouvelle chambre'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <input type="text" name="roomNumber" placeholder="Numéro" value={formData.roomNumber} onChange={handleInputChange} required />
                            <select name="type" value={formData.type} onChange={handleInputChange}><option value="single">Single</option><option value="double">Double</option><option value="suite">Suite</option></select>
                            <input type="number" name="floor" placeholder="Étage" value={formData.floor} onChange={handleInputChange} required />
                            <input type="number" name="capacity" placeholder="Capacité" value={formData.capacity} onChange={handleInputChange} required />
                            <textarea name="description" placeholder="Description" value={formData.description} onChange={handleInputChange} rows="2" style={{ gridColumn: 'span 2' }} />
                        </div>
                        <div style={{ marginTop: '1rem' }}><button type="submit" className="btn-submit">Enregistrer</button><button type="button" className="btn-cancel" onClick={resetForm}>Annuler</button></div>
                    </form>
                </div>
            )}
            <div className="table-card">
                <table className="room-table">
                    <thead><tr><th>Numéro</th><th>Type</th><th>Étage</th><th>Capacité</th><th>Description</th><th>Statut</th>{isAdmin && <th>Actions</th>}</tr></thead>
                    <tbody>
                        {rooms.map(room => (
                            <tr key={room.id}>
                                <td>{room.roomNumber}</td><td>{room.type}</td><td>{room.floor}</td><td>{room.capacity}</td><td>{room.description}</td><td>{room.isActive ? 'Actif' : 'Inactif'}</td>
                                {isAdmin && (
                                    <td>
                                        <button className="btn-action btn-equip" onClick={() => handleOpenEquipmentModal(room)}>⚙️</button>
                                        <button className="btn-action btn-edit" onClick={() => handleEdit(room)}>✏️</button>
                                        {room.isActive ? <button className="btn-action btn-deactivate" onClick={() => handleDeactivate(room.id)}>🔴</button> : <button className="btn-action btn-activate" onClick={() => handleActivate(room.id)}>🟢</button>}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showEquipmentModal && selectedRoom && (
    <div className="modal-overlay">
        <div className="modal-container equipment-modal">
            <div className="modal-header">
                <h3>🛠️ Équipements – Chambre {selectedRoom.roomNumber}</h3>
                <button className="modal-close" onClick={() => setShowEquipmentModal(false)}>✕</button>
            </div>
            <div className="modal-body">
                <div className="equipment-section">
                    <h4>📋 Équipements actuels</h4>
                    <ul className="equipment-list">
                        {roomEquipment.length === 0 ? <li className="empty-tag">Aucun équipement</li> : 
                            roomEquipment.map(eq => (
                                <li key={eq.id}>
                                    {eq.name}
                                    <button 
                                        className="remove-btn"
                                        onClick={() => removeEquipmentFromRoom(eq.id)}
                                    >
                                        Retirer
                                    </button>
                                </li>
                            ))
                        }
                    </ul>
                </div>
                <div className="equipment-section">
                    <h4>➕ Ajouter un équipement</h4>
                    <select 
                        onChange={(e) => addEquipmentToRoom(e.target.value)} 
                        defaultValue=""
                        className="equipment-select"
                    >
                        <option value="" disabled>-- Choisir --</option>
                        {allEquipment
                            .filter(eq => !roomEquipment.some(re => re.id === eq.id))
                            .map(eq => (
                                <option key={eq.id} value={eq.id}>{eq.name}</option>
                            ))
                        }
                    </select>
                </div>
            </div>
        </div>
    </div>
)}
        </div>
    );
};
export default Rooms;