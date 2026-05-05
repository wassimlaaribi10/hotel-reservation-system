import React, { useState, useEffect } from 'react';
import API from '../services/api';
import './Availability.css';

const Availability = () => {
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [roomType, setRoomType] = useState('');
    const [availableRooms, setAvailableRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!checkIn || !checkOut) { setError('Veuillez sélectionner les deux dates'); return; }
        setLoading(true);
        try {
            let url = `/rooms/available?checkIn=${checkIn}&checkOut=${checkOut}`;
            if (roomType) url += `&type=${roomType}`;
            const res = await API.get(url);
            setAvailableRooms(res.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur recherche');
            setAvailableRooms([]);
        } finally { setLoading(false); }
    };

    return (
        <div className="availability-app">
            <h1>Disponibilité des chambres</h1>
            <div className="form-card">
                <form onSubmit={handleSearch}>
                    <div className="grid-form">
                        <div><label>Arrivée</label><input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required /></div>
                        <div><label>Départ</label><input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required /></div>
                        <div><label>Type (optionnel)</label><select value={roomType} onChange={e => setRoomType(e.target.value)}><option value="">Tous</option><option value="single">Single</option><option value="double">Double</option><option value="suite">Suite</option></select></div>
                        <button type="submit" className="btn-search">🔍 Rechercher</button>
                    </div>
                </form>
            </div>
            {error && <div className="error-message">{error}</div>}
            {loading && <div className="loading-state"><div className="spinner"></div><span>Recherche...</span></div>}
            {!loading && availableRooms.length > 0 && (
                <div>
                    {availableRooms.map(room => (
                        <div key={room.id} className="room-card">
                            <div className="room-number">Chambre {room.roomNumber}</div>
                            <div>Type : {room.type}, Étage {room.floor}, Capacité {room.capacity}</div>
                            <div>{room.description}</div>
                        </div>
                    ))}
                </div>
            )}
            {!loading && availableRooms.length === 0 && checkIn && checkOut && <div className="room-card">Aucune chambre disponible pour ces dates.</div>}
        </div>
    );
};
export default Availability;