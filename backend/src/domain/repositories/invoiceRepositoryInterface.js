/**
 * Invoice Repository Interface
 * Handles invoice generation and retrieval
 */
class InvoiceRepositoryInterface {
    async create(invoice) {
        throw new Error('Method not implemented');
    }
    async findById(id) {
        throw new Error('Method not implemented');
    }
    async findByReservationId(reservationId) {
        throw new Error('Method not implemented');
    }
    async findByClientId(clientId) {
        throw new Error('Method not implemented');
    }
    async update(invoice) {
        throw new Error('Method not implemented');
    }
    async generateInvoiceNumber() {
        throw new Error('Method not implemented');
    }
}

module.exports = InvoiceRepositoryInterface;