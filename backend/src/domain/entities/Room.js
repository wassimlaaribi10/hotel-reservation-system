class Room {
    constructor(id, roomNumber, type, floor, capacity, description, isActive = true) {
        this.id = id;
        this.roomNumber = roomNumber;
        this.type = type; // 'single', 'double', 'suite'
        this.floor = floor;
        this.capacity = capacity;
        this.description = description;
        this.isActive = isActive;
        this.equipment = []; // will be filled later
    }

    // Business rule: room can accommodate given number of guests
    canAccommodate(guests) {
        return guests <= this.capacity;
    }

    // Business rule: room type price multiplier (example)
    getPriceMultiplier() {
        switch (this.type) {
            case 'single': return 1.0;
            case 'double': return 1.5;
            case 'suite': return 2.5;
            default: return 1.0;
        }
    }

    addEquipment(equipmentItem) {
        this.equipment.push(equipmentItem);
    }
}

module.exports = Room;