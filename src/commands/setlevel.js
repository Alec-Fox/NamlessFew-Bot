const {
	constructEmbed,
} = require('../util/utilities.js');
const {
	MOD_ROLE_ID,
} = require('../util/constants.js');
module.exports = {
	name: 'setlevel',
	description: 'Gives a member specified level',
	usage: '[@member] [level]',
	args: true,
	cooldown: 5,
	modOnly: true,
	execute(message, args) {
		message.delete();
		if (message.member.roles.highest.comparePositionTo(message.guild.roles.cache.find(role => role.id === MOD_ROLE_ID)) < 0) return message.reply('You are not authorized to use this command.');
		const specifiedMember = message.mentions.members.first();
		if (!specifiedMember) return message.reply(`You did not submit a valid member to give cash.\nThe proper usage would be: \`${message.client.config.prefix}${this.name}\` ${this.usage}`);
		if (args.length < 3) {
			const embed = constructEmbed(`\nInvalid command structure.\nThe proper usage would be: \`${message.client.config.prefix}${this.name} ${this.usage}\``, '', null, null);
			return message.channel.send(embed);
		}
        const amount = Number(args[1]);
        if (isNaN(amount) || !Number.isInteger(amount) || amount < 1 || amount > 99) {
			const embed = constructEmbed('Invalid level', '', null, null);
			return message.channel.send(embed);
		}
		const reasonsArray = args.splice(2, args.length);
		let reasons = reasonsArray.toString();
		reasons = reasons.replace(/,/g, ' ');
        message.client.memberinfo[specifiedMember.id].setLevel(specifiedMember, amount);
        const embed = constructEmbed(`${specifiedMember.displayName} level was set to ${amount} by ${message.member.displayName} for ${reasons}`, '', null, null);
			return message.channel.send(embed);
	},
};