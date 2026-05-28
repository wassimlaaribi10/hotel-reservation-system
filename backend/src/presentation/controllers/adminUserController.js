const bcrypt = require('bcryptjs');
const UserRepository = require('../../infrastructure/repositories/UserRepository');
const User = require('../../domain/entities/User');

const userRepo = new UserRepository();

exports.getAllUsers = async (req, res) => {
    try {
        const users = await userRepo.findAll();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createUser = async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
    if (role !== 'receptionist' && role !== 'admin') return res.status(400).json({ error: 'Rôle invalide' });

    try {
        const existing = await userRepo.findByEmail(email);
        if (existing) return res.status(400).json({ error: 'Email déjà utilisé' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User(null, email, hashedPassword, role, true);
        const created = await userRepo.create(user);
        res.status(201).json(created);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, role, isActive, password } = req.body;

    try {
        const userToUpdate = await userRepo.findById(parseInt(id));
        if (!userToUpdate) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        // 🔒 Empêcher l'admin de modifier son propre rôle
        if (req.user.id === parseInt(id) && role && role !== userToUpdate.role) {
            return res.status(403).json({ error: 'Vous ne pouvez pas modifier votre propre rôle' });
        }

        // 🔒 Empêcher l'admin de se désactiver lui-même
        if (req.user.id === parseInt(id) && isActive === false) {
            return res.status(403).json({ error: 'Vous ne pouvez pas désactiver votre propre compte' });
        }

        // Mise à jour des champs
        if (email) userToUpdate.email = email;
        if (role) userToUpdate.role = role;
        if (isActive !== undefined) userToUpdate.isActive = isActive;
        const updated = await userRepo.update(userToUpdate);

        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            await userRepo.updatePassword(userToUpdate.id, hashed);
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};