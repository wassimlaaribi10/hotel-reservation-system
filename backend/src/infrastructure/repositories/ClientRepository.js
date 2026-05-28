const pool = require('../database/pool');
const Client = require('../../domain/entities/Client');

class ClientRepository {
    async create(client) {
        const query = `
            INSERT INTO clients (first_name, last_name, id_card_number, address, phone, email, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [client.firstName, client.lastName, client.idCardNumber, 
                        client.address, client.phone, client.email, client.isActive];
        const result = await pool.query(query, values);
        const row = result.rows[0];
        return new Client(row.id, row.first_name, row.last_name, row.id_card_number,
                         row.address, row.phone, row.email, row.is_active);
    }

    async findById(id) {
        const query = `SELECT * FROM clients WHERE id = $1`;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new Client(row.id, row.first_name, row.last_name, row.id_card_number,
                         row.address, row.phone, row.email, row.is_active);
    }

    async findByEmail(email) {
        const query = `SELECT * FROM clients WHERE email = $1`;
        const result = await pool.query(query, [email]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new Client(row.id, row.first_name, row.last_name, row.id_card_number,
                         row.address, row.phone, row.email, row.is_active);
    }

    async findByPhone(phone) {
        const query = `SELECT * FROM clients WHERE phone = $1`;
        const result = await pool.query(query, [phone]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new Client(row.id, row.first_name, row.last_name, row.id_card_number,
                         row.address, row.phone, row.email, row.is_active);
    }

    // NEW METHOD
    async findByIdCardNumber(idCardNumber) {
        const query = `SELECT * FROM clients WHERE LOWER(id_card_number) = LOWER($1)`;
        const result = await pool.query(query, [idCardNumber]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new Client(row.id, row.first_name, row.last_name, row.id_card_number,
                        row.address, row.phone, row.email, row.is_active);
    }

    async update(client) {
        const query = `
            UPDATE clients 
            SET first_name = $1, last_name = $2, id_card_number = $3, address = $4, 
                phone = $5, email = $6, is_active = $7
            WHERE id = $8
            RETURNING *
        `;
        const values = [client.firstName, client.lastName, client.idCardNumber,
                        client.address, client.phone, client.email, client.isActive, client.id];
        const result = await pool.query(query, values);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new Client(row.id, row.first_name, row.last_name, row.id_card_number,
                         row.address, row.phone, row.email, row.is_active);
    }

    async deactivate(id) {
        const query = `UPDATE clients SET is_active = false WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new Client(row.id, row.first_name, row.last_name, row.id_card_number,
                         row.address, row.phone, row.email, row.is_active);
    }

    async findAll() {
        const query = `SELECT * FROM clients ORDER BY id`;
        const result = await pool.query(query);
        return result.rows.map(row => new Client(row.id, row.first_name, row.last_name,
                            row.id_card_number, row.address, row.phone, row.email, row.is_active));
    }
}

module.exports = ClientRepository;