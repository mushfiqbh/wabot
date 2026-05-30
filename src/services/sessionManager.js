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

