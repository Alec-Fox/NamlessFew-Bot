const {
	constructEmbed,
} = require('../util/utilities.js');
const {
	MOD_ROLE_ID,
} = require('../util/constants.js');
module.exports = {
	name: 'removecash',
	description: 'remove cash from a member',
	usage: '[@member] [amount] [reason]',
	args: true,
	cooldown: 5,
	modOnly: true,
	execute(message, args) {
		if (message.member.roles.highest.comparePositionTo(message.guild.roles.cache.find(role => role.id === MOD_ROLE_ID)) < 0) return message.reply('You are not authorized to use this command.');
		const specifiedMember = message.mentions.members.first();
		if (!specifiedMember) return message.reply(`You did not submit a valid member to give cash.\nThe proper usage would be: \`${message.client.config.prefix}${this.name}\` ${this.usage}`);
		if (args.length < 3) {
			const embed = constructEmbed(`\nInvalid command structure.\nThe proper usage would be: \`${message.client.config.prefix}${this.name} ${this.usage}\``, '', null, null);
			return message.channel.send(embed);
		}
        const amount = Number(args[1]);
        if (isNaN(amount) || !Number.isInteger(amount) || amount < 1 || amount > message.client.memberinfo[specifiedMember.id].cash) {
			const embed = constructEmbed('Invalid amount of cash', '', null, null);
			return message.channel.send(embed);
		}
		const reasonsArray = args.splice(2, args.length);
		let reasons = reasonsArray.toString();
		reasons = reasons.replace(/,/g, ' ');
        message.client.memberinfo[specifiedMember.id].removeCash(specifiedMember, amount, `${amount} was removed by ${message.member.displayName} for ${reasons}`);
        const embed = constructEmbed(`${amount} was removed from ${specifiedMember.displayName} by ${message.member.displayName} for ${reasons}`, '', null, null);
			return message.channel.send(embed);
	},
};