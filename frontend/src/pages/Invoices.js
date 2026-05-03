import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const Invoices = () => {
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const res = await API.get('/clients');
            setClients(res.data.filter(c => c.isActive));
        } catch (err) {
            setError('Failed to load clients');
        }
    };

    const fetchInvoices = async () => {
        if (!selectedClientId) return;
        setLoading(true);
        try {
            const res = await API.get(`/clients/${selectedClientId}/invoices`);
            setInvoices(res.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch invoices');
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedClientId) {
            fetchInvoices();
        }
    }, [selectedClientId]);

    return (
        <div>
            <h1>Invoices</h1>
            <div style={{ marginBottom: '20px' }}>
                <label>Select Client: </label>
                <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    style={{ padding: '8px', marginLeft: '10px', width: '300px' }}
                >
                    <option value="">-- Choose a client --</option>
                    {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName} - {c.idCardNumber}</option>
                    ))}
                </select>
                {selectedClientId && (
                    <button onClick={fetchInvoices} style={{ marginLeft: '10px', padding: '8px 16px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px' }}>
                        Refresh
                    </button>
                )}
            </div>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            {loading && <div>Loading invoices...</div>}

            {selectedClientId && !loading && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f2f2f2' }}>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Invoice #</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Reservation ID</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Issue Date</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Total Amount</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Discount</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Final Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No invoices for this client.</td></tr>
                        ) : (
                            invoices.map(inv => (
                                <tr key={inv.id}>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{inv.invoiceNumber}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{inv.reservationId}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(inv.issueDate).toLocaleDateString()}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{inv.totalAmount} €</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{inv.discount} €</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{inv.finalAmount} €</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Invoices;