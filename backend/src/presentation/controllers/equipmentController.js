const pool = require('../../infrastructure/database/pool');

exports.getAll = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM equipment ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    try {
        const result = await pool.query('INSERT INTO equipment (name) VALUES ($1) RETURNING *', [name]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM equipment WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addToRoom = async (req, res) => {
    const { roomId, equipmentId } = req.params;
    try {
        await pool.query('INSERT INTO room_equipment (room_id, equipment_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [roomId, equipmentId]);
        res.status(201).json({ message: 'Equipment added to room' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.removeFromRoom = async (req, res) => {
    const { roomId, equipmentId } = req.params;
    try {
        await pool.query('DELETE FROM room_equipment WHERE room_id = $1 AND equipment_id = $2', [roomId, equipmentId]);
        res.status(200).json({ message: 'Equipment removed from room' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRoomEquipment = async (req, res) => {
    const { roomId } = req.params;
    try {
        const result = await pool.query(`
            SELECT e.id, e.name FROM equipment e
            JOIN room_equipment re ON e.id = re.equipment_id
            WHERE re.room_id = $1
            ORDER BY e.name
        `, [roomId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};