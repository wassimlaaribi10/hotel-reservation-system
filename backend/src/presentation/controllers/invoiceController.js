const InvoiceRepository = require('../../infrastructure/repositories/InvoiceRepository');
const ReservationRepository = require('../../infrastructure/repositories/ReservationRepository');
const InvoiceUseCases = require('../../application/useCases/invoiceUseCases');

const invoiceRepository = new InvoiceRepository();
const reservationRepository = new ReservationRepository();
const invoiceUseCases = new InvoiceUseCases(invoiceRepository, reservationRepository);

exports.generateInvoice = async (req, res) => {
    try {
        const invoice = await invoiceUseCases.generateInvoiceForReservation(parseInt(req.params.reservationId));
        res.status(201).json(invoice);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getInvoiceByReservation = async (req, res) => {
    try {
        const invoice = await invoiceUseCases.getInvoiceByReservation(parseInt(req.params.reservationId));
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        res.json(invoice);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getClientInvoices = async (req, res) => {
    try {
        const invoices = await invoiceUseCases.getClientInvoices(parseInt(req.params.clientId));
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};