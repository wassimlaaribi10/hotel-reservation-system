const pool = require('../database/pool');
const User = require('../../domain/entities/User');

class UserRepository {
    async create(user) {
        const query = `
            INSERT INTO users (email, password_hash, role, is_active)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, role, is_active, created_at
        `;
        const values = [user.email, user.passwordHash, user.role, user.isActive !== undefined ? user.isActive : true];
        const result = await pool.query(query, values);
        const row = result.rows[0];
        return new User(row.id, row.email, null, row.role, row.is_active, row.created_at);
    }

    async findById(id) {
        const query = `SELECT id, email, role, is_active, created_at FROM users WHERE id = $1`;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new User(row.id, row.email, null, row.role, row.is_active, row.created_at);
    }

    async findByEmail(email) {
        const query = `SELECT id, email, password_hash, role, is_active, created_at FROM users WHERE email = $1`;
        const result = await pool.query(query, [email]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new User(row.id, row.email, row.password_hash, row.role, row.is_active, row.created_at);
    }

    async update(user) {
        const query = `
            UPDATE users 
            SET email = $1, role = $2, is_active = $3
            WHERE id = $4
            RETURNING id, email, role, is_active, created_at
        `;
        const values = [user.email, user.role, user.isActive, user.id];
        const result = await pool.query(query, values);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new User(row.id, row.email, null, row.role, row.is_active, row.created_at);
    }

    async updatePassword(id, newHashedPassword) {
        const query = `UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id`;
        await pool.query(query, [newHashedPassword, id]);
    }

    async deactivate(id) {
        const query = `UPDATE users SET is_active = false WHERE id = $1 RETURNING id`;
        await pool.query(query, [id]);
    }

    async activate(id) {
        const query = `UPDATE users SET is_active = true WHERE id = $1 RETURNING id`;
        await pool.query(query, [id]);
    }

    async findAll() {
        const query = `SELECT id, email, role, is_active, created_at FROM users ORDER BY id`;
        const result = await pool.query(query);
        return result.rows.map(row => new User(row.id, row.email, null, row.role, row.is_active, row.created_at));
    }
}

module.exports = UserRepository;