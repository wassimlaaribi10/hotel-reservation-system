const Room = require('../../domain/entities/Room');

class RoomUseCases {
    constructor(roomRepository) {
        this.roomRepository = roomRepository;
    }

    async createRoom(roomData) {
        const { roomNumber, type, floor, capacity, description } = roomData;
        if (!roomNumber || !type || !floor || !capacity) {
            throw new Error('Missing required room fields');
        }
        const existing = await this.roomRepository.findByNumber(roomNumber);
        if (existing) throw new Error('Room number already exists');

        const room = new Room(null, roomNumber, type, floor, capacity, description, true);
        return await this.roomRepository.create(room);
    }

    async getAllRooms() {
        return await this.roomRepository.findAll();
    }

    async getAvailableRooms(checkInDate, checkOutDate, type = null) {
        if (new Date(checkInDate) >= new Date(checkOutDate)) {
            throw new Error('Check-in date must be before check-out date');
        }
        return await this.roomRepository.findAvailable(checkInDate, checkOutDate, type);
    }

    async updateRoom(id, updateData) {
        const room = await this.roomRepository.findById(id);
        if (!room) throw new Error('Room not found');
        if (updateData.roomNumber) room.roomNumber = updateData.roomNumber;
        if (updateData.type) room.type = updateData.type;
        if (updateData.floor !== undefined) room.floor = updateData.floor;
        if (updateData.capacity) room.capacity = updateData.capacity;
        if (updateData.description !== undefined) room.description = updateData.description;
        if (updateData.isActive !== undefined) room.isActive = updateData.isActive;
        return await this.roomRepository.update(room);
    }
}

module.exports = RoomUseCases;