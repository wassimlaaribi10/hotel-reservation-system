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
        if (!checkIn || !checkOut) {
            setError('Veuillez sélectionner les deux dates');
            return;
        }
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="availability-app">
            <h1>Vérifier la disponibilité</h1>
            <div className="form-card">
                <form onSubmit={handleSearch}>
                    <div className="grid-form">
                        <div className="form-field">
                            <label>📅 Date d'arrivée</label>
                            <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required />
                        </div>
                        <div className="form-field">
                            <label>📅 Date de départ</label>
                            <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required />
                        </div>
                        <div className="form-field">
                            <label>🛏️ Type de chambre (optionnel)</label>
                            <select value={roomType} onChange={e => setRoomType(e.target.value)}>
                                <option value="">Tous les types</option>
                                <option value="single">Single</option>
                                <option value="double">Double</option>
                                <option value="suite">Suite</option>
                            </select>
                        </div>
                        <div className="form-field button-field">
                            <button type="submit" className="btn-search">
                                🔍 Rechercher
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {error && <div className="error-message">{error}</div>}
            {loading && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <span>Recherche en cours...</span>
                </div>
            )}

            {!loading && availableRooms.length > 0 && (
                <div className="results">
                    <h2>Chambres disponibles</h2>
                    {availableRooms.map(room => (
                        <div key={room.id} className="room-card">
                            <div className="room-number">Chambre {room.roomNumber}</div>
                            <div>Type : {room.type}, Étage {room.floor}, Capacité {room.capacity} personnes</div>
                            <div>{room.description}</div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && availableRooms.length === 0 && checkIn && checkOut && (
                <div className="room-card no-result">Aucune chambre disponible pour ces dates.</div>
            )}
        </div>
    );
};

export default Availability;