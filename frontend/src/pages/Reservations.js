import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Reservations.css';

/* ─── Chargement jsPDF + autoTable via CDN pour le PDF ─── */
const loadScript = (src) =>
    new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });

const loadJsPDF = async () => {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
    return window.jspdf.jsPDF;
};

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
        numberOfGuests: 1,
        discountPercent: 0
    });
    const [editingReservation, setEditingReservation] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editError, setEditError] = useState('');
    const [editForm, setEditForm] = useState({
        roomId: '',
        checkInDate: '',
        checkOutDate: '',
        numberOfGuests: 1,
        discountPercent: 0
    });
    
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        if (editError) {
            const timer = setTimeout(() => setEditError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [editError]);

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
            setError('Erreur chargement');
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await API.get('/clients');
            setClients(res.data.filter(c => c.isActive));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchRooms = async () => {
        try {
            const res = await API.get('/rooms');
            setRooms(res.data.filter(r => r.isActive));
        } catch (err) {
            console.error(err);
        }
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const resetForm = () => {
        setFormData({ clientId: '', roomId: '', checkInDate: '', checkOutDate: '', numberOfGuests: 1, discountPercent: 0 });
        setShowForm(false);
    };
    const handleCreateReservation = async (e) => {
        e.preventDefault();
        try {
            await API.post('/reservations', formData);
            resetForm();
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error);
        }
    };
    const handleEditClick = (res) => {
        if (res.status !== 'pending' && res.status !== 'confirmed') {
            setError('Impossible de modifier après check-in');
            return;
        }
        setEditingReservation(res);
        setEditForm({
            roomId: res.roomId,
            checkInDate: res.checkInDate.split('T')[0],
            checkOutDate: res.checkOutDate.split('T')[0],
            numberOfGuests: res.numberOfGuests,
            discountPercent: res.discountPercent || 0
        });
        setEditError('');
        setShowEditModal(true);
    };
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.put(`/reservations/${editingReservation.id}`, editForm);
            setShowEditModal(false);
            setEditError('');
            fetchReservations();
        } catch (err) {
            setEditError(err.response?.data?.error);
        }
    };
    const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });
    const handleConfirm = async (id) => {
        try {
            await API.put(`/reservations/${id}/confirm`);
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error);
        }
    };
    const handleCheckIn = async (id) => {
        try {
            await API.put(`/reservations/${id}/checkin`);
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error);
        }
    };
    const handleCheckOut = async (id) => {
        try {
            await API.put(`/reservations/${id}/checkout`);
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error);
        }
    };
    const handleCancel = async (id) => {
        if (!window.confirm('Annuler définitivement ?')) return;
        try {
            await API.delete(`/reservations/${id}`);
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.error);
        }
    };

    /* ── Génération PDF pour une facture individuelle (comme dans Invoices) ── */
    const handleDownloadInvoicePDF = async (reservationId) => {
        try {
            const invoiceRes = await API.get(`/reservations/${reservationId}/invoice`);
            const invoice = invoiceRes.data;
            if (!invoice || !invoice.invoiceNumber) {
                setError('Aucune facture trouvée pour cette réservation.');
                return;
            }

            const reservation = reservations.find(r => r.id === reservationId);
            const clientName = reservation?.clientName || `Client #${reservation?.clientId}`;
            const clientIdCard = reservation?.clientIdCard || '—';

            const jsPDF = await loadJsPDF();
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const pageW = doc.internal.pageSize.getWidth();
            const marginL = 14;
            const marginR = 14;
            const contentW = pageW - marginL - marginR;

            const PRIMARY = [42, 26, 94];
            const ACCENT = [255, 111, 21];
            const LIGHT_BG = [254, 249, 244];
            const GRAY_TEXT = [75, 85, 99];
            const BORDER = [229, 231, 235];

            // En-tête
            doc.setFillColor(...PRIMARY);
            doc.rect(0, 0, pageW, 28, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(255, 255, 255);
            doc.text('Facture', marginL, 12);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(200, 195, 230);
            const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
            doc.text(`Édité le ${dateStr}`, marginL, 20);
            doc.setFillColor(...ACCENT);
            doc.rect(0, 27, pageW, 1.5, 'F');

            // Bloc client
            const clientY = 36;
            doc.setFillColor(...LIGHT_BG);
            doc.roundedRect(marginL, clientY, contentW, 18, 3, 3, 'F');
            doc.setDrawColor(...ACCENT);
            doc.setLineWidth(0.8);
            doc.line(marginL, clientY, marginL, clientY + 18);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(...PRIMARY);
            doc.text(clientName, marginL + 5, clientY + 7);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...GRAY_TEXT);
            doc.text(`N° pièce d'identité : ${clientIdCard}`, marginL + 5, clientY + 13);

            // Tableau récapitulatif
            const recapRows = [[
                invoice.invoiceNumber,
                `#${invoice.reservationId}`,
                new Date(invoice.issueDate).toLocaleDateString('fr-FR'),
                `${parseFloat(invoice.totalAmount || 0).toFixed(2)} €`,
                `${parseFloat(invoice.discount || 0).toFixed(2)} €`,
                `${parseFloat(invoice.finalAmount || 0).toFixed(2)} €`,
            ]];

            doc.autoTable({
                startY: clientY + 24,
                head: [['N° Facture', 'Réservation', "Date d'émission", 'Montant HT', 'Remise', 'Total TTC']],
                body: recapRows,
                margin: { left: marginL, right: marginR },
                tableWidth: contentW,
                headStyles: {
                    fillColor: PRIMARY,
                    textColor: [255,255,255],
                    fontStyle: 'bold',
                    fontSize: 9,
                    halign: 'left',
                    cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
                },
                bodyStyles: {
                    fontSize: 9,
                    textColor: [55,65,81],
                    cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
                    lineColor: BORDER,
                    lineWidth: 0.2,
                },
                alternateRowStyles: { fillColor: LIGHT_BG },
                columnStyles: {
                    0: { fontStyle: 'bold', textColor: PRIMARY },
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    5: { halign: 'right', fontStyle: 'bold', textColor: ACCENT },
                },
            });

            let currentY = doc.lastAutoTable.finalY + 4;

            // Détail des nuitées
            let details = [];
            try {
                if (invoice.details) {
                    if (Array.isArray(invoice.details)) details = invoice.details;
                    else if (typeof invoice.details === 'string') details = JSON.parse(invoice.details);
                }
            } catch(e) { details = []; }

            if (details.length > 0) {
                const detailRows = details.map(d => [d.date, `${d.price} €`, d.roomType, d.roomNumber]);
                doc.autoTable({
                    startY: currentY,
                    head: [['Date', 'Prix par nuit', 'Type chambre', 'N° chambre']],
                    body: detailRows,
                    margin: { left: marginL, right: marginR },
                    tableWidth: contentW,
                    headStyles: {
                        fillColor: PRIMARY,
                        textColor: [255,255,255],
                        fontStyle: 'bold',
                        fontSize: 9,
                    },
                    bodyStyles: { fontSize: 10, textColor: [55,65,81] },
                });
            } else {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(9);
                doc.setTextColor(...GRAY_TEXT);
                doc.text('Aucune nuitée enregistrée', marginL, currentY);
            }

            // Pied de page
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                const footerY = doc.internal.pageSize.getHeight() - 8;
                doc.setDrawColor(...BORDER);
                doc.setLineWidth(0.3);
                doc.line(marginL, footerY - 3, pageW - marginR, footerY - 3);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(156, 163, 175);
                doc.text('Document confidentiel — généré automatiquement', marginL, footerY);
                doc.text(`Page ${i} / ${totalPages}`, pageW - marginR, footerY, { align: 'right' });
            }

            const filename = `facture_${invoice.invoiceNumber}.pdf`;
            doc.save(filename);
        } catch (err) {
            console.error('Erreur PDF :', err);
            setError(`Erreur génération PDF : ${err.message}`);
        }
    };

    const getStatusColor = (status) => ({ pending: '#f39c12', confirmed: '#3498db', checked_in: '#2ecc71', checked_out: '#95a5a6', cancelled: '#e74c3c' }[status] || '#7f8c8d');

    if (loading) return <div className="loading-state"><div className="spinner"></div><span>Chargement...</span></div>;

    return (
        <div className="reservations-app">
            <div className="header">
                <h1>Réservations</h1>
                <button className="btn-add" onClick={() => setShowForm(true)}>➕ Nouvelle réservation</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {showForm && (
                <div className="form-card">
                    <h2>📝 Créer une réservation</h2>
                    <form onSubmit={handleCreateReservation}>
                        <div className="form-grid">
                            <div>
                                <label>👤 Client *</label>
                                <select name="clientId" value={formData.clientId} onChange={handleInputChange} required>
                                    <option value="">Sélectionner un client</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName} - {c.idCardNumber}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>🛏️ Chambre *</label>
                                <select name="roomId" value={formData.roomId} onChange={handleInputChange} required>
                                    <option value="">Sélectionner une chambre</option>
                                    {rooms.map(r => (
                                        <option key={r.id} value={r.id}>{r.roomNumber} - {r.type} (capacité {r.capacity})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>📅 Date d'arrivée *</label>
                                <input type="date" name="checkInDate" value={formData.checkInDate} onChange={handleInputChange} required />
                            </div>
                            <div>
                                <label>📅 Date de départ *</label>
                                <input type="date" name="checkOutDate" value={formData.checkOutDate} onChange={handleInputChange} required />
                            </div>
                            <div>
                                <label>👥 Nombre de personnes *</label>
                                <input type="number" name="numberOfGuests" min="1" value={formData.numberOfGuests} onChange={handleInputChange} required />
                            </div>
                            <div>
                                <label>🏷️ Remise (%)</label>
                                <input type="number" name="discountPercent" min="0" max="100" step="1" value={formData.discountPercent} onChange={handleInputChange} placeholder="Ex: 10 pour 10%" />
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem' }}>
                            <button type="submit" className="btn-submit">Créer</button>
                            <button type="button" className="btn-cancel" onClick={resetForm}>Annuler</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-card">
                <table className="res-table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Client</th><th>Chambre</th><th>Arrivée</th><th>Départ</th><th>Personnes</th><th>Statut</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservations.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#6b6b80' }}>
                                    Aucune réservation trouvée.
                                </td>
                            </tr>
                        ) : (
                            reservations.map(res => (
                                <tr key={res.id}>
                                    <td>{res.id}</td>
                                    <td>{res.clientName || `#${res.clientId}`}</td>
                                    <td>{res.roomNumber || `#${res.roomId}`}</td>
                                    <td>{new Date(res.checkInDate).toLocaleDateString()}</td>
                                    <td>{new Date(res.checkOutDate).toLocaleDateString()}</td>
                                    <td>{res.numberOfGuests}</td>
                                    <td style={{ color: getStatusColor(res.status), fontWeight: 'bold' }}>{res.status}</td>
                                    <td>
                                        {(res.status === 'pending' || res.status === 'confirmed') && <button className="btn-action" onClick={() => handleEditClick(res)}>✏️</button>}
                                        {res.status === 'pending' && <button className="btn-action" onClick={() => handleConfirm(res.id)}>✅</button>}
                                        {res.status === 'confirmed' && <button className="btn-action" onClick={() => handleCheckIn(res.id)}>▶️</button>}
                                        {res.status === 'checked_in' && <button className="btn-action" onClick={() => handleCheckOut(res.id)}>⏹️</button>}
                                        {(res.status === 'pending' || res.status === 'confirmed') && <button className="btn-action" onClick={() => handleCancel(res.id)}>❌</button>}
                                        {res.status === 'checked_out' && (
                                            <button className="btn-action" onClick={() => handleDownloadInvoicePDF(res.id)}>📥</button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showEditModal && editingReservation && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>✏️ Modifier réservation #{editingReservation.id}</h2>
                        {editError && <div className="error-message" style={{ marginBottom: '1rem' }}>{editError}</div>}
                        <form onSubmit={handleEditSubmit}>
                            <div className="edit-form-grid">
                                <div>
                                    <label>🛏️ Chambre</label>
                                    <select name="roomId" value={editForm.roomId} onChange={handleEditChange} required>
                                        {rooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber} - {r.type}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label>📅 Date d'arrivée</label>
                                    <input type="date" name="checkInDate" value={editForm.checkInDate} onChange={handleEditChange} required />
                                </div>
                                <div>
                                    <label>📅 Date de départ</label>
                                    <input type="date" name="checkOutDate" value={editForm.checkOutDate} onChange={handleEditChange} required />
                                </div>
                                <div>
                                    <label>👥 Nombre de personnes</label>
                                    <input type="number" name="numberOfGuests" min="1" value={editForm.numberOfGuests} onChange={handleEditChange} required />
                                </div>
                                <div>
                                    <label>🏷️ Remise (%)</label>
                                    <input type="number" name="discountPercent" min="0" max="100" step="1" value={editForm.discountPercent} onChange={handleEditChange} />
                                </div>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <button type="submit" className="btn-submit">Enregistrer</button>
                                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reservations;