import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import './SeasonalPrices.css';

const SeasonalPrices = () => {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        room_type: 'single',
        season_name: 'high',
        price_per_night: '',
        valid_from: '',
        valid_to: ''
    });

    const { user } = useAuth();

    useEffect(() => { fetchPrices(); }, []);

    const fetchPrices = async () => {
        try {
            const res = await API.get('/admin/seasonal-prices');
            setPrices(res.data);
        } catch (err) {
            setError('Erreur chargement des tarifs');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const resetForm = () => {
        setFormData({
            room_type: 'single',
            season_name: 'high',
            price_per_night: '',
            valid_from: '',
            valid_to: ''
        });
        setEditing(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const price = parseFloat(formData.price_per_night);
        if (isNaN(price) || price <= 0) {
            setError('Le prix doit être un nombre positif');
            return;
        }
        try {
            if (editing) {
                await API.put(`/admin/seasonal-prices/${editing.id}`, { ...formData, price_per_night: price });
            } else {
                await API.post('/admin/seasonal-prices', { ...formData, price_per_night: price });
            }
            resetForm();
            fetchPrices();
        } catch (err) {
            setError(err.response?.data?.error || 'Opération échouée');
        }
    };

    const handleEdit = (price) => {
        setEditing(price);
        setFormData({
            room_type: price.room_type,
            season_name: price.season_name,
            price_per_night: price.price_per_night,
            valid_from: price.valid_from ? price.valid_from.split('T')[0] : '',
            valid_to: price.valid_to ? price.valid_to.split('T')[0] : ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce tarif saisonnier ?')) return;
        try {
            await API.delete(`/admin/seasonal-prices/${id}`);
            fetchPrices();
        } catch (err) {
            setError(err.response?.data?.error || 'Échec suppression');
        }
    };

    const getRoomTypeLabel = (type) => {
        switch(type) {
            case 'single': return 'Single';
            case 'double': return 'Double';
            case 'suite': return 'Suite';
            default: return type;
        }
    };

    const getSeasonLabel = (season) => {
        switch(season) {
            case 'high': return 'Haute saison';
            case 'low': return 'Basse saison';
            case 'special': return 'Période spéciale';
            default: return season;
        }
    };

    if (loading) return <div className="loading-state"><div className="spinner"></div><span>Chargement...</span></div>;

    return (
        <div className="seasonal-prices-app">
            <div className="header">
                <h1>Tarifs saisonniers</h1>
                <button className="btn-add" onClick={() => { resetForm(); setShowForm(true); }}>➕ Ajouter un tarif</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {showForm && (
                <div className="form-card">
                    <h2>{editing ? 'Modifier le tarif' : 'Nouveau tarif saisonnier'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Type de chambre</label>
                                <select name="room_type" value={formData.room_type} onChange={handleChange} required>
                                    <option value="single">Single</option>
                                    <option value="double">Double</option>
                                    <option value="suite">Suite</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Saison</label>
                                <select name="season_name" value={formData.season_name} onChange={handleChange} required>
                                    <option value="high">Haute saison</option>
                                    <option value="low">Basse saison</option>
                                    <option value="special">Période spéciale</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>💰 Prix par nuit (€)</label>
                                <input type="number" name="price_per_night" value={formData.price_per_night} onChange={handleChange} step="0.01" min="0" required />
                            </div>
                            <div className="form-group">
                                <label>📅 Date début (optionnel)</label>
                                <input type="date" name="valid_from" value={formData.valid_from} onChange={handleChange} />
                                <small>Laissez vide pour permanent</small>
                            </div>
                            <div className="form-group">
                                <label>📅 Date fin (optionnel)</label>
                                <input type="date" name="valid_to" value={formData.valid_to} onChange={handleChange} />
                                <small>Laissez vide si pas de fin</small>
                            </div>
                        </div>
                        {formData.valid_from && formData.valid_to && (
                            <div className="info-badge">
                                📌 Ce tarif s’appliquera du {new Date(formData.valid_from).toLocaleDateString()} 
                                au {new Date(formData.valid_to).toLocaleDateString()}
                            </div>
                        )}
                        <div className="form-actions">
                            <button type="submit" className="btn-submit">{editing ? 'Mettre à jour' : 'Créer'}</button>
                            <button type="button" className="btn-cancel" onClick={resetForm}>Annuler</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-card">
                <table className="prices-table">
                    <thead>
                        <tr>
                            <th>Type chambre</th>
                            <th>Saison</th>
                            <th>Prix (€/nuit)</th>
                            <th>Date début</th>
                            <th>Date fin</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prices.length === 0 ? (
                            <tr><td colSpan="6" className="empty-state">Aucun tarif saisonnier défini.</td></tr>
                        ) : (
                            prices.map(price => (
                                <tr key={price.id}>
                                    <td>{getRoomTypeLabel(price.room_type)}</td>
                                    <td>{getSeasonLabel(price.season_name)}</td>
                                    <td>{price.price_per_night} €</td>
                                    <td>{price.valid_from ? new Date(price.valid_from).toLocaleDateString() : '—'}</td>
                                    <td>{price.valid_to ? new Date(price.valid_to).toLocaleDateString() : '—'}</td>
                                    <td>
                                        <button className="btn-action btn-edit" onClick={() => handleEdit(price)}>✏️</button>
                                        <button className="btn-action btn-delete" onClick={() => handleDelete(price.id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SeasonalPrices;