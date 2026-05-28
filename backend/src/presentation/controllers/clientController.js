const ClientRepository = require('../../infrastructure/repositories/ClientRepository');
const ClientUseCases = require('../../application/useCases/clientUseCases');
const ReservationRepository = require('../../infrastructure/repositories/ReservationRepository');
const reservationRepository = new ReservationRepository();

const clientRepository = new ClientRepository();
const clientUseCases = new ClientUseCases(clientRepository);


exports.createClient = async (req, res) => {
    try {
        const client = await clientUseCases.createClient(req.body);
        res.status(201).json(client);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getAllClients = async (req, res) => {
    try {
        const clients = await clientUseCases.getAllClients();
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getClientById = async (req, res) => {
    try {
        const client = await clientUseCases.getClientById(parseInt(req.params.id));
        res.json(client);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
};

exports.updateClient = async (req, res) => {
    try {
        const client = await clientUseCases.updateClient(parseInt(req.params.id), req.body);
        res.json(client);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deactivateClient = async (req, res) => {
    try {
        const client = await clientUseCases.deactivateClient(parseInt(req.params.id));
        res.json(client);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getReservationsByIdCard = async (req, res) => {
    try {
        const { idCardNumber } = req.params;
        const client = await clientRepository.findByIdCardNumber(idCardNumber);
        if (!client) return res.status(404).json({ error: 'Client non trouvé' });
        
        const reservations = await reservationRepository.findByClient(client.id);
        res.json({ client: { firstName: client.firstName, lastName: client.lastName }, reservations });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};