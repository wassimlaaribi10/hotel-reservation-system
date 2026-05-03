class User {
    constructor(id, email, passwordHash, role) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role; // 'receptionist' or 'admin'
    }

    // Business rule: check if user has admin role
    isAdmin() {
        return this.role === 'admin';
    }

    // Business rule: check if user is receptionist
    isReceptionist() {
        return this.role === 'receptionist';
    }
}

module.exports = User;