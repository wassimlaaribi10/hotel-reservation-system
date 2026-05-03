class Client {
    constructor(id, firstName, lastName, idCardNumber, address, phone, email, isActive = true) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.idCardNumber = idCardNumber;
        this.address = address;
        this.phone = phone;
        this.email = email;
        this.isActive = isActive;
    }

    // Business rule: full name formatting
    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }

    // Business rule: client can be deactivated (not deleted)
    deactivate() {
        this.isActive = false;
    }

    // Business rule: validate email format (simple)
    isValidEmail() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(this.email);
    }

    // Business rule: phone must be at least 8 digits
    isValidPhone() {
        return this.phone && this.phone.length >= 8;
    }
}

module.exports = Client;