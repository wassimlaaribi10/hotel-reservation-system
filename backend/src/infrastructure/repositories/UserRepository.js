const pool = require('../database/pool');
const User = require('../../domain/entities/User');

class UserRepository {
    async create(user) {
        const query = `
            INSERT INTO users (email, password_hash, role)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const values = [user.email, user.passwordHash, user.role];
        const result = await pool.query(query, values);
        const row = result.rows[0];
        return new User(row.id, row.email, row.password_hash, row.role);
    }

    async findById(id) {
        const query = `SELECT * FROM users WHERE id = $1`;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new User(row.id, row.email, row.password_hash, row.role);
    }

    async findByEmail(email) {
        const query = `SELECT * FROM users WHERE email = $1`;
        const result = await pool.query(query, [email]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new User(row.id, row.email, row.password_hash, row.role);
    }

    async update(user) {
        const query = `
            UPDATE users SET email = $1, password_hash = $2, role = $3
            WHERE id = $4
            RETURNING *
        `;
        const values = [user.email, user.passwordHash, user.role, user.id];
        const result = await pool.query(query, values);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new User(row.id, row.email, row.password_hash, row.role);
    }

    async delete(id) {
        const query = `DELETE FROM users WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, [id]);
        return result.rows.length > 0;
    }

    async findAll() {
        const query = `SELECT * FROM users`;
        const result = await pool.query(query);
        return result.rows.map(row => new User(row.id, row.email, row.password_hash, row.role));
    }
}

module.exports = UserRepository;