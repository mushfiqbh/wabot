
/**
 * Sends a predefined image with a caption to the chat.
 * Usage: !image
 */
module.exports = {
  name: "image",
  description: "Send an image.",
  /**
   * Sends an image to the user.
   * @param {object} sock - WhatsApp socket instance
   * @param {string} from - Sender JID
   * @param {Array} args - Command arguments
   */
  execute: async (sock, from, args) => {
    await sock.sendMessage(from, {
      image: { url: "https://i0.wp.com/picjumbo.com/wp-content/uploads/detailed-shot-of-ripples-at-sunset-free-image.jpeg?w=600&quality=80" },
      caption: "Here is an image!",
    });
  },
};