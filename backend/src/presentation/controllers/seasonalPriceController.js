// backend/src/presentation/controllers/seasonalPriceController.js
const pool = require('../../infrastructure/database/pool');

exports.getAll = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM seasonal_prices ORDER BY room_type, valid_from');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const { room_type, season_name, price_per_night, valid_from, valid_to } = req.body;
    if (!room_type || !season_name || !price_per_night) {
        return res.status(400).json({ error: 'room_type, season_name et price_per_night requis' });
    }
    try {
        const query = `
            INSERT INTO seasonal_prices (room_type, season_name, price_per_night, valid_from, valid_to)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [room_type, season_name, price_per_night, valid_from || null, valid_to || null];
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    const { id } = req.params;
    const { room_type, season_name, price_per_night, valid_from, valid_to } = req.body;
    try {
        const query = `
            UPDATE seasonal_prices
            SET room_type = $1, season_name = $2, price_per_night = $3, valid_from = $4, valid_to = $5
            WHERE id = $6
            RETURNING *
        `;
        const values = [room_type, season_name, price_per_night, valid_from || null, valid_to || null, id];
        const result = await pool.query(query, values);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Tarif non trouvé' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM seasonal_prices WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Tarif non trouvé' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};