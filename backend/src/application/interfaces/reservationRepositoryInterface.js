class ReservationRepositoryInterface {
    async create(reservation) { throw new Error('Not implemented'); }
    async findById(id) { throw new Error('Not implemented'); }
    async findByClient(clientId) { throw new Error('Not implemented'); }
    async update(reservation) { throw new Error('Not implemented'); }
    async cancel(id) { throw new Error('Not implemented'); }
    async findConflicting(roomId, checkIn, checkOut) { throw new Error('Not implemented'); }
}

module.exports = ReservationRepositoryInterface;