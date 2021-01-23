const {
	constructEmbed,
} = require('../util/utilities.js');
const { MOD_ROLE_ID } = require('../util/constants.js');
const { disconnectMember } = require('../util/voice.js');
module.exports = {
	name: 'disconnect',
	description: 'Kicks the specified member from your voice channel',
	usage: '[@member]',
	args: true,
	cooldown: 5,
	modOnly: false,
	execute(message) {
		message.delete();
		const specifiedMember = message.mentions.members.first();
		if (!specifiedMember) {
			const embed = constructEmbed(`\nYou did not specify a valid member. The proper usage would be: \`${message.client.config.prefix}${this.name} ${this.usage}\``, '', null, null);
			return message.channel.send(embed);
		}
		if(specifiedMember.roles.highest.comparePositionTo(message.guild.roles.cache.find(role => role.id === MOD_ROLE_ID)) >= 0) return message.reply('You cannot kick a Moderator.');
        disconnectMember(message, specifiedMember);

	},
};