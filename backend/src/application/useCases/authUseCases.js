const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../domain/entities/User');

class AuthUseCases {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async registerUser(email, password, role) {
        const existing = await this.userRepository.findByEmail(email);
        if (existing) throw new Error('User already exists');

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User(null, email, hashedPassword, role, true);
        return await this.userRepository.create(user);
    }

    async loginUser(email, password) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) throw new Error('Invalid credentials');
        if (!user.isActive) throw new Error('Account disabled');

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) throw new Error('Invalid credentials');

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        return { token, user: { id: user.id, email: user.email, role: user.role } };
    }
}

module.exports = AuthUseCases;