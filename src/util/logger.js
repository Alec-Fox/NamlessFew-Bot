const {
    LOGGER_CHANNEL_ID,
} = require('./constants.js');
const {
    constructEmbed,
} = require('./utilities.js');
// eslint-disable-next-line no-empty-function
function Logger() {}
Logger.prototype.info = function(message, text) {
    const args = message.content.slice(message.client.config.prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const embed = constructEmbed(`.${commandName}`, `called by <@${message.author.id}> in <#${message.channel.id}>\n**Message Content:** \n${text}`)
    .setAuthor(message.member.user.tag, message.member.user.displayAvatarURL)
    .setFooter(`ID: ${message.member.id}`)
    .setTimestamp(message.createdAt);
    message.client.channels.get(LOGGER_CHANNEL_ID).send(embed);
};
module.exports = new Logger();