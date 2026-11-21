const config = require('./utils/config');
const app = require('./app');
const logger = require('./utils/logger');
const messageWorker = require('./workers/messageWorker');
const sessionManager = require('./services/sessionManager');
const supabaseService = require('./services/supabaseService');

const port = process.env.PORT || 4000;

app.listen(port, async () => {
    logger.info(`🚀 Server is running on http://localhost:${port}`);
    
    // Start the message queue worker
    messageWorker.start();

    try {
        const sessionIds = await supabaseService.getClientSessionIds();
        const clientIds = await supabaseService.getClientIds();
        const bootClientIds = Array.from(new Set([...sessionIds, ...clientIds]));

        if (bootClientIds.length === 0) {
            logger.info('No bot clients found to start');
            return;
        }

        logger.info(`Starting bot listeners for ${bootClientIds.length} client(s)`);

        await Promise.allSettled(
            bootClientIds.map(async (clientId) => {
                await sessionManager.getSession(clientId);
            })
        );
    } catch (err) {
        logger.error(`Failed to restore bot sessions on startup: ${err.message}`);
    }
});
