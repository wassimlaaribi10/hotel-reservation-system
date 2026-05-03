/**
 * Client Repository Interface
 * All methods must be implemented by the Infrastructure layer
 */
class ClientRepositoryInterface {
    async create(client) {
        throw new Error('Method not implemented');
    }
    async findById(id) {
        throw new Error('Method not implemented');
    }
    async findByEmail(email) {
        throw new Error('Method not implemented');
    }
    async findByPhone(phone) {
        throw new Error('Method not implemented');
    }
    async update(client) {
        throw new Error('Method not implemented');
    }
    async deactivate(id) {
        throw new Error('Method not implemented');
    }
    async findAll() {
        throw new Error('Method not implemented');
    }
}

module.exports = ClientRepositoryInterface;