const Invoice = require('../../domain/entities/Invoice');
const SeasonalPriceRepository = require('../../infrastructure/repositories/SeasonalPriceRepository');

class InvoiceUseCases {
    constructor(invoiceRepository, reservationRepository) {
        this.invoiceRepository = invoiceRepository;
        this.reservationRepository = reservationRepository;
        this.seasonalPriceRepo = new SeasonalPriceRepository();
    }

    async generateInvoiceForReservation(reservationId) {
        const reservation = await this.reservationRepository.findById(reservationId);
        if (!reservation || reservation.status !== 'checked_out') {
            throw new Error('Invoice can only be generated after check-out');
        }

        const existing = await this.invoiceRepository.findByReservationId(reservationId);
        if (existing) return existing;

        // Calcul détaillé par nuit
        const roomRepo = require('../../infrastructure/repositories/RoomRepository');
        const room = await new roomRepo().findById(reservation.roomId);
        const nights = reservation.getNumberOfNights();
        let details = [];
        let total = 0;
        let currentDate = new Date(reservation.checkInDate);
        for (let i = 0; i < nights; i++) {
            const nightDate = new Date(currentDate);
            nightDate.setDate(currentDate.getDate() + i);
            const price = await this.seasonalPriceRepo.getPriceForDate(room.type, nightDate);
            total += price;
            details.push({
                date: nightDate.toISOString().split('T')[0],
                price: price,
                roomType: room.type,
                roomNumber: room.roomNumber
            });
        }

        let discount = 0;
        if (reservation.discountPercent) {
            discount = total * (reservation.discountPercent / 100);
        }
        const finalAmount = total - discount;

        const invoiceNumber = await this.invoiceRepository.generateInvoiceNumber();
        const invoice = new Invoice(null, reservationId, invoiceNumber, new Date(), total, discount, finalAmount);
        invoice.details = details; // stocké plus tard

        return await this.invoiceRepository.create(invoice, JSON.stringify(details));
    }

    async getInvoiceByReservation(reservationId) {
        return await this.invoiceRepository.findByReservationId(reservationId);
    }

    async getClientInvoices(clientId) {
        return await this.invoiceRepository.findByClientId(clientId);
    }
}

module.exports = InvoiceUseCases;