import React, { useState } from 'react';
import API from '../services/api';
import './ClientHistory.css';

const ClientHistory = () => {
    const [idCardNumber, setIdCardNumber] = useState('');
    const [client, setClient] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!idCardNumber.trim().toUpperCase()) {
            setError('Veuillez saisir votre numéro de pièce d\'identité');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await API.get(`/public/client-reservations/${idCardNumber}`);
            setClient(res.data.client);
            setReservations(res.data.reservations);
        } catch (err) {
            setError(err.response?.data?.error || 'Aucune réservation trouvée pour ce numéro');
            setClient(null);
            setReservations([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('fr-FR');

    return (
        <div className="client-history-app">
            <div className="history-card">
                <h1>📋 Mes réservations</h1>
                <form onSubmit={handleSearch}>
                    <div className="input-group">
                        <label>Numéro de pièce d'identité (CIN)</label>
                        <input
                            type="text"
                            value={idCardNumber}
                            onChange={(e) => setIdCardNumber(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-search" disabled={loading}>
                        {loading ? 'Recherche...' : '🔍 Consulter'}
                    </button>
                </form>

                {error && <div className="error-message">{error}</div>}

                {client && (
                    <div className="results">
                        <h2>Bienvenue {client.firstName} {client.lastName}</h2>
                        {reservations.length === 0 ? (
                            <p>Aucune réservation trouvée.</p>
                        ) : (
                            <div className="reservations-list">
                                {reservations.map(res => (
                                    <div key={res.id} className="reservation-card">
                                        <div className="res-header">
                                            <span>Réservation #{res.id}</span>
                                            <span className={`status ${res.status}`}>{res.status}</span>
                                        </div>
                                        <div className="res-dates">
                                            📅 Du {formatDate(res.checkInDate)} au {formatDate(res.checkOutDate)}
                                        </div>
                                        <div className="res-room">
                                            🛏️ Chambre {res.roomNumber || `#${res.roomId}`}
                                        </div>
                                        <div className="res-guests">
                                            👥 {res.numberOfGuests} personne(s)
                                        </div>
                                        <div className="res-price">
                                            {res.status === 'cancelled' && res.cancellationFee ? (
                                                <>💰 Pénalité : {res.cancellationFee} €</>
                                            ) : (
                                                <>💰 Prix total : {res.totalPrice ? `${res.totalPrice} €` : 'N/A'}</>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientHistory;