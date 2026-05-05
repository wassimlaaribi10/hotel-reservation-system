import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Invoices.css';

/* ─── Chargement jsPDF + autoTable via CDN (évite tout problème de bundler) ─── */
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

/* ─────────────────────────────────────────────────────────────────────────── */

const Invoices = () => {
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();

        useEffect(() => {
            if (error) {
                const timer = setTimeout(() => setError(''), 5000);
                return () => clearTimeout(timer);
            }
        }, [error]);

    useEffect(() => { fetchClients(); }, []);

    const fetchClients = async () => {
        try {
            const res = await API.get('/clients');
            setClients(res.data.filter(c => c.isActive));
        } catch {
            setError('Impossible de charger les clients');
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
            setError(err.response?.data?.error || 'Impossible de charger les factures');
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedClientId) fetchInvoices();
        else setInvoices([]);
    }, [selectedClientId]);

    const selectedClient = clients.find(c => c.id === parseInt(selectedClientId));

    /* ── Génération PDF ────────────────────────────────────────────────────── */
    const handleDownloadPDF = async () => {
        if (!invoices.length) return;
        setPdfLoading(true);
        setError('');

        try {
            const jsPDF = await loadJsPDF();

            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const pageW    = doc.internal.pageSize.getWidth();
            const marginL  = 14;
            const marginR  = 14;
            const contentW = pageW - marginL - marginR;

            const PRIMARY   = [42,  26,  94];
            const ACCENT    = [255, 111, 21];
            const LIGHT_BG  = [254, 249, 244];
            const GRAY_TEXT = [75,  85,  99];
            const BORDER    = [229, 231, 235];

            // En-tête
            doc.setFillColor(...PRIMARY);
            doc.rect(0, 0, pageW, 28, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(255, 255, 255);
            doc.text('Relevé de facturation', marginL, 12);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(200, 195, 230);
            const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
            doc.text(
                `Édité le ${dateStr}   |   Par : ${user?.name || user?.email || '—'}`,
                marginL, 20
            );

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
            doc.text(
                `${selectedClient?.firstName || ''} ${selectedClient?.lastName || ''}`,
                marginL + 5, clientY + 7
            );

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...GRAY_TEXT);
            doc.text(
                `N° pièce d'identité : ${selectedClient?.idCardNumber || '—'}   |   ${invoices.length} facture${invoices.length > 1 ? 's' : ''}`,
                marginL + 5, clientY + 13
            );

            // Tableau
            const rows = invoices.map(inv => [
                inv.invoiceNumber,
                `#${inv.reservationId}`,
                new Date(inv.issueDate).toLocaleDateString('fr-FR'),
                `${parseFloat(inv.totalAmount  || 0).toFixed(2)} €`,
                `${parseFloat(inv.discount     || 0).toFixed(2)} €`,
                `${parseFloat(inv.finalAmount  || 0).toFixed(2)} €`,
            ]);

            doc.autoTable({
                startY: clientY + 24,
                head: [['N° Facture', 'Réservation', "Date d'émission", 'Montant HT', 'Remise', 'Total TTC']],
                body: rows,
                margin: { left: marginL, right: marginR },
                tableWidth: contentW,
                headStyles: {
                    fillColor: PRIMARY,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8,
                    halign: 'left',
                    cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: [55, 65, 81],
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
                showHead: 'everyPage',
                didDrawPage: (data) => {
                    const total   = doc.internal.getNumberOfPages();
                    const current = data.pageNumber;
                    const footerY = doc.internal.pageSize.getHeight() - 8;

                    doc.setDrawColor(...BORDER);
                    doc.setLineWidth(0.3);
                    doc.line(marginL, footerY - 3, pageW - marginR, footerY - 3);

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7);
                    doc.setTextColor(156, 163, 175);
                    doc.text('Document confidentiel — généré automatiquement', marginL, footerY);
                    doc.text(`Page ${current} / ${total}`, pageW - marginR, footerY, { align: 'right' });
                },
            });

            const filename = `factures_${selectedClient?.lastName || 'client'}_${selectedClient?.firstName || ''}_${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(filename);

        } catch (err) {
            console.error('Erreur PDF :', err);
            setError(`Erreur génération PDF : ${err.message}`);
        } finally {
            setPdfLoading(false);
        }
    };

    return (
        <div className="invoice-app">
            <div className="container">

                <div className="header">
                    <div className="header-left">
                        <h1>Factures</h1>
                        <p>Consultez et exportez les factures de vos clients</p>
                    </div>
                    <div className="badge">
                        {selectedClientId ? `${invoices.length} facture(s)` : 'Sélectionnez un client'}
                    </div>
                </div>

                <div className="filter-card">
                    <div className="filter-group">
                        <label>👤 Client</label>
                        <div className="custom-select">
                            <select
                                value={selectedClientId}
                                onChange={(e) => setSelectedClientId(e.target.value)}
                            >
                                <option value="">-- Choisir un client --</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.firstName} {c.lastName} — {c.idCardNumber}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <button
                            className="btn-print"
                            onClick={handleDownloadPDF}
                            disabled={!selectedClientId || invoices.length === 0 || pdfLoading}
                        >
                            {pdfLoading
                                ? <><span className="btn-spinner"></span> Génération…</>
                                : <>📄 Télécharger PDF</>
                            }
                        </button>
                    </div>
                </div>

                {error && <div className="error-message"><span>⚠️</span> {error}</div>}
                {loading && (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <span>Chargement…</span>
                    </div>
                )}

                {selectedClientId && !loading && (
                    <div className="table-card">
                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th>N° Facture</th>
                                    <th>Réservation</th>
                                    <th>Date d'émission</th>
                                    <th style={{ textAlign: 'right' }}>Montant HT</th>
                                    <th style={{ textAlign: 'right' }}>Remise</th>
                                    <th style={{ textAlign: 'right' }}>Total TTC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="empty-state">
                                            Aucune facture pour ce client.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td className="invoice-number">{inv.invoiceNumber}</td>
                                            <td>#{inv.reservationId}</td>
                                            <td>{new Date(inv.issueDate).toLocaleDateString('fr-FR')}</td>
                                            <td className="amount" style={{ textAlign: 'right' }}>
                                                {parseFloat(inv.totalAmount || 0).toFixed(2)} €
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {parseFloat(inv.discount || 0).toFixed(2)} €
                                            </td>
                                            <td className="final-amount" style={{ textAlign: 'right' }}>
                                                {parseFloat(inv.finalAmount || 0).toFixed(2)} €
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Invoices;