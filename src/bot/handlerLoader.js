const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const loadCommands = () => {
    const commands = new Map();
    const commandsPath = path.join(__dirname, 'commands');
    if (fs.existsSync(commandsPath)) {
        fs.readdirSync(commandsPath).forEach((file) => {
            if (file.endsWith('.js')) {
                const cmd = require(path.join(commandsPath, file));
                commands.set(cmd.name, cmd);
            }
        });
    }
    return commands;
};

const loadEvents = () => {
    const eventHandlers = [];
    const eventsPath = path.join(__dirname, 'events');
    if (fs.existsSync(eventsPath)) {
        const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'));
        for (const file of eventFiles) {
            const eventModule = require(path.join(eventsPath, file));
            if (eventModule.eventName && typeof eventModule.handler === 'function') {
                eventHandlers.push(eventModule);
            }
        }
    }
    return eventHandlers;
};

module.exports = { loadCommands, loadEvents };
