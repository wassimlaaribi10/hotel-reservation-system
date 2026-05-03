const AuthUseCases = require('../../application/useCases/authUseCases');
const UserRepository = require('../../infrastructure/repositories/UserRepository');

const userRepository = new UserRepository();
const authUseCases = new AuthUseCases(userRepository);

exports.register = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const user = await authUseCases.registerUser(email, password, role);
        res.status(201).json({ message: 'User created', user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { token, user } = await authUseCases.loginUser(email, password);
        res.json({ token, user });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
};