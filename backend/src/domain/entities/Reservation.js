class Reservation {
    constructor(id, clientId, roomId, checkInDate, checkOutDate, numberOfGuests, status = 'pending', totalPrice = null) {
        this.id = id;
        this.clientId = clientId;
        this.roomId = roomId;
        this.checkInDate = new Date(checkInDate);
        this.checkOutDate = new Date(checkOutDate);
        this.numberOfGuests = numberOfGuests;
        this.status = status;
        this.totalPrice = totalPrice;
        this.discountPercent = 0;
        this.checkedInAt = null;
        this.checkedOutAt = null;
    }

    isValidDates() {
        return this.checkInDate < this.checkOutDate;
    }

    getNumberOfNights() {
        const diffTime = Math.abs(this.checkOutDate - this.checkInDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    canCancel() {
        return this.status !== 'checked_in' && this.status !== 'checked_out';
    }

    checkIn() {
        if (this.status !== 'confirmed' && this.status !== 'pending') {
            throw new Error('Reservation cannot be checked in from status: ' + this.status);
        }
        this.status = 'checked_in';
        this.checkedInAt = new Date();
    }

    checkOut() {
        if (this.status !== 'checked_in') {
            throw new Error('Cannot check out a reservation that is not checked in');
        }
        this.status = 'checked_out';
        this.checkedOutAt = new Date();
    }
}

module.exports = Reservation;