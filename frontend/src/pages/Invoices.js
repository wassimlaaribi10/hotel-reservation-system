import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Invoices.css';

/* ─── Chargement jsPDF + autoTable via CDN ─── */
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

    /* ── Génération PDF améliorée (structurée, lisible) ── */
    const handleDownloadPDF = async () => {
        if (!invoices.length) return;
        setPdfLoading(true);
        setError('');

        try {
            const jsPDF = await loadJsPDF();
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const pageW = doc.internal.pageSize.getWidth();
            const marginL = 15;
            const marginR = 15;
            const contentW = pageW - marginL - marginR;

            const PRIMARY = [42, 26, 94];
            const ACCENT = [255, 111, 21];
            const LIGHT_BG = [254, 249, 244];
            const DARK_TEXT = [20, 20, 40];
            const GRAY_TEXT = [100, 100, 120];
            const BORDER = [220, 220, 230];

            // ========== EN-TÊTE ==========
            doc.setFillColor(...PRIMARY);
            doc.rect(0, 0, pageW, 30, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.setTextColor(255, 255, 255);
            doc.text('Relevé de facturation', marginL, 14);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(220, 210, 240);
            const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
            doc.text(`Édité le ${dateStr}   |   Par : ${user?.email || '—'}`, marginL, 22);

            doc.setFillColor(...ACCENT);
            doc.rect(0, 29, pageW, 2, 'F');

            // ========== BLOC CLIENT ==========
            const clientY = 40;
            doc.setFillColor(...LIGHT_BG);
            doc.roundedRect(marginL, clientY, contentW, 22, 3, 3, 'F');
            doc.setDrawColor(...ACCENT);
            doc.setLineWidth(0.5);
            doc.line(marginL, clientY, marginL, clientY + 22);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(...PRIMARY);
            doc.text(`${selectedClient?.firstName || ''} ${selectedClient?.lastName || ''}`, marginL + 5, clientY + 9);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...GRAY_TEXT);
            doc.text(`N° pièce : ${selectedClient?.idCardNumber || '—'}`, marginL + 5, clientY + 16);

            // ========== BOUCLE SUR LES FACTURES ==========
            let currentY = clientY + 28;
            for (let idx = 0; idx < invoices.length; idx++) {
                const inv = invoices[idx];

                // Récupérer les détails des nuitées (JSON)
                let details = [];
                try {
                    if (inv.details) {
                        if (Array.isArray(inv.details)) details = inv.details;
                        else if (typeof inv.details === 'string') details = JSON.parse(inv.details);
                    }
                } catch(e) { details = []; }

                // ===== TABLEAU RÉCAPITULATIF DE LA FACTURE =====
                const recapRows = [[
                    inv.invoiceNumber,
                    `#${inv.reservationId}`,
                    new Date(inv.issueDate).toLocaleDateString('fr-FR'),
                    `${parseFloat(inv.totalAmount || 0).toFixed(2)} €`,
                    `${parseFloat(inv.discount || 0).toFixed(2)} €`,
                    `${parseFloat(inv.finalAmount || 0).toFixed(2)} €`,
                ]];

                doc.autoTable({
                    startY: currentY,
                    head: [['N° Facture', 'Réservation', "Date d'émission", 'Montant HT', 'Remise', 'Total TTC']],
                    body: recapRows,
                    margin: { left: marginL, right: marginR },
                    tableWidth: contentW,
                    headStyles: {
                        fillColor: PRIMARY,
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        fontSize: 9,
                        halign: 'center',
                        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
                    },
                    bodyStyles: {
                        fontSize: 9,
                        textColor: DARK_TEXT,
                        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
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

                currentY = doc.lastAutoTable.finalY + 4;

                // ===== DÉTAIL DES NUITÉES (si présent) =====
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
                            textColor: [255, 255, 255],
                            fontStyle: 'bold',
                            fontSize: 9,
                            halign: 'center',
                            cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
                        },
                        bodyStyles: {
                            fontSize: 9,
                            textColor: DARK_TEXT,
                            cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
                        },
                        alternateRowStyles: { fillColor: LIGHT_BG },
                    });
                    currentY = doc.lastAutoTable.finalY + 6;
                } else {
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(9);
                    doc.setTextColor(...GRAY_TEXT);
                    doc.text('Aucune nuitée enregistrée', marginL, currentY);
                    currentY += 6;
                }

                // Ligne de séparation entre factures (sauf après la dernière)
                if (idx < invoices.length - 1) {
                    doc.setDrawColor(...BORDER);
                    doc.setLineWidth(0.3);
                    doc.line(marginL, currentY - 2, pageW - marginR, currentY - 2);
                    currentY += 3;
                }

                // Vérifier la place pour la page suivante (éviter débordement)
                if (currentY > 270 && idx < invoices.length - 1) {
                    doc.addPage();
                    // Répéter l'en-tête sur les nouvelles pages
                    doc.setFillColor(...PRIMARY);
                    doc.rect(0, 0, pageW, 30, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(20);
                    doc.setTextColor(255, 255, 255);
                    doc.text('Relevé de facturation (suite)', marginL, 14);
                    doc.setFillColor(...ACCENT);
                    doc.rect(0, 29, pageW, 2, 'F');
                    currentY = 40;
                }
            }

            // ========== PIED DE PAGE ==========
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                const footerY = doc.internal.pageSize.getHeight() - 10;
                doc.setDrawColor(...BORDER);
                doc.setLineWidth(0.3);
                doc.line(marginL, footerY - 3, pageW - marginR, footerY - 3);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 170);
                doc.text('Document confidentiel — généré automatiquement', marginL, footerY);
                doc.text(`Page ${i} / ${totalPages}`, pageW - marginR, footerY, { align: 'right' });
            }

            const filename = `factures_${selectedClient?.lastName || 'client'}_${selectedClient?.firstName || ''}_${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(filename);
        } catch (err) {
            console.error('Erreur PDF :', err);
            setError(`Erreur génération PDF : ${err.message}`);
        } finally {
            setPdfLoading(false);
        }
    };
    // Fonction pour afficher les détails dans le tableau HTML (corrigée)
    const renderNightlyDetails = (detailsJson) => {
        if (!detailsJson) return null;
        let details = [];
        try {
            if (Array.isArray(detailsJson)) {
                details = detailsJson;
            } else if (typeof detailsJson === 'string') {
                details = JSON.parse(detailsJson);
            } else {
                return null;
            }
        } catch (e) {
            return null;
        }
        if (!Array.isArray(details) || details.length === 0) return null;

        return (
            <tr className="invoice-details-row">
                <td colSpan="6" style={{ padding: '0.5rem 1rem', backgroundColor: '#f9f9f9', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>📅 Détail des nuitées</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f5f9' }}>
                                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Date</th>
                                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Prix par nuit</th>
                                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Type chambre</th>
                                <th style={{ textAlign: 'left', padding: '4px 8px' }}>N° chambre</th>
                            </tr>
                        </thead>
                        <tbody>
                            {details.map((detail, idx) => (
                                <tr key={idx}>
                                    <td style={{ padding: '4px 8px' }}>{detail.date}</td>
                                    <td style={{ padding: '4px 8px' }}>{detail.price} €</td>
                                    <td style={{ padding: '4px 8px' }}>{detail.roomType}</td>
                                    <td style={{ padding: '4px 8px' }}>{detail.roomNumber}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </td>
            </tr>
        );
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
                                    invoices.flatMap(inv => {
                                        const mainRow = (
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
                                        );
                                        const detailRow = renderNightlyDetails(inv.details);
                                        return detailRow ? [mainRow, detailRow] : [mainRow];
                                    })
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