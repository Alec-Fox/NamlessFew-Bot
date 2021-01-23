const {
	constructEmbed,
} = require('../util/utilities.js');
const {
	MOD_ROLE_ID,
} = require('../util/constants.js');
module.exports = {
	name: 'warn',
	description: 'Gives a member a warning [Mod use only]',
	usage: '[@member] [warning reason]',
	args: true,
	cooldown: 5,
	modOnly: true,
	execute(message, args) {
		message.delete();
		if(message.member.roles.highest.comparePositionTo(message.guild.roles.cache.find(role => role.id === MOD_ROLE_ID)) < 0) return message.reply('You are not authorized to use this command.');
		const specifiedMember = message.mentions.members.first();
		if (!specifiedMember) {
			const embed = constructEmbed(`\nYou did not specify a valid member. The proper usage would be: \`${message.client.config.prefix}${this.name} ${this.usage}\``, '', null, null);
			return message.channel.send(embed);
		}
		if (args.length < 2) {
			const embed = constructEmbed(`\nInvalid command structure. The proper usage would be: \`${message.client.config.prefix}${this.name} ${this.usage}\``, '', null, null);
			return message.channel.send(embed);
		}
		const reasonsArray = args.splice(1, args.length);
		let reasons = reasonsArray.toString();
		reasons = reasons.replace(/,/g, ' ');
		return message.client.memberinfo[specifiedMember.id].giveWarning(message, reasons);
	},
};