const supabaseService = require('../../services/supabaseService');

const register = async (req, res) => {
    const { name, userId, phone } = req.body;
    try {
        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }
        const client = await supabaseService.registerClient(name, userId, phone);
        res.status(201).json(client);
    } catch (err) {
        const statusCode = err.code ? 500 : 500;
        res.status(statusCode).json({
            error: err.message,
            code: err.code || undefined,
            details: err.details || undefined,
        });
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
