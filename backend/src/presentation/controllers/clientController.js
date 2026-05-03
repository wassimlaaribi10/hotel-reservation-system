const ClientRepository = require('../../infrastructure/repositories/ClientRepository');
const ClientUseCases = require('../../application/useCases/clientUseCases');

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