const pool = require('../database/pool');
const Reservation = require('../../domain/entities/Reservation');

class ReservationRepository {
    async create(reservation) {
        const query = `
            INSERT INTO reservations (client_id, room_id, check_in_date, check_out_date, number_of_guests, status, total_price, discount_percent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const values = [
            reservation.clientId, reservation.roomId, reservation.checkInDate,
            reservation.checkOutDate, reservation.numberOfGuests, reservation.status,
            reservation.totalPrice, reservation.discountPercent || 0
        ];
        const result = await pool.query(query, values);
        const row = result.rows[0];
        const res = new Reservation(
            row.id, row.client_id, row.room_id, row.check_in_date,
            row.check_out_date, row.number_of_guests, row.status, row.total_price
        );
        res.discountPercent = row.discount_percent || 0;
        return res;
    }

    async findAll() {
        const query = `
            SELECT 
                r.id, r.client_id, r.room_id, r.check_in_date, r.check_out_date,
                r.number_of_guests, r.status, r.total_price, r.created_at,
                r.checked_in_at, r.checked_out_at, r.discount_percent,
                c.first_name, c.last_name, c.id_card_number,
                rm.room_number, rm.type
            FROM reservations r
            JOIN clients c ON r.client_id = c.id
            JOIN rooms rm ON r.room_id = rm.id
            ORDER BY r.check_in_date DESC
        `;
        const result = await pool.query(query);
        return result.rows.map(row => {
            const reservation = new Reservation(
                row.id, row.client_id, row.room_id,
                row.check_in_date, row.check_out_date,
                row.number_of_guests, row.status, row.total_price
            );
            reservation.discountPercent = row.discount_percent || 0;
            reservation.clientName = `${row.first_name} ${row.last_name}`;
            reservation.clientIdCard = row.id_card_number;
            reservation.roomNumber = row.room_number;
            reservation.roomType = row.type;
            return reservation;
        });
    }

    async findById(id) {
        const query = `SELECT *, discount_percent FROM reservations WHERE id = $1`;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        const reservation = new Reservation(
            row.id, row.client_id, row.room_id, row.check_in_date,
            row.check_out_date, row.number_of_guests, row.status, row.total_price
        );
        reservation.discountPercent = row.discount_percent || 0;
        return reservation;
    }

    async findByClient(clientId) {
    const query = `
        SELECT r.*, rm.room_number, r.cancellation_fee
        FROM reservations r
        JOIN rooms rm ON r.room_id = rm.id
        WHERE r.client_id = $1
        ORDER BY r.check_in_date DESC
    `;
    const result = await pool.query(query, [clientId]);
    return result.rows.map(row => {
        const reservation = new Reservation(
            row.id, row.client_id, row.room_id,
            row.check_in_date, row.check_out_date,
            row.number_of_guests, row.status, row.total_price
        );
        reservation.roomNumber = row.room_number;
        reservation.cancellationFee = row.cancellation_fee; // ajout
        return reservation;
    });
}

    async update(reservation) {
        const query = `
            UPDATE reservations 
            SET client_id = $1, room_id = $2, check_in_date = $3, check_out_date = $4,
                number_of_guests = $5, status = $6, total_price = $7, 
                checked_in_at = $8, checked_out_at = $9, discount_percent = $11
            WHERE id = $10
            RETURNING *
        `;
        const values = [
            reservation.clientId, reservation.roomId, reservation.checkInDate,
            reservation.checkOutDate, reservation.numberOfGuests, reservation.status,
            reservation.totalPrice, reservation.checkedInAt, reservation.checkedOutAt,
            reservation.id, reservation.discountPercent || 0
        ];
        const result = await pool.query(query, values);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        const updated = new Reservation(
            row.id, row.client_id, row.room_id, row.check_in_date, row.check_out_date,
            row.number_of_guests, row.status, row.total_price
        );
        updated.discountPercent = row.discount_percent || 0;
        return updated;
    }

    async cancel(id) {
        const query = `UPDATE reservations SET status = 'cancelled' WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        const reservation = new Reservation(
            row.id, row.client_id, row.room_id, row.check_in_date,
            row.check_out_date, row.number_of_guests, row.status, row.total_price
        );
        reservation.discountPercent = row.discount_percent || 0;
        return reservation;
    }

    async setCancellationFee(id, fee) {
        const query = `UPDATE reservations SET cancellation_fee = $1, cancelled_at = NOW() WHERE id = $2 RETURNING *`;
        const res = await pool.query(query, [fee, id]);
        return res.rows[0];
    }

    async findConflicting(roomId, checkInDate, checkOutDate) {
        const query = `
            SELECT * FROM reservations 
            WHERE room_id = $1 
            AND status NOT IN ('cancelled', 'checked_out')
            AND check_in_date < $3
            AND check_out_date > $2
        `;
        const result = await pool.query(query, [roomId, checkInDate, checkOutDate]);
        return result.rows.map(row => new Reservation(
            row.id, row.client_id, row.room_id,
            row.check_in_date, row.check_out_date,
            row.number_of_guests, row.status, row.total_price
        ));
    }

    async findActiveByRoom(roomId) {
    const query = `SELECT * FROM reservations WHERE room_id = $1 AND status = 'checked_in'`;
    const result = await pool.query(query, [roomId]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return new Reservation(
        row.id, row.client_id, row.room_id,
        row.check_in_date, row.check_out_date,
        row.number_of_guests, row.status, row.total_price
    );
}

}


module.exports = ReservationRepository;