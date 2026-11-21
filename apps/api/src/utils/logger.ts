const pino = require('pino');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Try to load bot.yml for logging configuration
let loggingLevel = 'info';
try {
  const apiRoot = path.resolve(__dirname, '../..');
  const file = fs.readFileSync(path.join(apiRoot, 'bot.yml'), 'utf8');
  const config = yaml.load(file);
  loggingLevel = config.logging?.level || 'info';
} catch (e) {
  // Use default logging level
}

const logger = pino({
  level: loggingLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

module.exports = logger;

