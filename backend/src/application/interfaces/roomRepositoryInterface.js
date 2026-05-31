class RoomRepositoryInterface {
    async create(room) { throw new Error('Not implemented'); }
    async findById(id) { throw new Error('Not implemented'); }
    async findByNumber(roomNumber) { throw new Error('Not implemented'); }
    async update(room) { throw new Error('Not implemented'); }
    async deactivate(id) { throw new Error('Not implemented'); }
    async findAll() { throw new Error('Not implemented'); }
    async findAvailable(checkInDate, checkOutDate, type = null) { throw new Error('Not implemented'); }
}

module.exports = RoomRepositoryInterface;