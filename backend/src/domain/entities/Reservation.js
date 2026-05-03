class Reservation {
    constructor(id, clientId, roomId, checkInDate, checkOutDate, numberOfGuests, status = 'pending', totalPrice = null) {
        this.id = id;
        this.clientId = clientId;
        this.roomId = roomId;
        this.checkInDate = new Date(checkInDate);
        this.checkOutDate = new Date(checkOutDate);
        this.numberOfGuests = numberOfGuests;
        this.status = status; // pending, confirmed, checked_in, checked_out, cancelled
        this.totalPrice = totalPrice;
        this.checkedInAt = null;
        this.checkedOutAt = null;
        this.discountPercent = 0;  // nouvelle ligne

    }

    // Business rule: validate dates (check-in before check-out)
    isValidDates() {
        return this.checkInDate < this.checkOutDate;
    }

    // Business rule: calculate number of nights
    getNumberOfNights() {
        const diffTime = Math.abs(this.checkOutDate - this.checkInDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    // Business rule: can cancel only if not already checked in
    canCancel() {
        return this.status !== 'checked_in' && this.status !== 'checked_out';
    }

    // Business rule: proceed to check-in
    checkIn() {
        if (this.status !== 'confirmed' && this.status !== 'pending') {
            throw new Error('Reservation cannot be checked in from status: ' + this.status);
        }
        this.status = 'checked_in';
        this.checkedInAt = new Date();
    }

    // Business rule: proceed to check-out
    checkOut() {
        if (this.status !== 'checked_in') {
            throw new Error('Cannot check out a reservation that is not checked in');
        }
        this.status = 'checked_out';
        this.checkedOutAt = new Date();
    }

    applyDiscount(percent) {
        if (percent < 0 || percent > 100) throw new Error('Discount percent must be between 0 and 100');
        this.discountPercent = percent;
        if (this.totalPrice) {
            this.totalPrice = this.originalTotalPrice * (1 - percent / 100);
        }
    }

}

module.exports = Reservation;