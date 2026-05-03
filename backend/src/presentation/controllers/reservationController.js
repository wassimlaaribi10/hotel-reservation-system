const ReservationRepository = require('../../infrastructure/repositories/ReservationRepository');
const RoomRepository = require('../../infrastructure/repositories/RoomRepository');
const ClientRepository = require('../../infrastructure/repositories/ClientRepository');
const ReservationUseCases = require('../../application/useCases/reservationUseCases');

const reservationRepository = new ReservationRepository();
const roomRepository = new RoomRepository();
const clientRepository = new ClientRepository();
const reservationUseCases = new ReservationUseCases(reservationRepository, roomRepository, clientRepository);

exports.createReservation = async (req, res) => {
    try {
        const reservation = await reservationUseCases.createReservation(req.body);
        res.status(201).json(reservation);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.confirmReservation = async (req, res) => {
    try {
        const reservation = await reservationUseCases.confirmReservation(parseInt(req.params.id));
        res.json(reservation);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.checkIn = async (req, res) => {
    try {
        const reservation = await reservationUseCases.checkIn(parseInt(req.params.id));
        res.json(reservation);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.checkOut = async (req, res) => {
    try {
        const reservation = await reservationUseCases.checkOut(parseInt(req.params.id));
        res.json(reservation);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.cancelReservation = async (req, res) => {
    try {
        const reservation = await reservationUseCases.cancelReservation(parseInt(req.params.id));
        res.json(reservation);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getReservationsByClient = async (req, res) => {
    try {
        const reservations = await reservationUseCases.getReservationsByClient(parseInt(req.params.clientId));
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllReservations = async (req, res) => {
    try {
        const reservations = await reservationUseCases.getAllReservations();
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateReservation = async (req, res) => {
    try {
        const reservation = await reservationUseCases.updateReservation(parseInt(req.params.id), req.body);
        res.json(reservation);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};