const Reservation = require('../../domain/entities/Reservation');
const SeasonalPriceRepository = require('../../infrastructure/repositories/SeasonalPriceRepository');
const InvoiceRepository = require('../../infrastructure/repositories/InvoiceRepository');
const InvoiceUseCases = require('./invoiceUseCases');

class ReservationUseCases {
    constructor(reservationRepository, roomRepository, clientRepository) {
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
        this.clientRepository = clientRepository;
        this.seasonalPriceRepo = new SeasonalPriceRepository();
    }

    async createReservation(reservationData) {
        const { clientId, roomId, checkInDate, checkOutDate, numberOfGuests, discountPercent = 0 } = reservationData;

        const client = await this.clientRepository.findById(clientId);
        if (!client) throw new Error('Client not found');

        const room = await this.roomRepository.findById(roomId);
        if (!room) throw new Error('Room not found');
        if (!room.canAccommodate(numberOfGuests)) {
            throw new Error(`Room can only accommodate ${room.capacity} guests`);
        }

        const conflicts = await this.reservationRepository.findConflicting(roomId, checkInDate, checkOutDate);
        if (conflicts.length > 0) throw new Error('Room already booked for these dates');

        const reservation = new Reservation(null, clientId, roomId, checkInDate, checkOutDate, numberOfGuests, 'pending');
        if (!reservation.isValidDates()) throw new Error('Check-in must be before check-out');

        // Calcul du prix dynamique par saison
        const nights = reservation.getNumberOfNights();
        let total = 0;
        let currentDate = new Date(reservation.checkInDate);
        for (let i = 0; i < nights; i++) {
            const nightDate = new Date(currentDate);
            nightDate.setDate(currentDate.getDate() + i);
            const nightPrice = await this.seasonalPriceRepo.getPriceForDate(room.type, nightDate);
            total += nightPrice;
        }
        reservation.totalPrice = total;

        // Application de la remise
        if (discountPercent > 0 && discountPercent <= 100) {
            reservation.totalPrice = reservation.totalPrice * (1 - discountPercent / 100);
            reservation.discountPercent = discountPercent;
        }

        return await this.reservationRepository.create(reservation);
    }

    async confirmReservation(reservationId) {
        const reservation = await this.reservationRepository.findById(reservationId);
        if (!reservation) throw new Error('Reservation not found');
        if (reservation.status !== 'pending') throw new Error('Reservation cannot be confirmed');
        reservation.status = 'confirmed';
        return await this.reservationRepository.update(reservation);
    }

    async checkIn(reservationId) {
        const reservation = await this.reservationRepository.findById(reservationId);
        if (!reservation) throw new Error('Reservation not found');
        reservation.checkIn(); // domain business rule
        return await this.reservationRepository.update(reservation);
    }

   // Déjà dans le fichier, ajouter après la mise à jour du statut
     async checkOut(reservationId) {
        const reservation = await this.reservationRepository.findById(reservationId);
        if (!reservation) throw new Error('Reservation not found');
        reservation.checkOut();
        const updated = await this.reservationRepository.update(reservation);

        // Auto générer facture
        const invoiceRepo = new InvoiceRepository();
        const invoiceUseCases = new InvoiceUseCases(invoiceRepo, this.reservationRepository);
        await invoiceUseCases.generateInvoiceForReservation(reservationId);

        return updated;
    }


   async cancelReservation(reservationId) {
        const reservation = await this.reservationRepository.findById(reservationId);
        if (!reservation) throw new Error('Reservation not found');
        if (!reservation.canCancel()) throw new Error('Reservation cannot be cancelled');

        const daysBeforeArrival = Math.ceil((new Date(reservation.checkInDate) - new Date()) / (1000 * 3600 * 24));
        let fee = 0;
        if (daysBeforeArrival < 1) fee = reservation.totalPrice * 0.5;
        else if (daysBeforeArrival < 3) fee = reservation.totalPrice * 0.3;
        else if (daysBeforeArrival < 7) fee = reservation.totalPrice * 0.1;

        // Appeler repository pour annuler avec pénalité
        await this.reservationRepository.cancel(reservationId);
        if (fee > 0) {
            await this.reservationRepository.setCancellationFee(reservationId, fee);
        }
        return { cancelled: true, cancellationFee: fee };
    }

    async getReservationsByClient(clientId) {
        return await this.reservationRepository.findByClient(clientId);
    }

    async getAllReservations() {
        return await this.reservationRepository.findAll();
    }

    async updateReservation(reservationId, updateData) {
        const reservation = await this.reservationRepository.findById(reservationId);
        if (!reservation) throw new Error('Reservation not found');
        if (reservation.status !== 'pending' && reservation.status !== 'confirmed') {
            throw new Error('Cannot modify reservation after check-in');
        }

        if (updateData.roomId) reservation.roomId = updateData.roomId;
        if (updateData.checkInDate) reservation.checkInDate = new Date(updateData.checkInDate);
        if (updateData.checkOutDate) reservation.checkOutDate = new Date(updateData.checkOutDate);
        if (updateData.numberOfGuests) reservation.numberOfGuests = updateData.numberOfGuests;
        if (updateData.discountPercent !== undefined) reservation.discountPercent = updateData.discountPercent;

        if (!reservation.isValidDates()) throw new Error('Check-in must be before check-out');

        // Recalculer prix si dates ou chambre changent
        if (updateData.roomId || updateData.checkInDate || updateData.checkOutDate) {
            const room = await this.roomRepository.findById(reservation.roomId);
            const nights = reservation.getNumberOfNights();
            let total = 0;
            let currentDate = new Date(reservation.checkInDate);
            for (let i = 0; i < nights; i++) {
                const nightDate = new Date(currentDate);
                nightDate.setDate(currentDate.getDate() + i);
                const nightPrice = await this.seasonalPriceRepo.getPriceForDate(room.type, nightDate);
                total += nightPrice;
            }
            reservation.totalPrice = total;
            if (reservation.discountPercent) {
                reservation.totalPrice = reservation.totalPrice * (1 - reservation.discountPercent / 100);
            }
        }

        // Vérifier conflits
        const conflicts = await this.reservationRepository.findConflicting(reservation.roomId, reservation.checkInDate, reservation.checkOutDate);
        const conflicting = conflicts.filter(r => r.id !== reservation.id);
        if (conflicting.length > 0) throw new Error('Room already booked for these dates');

        return await this.reservationRepository.update(reservation);
    }
}

module.exports = ReservationUseCases;