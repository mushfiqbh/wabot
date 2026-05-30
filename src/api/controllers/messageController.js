const supabaseService = require('../../services/supabaseService');
const sessionManager = require('../../services/sessionManager');
const logger = require('../../utils/logger');

const sendBatch = async (req, res) => {
    if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Request body must be an array of objects: [{numbers, message}]" });
    }

    const batches = req.body;
    if (batches.length === 0) {
        return res.status(400).json({ error: "At least one message batch is required" });
    }

    // Basic validation for all message batches
    for (const batch of batches) {
        if (!batch.numbers || !batch.message) {
            return res.status(400).json({ error: "Each batch must have 'numbers' and 'message'" });
        }
    }

    try {
        const messagesToEnqueue = [];

        for (const batch of batches) {
            const numbers = batch.numbers.toString().split(',').map(n => n.trim()).filter(n => n !== "");
            for (const number of numbers) {
                messagesToEnqueue.push({ number, message: batch.message });
            }
        }

        const enqueued = await supabaseService.enqueueMessages(req.clientId, messagesToEnqueue);

        res.status(202).json({ 
            status: true, 
            message: `Processed ${batches.length} batches. ${enqueued.length} messages added to queue.`,
            results: enqueued.map(m => ({ id: m.id, number: m.number, status: m.status }))
        });
    } catch (err) {
        logger.error(`API Queue Error for ${req.clientId}: ${err.message}`);
        res.status(500).json({ status: false, message: err.message });
    }
};

const connect = async (req, res) => {
    try {
        await sessionManager.getSession(req.clientId);
        const qr = sessionManager.getQR(req.clientId);
        res.status(200).json({ 
            connected: sessionManager.isConnected(req.clientId),
            qr: qr || null 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const status = async (req, res) => {
    res.status(200).json({
        connected: sessionManager.isConnected(req.clientId),
        user: sessionManager.sessions.get(req.clientId)?.user || null
    });
};

module.exports = { sendBatch, connect, status };
