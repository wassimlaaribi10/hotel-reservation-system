const pool = require('../database/pool');
const Room = require('../../domain/entities/Room');

class RoomRepository {
    async create(room) {
        const query = `
            INSERT INTO rooms (room_number, type, floor, capacity, description, is_active)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const values = [room.roomNumber, room.type, room.floor, room.capacity, room.description, room.isActive];
        const result = await pool.query(query, values);
        const row = result.rows[0];
        return new Room(row.id, row.room_number, row.type, row.floor, row.capacity, row.description, row.is_active);
    }

    async findById(id) {
        const query = `SELECT * FROM rooms WHERE id = $1`;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new Room(row.id, row.room_number, row.type, row.floor, row.capacity, row.description, row.is_active);
    }

    async findByNumber(roomNumber) {
        const query = `SELECT * FROM rooms WHERE room_number = $1`;
        const result = await pool.query(query, [roomNumber]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new Room(row.id, row.room_number, row.type, row.floor, row.capacity, row.description, row.is_active);
    }

    async update(room) {
        const query = `
            UPDATE rooms 
            SET room_number = $1, type = $2, floor = $3, capacity = $4, description = $5, is_active = $6
            WHERE id = $7
            RETURNING *
        `;
        const values = [room.roomNumber, room.type, room.floor, room.capacity, room.description, room.isActive, room.id];
        const result = await pool.query(query, values);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new Room(row.id, row.room_number, row.type, row.floor, row.capacity, row.description, row.is_active);
    }

    async deactivate(id) {
        const query = `UPDATE rooms SET is_active = false WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new Room(row.id, row.room_number, row.type, row.floor, row.capacity, row.description, row.is_active);
    }

    async findAll() {
        const query = `
            SELECT r.*, 
                   COALESCE(
                       (SELECT json_agg(e.name) 
                        FROM room_equipment re 
                        JOIN equipment e ON re.equipment_id = e.id 
                        WHERE re.room_id = r.id), 
                       '[]'::json
                   ) as equipment_names
            FROM rooms r
        `;
        const result = await pool.query(query);
        return result.rows.map(row => {
            const room = new Room(row.id, row.room_number, row.type, row.floor, row.capacity, row.description, row.is_active);
            room.equipmentNames = row.equipment_names || []; // ajoute les équipements sous forme de tableau
            return room;
        });
    }

    // Find available rooms between check-in and check-out, optionally filtered by type
    async findAvailable(checkInDate, checkOutDate, type = null) {
        let query = `
            SELECT r.* FROM rooms r
            WHERE r.is_active = true
            AND NOT EXISTS (
                SELECT 1 FROM reservations res
                WHERE res.room_id = r.id
                AND res.status NOT IN ('cancelled', 'checked_out')
                AND res.check_in_date < $2
                AND res.check_out_date > $1
            )
        `;
        const values = [checkInDate, checkOutDate];
        if (type) {
            query += ` AND r.type = $3`;
            values.push(type);
        }
        const result = await pool.query(query, values);
        return result.rows.map(row => new Room(row.id, row.room_number, row.type, row.floor, row.capacity, row.description, row.is_active));
    }
}

module.exports = RoomRepository;