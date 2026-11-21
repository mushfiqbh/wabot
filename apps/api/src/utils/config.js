/**
 * Utility functions for WhatsApp bot
 * Add helpers here for config, formatting, validation, etc.
 */
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
require('dotenv').config();

let config = {};
try {
  // Config is expected at the root
  const configPath = path.join(process.cwd(), 'bot.yml');
  const file = fs.readFileSync(configPath, 'utf8');
  config = yaml.load(file);
} catch (e) {
  console.error('⚠️ Failed to load bot.yml:', e);
}

module.exports = {
  ...config,
  /**
   * Formats a phone number into a WhatsApp JID.
   * @param {string} number - The phone number to format.
   * @returns {string} The formatted JID.
   */
  formatJid: (number) => {
    if (!number) return null;
    const cleaned = number.toString().replace(/[^0-9]/g, '');
    return cleaned.includes('@s.whatsapp.net') ? cleaned : `${cleaned}@s.whatsapp.net`;
  }
};
