const RoomRepository = require('../../infrastructure/repositories/RoomRepository');
const RoomUseCases = require('../../application/useCases/roomUseCases');

const roomRepository = new RoomRepository();
const roomUseCases = new RoomUseCases(roomRepository);

exports.createRoom = async (req, res) => {
    try {
        const room = await roomUseCases.createRoom(req.body);
        res.status(201).json(room);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await roomUseCases.getAllRooms();
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAvailableRooms = async (req, res) => {
    try {
        const { checkIn, checkOut, type } = req.query;
        if (!checkIn || !checkOut) {
            return res.status(400).json({ error: 'checkIn and checkOut dates required' });
        }
        const rooms = await roomUseCases.getAvailableRooms(checkIn, checkOut, type);
        res.json(rooms);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.updateRoom = async (req, res) => {
    try {
        const room = await roomUseCases.updateRoom(parseInt(req.params.id), req.body);
        res.json(room);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.addEquipment = async (req, res) => {
    const { roomId, equipmentId } = req.params;
    try {
        await pool.query('INSERT INTO room_equipment (room_id, equipment_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [roomId, equipmentId]);
        res.status(201).json({ message: 'Equipment added to room' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.removeEquipment = async (req, res) => {
    const { roomId, equipmentId } = req.params;
    try {
        await pool.query('DELETE FROM room_equipment WHERE room_id = $1 AND equipment_id = $2', [roomId, equipmentId]);
        res.status(200).json({ message: 'Equipment removed from room' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};