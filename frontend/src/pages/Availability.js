import React, { useState } from 'react';
import API from '../services/api';

const Availability = () => {
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [roomType, setRoomType] = useState('');
    const [availableRooms, setAvailableRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!checkIn || !checkOut) {
            setError('Please select both check-in and check-out dates');
            return;
        }
        setLoading(true);
        setError('');
        try {
            let url = `/rooms/available?checkIn=${checkIn}&checkOut=${checkOut}`;
            if (roomType) url += `&type=${roomType}`;
            const res = await API.get(url);
            setAvailableRooms(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch available rooms');
            setAvailableRooms([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Check Room Availability</h1>
            <form onSubmit={handleSearch} style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                    <div>
                        <label>Check-in Date *</label><br />
                        <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
                    </div>
                    <div>
                        <label>Check-out Date *</label><br />
                        <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
                    </div>
                    <div>
                        <label>Room Type (optional)</label><br />
                        <select value={roomType} onChange={(e) => setRoomType(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                            <option value="">All</option>
                            <option value="single">Single</option>
                            <option value="double">Double</option>
                            <option value="suite">Suite</option>
                        </select>
                    </div>
                    <div>
                        <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px' }}>Search</button>
                    </div>
                </div>
            </form>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            {loading && <div>Loading available rooms...</div>}

            {availableRooms.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f2f2f2' }}>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Room Number</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Type</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Floor</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Capacity</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {availableRooms.map(room => (
                            <tr key={room.id}>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{room.roomNumber}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{room.type}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{room.floor}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{room.capacity}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{room.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {!loading && availableRooms.length === 0 && checkIn && checkOut && (
                <div>No rooms available for the selected dates.</div>
            )}
        </div>
    );
};

export default Availability;