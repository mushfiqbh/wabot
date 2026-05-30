const supabaseService = require('../services/supabaseService');
const sessionManager = require('../services/sessionManager');
const config = require('../utils/config');
const logger = require('../utils/logger');

class MessageWorker {
    constructor() {
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        logger.info('Message worker started');
        this.process();
    }

    async stop() {
        this.isRunning = false;
        logger.info('Message worker stopped');
    }

    async process() {
        while (this.isRunning) {
            try {
                const job = await supabaseService.getNextPendingMessage();
                
                if (job) {
                    logger.info(`Processing message ${job.id} for client ${job.client_id} to ${job.number}`);
                    
                    try {
                        let sock = await sessionManager.getSession(job.client_id);
                        
                        // Wait for connection to be ready if it's currently connecting
                        let retries = 0;
                        while ((!sock || !sessionManager.isConnected(job.client_id)) && retries < 10) {
                            logger.warn(`Waiting for client ${job.client_id} to connect... (attempt ${retries + 1})`);
                            await new Promise(resolve => setTimeout(resolve, 3000));
                            sock = await sessionManager.getSession(job.client_id);
                            retries++;
                        }

                        if (!sock || !sessionManager.isConnected(job.client_id)) {
                            throw new Error('WhatsApp session not connected (timeout)');
                        }

                        const jid = config.formatJid(job.number);
                        await sock.sendMessage(jid, { text: job.message });

                        try {
                            await supabaseService.updateMessageStatus(job.id, 'sent');
                        } catch (statusErr) {
                            logger.error(
                                `Message ${job.id} was sent, but failed to mark as sent: ${statusErr.message}`
                            );
                        }

                        logger.info(`Message ${job.id} sent successfully`);

                    } catch (err) {
                        logger.error(`Error sending message ${job.id}: ${err.message}`);
                        
                        // Detailed error handling
                        const errorMsg = err.message || 'Unknown error';
                        
                        // Check if we should retry or fail
                        const currentRetryCount = job.retry_count || 0;
                        const maxRetries = 3;

                        if (currentRetryCount < maxRetries) {
                            logger.warn(`Retrying message ${job.id} (${currentRetryCount + 1}/${maxRetries})`);
                            await supabaseService.updateMessageStatus(job.id, 'pending', errorMsg, currentRetryCount + 1);
                        } else {
                            await supabaseService.updateMessageStatus(job.id, 'failed', `Max retries exceeded: ${errorMsg}`);
                        }
                    }

                    // Random delay between 1-3 seconds to avoid spam detection
                    const delay = Math.floor(Math.random() * (3000 - 1000 + 1) + 1000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // No pending messages, wait a bit longer before checking again
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            } catch (err) {
                logger.error(`Worker loop error: ${err.message}`);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
    }
}

module.exports = new MessageWorker();
