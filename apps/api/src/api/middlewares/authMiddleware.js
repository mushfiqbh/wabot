const supabaseService = require('../../services/supabaseService');

const authenticate = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: "Missing API Key" });

    const client = await supabaseService.getClientByKey(apiKey);
    if (!client) return res.status(401).json({ error: "Invalid API Key" });

    req.clientId = client.id;
    req.client = client;
    next();
};

module.exports = authenticate;
