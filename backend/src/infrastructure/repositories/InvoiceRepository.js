const pool = require('../database/pool');
const Invoice = require('../../domain/entities/Invoice');

class InvoiceRepository {
async create(invoice, detailsJson = null) {
    const query = `
        INSERT INTO invoices (reservation_id, invoice_number, issue_date, total_amount, discount, final_amount, pdf_path, details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;
    const values = [
        invoice.reservationId, invoice.invoiceNumber, invoice.issueDate,
        invoice.totalAmount, invoice.discount, invoice.finalAmount,
        invoice.pdfPath, detailsJson
    ];
    const result = await pool.query(query, values);
        const row = result.rows[0];
        return new Invoice(row.id, row.reservation_id, row.invoice_number, row.issue_date,
                          row.total_amount, row.discount, row.final_amount, row.pdf_path);
    }

    async findById(id) {
        const query = `SELECT * FROM invoices WHERE id = $1`;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new Invoice(row.id, row.reservation_id, row.invoice_number, row.issue_date,
                          row.total_amount, row.discount, row.final_amount, row.pdf_path);
    }

    async findByReservationId(reservationId) {
        const query = `SELECT * FROM invoices WHERE reservation_id = $1`;
        const result = await pool.query(query, [reservationId]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new Invoice(row.id, row.reservation_id, row.invoice_number, row.issue_date,
                          row.total_amount, row.discount, row.final_amount, row.pdf_path);
    }

    async findByClientId(clientId) {
        const query = `
            SELECT i.* FROM invoices i
            JOIN reservations r ON i.reservation_id = r.id
            WHERE r.client_id = $1
            ORDER BY i.issue_date DESC
        `;
        const result = await pool.query(query, [clientId]);
        return result.rows.map(row => new Invoice(row.id, row.reservation_id, row.invoice_number,
                                row.issue_date, row.total_amount, row.discount, row.final_amount, row.pdf_path));
    }

    async update(invoice) {
        const query = `
            UPDATE invoices 
            SET total_amount = $1, discount = $2, final_amount = $3, pdf_path = $4
            WHERE id = $5
            RETURNING *
        `;
        const values = [invoice.totalAmount, invoice.discount, invoice.finalAmount, invoice.pdfPath, invoice.id];
        const result = await pool.query(query, values);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new Invoice(row.id, row.reservation_id, row.invoice_number, row.issue_date,
                          row.total_amount, row.discount, row.final_amount, row.pdf_path);
    }

    async generateInvoiceNumber() {
        const query = `SELECT COUNT(*) FROM invoices`;
        const result = await pool.query(query);
        const count = parseInt(result.rows[0].count) + 1;
        const year = new Date().getFullYear();
        return `INV-${year}-${String(count).padStart(5, '0')}`;
    }
}

module.exports = InvoiceRepository;