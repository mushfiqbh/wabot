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
        if (!batch.numbers || typeof batch.message !== 'string' || !batch.message.trim()) {
            return res.status(400).json({ error: "Each batch must have 'numbers' and 'message'" });
        }
    }

    try {
        const messagesToEnqueue = [];

        for (const batch of batches) {
            const numbers = batch.numbers.toString().split(',').map(n => n.trim()).filter(n => n !== "");
            for (const number of numbers) {
                // Require E.164 input so the country calling code is explicit and
                // the response/database retain the same international number.
                if (!/^\+[1-9]\d{7,14}$/.test(number)) {
                    return res.status(400).json({
                        error: `Invalid phone number "${number}". Use international format with + and country code, such as +8801712345678.`,
                    });
                }
                messagesToEnqueue.push({ number, message: batch.message.trim() });
            }
        }

        if (messagesToEnqueue.length === 0) {
            return res.status(400).json({ error: "At least one valid phone number is required" });
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

const reset = async (req, res) => {
    try {
        await sessionManager.resetConnection(req.clientId);
        // Immediately spin up a fresh session so the client can scan a new QR
        await sessionManager.getSession(req.clientId);
        res.status(200).json({
            status: true,
            message: 'Connection reset. Scan the new QR code to link again.',
            qr: sessionManager.getQR(req.clientId) || null,
            connected: sessionManager.isConnected(req.clientId),
        });
    } catch (err) {
        logger.error(`Reset connection error for ${req.clientId}: ${err.message}`);
        res.status(500).json({ status: false, error: err.message });
    }
};

const failures = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
        const rows = await supabaseService.getRecentMessageFailures(req.clientId, limit);
        res.status(200).json({ status: true, count: rows.length, failures: rows });
    } catch (err) {
        logger.error(`Fetch failures error for ${req.clientId}: ${err.message}`);
        res.status(500).json({ status: false, error: err.message });
    }
};

module.exports = { sendBatch, connect, status, reset, failures };

