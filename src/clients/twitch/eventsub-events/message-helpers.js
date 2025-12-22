/**
 * Helper function to replace placeholders in custom thank you messages
 * @param {string} messageTemplate - The message template with placeholders
 * @param {Object} replacements - Object containing replacement values
 * @param {string} replacements.user - User display name
 * @param {string} replacements.gifter - Gifter display name
 * @param {number} replacements.months - Subscription months
 * @param {number} replacements.amount - Gift sub amount
 * @param {string} broadcasterLogin - Broadcaster login for emote lookup
 * @returns {Promise<string>} - Message with placeholders replaced
 */
async function replaceMessagePlaceholders(
  messageTemplate,
  replacements,
  broadcasterLogin
) {
  let message = messageTemplate;

  // Replace {user} with user display name
  if (replacements.user !== undefined) {
    message = message.replace(/\{user\}/g, replacements.user);
  }

  // Replace {gifter} with gifter display name
  if (replacements.gifter !== undefined) {
    message = message.replace(/\{gifter\}/g, replacements.gifter);
  }

  // Replace {months} with subscription months
  if (replacements.months !== undefined) {
    message = message.replace(/\{months\}/g, String(replacements.months));
  }

  // Replace {amount} with gift sub amount
  if (replacements.amount !== undefined) {
    message = message.replace(/\{amount\}/g, String(replacements.amount));
  }

  // Replace {emote} with a random emote from love emotes list
  if (message.includes("{emote}")) {
    const emote = await fb.emotes.getEmoteFromList(
      broadcasterLogin,
      fb.emotes.loveEmotes,
      "💚"
    );
    message = message.replace(/\{emote\}/g, emote);
  }

  return message;
}

module.exports = {
  replaceMessagePlaceholders,
};
