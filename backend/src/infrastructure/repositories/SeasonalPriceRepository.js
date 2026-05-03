const pool = require('../database/pool');

class SeasonalPriceRepository {
    async getPriceForDate(roomType, date) {
        const query = `
            SELECT price_per_night FROM seasonal_prices
            WHERE room_type = $1 
              AND (valid_from IS NULL OR valid_from <= $2)
              AND (valid_to IS NULL OR valid_to >= $2)
            ORDER BY id DESC LIMIT 1
        `;
        const res = await pool.query(query, [roomType, date]);
        if (res.rows.length === 0) return 100;
        return parseFloat(res.rows[0].price_per_night);
    }

    async getAllPrices() {
        const res = await pool.query('SELECT * FROM seasonal_prices ORDER BY room_type, valid_from');
        return res.rows;
    }

    async createPrice(roomType, seasonName, pricePerNight, validFrom, validTo) {
        const query = `
            INSERT INTO seasonal_prices (room_type, season_name, price_per_night, valid_from, valid_to)
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `;
        const values = [roomType, seasonName, pricePerNight, validFrom, validTo];
        const res = await pool.query(query, values);
        return res.rows[0];
    }

    async deletePrice(id) {
        await pool.query('DELETE FROM seasonal_prices WHERE id = $1', [id]);
    }
}

module.exports = SeasonalPriceRepository;