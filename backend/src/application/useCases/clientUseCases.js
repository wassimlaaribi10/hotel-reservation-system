const Client = require('../../domain/entities/Client');

class ClientUseCases {
    constructor(clientRepository) {
        this.clientRepository = clientRepository;
    }

    async createClient(clientData) {
        // Validate required fields
        const { firstName, lastName, idCardNumber, address, phone, email } = clientData;
        if (!firstName || !lastName || !idCardNumber || !phone) {
            throw new Error('Missing required client fields');
        }

        // Check if client already exists by ID card or phone
        const existingByIdCard = await this.clientRepository.findByIdCardNumber(idCardNumber);
        if (existingByIdCard) throw new Error('Client with this ID card already exists');

        const existingByPhone = await this.clientRepository.findByPhone(phone);
        if (existingByPhone) throw new Error('Client with this phone already exists');

        // Create entity
        const client = new Client(null, firstName, lastName, idCardNumber, address, phone, email, true);

        // Validate business rules
        if (!client.isValidEmail() && email) throw new Error('Invalid email format');
        if (!client.isValidPhone()) throw new Error('Phone number must be at least 8 digits');

        // Save via repository
        return await this.clientRepository.create(client);
    }

    async getClientById(id) {
        const client = await this.clientRepository.findById(id);
        if (!client) throw new Error('Client not found');
        return client;
    }

    async getAllClients() {
        return await this.clientRepository.findAll();
    }

    async updateClient(id, updateData) {
        const client = await this.clientRepository.findById(id);
        if (!client) throw new Error('Client not found');

        if (updateData.firstName) client.firstName = updateData.firstName;
        if (updateData.lastName) client.lastName = updateData.lastName;
        if (updateData.address) client.address = updateData.address;
        if (updateData.phone) client.phone = updateData.phone;
        if (updateData.email) client.email = updateData.email;
        if (updateData.isActive !== undefined) client.isActive = updateData.isActive; // ADD THIS LINE

        if (updateData.email && !client.isValidEmail()) throw new Error('Invalid email format');
        if (updateData.phone && !client.isValidPhone()) throw new Error('Invalid phone');

        return await this.clientRepository.update(client);
    }

    async deactivateClient(id) {
        const client = await this.clientRepository.findById(id);
        if (!client) throw new Error('Client not found');
        client.deactivate();
        return await this.clientRepository.update(client);
    }
}

module.exports = ClientUseCases;