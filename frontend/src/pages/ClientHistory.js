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
        const trimmed = idCardNumber.trim().toUpperCase();
        if (!trimmed) {
            setError('Veuillez saisir votre numéro de pièce d\'identité');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await API.get(`/public/client-reservations/${trimmed}`);
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
            <div className="ch-card">
                <h1>📋 Mes réservations</h1>
                <form onSubmit={handleSearch} className="ch-form">
                    <div className="ch-input-group">
                        <label>Numéro de pièce d'identité (CIN)</label>
                        <input
                            type="text"
                            value={idCardNumber}
                            onChange={(e) => setIdCardNumber(e.target.value.toUpperCase())}
                            placeholder="Ex: DB2026"
                            required
                        />
                    </div>
                    <button type="submit" className="ch-btn-search" disabled={loading}>
                        {loading ? 'Recherche...' : '🔍 Consulter'}
                    </button>
                </form>

                {error && <div className="ch-error-message">{error}</div>}

                {client && (
                    <div className="ch-results">
                        <h2>Bienvenue {client.firstName} {client.lastName}</h2>
                        {reservations.length === 0 ? (
                            <p>Aucune réservation trouvée.</p>
                        ) : (
                            <div className="ch-reservations-list">
                                {reservations.map((res) => (
                                    <div key={res.id} className="ch-reservation-card">
                                        <div className="ch-res-header">
                                            <span>Réservation #{res.id}</span>
                                            <span className={`ch-status ${res.status}`}>{res.status}</span>
                                        </div>
                                        <div className="ch-res-dates">
                                            Du {formatDate(res.checkInDate)} au {formatDate(res.checkOutDate)}
                                        </div>
                                        <div className="ch-res-room">
                                            Chambre {res.roomNumber || `#${res.roomId}`}
                                        </div>
                                        <div className="ch-res-guests">
                                            {res.numberOfGuests} personne(s)
                                        </div>
                                        <div className="ch-res-price">
                                            {res.status === 'cancelled' && res.cancellationFee ? (
                                                <>Pénalité : {res.cancellationFee} €</>
                                            ) : (
                                                <>Prix total : {res.total_price ? `${res.total_price} €` : (res.totalPrice ? `${res.totalPrice} €` : 'N/A')}</>
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