const supabaseService = require('../../services/supabaseService');

const register = async (req, res) => {
    const { name, userId, phone } = req.body;
    try {
        const client = await supabaseService.registerClient(name, userId, phone);
        res.status(201).json(client);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const login = async (req, res) => {
    const { name } = req.body;
    try {
        const client = await supabaseService.loginClient(name);
        res.status(200).json(client);
    } catch (err) {
        res.status(404).json({ error: "Client not found" });
    }
};

module.exports = { register, login };
