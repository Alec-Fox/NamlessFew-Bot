const { VOICE_CHANNEL_LOGS_CHANNEL_ID } = require('./constants.js');

// eslint-disable-next-line no-empty-function
function Logger() { }
Logger.prototype.info = function(msg, text) {

    msg.client.channels.cache.get(VOICE_CHANNEL_LOGS_CHANNEL_ID).send(new Date().toLocaleString() + ': ' + text);
};
module.exports = new Logger();