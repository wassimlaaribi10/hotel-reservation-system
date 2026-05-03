class Invoice {
    constructor(id, reservationId, invoiceNumber, issueDate, totalAmount, discount = 0, finalAmount = null, pdfPath = null) {
        this.id = id;
        this.reservationId = reservationId;
        this.invoiceNumber = invoiceNumber;
        this.issueDate = new Date(issueDate);
        this.totalAmount = totalAmount;
        this.discount = discount;
        this.finalAmount = finalAmount !== null ? finalAmount : totalAmount - discount;
        this.pdfPath = pdfPath;
    }

    // Business rule: apply discount (cannot exceed total)
    applyDiscount(amount) {
        if (amount > this.totalAmount) {
            throw new Error('Discount cannot exceed total amount');
        }
        this.discount = amount;
        this.finalAmount = this.totalAmount - this.discount;
    }

    // Business rule: format currency
    getFormattedTotal() {
        return `${this.finalAmount.toFixed(2)} €`;
    }
}

module.exports = Invoice;