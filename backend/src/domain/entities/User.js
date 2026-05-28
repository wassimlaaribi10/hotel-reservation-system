class User {
    constructor(id, email, passwordHash, role, isActive = true, createdAt = null) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role; // 'receptionist' or 'admin'
        this.isActive = isActive;
        this.createdAt = createdAt;
    }

    isAdmin() {
        return this.role === 'admin';
    }

    isReceptionist() {
        return this.role === 'receptionist';
    }
}

module.exports = User;