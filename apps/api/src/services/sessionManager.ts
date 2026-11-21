const { 
    makeWASocket, 
    fetchLatestBaileysVersion,
    DisconnectReason
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const logger = require('../utils/logger');
const config = require('../utils/config');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const useSupabaseAuthState = require('./supabaseAuthState');
const { loadCommands, loadEvents } = require('../bot/handlerLoader');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

class SessionManager {
    [key: string]: any;
    constructor() {
        this.sessions = new Map();
        this.sessionPromises = new Map();
        this.qrs = new Map();
        this.connectionStates = new Map();
        this.logger = logger;
        this.commands = loadCommands();
        this.events = loadEvents();
    }

    /**
     * Get the latest QR code for a client
     */
    getQR(clientId) {
        return this.qrs.get(clientId);
    }

    isConnected(clientId) {
        return this.connectionStates.get(clientId) === true;
    }

    /**
     * Get or create a WhatsApp session for a specific client
     */
    async getSession(clientId) {
        if (this.sessions.has(clientId)) {
            return this.sessions.get(clientId);
        }

        if (this.sessionPromises.has(clientId)) {
            return this.sessionPromises.get(clientId);
        }

        const sessionPromise = this.initSocket(clientId)
            .then((sock) => {
                this.sessions.set(clientId, sock);
                this.sessionPromises.delete(clientId);
                return sock;
            })
            .catch((err) => {
                this.sessionPromises.delete(clientId);
                throw err;
            });

        this.sessionPromises.set(clientId, sessionPromise);
        return sessionPromise;
    }

    /**
     * Reset (unlink) the WhatsApp session for a client.
     * Ends the active socket, wipes the persisted auth state in Supabase,
     * and clears in-memory state so the next getSession() call generates a fresh QR.
     */
    async resetConnection(clientId) {
        const sock = this.sessions.get(clientId);

        // 1) Tear down any active socket cleanly
        if (sock) {
            try {
                if (typeof sock.logout === 'function') {
                    await sock.logout().catch(() => {});
                }
            } catch (err) {
                this.logger.warn(`Logout during reset for ${clientId} failed: ${err.message}`);
            }
            try {
                sock.ev?.removeAllListeners?.();
                if (typeof sock.end === 'function') {
                    sock.end();
                } else if (sock.ws?.close) {
                    sock.ws.close();
                }
            } catch (err) {
                this.logger.warn(`Socket end during reset for ${clientId} failed: ${err.message}`);
            }
        }

        // 2) Clear in-memory state so a new session can be created
        this.sessions.delete(clientId);
        this.sessionPromises.delete(clientId);
        this.qrs.delete(clientId);
        this.connectionStates.set(clientId, false);

        // 3) Wipe the persisted auth state in Supabase so the next
        //    initSocket call gets fresh creds and emits a new QR.
        const { error: deleteError } = await supabase
            .from('sessions')
            .delete()
            .eq('id', clientId);

        if (deleteError) {
            // Fallback: blank out the data column if a hard delete is blocked by RLS/policy
            const { error: updateError } = await supabase
                .from('sessions')
                .update({ data: {}, updated_at: new Date() })
                .eq('id', clientId);

            if (updateError) {
                throw new Error(`Failed to clear session row for ${clientId}: ${updateError.message}`);
            }
        }

        this.logger.info(`Reset connection for client ${clientId}`);
        return true;
    }

    async initSocket(clientId) {
        const { version } = await fetchLatestBaileysVersion();
        
        // Use Supabase Database for Auth State instead of local files
        const { state, saveCreds } = await useSupabaseAuthState(supabase, clientId);

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 10000,
        });

        sock.clientId = clientId; // Attach clientId to sock
        sock.ev.on('creds.update', saveCreds);

        // Register all event handlers
        for (const { eventName, handler } of this.events) {
            if (eventName === "connection.update") {
                // Special handling for connection update to capture QR and state
                sock.ev.on(eventName, async (update) => {
                    const { connection, lastDisconnect, qr } = update;
                    if (qr) this.qrs.set(clientId, qr);
                    if (connection === 'open') {
                        this.qrs.delete(clientId);
                        this.connectionStates.set(clientId, true);
                        this.logger.info(`Client ${clientId} connected`);
                    }
                    if (connection === 'close') {
                        const statusCode = (lastDisconnect?.error)?.output?.statusCode;
                        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                        this.connectionStates.set(clientId, false);
                        this.sessions.delete(clientId);
                        this.logger.warn(`Connection closed for ${clientId}. Reason: ${statusCode}, Reconnecting: ${shouldReconnect}`);
                        if (!shouldReconnect) {
                            this.qrs.delete(clientId);
                            this.connectionStates.delete(clientId);
                            this.sessionPromises.delete(clientId);
                        } else {
                            this.getSession(clientId).catch((err) => {
                                this.logger.error(`Reconnect failed for ${clientId}: ${err.message}`);
                            });
                        }
                    }
                    // The external connection.update handler handles the actual reconnection logic
                    handler(sock, this.logger, saveCreds, () => this.getSession(clientId))(update);
                });
            } else if (eventName === "messages.upsert") {
                sock.ev.on(eventName, handler(sock, this.logger, this.commands));
            } else {
                sock.ev.on(eventName, handler(sock, this.logger));
            }
        }

        return sock;
    }
}

module.exports = new SessionManager();


