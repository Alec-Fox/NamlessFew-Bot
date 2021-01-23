const {
	constructEmbed,
} = require('../util/utilities.js');
const { allowMember } = require('../util/voice.js');
module.exports = {
	name: 'allow',
	description: 'Allows the specified member to join your voice channel',
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
        allowMember(message, specifiedMember);

	},
};